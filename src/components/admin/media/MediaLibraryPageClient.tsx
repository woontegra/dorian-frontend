'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { MediaAsset, MediaSortOrder } from '@kurumsal/shared';
import { Upload } from 'lucide-react';
import { AdminInlineNotice } from '@/components/admin/common/AdminInlineNotice';
import { MediaDetailPanel } from '@/components/admin/media/MediaDetailPanel';
import { MediaEmptyState } from '@/components/admin/media/MediaEmptyState';
import { MediaGrid } from '@/components/admin/media/MediaGrid';
import { MediaListView } from '@/components/admin/media/MediaListView';
import { MediaSkeleton } from '@/components/admin/media/MediaSkeleton';
import { MediaToolbar, type MediaViewMode } from '@/components/admin/media/MediaToolbar';
import {
  MediaUploadPanel,
  revokeUploadQueue,
  type UploadQueueItem,
} from '@/components/admin/media/MediaUploadPanel';
import { useAdminSession } from '@/components/admin/session/AdminSessionProvider';
import { AdminApiError } from '@/lib/auth/types';
import {
  deleteMediaAsset,
  fetchMediaAssets,
  isForbiddenError,
  isUnauthorizedError,
  updateMediaAsset,
  uploadMediaAssets,
} from '@/lib/media/api';

type Notice = { tone: 'success' | 'error'; message: string } | null;

