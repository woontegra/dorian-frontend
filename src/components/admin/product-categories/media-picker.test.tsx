import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MediaAsset } from '@kurumsal/shared';
import { MEDIA_LIMITS } from '@kurumsal/shared';
import { ProductCategoryMediaPicker } from '@/components/admin/product-categories/ProductCategoryMediaPicker';
import { AdminApiError } from '@/lib/auth/types';

vi.mock('@/components/admin/session/AdminSessionProvider', () => ({
  useAdminSession: vi.fn(),
}));

vi.mock('@/lib/media/api', () => ({
  fetchMediaAssets: vi.fn(),
  uploadMediaAssets: vi.fn(),
  deleteMediaAsset: vi.fn(),
  isForbiddenError: (error: unknown) => error instanceof AdminApiError && error.code === 'FORBIDDEN',
  isUnauthorizedError: (error: unknown) => error instanceof AdminApiError && error.code === 'UNAUTHORIZED',
}));

import { useAdminSession } from '@/components/admin/session/AdminSessionProvider';
import { deleteMediaAsset, fetchMediaAssets, uploadMediaAssets } from '@/lib/media/api';

const mockedSession = useAdminSession as unknown as ReturnType<typeof vi.fn>;
const mockedFetch = fetchMediaAssets as unknown as ReturnType<typeof vi.fn>;
const mockedUpload = uploadMediaAssets as unknown as ReturnType<typeof vi.fn>;
const mockedDelete = deleteMediaAsset as unknown as ReturnType<typeof vi.fn>;

