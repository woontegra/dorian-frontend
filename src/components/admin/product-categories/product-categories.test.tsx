import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ProductCategory } from '@kurumsal/shared';
import { ProductCategoriesPageClient } from '@/components/admin/product-categories/ProductCategoriesPageClient';
import { AdminApiError } from '@/lib/auth/types';

const replaceMock = vi.fn();
const routerMock = { replace: replaceMock, push: vi.fn() };

vi.mock('next/navigation', () => ({
  useRouter: () => routerMock,
}));

vi.mock('@/components/admin/session/AdminSessionProvider', () => ({
  useAdminSession: vi.fn(),
}));

vi.mock('@/lib/product-categories/api', () => ({
  fetchProductCategories: vi.fn(),
  createProductCategory: vi.fn(),
  updateProductCategory: vi.fn(),
  updateProductCategoryStatus: vi.fn(),
  reorderProductCategories: vi.fn(),
  deleteProductCategory: vi.fn(),
  isForbiddenError: (error: unknown) => error instanceof AdminApiError && error.code === 'FORBIDDEN',
  isUnauthorizedError: (error: unknown) => error instanceof AdminApiError && error.code === 'UNAUTHORIZED',
  isSlugConflictError: (error: unknown) => error instanceof AdminApiError && error.code === 'SLUG_CONFLICT',
  isCategoryHasChildrenError: (error: unknown) => error instanceof AdminApiError && error.code === 'CATEGORY_HAS_CHILDREN',
  isCategoryInUseError: (error: unknown) => error instanceof AdminApiError && error.code === 'CATEGORY_IN_USE',
}));

import { useAdminSession } from '@/components/admin/session/AdminSessionProvider';
import {
  createProductCategory,
  deleteProductCategory,
  fetchProductCategories,
  updateProductCategory,
  updateProductCategoryStatus,
} from '@/lib/product-categories/api';

const mockedSession = useAdminSession as unknown as ReturnType<typeof vi.fn>;
const mockedFetch = fetchProductCategories as unknown as ReturnType<typeof vi.fn>;
const mockedCreate = createProductCategory as unknown as ReturnType<typeof vi.fn>;
const mockedUpdate = updateProductCategory as unknown as ReturnType<typeof vi.fn>;
const mockedStatus = updateProductCategoryStatus as unknown as ReturnType<typeof vi.fn>;
const mockedDelete = deleteProductCategory as unknown as ReturnType<typeof vi.fn>;