export function MediaLibraryPageClient() {
  const router = useRouter();
  const { admin } = useAdminSession();
  const canDelete = admin.role === 'ADMIN';

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState<MediaSortOrder>('newest');
  const [viewMode, setViewMode] = useState<MediaViewMode>('grid');
  const [notice, setNotice] = useState<Notice>(null);
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [detailNotice, setDetailNotice] = useState<Notice>(null);
  const [savingDetail, setSavingDetail] = useState(false);
  const [deletingDetail, setDeletingDetail] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadMedia = useCallback(async (options?: { keepNotice?: boolean }) => {
    setLoading(true);
    if (!options?.keepNotice) {
      setNotice(null);
    }
    try {
      const response = await fetchMediaAssets({
        page,
        pageSize: 24,
        search: debouncedSearch || undefined,
        sort,
      });
      setItems(response.items);
      setTotalItems(response.pagination.totalItems);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        router.replace('/admin/login');
        return;
      }
      setNotice({
        tone: 'error',
        message: error instanceof AdminApiError ? error.message : 'Medya kütüphanesi yüklenemedi.',
      });
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, sort, router]);

  useEffect(() => {
    void loadMedia();
  }, [loadMedia]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sort]);

  const searchActive = debouncedSearch.length > 0;

  const openUpload = () => {
    setUploadOpen(true);
    setNotice(null);
  };

  const closeUpload = () => {
    if (uploading) {
      return;
    }
    revokeUploadQueue(uploadQueue);
    setUploadQueue([]);
    setUploadOpen(false);
  };

  async function handleStartUpload() {
    if (uploading) {
      return;
    }

    const pendingItems = uploadQueue.filter((item) => item.status === 'pending');
    if (pendingItems.length === 0) {
      return;
    }

    setUploading(true);
    setNotice(null);

    let nextQueue = uploadQueue.map((item) =>
      item.status === 'pending' ? { ...item, status: 'uploading' as const } : item,
    );
    setUploadQueue(nextQueue);

    try {
      const response = await uploadMediaAssets(pendingItems.map((item) => item.file));
      const resultMap = new Map(response.results.map((result) => [result.originalFilename, result]));

      nextQueue = nextQueue.map((item) => {
        const result = resultMap.get(item.file.name);
        if (!result || item.status !== 'uploading') {
          return item;
        }
        if (result.success) {
          return { ...item, status: 'success' as const };
        }
        return { ...item, status: 'error' as const, error: result.error ?? 'Yüklenemedi.' };
      });

      const attemptedCount = response.results.length;
      const successCount = response.results.filter((result) => result.success).length;
      const allAttemptedSucceeded = attemptedCount > 0 && successCount === attemptedCount;

      if (allAttemptedSucceeded) {
        revokeUploadQueue(nextQueue);
        setUploadQueue([]);
        setUploadOpen(false);
        setNotice({ tone: 'success', message: `${successCount} görsel başarıyla yüklendi.` });
        await loadMedia({ keepNotice: true });
        return;
      }

      const failedItems = nextQueue.filter((item) => item.status === 'error');
      for (const item of nextQueue) {
        if (item.status === 'success') {
          URL.revokeObjectURL(item.previewUrl);
        }
      }
      setUploadQueue(failedItems);

      if (successCount > 0) {
        setNotice({ tone: 'success', message: `${successCount} görsel başarıyla yüklendi.` });
        await loadMedia({ keepNotice: true });
      }
      if (response.results.some((result) => !result.success)) {
        setNotice({
          tone: 'error',
          message: 'Bazı dosyalar yüklenemedi. Kuyruktaki hata mesajlarını kontrol edin.',
        });
      }
    } catch (error) {
      if (isUnauthorizedError(error)) {
        router.replace('/admin/login');
        return;
      }
      setNotice({
        tone: 'error',
        message: error instanceof AdminApiError ? error.message : 'Yükleme başarısız oldu.',
      });
      setUploadQueue(
        uploadQueue.map((item) =>
          item.status === 'uploading' ? { ...item, status: 'error' as const, error: 'Yükleme başarısız.' } : item,
        ),
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveDetail(payload: { altText: string; title: string; caption: string }) {
    if (!selectedAsset) {
      return;
    }
    setSavingDetail(true);
    setDetailNotice(null);
    try {
      const updated = await updateMediaAsset(selectedAsset.id, {
        altText: payload.altText.trim() || null,
        title: payload.title.trim() || null,
        caption: payload.caption.trim() || null,
      });
      setSelectedAsset(updated);
      setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setDetailNotice({ tone: 'success', message: 'Görsel bilgileri kaydedildi.' });
    } catch (error) {
      if (isUnauthorizedError(error)) {
        router.replace('/admin/login');
        return;
      }
      setDetailNotice({
        tone: 'error',
        message: error instanceof AdminApiError ? error.message : 'Kaydetme başarısız oldu.',
      });
    } finally {
      setSavingDetail(false);
    }
  }

  async function handleDeleteDetail() {
    if (!selectedAsset || !canDelete) {
      return;
    }
    setDeletingDetail(true);
    setDetailNotice(null);
    try {
      await deleteMediaAsset(selectedAsset.id);
      setItems((current) => current.filter((item) => item.id !== selectedAsset.id));
      setTotalItems((current) => Math.max(0, current - 1));
      setSelectedAsset(null);
      setNotice({ tone: 'success', message: 'Görsel silindi.' });
    } catch (error) {
      if (isUnauthorizedError(error)) {
        router.replace('/admin/login');
        return;
      }
      if (isForbiddenError(error)) {
        setDetailNotice({ tone: 'error', message: 'Bu işlem için yetkiniz yok.' });
        return;
      }
      setDetailNotice({
        tone: 'error',
        message: error instanceof AdminApiError ? error.message : 'Silme işlemi başarısız oldu.',
      });
    } finally {
      setDeletingDetail(false);
    }
  }

  const totalLabel = useMemo(() => `${totalItems} görsel`, [totalItems]);

  return (
    <div className="media-page">
      <header className="media-page-header">
        <div className="media-page-header__intro">
          <h2 className="media-page-header__title">Medya Kütüphanesi</h2>
          <p className="media-page-header__description">Sitenizde kullanılan görselleri yükleyin ve yönetin.</p>
          <p className="media-page-header__count" role="status">{totalLabel}</p>
          {notice ? <AdminInlineNotice tone={notice.tone} message={notice.message} /> : null}
        </div>
        <button type="button" className="admin-button admin-button-primary media-page-header__upload" onClick={openUpload}>
          <Upload size={16} />
          Görsel Yükle
        </button>
      </header>

      <MediaToolbar
        search={search}
        sort={sort}
        viewMode={viewMode}
        onSearchChange={setSearch}
        onSortChange={setSort}
        onViewModeChange={setViewMode}
      />

      {loading ? <MediaSkeleton /> : null}

      {!loading && items.length === 0 ? <MediaEmptyState onUpload={openUpload} searchActive={searchActive} /> : null}

      {!loading && items.length > 0 ? (
        viewMode === 'grid' ? (
          <MediaGrid items={items} onSelect={setSelectedAsset} />
        ) : (
          <MediaListView items={items} onSelect={setSelectedAsset} />
        )
      ) : null}

      <MediaUploadPanel
        open={uploadOpen}
        uploading={uploading}
        queue={uploadQueue}
        onClose={closeUpload}
        onQueueChange={setUploadQueue}
        onStartUpload={() => void handleStartUpload()}
      />

      <MediaDetailPanel
        asset={selectedAsset}
        readOnlyDelete={!canDelete}
        saving={savingDetail}
        deleting={deletingDetail}
        notice={detailNotice}
        onClose={() => setSelectedAsset(null)}
        onSave={(payload) => void handleSaveDetail(payload)}
        onDelete={() => void handleDeleteDetail()}
      />
    </div>
  );
}