const assetA: MediaAsset = {
  id: 'a1',
  filename: 'hero-a.jpg',
  originalFilename: 'hero-desktop.jpg',
  url: 'https://cdn.example.com/hero-a.jpg',
  pathname: 'media/2026/07/hero-a.jpg',
  mimeType: 'image/jpeg',
  extension: 'jpg',
  sizeBytes: 204800,
  width: 1600,
  height: 900,
  altText: 'Hero A',
  title: null,
  caption: null,
  createdById: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const assetB: MediaAsset = {
  ...assetA,
  id: 'b2',
  filename: 'hero-b.jpg',
  originalFilename: 'hero-mobile.jpg',
  url: 'https://cdn.example.com/hero-b.jpg',
  pathname: 'media/2026/07/hero-b.jpg',
};

const uploadedAsset: MediaAsset = {
  ...assetA,
  id: 'new-1',
  filename: 'new-upload.png',
  originalFilename: 'yeni-gorsel.png',
  url: 'https://cdn.example.com/media/yeni-gorsel.png',
  pathname: 'media/2026/07/yeni-gorsel.png',
  mimeType: 'image/png',
  extension: 'png',
  sizeBytes: 12000,
};

describe('ProductCategoryMediaPicker', () => {
  beforeEach(() => {
    mockedFetch.mockReset();
    mockedUpload.mockReset();
    mockedDelete.mockReset();
    mockedSession.mockReturnValue({
      admin: { id: '1', fullName: 'Admin', email: 'a@b.c', role: 'ADMIN' },
    });
    document.body.style.overflow = '';
  });

  it('renders as a fixed dialog portal and keeps body scroll locked', async () => {
    mockedFetch.mockResolvedValue({
      items: [assetA],
      pagination: { page: 1, pageSize: 48, totalItems: 1, totalPages: 1 },
    });

    render(
      <ProductCategoryMediaPicker open selectedId={null} onClose={vi.fn()} onSelect={vi.fn()} />,
    );

    const dialog = await screen.findByRole('dialog', { name: 'Medya Kütüphanesinden Seç' });
    expect(dialog).toBeInTheDocument();
    expect(dialog.parentElement).toHaveClass('pc-media-picker-backdrop');
    expect(document.body.contains(dialog.parentElement)).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');
    expect(screen.getByRole('button', { name: 'Seçili görseli kullan' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Bilgisayardan Yükle' })).toBeInTheDocument();
  });

  it('applies selection through confirm and closes via callbacks', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onClose = vi.fn();
    mockedFetch.mockResolvedValue({
      items: [assetA, assetB],
      pagination: { page: 1, pageSize: 48, totalItems: 2, totalPages: 1 },
    });

    render(
      <ProductCategoryMediaPicker open selectedId={null} onClose={onClose} onSelect={onSelect} />,
    );

    await screen.findByRole('button', { name: 'hero-desktop.jpg seç' });
    await user.click(screen.getByRole('button', { name: 'hero-desktop.jpg seç' }));
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Seçili görseli kullan' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Seçili görseli kullan' }));
    expect(onSelect).toHaveBeenCalledWith(assetA);
    expect(onClose).toHaveBeenCalled();
  });

  it('keeps hero desktop/mobile target contract by returning full persistent asset', async () => {
    const user = userEvent.setup();
    let applied: { url: string; pathname: string } | null = null;
    mockedFetch.mockResolvedValue({
      items: [assetA],
      pagination: { page: 1, pageSize: 48, totalItems: 1, totalPages: 1 },
    });

    render(
      <ProductCategoryMediaPicker
        open
        selectedId={null}
        onClose={vi.fn()}
        onSelect={(asset) => {
          applied = { url: asset.url, pathname: asset.pathname };
        }}
      />,
    );

    await user.click(await screen.findByRole('button', { name: 'hero-desktop.jpg seç' }));
    await user.click(screen.getByRole('button', { name: 'Seçili görseli kullan' }));
    expect(applied).toEqual({
      url: 'https://cdn.example.com/hero-a.jpg',
      pathname: 'media/2026/07/hero-a.jpg',
    });
    expect(applied?.url.startsWith('blob:')).toBe(false);
  });

  it('cancel closes without selecting', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onClose = vi.fn();
    mockedFetch.mockResolvedValue({
      items: [assetA],
      pagination: { page: 1, pageSize: 48, totalItems: 1, totalPages: 1 },
    });

    render(
      <ProductCategoryMediaPicker open selectedId={null} onClose={onClose} onSelect={onSelect} />,
    );

    await screen.findByRole('button', { name: 'hero-desktop.jpg seç' });
    await user.click(screen.getByRole('button', { name: 'hero-desktop.jpg seç' }));
    await user.click(screen.getByRole('button', { name: 'İptal' }));
    expect(onClose).toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('shows API error with retry action', async () => {
    const user = userEvent.setup();
    mockedFetch
      .mockRejectedValueOnce(new AdminApiError('Sunucu hatası', 500, 'INTERNAL'))
      .mockResolvedValueOnce({
        items: [assetA],
        pagination: { page: 1, pageSize: 48, totalItems: 1, totalPages: 1 },
      });

    render(
      <ProductCategoryMediaPicker open selectedId={null} onClose={vi.fn()} onSelect={vi.fn()} />,
    );

    expect(await screen.findByText('Sunucu hatası')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tekrar dene' }));
    expect(await screen.findByRole('button', { name: 'hero-desktop.jpg seç' })).toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    mockedFetch.mockResolvedValue({
      items: [],
      pagination: { page: 1, pageSize: 48, totalItems: 0, totalPages: 0 },
    });

    render(
      <ProductCategoryMediaPicker open selectedId={null} onClose={onClose} onSelect={vi.fn()} />,
    );

    await waitFor(() => expect(mockedFetch).toHaveBeenCalled());
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('rejects unsupported file types before calling upload API', async () => {
    mockedFetch.mockResolvedValue({
      items: [assetA],
      pagination: { page: 1, pageSize: 48, totalItems: 1, totalPages: 1 },
    });

    render(
      <ProductCategoryMediaPicker open selectedId={null} onClose={vi.fn()} onSelect={vi.fn()} />,
    );

    await screen.findByRole('button', { name: 'Bilgisayardan Yükle' });
    const input = document.querySelector('.pc-media-picker__file-input') as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [new File(['pdf'], 'dokuman.pdf', { type: 'application/pdf' })] },
    });

    expect(await screen.findByText('Yalnızca PNG, JPEG, WebP ve SVG dosyaları yüklenebilir.')).toBeInTheDocument();
    expect(mockedUpload).not.toHaveBeenCalled();
  });

  it('rejects oversized files before calling upload API', async () => {
    mockedFetch.mockResolvedValue({
      items: [assetA],
      pagination: { page: 1, pageSize: 48, totalItems: 1, totalPages: 1 },
    });

    render(
      <ProductCategoryMediaPicker open selectedId={null} onClose={vi.fn()} onSelect={vi.fn()} />,
    );

    await screen.findByRole('button', { name: 'Bilgisayardan Yükle' });
    const input = document.querySelector('.pc-media-picker__file-input') as HTMLInputElement;
    fireEvent.change(input, {
      target: {
        files: [
          new File(
            [new Uint8Array(MEDIA_LIMITS.defaultMaxImageSizeMb * 1024 * 1024 + 1)],
            'buyuk.png',
            { type: 'image/png' },
          ),
        ],
      },
    });

    expect(
      await screen.findByText(`Dosya boyutu en fazla ${MEDIA_LIMITS.defaultMaxImageSizeMb} MB olabilir.`),
    ).toBeInTheDocument();
    expect(mockedUpload).not.toHaveBeenCalled();
  });

  it('uploads a valid image, prepends it selected, and waits for confirm', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    mockedFetch.mockResolvedValue({
      items: [assetA],
      pagination: { page: 1, pageSize: 48, totalItems: 1, totalPages: 1 },
    });
    mockedUpload.mockResolvedValue({
      results: [{ originalFilename: 'yeni-gorsel.png', success: true, asset: uploadedAsset }],
    });

    render(
      <ProductCategoryMediaPicker open selectedId={null} onClose={vi.fn()} onSelect={onSelect} />,
    );

    await screen.findByRole('button', { name: 'hero-desktop.jpg seç' });
    const input = document.querySelector('.pc-media-picker__file-input') as HTMLInputElement;
    await user.upload(input, new File([new Uint8Array([1, 2, 3])], 'yeni-gorsel.png', { type: 'image/png' }));

    await waitFor(() => expect(mockedUpload).toHaveBeenCalledTimes(1));
    const uploadedButton = await screen.findByRole('button', { name: 'yeni-gorsel.png seç' });
    expect(uploadedButton).toHaveAttribute('aria-pressed', 'true');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('does not select card when delete button is pressed and requires confirmation', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    mockedFetch.mockResolvedValue({
      items: [assetA],
      pagination: { page: 1, pageSize: 48, totalItems: 1, totalPages: 1 },
    });

    render(
      <ProductCategoryMediaPicker open selectedId={null} onClose={vi.fn()} onSelect={onSelect} />,
    );

    await screen.findByRole('button', { name: 'hero-desktop.jpg seç' });
    await user.click(screen.getByRole('button', { name: 'hero-desktop.jpg sil' }));
    expect(mockedDelete).not.toHaveBeenCalled();
    expect(screen.getByRole('alertdialog', { name: 'Görsel silinsin mi?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'hero-desktop.jpg seç' })).toHaveAttribute('aria-pressed', 'false');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('deletes media after confirm and clears pending selection', async () => {
    const user = userEvent.setup();
    mockedFetch.mockResolvedValue({
      items: [assetA, assetB],
      pagination: { page: 1, pageSize: 48, totalItems: 2, totalPages: 1 },
    });
    mockedDelete.mockResolvedValue({ deleted: true, usageCount: 0 });

    render(
      <ProductCategoryMediaPicker open selectedId={null} onClose={vi.fn()} onSelect={vi.fn()} />,
    );

    await user.click(await screen.findByRole('button', { name: 'hero-desktop.jpg seç' }));
    expect(screen.getByRole('button', { name: 'Seçili görseli kullan' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'hero-desktop.jpg sil' }));
    await user.click(screen.getByRole('button', { name: 'Görseli Sil' }));

    await waitFor(() => expect(mockedDelete).toHaveBeenCalledWith('a1'));
    expect(screen.queryByRole('button', { name: 'hero-desktop.jpg seç' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Seçili görseli kullan' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'hero-mobile.jpg seç' })).toBeInTheDocument();
  });

  it('keeps list and shows message when media is in use', async () => {
    const user = userEvent.setup();
    mockedFetch.mockResolvedValue({
      items: [assetA],
      pagination: { page: 1, pageSize: 48, totalItems: 1, totalPages: 1 },
    });
    mockedDelete.mockRejectedValue(
      new AdminApiError('Bu görsel başka bir içerikte kullanıldığı için silinemez.', 409, 'MEDIA_IN_USE'),
    );

    render(
      <ProductCategoryMediaPicker open selectedId={null} onClose={vi.fn()} onSelect={vi.fn()} />,
    );

    await user.click(await screen.findByRole('button', { name: 'hero-desktop.jpg sil' }));
    await user.click(screen.getByRole('button', { name: 'Görseli Sil' }));

    expect(
      await screen.findByText('Bu görsel başka bir içerikte kullanıldığı için silinemez.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'hero-desktop.jpg seç' })).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Medya Kütüphanesinden Seç' })).toBeInTheDocument();
  });

  it('hides delete action for editor role', async () => {
    mockedSession.mockReturnValue({
      admin: { id: '2', fullName: 'Editor', email: 'e@b.c', role: 'EDITOR' },
    });
    mockedFetch.mockResolvedValue({
      items: [assetA],
      pagination: { page: 1, pageSize: 48, totalItems: 1, totalPages: 1 },
    });

    render(
      <ProductCategoryMediaPicker open selectedId={null} onClose={vi.fn()} onSelect={vi.fn()} />,
    );

    await screen.findByRole('button', { name: 'hero-desktop.jpg seç' });
    expect(screen.queryByRole('button', { name: 'hero-desktop.jpg sil' })).not.toBeInTheDocument();
  });
});