const parentCategory: ProductCategory = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Elektronik',
  slug: 'elektronik',
  description: 'Ana kategori',
  parentId: null,
  parentName: null,
  sortOrder: 0,
  isActive: true,
  seoTitle: 'SEO Başlık',
  seoDescription: 'SEO açıklama',
  childCount: 1,
  productCount: 0,
  image: null,
  children: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const childCategory: ProductCategory = {
  id: '22222222-2222-2222-2222-222222222222',
  name: 'Telefon',
  slug: 'telefon',
  description: null,
  parentId: parentCategory.id,
  parentName: 'Elektronik',
  sortOrder: 0,
  isActive: true,
  seoTitle: null,
  seoDescription: null,
  childCount: 0,
  productCount: 0,
  image: null,
  children: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

async function waitForCategoriesLoaded() {
  expect(await screen.findByRole('table')).toBeInTheDocument();
}

function getDrawer(name: RegExp) {
  return screen.getByRole('dialog', { name });
}

describe('ProductCategoriesPageClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedSession.mockReturnValue({
      admin: { id: '1', fullName: 'Admin', email: 'a@b.c', role: 'ADMIN' },
    });
    mockedFetch.mockResolvedValue({
      items: [{ ...parentCategory, children: [childCategory] }],
      totalCount: 2,
    });
  });

  it('keeps drawer closed on initial load', async () => {
    render(<ProductCategoriesPageClient />);
    await waitForCategoriesLoaded();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows empty state without auto-opening drawer', async () => {
    mockedFetch.mockResolvedValue({ items: [], totalCount: 0 });
    render(<ProductCategoriesPageClient />);
    expect(await screen.findByText(/Henüz kategori yok/i)).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens drawer from Yeni Kategori with create title', async () => {
    const user = userEvent.setup();
    render(<ProductCategoriesPageClient />);
    await waitForCategoriesLoaded();
    await user.click(screen.getByRole('button', { name: 'Yeni Kategori' }));
    expect(getDrawer(/Yeni Kategori/i)).toBeInTheDocument();
    expect(screen.getByText(/yeni bir kategori oluşturun/i)).toBeInTheDocument();
  });

  it('opens drawer from empty state CTA', async () => {
    const user = userEvent.setup();
    mockedFetch.mockResolvedValue({ items: [], totalCount: 0 });
    render(<ProductCategoriesPageClient />);
    await user.click(await screen.findByRole('button', { name: /İlk Kategoriyi Oluştur/i }));
    expect(getDrawer(/Yeni Kategori/i)).toBeInTheDocument();
  });

  it('opens edit drawer with category values and edit title', async () => {
    const user = userEvent.setup();
    render(<ProductCategoriesPageClient />);
    await waitForCategoriesLoaded();
    await user.click(screen.getByRole('button', { name: 'Elektronik düzenle' }));
    const drawer = getDrawer(/Kategoriyi Düzenle/i);
    expect(within(drawer).getByDisplayValue('elektronik')).toBeInTheDocument();
    expect(within(drawer).getByText('Elektronik')).toBeInTheDocument();
  });

  it('auto-generates slug on create and preserves manual slug edits', async () => {
    const user = userEvent.setup();
    render(<ProductCategoriesPageClient />);
    await waitForCategoriesLoaded();
    await user.click(screen.getByRole('button', { name: 'Yeni Kategori' }));
    const drawer = getDrawer(/Yeni Kategori/i);
    await user.type(within(drawer).getByRole('textbox', { name: /Kategori Adı/i }), 'Çocuk Giyim');
    expect(within(drawer).getByDisplayValue('cocuk-giyim')).toBeInTheDocument();
  });

  it('closes drawer with X and cancel', async () => {
    const user = userEvent.setup();
    render(<ProductCategoriesPageClient />);
    await waitForCategoriesLoaded();
    await user.click(screen.getByRole('button', { name: 'Yeni Kategori' }));
    await user.click(screen.getByRole('button', { name: 'Paneli kapat' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Yeni Kategori' }));
    await user.click(within(getDrawer(/Yeni Kategori/i)).getByRole('button', { name: 'İptal' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not carry previous values into a new create drawer', async () => {
    const user = userEvent.setup();
    render(<ProductCategoriesPageClient />);
    await waitForCategoriesLoaded();
    await user.click(screen.getByRole('button', { name: 'Yeni Kategori' }));
    const drawer = getDrawer(/Yeni Kategori/i);
    await user.type(within(drawer).getByRole('textbox', { name: /Kategori Adı/i }), 'Geçici');
    await user.click(within(drawer).getByRole('button', { name: 'İptal' }));

    await user.click(screen.getByRole('button', { name: 'Yeni Kategori' }));
    expect(within(getDrawer(/Yeni Kategori/i)).getByRole('textbox', { name: /Kategori Adı/i })).toHaveValue('');
  });

  it('uses modern status switch and sends boolean value', async () => {
    const user = userEvent.setup();
    mockedCreate.mockResolvedValue(parentCategory);
    render(<ProductCategoriesPageClient />);
    await waitForCategoriesLoaded();
    await user.click(screen.getByRole('button', { name: 'Yeni Kategori' }));
    const drawer = getDrawer(/Yeni Kategori/i);
    const statusSwitch = within(drawer).getByRole('switch', { name: 'Yayın Durumu' });
    expect(statusSwitch).toHaveAttribute('aria-checked', 'true');
    await user.click(statusSwitch);
    expect(statusSwitch).toHaveAttribute('aria-checked', 'false');

    await user.type(within(drawer).getByRole('textbox', { name: /Kategori Adı/i }), 'Mobilya');
    await user.click(within(drawer).getByRole('button', { name: 'Kaydet' }));

    await waitFor(() =>
      expect(mockedCreate).toHaveBeenCalledWith(expect.objectContaining({ isActive: false })),
    );
  });

  it('preserves SEO values when section is toggled', async () => {
    const user = userEvent.setup();
    render(<ProductCategoriesPageClient />);
    await waitForCategoriesLoaded();
    await user.click(screen.getByRole('button', { name: 'Yeni Kategori' }));
    const drawer = getDrawer(/Yeni Kategori/i);
    await user.click(within(drawer).getByRole('button', { name: /SEO Ayarları/i }));
    await user.type(within(drawer).getByLabelText('SEO Başlığı'), 'Başlık');
    await user.click(within(drawer).getByRole('button', { name: /SEO Ayarları/i }));
    await user.click(within(drawer).getByRole('button', { name: /SEO Ayarları/i }));
    expect(within(drawer).getByLabelText('SEO Başlığı')).toHaveValue('Başlık');
  });

  it('creates category, closes drawer and refreshes list', async () => {
    const user = userEvent.setup();
    mockedCreate.mockResolvedValue(parentCategory);
    render(<ProductCategoriesPageClient />);
    await waitForCategoriesLoaded();
    await user.click(screen.getByRole('button', { name: 'Yeni Kategori' }));
    const drawer = getDrawer(/Yeni Kategori/i);
    await user.type(within(drawer).getByRole('textbox', { name: /Kategori Adı/i }), 'Mobilya');
    await user.click(within(drawer).getByRole('button', { name: 'Kaydet' }));

    await waitFor(() => expect(mockedCreate).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });

  it('keeps drawer open on save error', async () => {
    const user = userEvent.setup();
    mockedCreate.mockRejectedValue(new AdminApiError('Slug zaten kullanılıyor.', 409, 'SLUG_CONFLICT'));
    render(<ProductCategoriesPageClient />);
    await waitForCategoriesLoaded();
    await user.click(screen.getByRole('button', { name: 'Yeni Kategori' }));
    const drawer = getDrawer(/Yeni Kategori/i);
    await user.type(within(drawer).getByRole('textbox', { name: /Kategori Adı/i }), 'Mobilya');
    await user.click(within(drawer).getByRole('button', { name: 'Kaydet' }));

    expect(await screen.findByText(/Slug zaten kullanılıyor/i)).toBeInTheDocument();
    expect(getDrawer(/Yeni Kategori/i)).toBeInTheDocument();
    expect(within(drawer).getByRole('textbox', { name: /Kategori Adı/i })).toHaveValue('Mobilya');
  });

  it('prevents double submit while saving', async () => {
    const user = userEvent.setup();
    let resolveCreate: ((value: ProductCategory) => void) | undefined;
    mockedCreate.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCreate = resolve;
        }),
    );

    render(<ProductCategoriesPageClient />);
    await waitForCategoriesLoaded();
    await user.click(screen.getByRole('button', { name: 'Yeni Kategori' }));
    const drawer = getDrawer(/Yeni Kategori/i);
    await user.type(within(drawer).getByRole('textbox', { name: /Kategori Adı/i }), 'Mobilya');
    const saveButton = within(drawer).getByRole('button', { name: 'Kaydet' });
    await user.click(saveButton);
    await user.click(saveButton);
    expect(mockedCreate).toHaveBeenCalledTimes(1);
    resolveCreate?.(parentCategory);
  });

  it('updates category with edit submit label', async () => {
    const user = userEvent.setup();
    mockedUpdate.mockResolvedValue(parentCategory);
    render(<ProductCategoriesPageClient />);
    await waitForCategoriesLoaded();
    await user.click(screen.getByRole('button', { name: 'Elektronik düzenle' }));
    const drawer = getDrawer(/Kategoriyi Düzenle/i);
    await user.click(within(drawer).getByRole('button', { name: 'Değişiklikleri Kaydet' }));
    await waitFor(() => expect(mockedUpdate).toHaveBeenCalled());
  });

  it('closes drawer on Escape', async () => {
    const user = userEvent.setup();
    render(<ProductCategoriesPageClient />);
    await waitForCategoriesLoaded();
    await user.click(screen.getByRole('button', { name: 'Yeni Kategori' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('updates table status independently from drawer switch', async () => {
    const user = userEvent.setup();
    mockedStatus.mockResolvedValue({ ...parentCategory, isActive: false });
    render(<ProductCategoriesPageClient />);
    await waitForCategoriesLoaded();
    const toggle = screen.getAllByRole('checkbox', { name: /Elektronik durumu/i })[0];
    await user.click(toggle);
    await waitFor(() => expect(mockedStatus).toHaveBeenCalledWith(parentCategory.id, false));
  });

  it('hides delete for editor', async () => {
    mockedSession.mockReturnValue({
      admin: { id: '2', fullName: 'Editor', email: 'e@b.c', role: 'EDITOR' },
    });
    render(<ProductCategoriesPageClient />);
    await waitForCategoriesLoaded();
    expect(screen.queryByRole('button', { name: 'Elektronik sil' })).not.toBeInTheDocument();
  });

  it('shows delete error for category with children', async () => {
    const user = userEvent.setup();
    mockedDelete.mockRejectedValue(
      new AdminApiError('Alt kategorisi olan kategori silinemez.', 409, 'CATEGORY_HAS_CHILDREN'),
    );
    render(<ProductCategoriesPageClient />);
    await waitForCategoriesLoaded();
    await user.click(screen.getByRole('button', { name: 'Elektronik sil' }));
    await user.click(screen.getByRole('button', { name: 'Sil' }));
    expect(await screen.findByText(/Alt kategorisi olan kategori silinemez/i)).toBeInTheDocument();
  });

  it('redirects to login on 401', async () => {
    mockedFetch.mockRejectedValue(new AdminApiError('Unauthorized', 401, 'UNAUTHORIZED'));
    render(<ProductCategoriesPageClient />);
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith('/admin/login'));
  });

  it('shows forbidden without login redirect on 403 status update', async () => {
    mockedSession.mockReturnValue({
      admin: { id: '2', fullName: 'Editor', email: 'e@b.c', role: 'EDITOR' },
    });
    mockedStatus.mockRejectedValue(new AdminApiError('Bu işlem için yetkiniz yok.', 403, 'FORBIDDEN'));
    const user = userEvent.setup();
    render(<ProductCategoriesPageClient />);
    await waitForCategoriesLoaded();
    await user.click(screen.getAllByRole('checkbox', { name: /Elektronik durumu/i })[0]);
    expect(await screen.findByText(/yetkiniz yok/i)).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalledWith('/admin/login');
  });
});
