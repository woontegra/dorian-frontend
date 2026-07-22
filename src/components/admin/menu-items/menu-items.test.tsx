import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MenuItem } from '@kurumsal/shared';
import { MenuItemsPageClient } from '@/components/admin/menu-items/MenuItemsPageClient';
import { AdminApiError } from '@/lib/auth/types';

const replaceMock = vi.fn();
const routerMock = { replace: replaceMock, push: vi.fn() };

vi.mock('next/navigation', () => ({
  useRouter: () => routerMock,
}));

vi.mock('@/components/admin/session/AdminSessionProvider', () => ({
  useAdminSession: vi.fn(),
}));

vi.mock('@/lib/menu-items/api', () => ({
  fetchMenuItems: vi.fn(),
  createMenuItem: vi.fn(),
  updateMenuItem: vi.fn(),
  reorderMenuItems: vi.fn(),
  deleteMenuItem: vi.fn(),
  isForbiddenError: (error: unknown) => error instanceof AdminApiError && error.code === 'FORBIDDEN',
  isUnauthorizedError: (error: unknown) => error instanceof AdminApiError && error.code === 'UNAUTHORIZED',
  isMenuItemHasChildrenError: (error: unknown) =>
    error instanceof AdminApiError && error.code === 'MENU_ITEM_HAS_CHILDREN',
}));

import { useAdminSession } from '@/components/admin/session/AdminSessionProvider';
import {
  createMenuItem,
  deleteMenuItem,
  fetchMenuItems,
  reorderMenuItems,
  updateMenuItem,
} from '@/lib/menu-items/api';

const mockedSession = useAdminSession as unknown as ReturnType<typeof vi.fn>;
const mockedFetch = fetchMenuItems as unknown as ReturnType<typeof vi.fn>;
const mockedCreate = createMenuItem as unknown as ReturnType<typeof vi.fn>;
const mockedUpdate = updateMenuItem as unknown as ReturnType<typeof vi.fn>;
const mockedReorder = reorderMenuItems as unknown as ReturnType<typeof vi.fn>;
const mockedDelete = deleteMenuItem as unknown as ReturnType<typeof vi.fn>;

