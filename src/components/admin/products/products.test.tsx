import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ProductListItem } from '@kurumsal/shared';
import { ProductsPageClient } from '@/components/admin/products/ProductsPageClient';
import { AdminApiError } from '@/lib/auth/types';

const replaceMock = vi.fn();
const pushMock = vi.fn();
const routerMock = { replace: replaceMock, push: pushMock };

vi.mock('next/navigation', () => ({
  useRouter: () => routerMock,
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/components/admin/session/AdminSessionProvider', () => ({
  useAdminSession: vi.fn(),
}));

vi.mock('@/lib/product-categories/api', () => ({
  fetchProductCategories: vi.fn(),
}));

vi.mock('@/lib/products/api', () => ({
  fetchProducts: vi.fn(),
  updateProductStatus: vi.fn(),
  updateProductFeatured: vi.fn(),
  reorderProducts: vi.fn(),
  deleteProduct: vi.fn(),
  isUnauthorizedError: (error: unknown) => error instanceof AdminApiError && error.code === 'UNAUTHORIZED',
  isForbiddenError: (error: unknown) => error instanceof AdminApiError && error.code === 'FORBIDDEN',
}));

import { useAdminSession } from '@/components/admin/session/AdminSessionProvider';
import { fetchProductCategories } from '@/lib/product-categories/api';
import {
  deleteProduct,
  fetchProducts,
  updateProductFeatured,
  updateProductStatus,
} from '@/lib/products/api';

const mockedSession = useAdminSession as unknown as ReturnType<typeof vi.fn>;
const mockedFetch = fetchProducts as unknown as ReturnType<typeof vi.fn>;
const mockedCategories = fetchProductCategories as unknown as ReturnType<typeof vi.fn>;
const mockedStatus = updateProductStatus as unknown as ReturnType<typeof vi.fn>;
const mockedFeatured = updateProductFeatured as unknown as ReturnType<typeof vi.fn>;
const mockedDelete = deleteProduct as unknown as ReturnType<typeof vi.fn>;

const sampleProduct: ProductListItem = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Kurumsal Yazılım',
  slug: 'kurumsal-yazilim',
  shortDescription: 'Kısa açıklama',
  category: {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Yazılım',
    slug: 'yazilim',
    isActive: true,
    parentId: null,
    parentName: null,
  },
  coverImage: null,
  logoImage: null,
  isActive: true,
  isFeatured: false,
  sortOrder: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('ProductsPageClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedSession.mockReturnValue({
      admin: { id: '1', fullName: 'Admin', email: 'a@b.c', role: 'ADMIN' },
    });
    mockedCategories.mockResolvedValue({ items: [], totalCount: 0 });
    mockedFetch.mockResolvedValue({
      items: [sampleProduct],
      pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
    });
  });

  it('loads product list', async () => {
    render(<ProductsPageClient />);
    expect(await screen.findByText('Kurumsal Yazılım')).toBeInTheDocument();
    expect(screen.getByText('1 ürün')).toBeInTheDocument();
  });

  it('shows empty state without auto navigation', async () => {
    mockedFetch.mockResolvedValue({
      items: [],
      pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 1 },
    });
    render(<ProductsPageClient />);
    expect(await screen.findByText(/Henüz ürün eklenmedi/i)).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('links to new product page', async () => {
    render(<ProductsPageClient />);
    await screen.findByText('Kurumsal Yazılım');
    expect(screen.getByRole('link', { name: /Yeni Ürün/i })).toHaveAttribute('href', '/admin/products/new');
  });

  it('navigates to edit page', async () => {
    const user = userEvent.setup();
    render(<ProductsPageClient />);
    await user.click(await screen.findByRole('button', { name: 'Kurumsal Yazılım düzenle' }));
    expect(pushMock).toHaveBeenCalledWith(`/admin/products/${sampleProduct.id}/edit`);
  });

  it('hides delete for editor', async () => {
    mockedSession.mockReturnValue({
      admin: { id: '2', fullName: 'Editor', email: 'e@b.c', role: 'EDITOR' },
    });
    render(<ProductsPageClient />);
    await screen.findByText('Kurumsal Yazılım');
    expect(screen.queryByRole('button', { name: 'Kurumsal Yazılım sil' })).not.toBeInTheDocument();
  });

  it('reverts status on error', async () => {
    const user = userEvent.setup();
    mockedStatus.mockRejectedValue(new AdminApiError('Durum hatası', 400, 'VALIDATION'));
    render(<ProductsPageClient />);
    await screen.findByText('Kurumsal Yazılım');
    await user.click(screen.getByRole('checkbox', { name: 'Kurumsal Yazılım durumu' }));
    expect(await screen.findByText(/Durum hatası|güncellenemedi/i)).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Kurumsal Yazılım durumu' })).toBeChecked();
  });

  it('reverts featured on error', async () => {
    const user = userEvent.setup();
    mockedFeatured.mockRejectedValue(new AdminApiError('Öne çıkan hatası', 400, 'VALIDATION'));
    render(<ProductsPageClient />);
    await screen.findByText('Kurumsal Yazılım');
    await user.click(screen.getByRole('button', { name: 'Kurumsal Yazılım öne çıkan durumu' }));
    expect(await screen.findByText('Öne çıkan hatası')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Kurumsal Yazılım öne çıkan durumu' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('deletes product with confirm dialog', async () => {
    const user = userEvent.setup();
    mockedDelete.mockResolvedValue({ deleted: true });
    render(<ProductsPageClient />);
    await user.click(await screen.findByRole('button', { name: 'Kurumsal Yazılım sil' }));
    await user.click(screen.getByRole('button', { name: 'Sil' }));
    await waitFor(() => expect(mockedDelete).toHaveBeenCalledWith(sampleProduct.id));
  });

  it('redirects to login on 401', async () => {
    mockedFetch.mockRejectedValue(new AdminApiError('Unauthorized', 401, 'UNAUTHORIZED'));
    render(<ProductsPageClient />);
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith('/admin/login'));
  });
});
