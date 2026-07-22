import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MediaLibraryPageClient } from '@/components/admin/media/MediaLibraryPageClient';
import { AdminApiError } from '@/lib/auth/types';
import type { MediaAsset } from '@kurumsal/shared';

const replaceMock = vi.fn();
const routerMock = { replace: replaceMock, push: vi.fn() };

vi.mock('next/navigation', () => ({
  useRouter: () => routerMock,
}));

vi.mock('@/components/admin/session/AdminSessionProvider', () => ({
  useAdminSession: vi.fn(),
}));

vi.mock('@/lib/media/api', () => ({
  fetchMediaAssets: vi.fn(),
  updateMediaAsset: vi.fn(),
  deleteMediaAsset: vi.fn(),
  uploadMediaAssets: vi.fn(),
  isForbiddenError: (error: unknown) => error instanceof AdminApiError && error.code === 'FORBIDDEN',
  isUnauthorizedError: (error: unknown) => error instanceof AdminApiError && error.code === 'UNAUTHORIZED',
}));

import { useAdminSession } from '@/components/admin/session/AdminSessionProvider';
import { fetchMediaAssets, updateMediaAsset, uploadMediaAssets } from '@/lib/media/api';

const mockedSession = useAdminSession as unknown as ReturnType<typeof vi.fn>;
const mockedFetch = fetchMediaAssets as unknown as ReturnType<typeof vi.fn>;
const mockedUpdate = updateMediaAsset as unknown as ReturnType<typeof vi.fn>;
const mockedUpload = uploadMediaAssets as unknown as ReturnType<typeof vi.fn>;

const revokeObjectUrlMock = vi.fn();

async function openUploadPanel(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Görsel Yükle' }));
  return screen.getByRole('dialog', { name: /Görsel Yükle/i });
}

async function queueFile(user: ReturnType<typeof userEvent.setup>, fileName = 'test.png') {
  const file = new File(['image'], fileName, { type: 'image/png' });
  const input = document.querySelector('.media-dropzone input[type="file"]') as HTMLInputElement;
  await user.upload(input, file);
}