const parentItem: MenuItem = {
  id: '11111111-1111-1111-1111-111111111111',
  label: 'Ürünler',
  href: '/urunler',
  parentId: null,
  sortOrder: 0,
  isActive: true,
  openInNewTab: false,
  childCount: 1,
  children: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const childItem: MenuItem = {
  id: '22222222-2222-2222-2222-222222222222',
  label: 'İç Mekan',
  href: '/urunler/ic-mekan',
  parentId: parentItem.id,
  sortOrder: 0,
  isActive: true,
  openInNewTab: true,
  childCount: 0,
  children: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const secondParent: MenuItem = {
  id: '33333333-3333-3333-3333-333333333333',
  label: 'Projeler',
  href: '/projeler',
  parentId: null,
  sortOrder: 1,
  isActive: true,
  openInNewTab: false,
  childCount: 0,
  children: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function sampleTree(): MenuItem[] {
  return [
    { ...parentItem, children: [childItem] },
    secondParent,
  ];
}

async function waitForList() {
  expect(await screen.findByRole('list', { name: 'Menü öğeleri' })).toBeInTheDocument();
}

function getDrawer(name: RegExp) {
  return screen.getByRole('dialog', { name });
}

describe('MenuItemsPageClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedSession.mockReturnValue({
      admin: { id: '1', fullName: 'Admin', email: 'a@b.c', role: 'ADMIN' },
    });
    mockedFetch.mockResolvedValue({ items: sampleTree(), totalCount: 3 });
    mockedCreate.mockResolvedValue(parentItem);
    mockedUpdate.mockResolvedValue(parentItem);
    mockedReorder.mockResolvedValue({ updated: true });
    mockedDelete.mockResolvedValue({ deleted: true });
  });

  it('loads hierarchical menu items', async () => {
    render(<MenuItemsPageClient />);
    await waitForList();
    expect(screen.getByText('Ürünler')).toBeInTheDocument();
    expect(screen.getByText('İç Mekan')).toBeInTheDocument();
    expect(screen.getAllByText('Üst Menü').length).toBeGreaterThan(0);
    expect(screen.getByText('Alt Menü')).toBeInTheDocument();
  });

  it('shows empty state', async () => {
    mockedFetch.mockResolvedValue({ items: [], totalCount: 0 });
    render(<MenuItemsPageClient />);
    expect(await screen.findByText(/Henüz menü öğesi eklenmedi/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /İlk Menü Öğesini Ekle/i })).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Menü öğeleri' })).not.toBeInTheDocument();
  });

  it('shows load error instead of empty state', async () => {
    mockedFetch.mockRejectedValue(new AdminApiError('Sunucu hatası', 500, 'UNKNOWN'));
    render(<MenuItemsPageClient />);
    expect(await screen.findByText('Sunucu hatası')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Yeniden dene/i })).toBeInTheDocument();
    expect(screen.queryByText(/Henüz menü öğesi eklenmedi/i)).not.toBeInTheDocument();
  });

  it('creates a top-level menu item', async () => {
    const user = userEvent.setup();
    render(<MenuItemsPageClient />);
    await waitForList();
    await user.click(screen.getByRole('button', { name: 'Yeni Menü Öğesi' }));
    const drawer = getDrawer(/Yeni Menü Öğesi/i);
    await user.type(within(drawer).getByLabelText(/Menü adı/i), 'Galeri');
    await user.type(within(drawer).getByLabelText(/Bağlantı adresi/i), '/galeri');
    await user.click(within(drawer).getByRole('button', { name: 'Kaydet' }));
    await waitFor(() => {
      expect(mockedCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          label: 'Galeri',
          href: '/galeri',
          parentId: null,
        }),
      );
    });
  });

  it('creates a top-level item with optional empty href as null', async () => {
    const user = userEvent.setup();
    render(<MenuItemsPageClient />);
    await waitForList();
    await user.click(screen.getByRole('button', { name: 'Yeni Menü Öğesi' }));
    const drawer = getDrawer(/Yeni Menü Öğesi/i);
    expect(within(drawer).getByText(/yalnızca alt menüyü açan bir başlık/i)).toBeInTheDocument();
    await user.type(within(drawer).getByLabelText(/Menü adı/i), 'Ürünler');
    await user.click(within(drawer).getByRole('button', { name: 'Kaydet' }));
    await waitFor(() => {
      expect(mockedCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          label: 'Ürünler',
          href: null,
          parentId: null,
        }),
      );
    });
  });

  it('requires href for child items in the form', async () => {
    const user = userEvent.setup();
    render(<MenuItemsPageClient />);
    await waitForList();
    await user.click(screen.getByRole('button', { name: 'Yeni Menü Öğesi' }));
    const drawer = getDrawer(/Yeni Menü Öğesi/i);
    await user.type(within(drawer).getByLabelText(/Menü adı/i), 'Alt');
    await user.click(within(drawer).getByRole('radio', { name: /Bir üst menünün altında/i }));
    await user.selectOptions(within(drawer).getByRole('combobox', { name: /Üst menü/i }), parentItem.id);
    await user.click(within(drawer).getByRole('button', { name: 'Kaydet' }));
    expect(await within(drawer).findByText('Alt menüler için bağlantı adresi zorunludur.')).toBeInTheDocument();
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it('shows null href as empty in edit form and as title text in the list', async () => {
    const user = userEvent.setup();
    const linkless: MenuItem = {
      ...secondParent,
      href: null,
      label: 'Katalog',
    };
    mockedFetch.mockResolvedValue({
      items: [{ ...parentItem, children: [childItem] }, linkless],
      totalCount: 3,
    });

    render(<MenuItemsPageClient />);
    expect(await screen.findByText('Yalnızca açılır menü başlığı')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Katalog düzenle' }));
    const drawer = getDrawer(/Menü Öğesini Düzenle/i);
    expect(within(drawer).getByLabelText(/Bağlantı adresi/i)).toHaveValue('');
  });

  it('requires parent when creating a child item', async () => {
    const user = userEvent.setup();
    render(<MenuItemsPageClient />);
    await waitForList();
    await user.click(screen.getByRole('button', { name: 'Yeni Menü Öğesi' }));
    const drawer = getDrawer(/Yeni Menü Öğesi/i);
    await user.type(within(drawer).getByLabelText(/Menü adı/i), 'Alt');
    await user.type(within(drawer).getByLabelText(/Bağlantı adresi/i), '/alt');
    await user.click(within(drawer).getByRole('radio', { name: /Bir üst menünün altında/i }));
    await user.click(within(drawer).getByRole('button', { name: 'Kaydet' }));
    expect(await within(drawer).findByText('Alt menü için bir üst menü seçin.')).toBeInTheDocument();
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it('creates a child menu item with parent', async () => {
    const user = userEvent.setup();
    render(<MenuItemsPageClient />);
    await waitForList();
    await user.click(screen.getByRole('button', { name: 'Yeni Menü Öğesi' }));
    const drawer = getDrawer(/Yeni Menü Öğesi/i);
    await user.type(within(drawer).getByLabelText(/Menü adı/i), 'Dış Mekan');
    await user.type(within(drawer).getByLabelText(/Bağlantı adresi/i), '/urunler/dis-mekan');
    await user.click(within(drawer).getByRole('radio', { name: /Bir üst menünün altında/i }));
    await user.selectOptions(within(drawer).getByRole('combobox', { name: /Üst menü/i }), parentItem.id);
    await user.click(within(drawer).getByRole('button', { name: 'Kaydet' }));
    await waitFor(() => {
      expect(mockedCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          label: 'Dış Mekan',
          href: '/urunler/dis-mekan',
          parentId: parentItem.id,
        }),
      );
    });
  });

  it('opens edit form with existing values', async () => {
    const user = userEvent.setup();
    render(<MenuItemsPageClient />);
    await waitForList();
    await user.click(screen.getByRole('button', { name: 'Ürünler düzenle' }));
    const drawer = getDrawer(/Menü Öğesini Düzenle/i);
    expect(within(drawer).getByDisplayValue('Ürünler')).toBeInTheDocument();
    expect(within(drawer).getByDisplayValue('/urunler')).toBeInTheDocument();
    expect(within(drawer).getByRole('radio', { name: /Bir üst menünün altında/i })).toBeDisabled();
  });

  it('updates active status via update endpoint and rolls back on error', async () => {
    const user = userEvent.setup();
    mockedUpdate
      .mockRejectedValueOnce(new AdminApiError('Durum hatası', 500, 'UNKNOWN'))
      .mockResolvedValueOnce({ ...parentItem, isActive: false });

    render(<MenuItemsPageClient />);
    await waitForList();

    const switchInput = screen.getByRole('checkbox', { name: 'Ürünler durumu' });
    expect(switchInput).toBeChecked();
    await user.click(switchInput);

    await waitFor(() => {
      expect(mockedUpdate).toHaveBeenCalledWith(parentItem.id, { isActive: false });
    });
    expect(await screen.findByText('Durum hatası')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Ürünler durumu' })).toBeChecked();
  });

  it('reorders top-level items within their group', async () => {
    const user = userEvent.setup();
    render(<MenuItemsPageClient />);
    await waitForList();

    const handle = screen.getByRole('button', { name: 'Ürünler sırasını değiştir' });
    handle.focus();
    await user.keyboard('{ArrowDown}');

    await waitFor(() => {
      expect(mockedReorder).toHaveBeenCalledWith([
        { id: secondParent.id, sortOrder: 0 },
        { id: parentItem.id, sortOrder: 1 },
      ]);
    });
  });

  it('reorders child items only within parent group', async () => {
    const sibling: MenuItem = {
      ...childItem,
      id: '44444444-4444-4444-4444-444444444444',
      label: 'Dış Mekan',
      href: '/urunler/dis',
      sortOrder: 1,
    };
    mockedFetch.mockResolvedValue({
      items: [{ ...parentItem, childCount: 2, children: [childItem, sibling] }, secondParent],
      totalCount: 4,
    });

    const user = userEvent.setup();
    render(<MenuItemsPageClient />);
    await waitForList();

    const handle = screen.getByRole('button', { name: 'İç Mekan sırasını değiştir' });
    handle.focus();
    await user.keyboard('{ArrowDown}');

    await waitFor(() => {
      expect(mockedReorder).toHaveBeenCalledWith([
        { id: sibling.id, sortOrder: 0 },
        { id: childItem.id, sortOrder: 1 },
      ]);
    });
  });

  it('restores previous order when reorder fails', async () => {
    const user = userEvent.setup();
    mockedReorder.mockRejectedValueOnce(new AdminApiError('Sıra hatası', 400, 'UNKNOWN'));
    render(<MenuItemsPageClient />);
    await waitForList();

    const list = screen.getByRole('list', { name: 'Menü öğeleri' });
    const before = within(list)
      .getAllByRole('listitem')
      .map((item) => item.textContent);

    const handle = screen.getByRole('button', { name: 'Ürünler sırasını değiştir' });
    handle.focus();
    await user.keyboard('{ArrowDown}');

    expect(await screen.findByText('Sıra hatası')).toBeInTheDocument();
    const after = within(list)
      .getAllByRole('listitem')
      .map((item) => item.textContent);
    expect(after).toEqual(before);
  });

  it('allows ADMIN to delete and blocks double submit', async () => {
    const user = userEvent.setup();
    let resolveDelete: ((value: { deleted: true }) => void) | null = null;
    mockedDelete.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveDelete = resolve;
        }),
    );

    render(<MenuItemsPageClient />);
    await waitForList();
    await user.click(screen.getByRole('button', { name: 'Projeler sil' }));

    const dialog = screen.getByRole('alertdialog');
    const confirm = within(dialog).getByRole('button', { name: 'Sil' });
    await user.click(confirm);
    await user.click(confirm);

    expect(mockedDelete).toHaveBeenCalledTimes(1);
    resolveDelete?.({ deleted: true });
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });

  it('hides delete action for EDITOR', async () => {
    mockedSession.mockReturnValue({
      admin: { id: '2', fullName: 'Editor', email: 'e@b.c', role: 'EDITOR' },
    });
    render(<MenuItemsPageClient />);
    await waitForList();
    expect(screen.queryByRole('button', { name: /sil$/i })).not.toBeInTheDocument();
  });

  it('shows understandable children delete error', async () => {
    const user = userEvent.setup();
    mockedDelete.mockRejectedValue(
      new AdminApiError('Alt menü öğeleri olan üst öğe silinemez.', 409, 'MENU_ITEM_HAS_CHILDREN'),
    );
    render(<MenuItemsPageClient />);
    await waitForList();
    await user.click(screen.getByRole('button', { name: 'Ürünler sil' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Sil' }));
    expect(
      await screen.findByText(
        /Bu üst menüye bağlı alt menüler var. Önce alt menüleri silin veya başka bir üst menüye taşıyın./i,
      ),
    ).toBeInTheDocument();
  });

  it('clears form errors when reopening the panel', async () => {
    const user = userEvent.setup();
    render(<MenuItemsPageClient />);
    await waitForList();
    await user.click(screen.getByRole('button', { name: 'Yeni Menü Öğesi' }));
    let drawer = getDrawer(/Yeni Menü Öğesi/i);
    await user.click(within(drawer).getByRole('button', { name: 'Kaydet' }));
    expect(await within(drawer).findByText(/Menü adı zorunludur/i)).toBeInTheDocument();

    await user.click(within(drawer).getByRole('button', { name: 'Paneli kapat' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Yeni Menü Öğesi' }));
    drawer = getDrawer(/Yeni Menü Öğesi/i);
    expect(within(drawer).queryByText(/Menü adı zorunludur/i)).not.toBeInTheDocument();
  });
});