const sampleAsset: MediaAsset = {
  id: '11111111-1111-1111-1111-111111111111',
  filename: 'abc.png',
  originalFilename: 'photo.png',
  url: 'https://blob/photo.png',
  pathname: 'media/2026/07/abc.png',
  mimeType: 'image/png',
  extension: 'png',
  sizeBytes: 1200,
  width: 100,
  height: 80,
  altText: null,
  title: null,
  caption: null,
  createdById: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('MediaLibraryPageClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    revokeObjectUrlMock.mockReset();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: vi.fn(() => 'blob:preview'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revokeObjectUrlMock,
    });
    mockedSession.mockReturnValue({
      admin: { id: '1', fullName: 'Admin', email: 'a@b.c', role: 'ADMIN' },
    });
    mockedFetch.mockResolvedValue({
      items: [sampleAsset],
      pagination: { page: 1, pageSize: 24, totalItems: 1, totalPages: 1 },
    });
  });

  it('shows loading then grid content', async () => {
    render(<MediaLibraryPageClient />);
    expect(await screen.findByText('photo.png')).toBeInTheDocument();
    expect(screen.getByText('1 görsel')).toBeInTheDocument();
  });

  it('shows empty state when no media', async () => {
    mockedFetch.mockResolvedValue({
      items: [],
      pagination: { page: 1, pageSize: 24, totalItems: 0, totalPages: 1 },
    });
    render(<MediaLibraryPageClient />);
    expect(await screen.findByText(/Henüz görsel yok/i)).toBeInTheDocument();
  });

  it('switches to list view', async () => {
    const user = userEvent.setup();
    render(<MediaLibraryPageClient />);
    await screen.findByText('photo.png');
    await user.click(screen.getByRole('button', { name: /Liste/i }));
    expect(screen.getByRole('list')).toHaveClass('media-list');
  });

  it('renders sort select without visible label and with aria-label', async () => {
    render(<MediaLibraryPageClient />);
    await screen.findByText('photo.png');
    expect(screen.queryByText('Sıralama')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Sıralama' })).toHaveClass('media-toolbar__sort');
  });

  it('opens upload panel', async () => {
    const user = userEvent.setup();
    render(<MediaLibraryPageClient />);
    await screen.findByText('photo.png');
    await openUploadPanel(user);
  });

  it('renders compact file select button and opens file input', async () => {
    const user = userEvent.setup();
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click');
    render(<MediaLibraryPageClient />);
    await screen.findByText('photo.png');
    await openUploadPanel(user);

    const selectButton = screen.getByRole('button', { name: 'Dosya Seç' });
    expect(selectButton).toHaveClass('media-dropzone__select');
    await user.click(selectButton);
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it('closes upload panel after single successful upload', async () => {
    const user = userEvent.setup();
    mockedUpload.mockResolvedValue({
      results: [{ originalFilename: 'test.png', success: true, asset: sampleAsset }],
    });

    render(<MediaLibraryPageClient />);
    await screen.findByText('photo.png');
    await openUploadPanel(user);
    await queueFile(user);
    await user.click(screen.getByRole('button', { name: 'Yüklemeyi Başlat' }));

    await waitFor(() => {
      expect(mockedUpload).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('dialog', { name: /Görsel Yükle/i })).not.toBeInTheDocument();
      expect(screen.getByText(/başarıyla yüklendi/i)).toBeInTheDocument();
    });
    expect(revokeObjectUrlMock).toHaveBeenCalled();
  });

  it('closes upload panel when all queued files succeed', async () => {
    const user = userEvent.setup();
    mockedUpload.mockResolvedValue({
      results: [
        { originalFilename: 'one.png', success: true, asset: sampleAsset },
        { originalFilename: 'two.png', success: true, asset: { ...sampleAsset, id: '2', originalFilename: 'two.png' } },
      ],
    });

    render(<MediaLibraryPageClient />);
    await screen.findByText('photo.png');
    await openUploadPanel(user);
    await queueFile(user, 'one.png');
    await queueFile(user, 'two.png');
    await user.click(screen.getByRole('button', { name: 'Yüklemeyi Başlat' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /Görsel Yükle/i })).not.toBeInTheDocument();
    });
  });

  it('keeps upload panel open when some files fail', async () => {
    const user = userEvent.setup();
    mockedUpload.mockResolvedValue({
      results: [
        { originalFilename: 'ok.png', success: true, asset: sampleAsset },
        { originalFilename: 'bad.png', success: false, error: 'Geçersiz dosya.' },
      ],
    });

    render(<MediaLibraryPageClient />);
    await screen.findByText('photo.png');
    await openUploadPanel(user);
    await queueFile(user, 'ok.png');
    await queueFile(user, 'bad.png');
    await user.click(screen.getByRole('button', { name: 'Yüklemeyi Başlat' }));

    expect(await screen.findByRole('dialog', { name: /Görsel Yükle/i })).toBeInTheDocument();
    expect(screen.getByText('Geçersiz dosya.')).toBeInTheDocument();
    expect(screen.queryByText('ok.png')).not.toBeInTheDocument();
  });

  it('does not restore previous successful queue when reopening upload panel', async () => {
    const user = userEvent.setup();
    mockedUpload.mockResolvedValue({
      results: [{ originalFilename: 'test.png', success: true, asset: sampleAsset }],
    });

    render(<MediaLibraryPageClient />);
    await screen.findByText('photo.png');
    await openUploadPanel(user);
    await queueFile(user);
    await user.click(screen.getByRole('button', { name: 'Yüklemeyi Başlat' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /Görsel Yükle/i })).not.toBeInTheDocument();
    });

    await openUploadPanel(user);
    expect(screen.queryByText('test.png')).not.toBeInTheDocument();
  });

  it('revokes object URLs when upload panel is closed manually', async () => {
    const user = userEvent.setup();
    render(<MediaLibraryPageClient />);
    await screen.findByText('photo.png');
    await openUploadPanel(user);
    await queueFile(user);
    await user.click(screen.getByRole('button', { name: 'İptal' }));

    expect(revokeObjectUrlMock).toHaveBeenCalled();
    expect(screen.queryByRole('dialog', { name: /Görsel Yükle/i })).not.toBeInTheDocument();
  });

  it('opens detail panel and saves metadata for admin', async () => {
    const user = userEvent.setup();
    mockedUpdate.mockResolvedValue({ ...sampleAsset, altText: 'Logo' });
    render(<MediaLibraryPageClient />);
    await user.click(await screen.findByText('photo.png'));
    await user.type(screen.getByLabelText('ALT Metni'), 'Logo');
    await user.click(screen.getByRole('button', { name: 'Kaydet' }));
    await waitFor(() => expect(mockedUpdate).toHaveBeenCalled());
  });

  it('hides delete button for editor', async () => {
    mockedSession.mockReturnValue({
      admin: { id: '2', fullName: 'Editor', email: 'e@b.c', role: 'EDITOR' },
    });
    const user = userEvent.setup();
    render(<MediaLibraryPageClient />);
    await user.click(await screen.findByText('photo.png'));
    expect(screen.queryByRole('button', { name: 'Sil' })).not.toBeInTheDocument();
  });

  it('redirects to login on 401', async () => {
    mockedFetch.mockRejectedValue(new AdminApiError('Unauthorized', 401, 'UNAUTHORIZED'));
    render(<MediaLibraryPageClient />);
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith('/admin/login'));
  });

  it('shows forbidden message without login redirect on 403 update', async () => {
    mockedSession.mockReturnValue({
      admin: { id: '2', fullName: 'Editor', email: 'e@b.c', role: 'EDITOR' },
    });
    mockedUpdate.mockRejectedValue(new AdminApiError('Bu işlem için yetkiniz yok.', 403, 'FORBIDDEN'));
    const user = userEvent.setup();
    render(<MediaLibraryPageClient />);
    await user.click(await screen.findByText('photo.png'));
    await user.click(screen.getByRole('button', { name: 'Kaydet' }));
    expect(await screen.findByText(/yetkiniz yok/i)).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalledWith('/admin/login');
  });
});
