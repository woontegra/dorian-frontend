'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { MediaAsset } from '@kurumsal/shared';
import { MEDIA_LIMITS } from '@kurumsal/shared';
import { Check, Search, Trash2, Upload, X } from 'lucide-react';
import { useAdminSession } from '@/components/admin/session/AdminSessionProvider';
import { deleteMediaAsset, fetchMediaAssets, isForbiddenError, uploadMediaAssets } from '@/lib/media/api';
import { ACCEPTED_MEDIA_TYPES, isAcceptedMediaFile } from '@/lib/media/format';
import { AdminApiError } from '@/lib/auth/types';
import '@/components/admin/product-categories/media-picker.css';

type ProductCategoryMediaPickerProps = {
  open: boolean;
  selectedId: string | null;
  onSelect: (asset: MediaAsset) => void;
  onClose: () => void;
  description?: string;
};

const ACCEPT_ATTR = ACCEPTED_MEDIA_TYPES.join(',');
const MAX_BYTES = MEDIA_LIMITS.defaultMaxImageSizeMb * 1024 * 1024;

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function assetMeta(asset: MediaAsset): string {
  const parts = [asset.extension.toUpperCase(), formatBytes(asset.sizeBytes)];
  if (asset.width && asset.height) {
    parts.push(`${asset.width}×${asset.height}`);
  }
  return parts.join(' · ');
}

function validateUploadFile(file: File): string | null {
  if (!isAcceptedMediaFile(file)) {
    return 'Yalnızca PNG, JPEG, WebP ve SVG dosyaları yüklenebilir.';
  }
  if (file.size > MAX_BYTES) {
    return `Dosya boyutu en fazla ${MEDIA_LIMITS.defaultMaxImageSizeMb} MB olabilir.`;
  }
  return null;
}

function isPersistedMediaUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (/^(blob:|file:|data:)/i.test(trimmed)) return false;
  return /^https?:\/\//i.test(trimmed) || trimmed.startsWith('/');
}

export function ProductCategoryMediaPicker({
  open,
  selectedId,
  onSelect,
  onClose,
  description = 'Tek bir görsel seçin. Onaylanana kadar form değeri değişmez.',
}: ProductCategoryMediaPickerProps) {
  const { admin } = useAdminSession();
  const canDelete = admin.role === 'ADMIN';
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const skipNextFetchRef = useRef(false);
  const uploadingRef = useRef(false);
  const pendingAssetRef = useRef<MediaAsset | null>(null);

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pendingAsset, setPendingAsset] = useState<MediaAsset | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MediaAsset | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    uploadingRef.current = uploading;
  }, [uploading]);

  useEffect(() => {
    pendingAssetRef.current = pendingAsset;
  }, [pendingAsset]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!open) {
      return;
    }

    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setPendingAsset(null);
    pendingAssetRef.current = null;
    setSearch('');
    setDebouncedSearch('');
    setError(null);
    setUploadError(null);
    setActionError(null);
    setDragActive(false);
    setUploading(false);
    setDeleteTarget(null);
    setDeleting(false);
    skipNextFetchRef.current = false;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      searchRef.current?.focus();
    }, 0);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
      returnFocusRef.current?.focus?.();
      returnFocusRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !selectedId) {
      return;
    }
    setPendingAsset((current) => {
      if (current?.id === selectedId) return current;
      const matched = items.find((item) => item.id === selectedId) ?? null;
      return matched;
    });
  }, [open, selectedId, items]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    void fetchMediaAssets({ page: 1, pageSize: 48, search: debouncedSearch || undefined, sort: 'newest' })
      .then((response) => {
        if (!active) return;
        setItems(response.items);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setItems([]);
        setError(err instanceof AdminApiError ? err.message : 'Medya listesi yüklenemedi.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, debouncedSearch, reloadToken]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (deleting || uploadingRef.current) {
          return;
        }
        if (deleteTarget) {
          setDeleteTarget(null);
          return;
        }
        onClose();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose, deleteTarget, deleting]);

  function selectAsset(asset: MediaAsset) {
    setPendingAsset(asset);
    pendingAssetRef.current = asset;
    setActionError(null);
  }

  async function uploadFile(file: File) {
    if (uploadingRef.current) {
      return;
    }

    const validationError = validateUploadFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setUploading(true);
    setUploadError(null);
    setActionError(null);

    try {
      const response = await uploadMediaAssets([file]);
      const result = response.results[0];
      if (!result?.success || !result.asset) {
        setUploadError(result?.error ?? 'Dosya yüklenemedi.');
        return;
      }

      const uploaded = result.asset;
      if (!isPersistedMediaUrl(uploaded.url)) {
        setUploadError('Yüklenen görsel kalıcı URL döndürmedi. Lütfen tekrar deneyin.');
        return;
      }

      if (search.trim()) {
        skipNextFetchRef.current = true;
        setSearch('');
        setDebouncedSearch('');
      }

      setError(null);
      setItems((current) => [uploaded, ...current.filter((item) => item.id !== uploaded.id)]);
      selectAsset(uploaded);
      window.requestAnimationFrame(() => {
        const node = bodyRef.current;
        if (!node) return;
        if (typeof node.scrollTo === 'function') {
          node.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          node.scrollTop = 0;
        }
      });
    } catch (err: unknown) {
      setUploadError(err instanceof AdminApiError ? err.message : 'Dosya yüklenemedi.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  function handleIncomingFiles(fileList: FileList | File[] | null) {
    if (!fileList || uploading) {
      return;
    }
    const file = Array.from(fileList)[0];
    if (!file) {
      return;
    }
    void uploadFile(file);
  }

  function requestClose() {
    if (uploading || deleting) {
      return;
    }
    onClose();
  }

  function confirmSelection(event?: { preventDefault?: () => void; stopPropagation?: () => void }) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    const selected = pendingAssetRef.current ?? pendingAsset;
    if (!selected || uploading || deleting) {
      return;
    }

    if (!isPersistedMediaUrl(selected.url)) {
      setActionError('Seçilen görsel kullanılamıyor. Kalıcı bir medya kaydı seçin.');
      return;
    }

    setActionError(null);
    onSelect(selected);
    onClose();
  }

  async function confirmDelete() {
    if (!deleteTarget || deleting || !canDelete) {
      return;
    }

    setDeleting(true);
    setActionError(null);

    try {
      await deleteMediaAsset(deleteTarget.id);
      setItems((current) => current.filter((item) => item.id !== deleteTarget.id));
      if (pendingAssetRef.current?.id === deleteTarget.id || pendingAsset?.id === deleteTarget.id) {
        setPendingAsset(null);
        pendingAssetRef.current = null;
      }
      setDeleteTarget(null);
    } catch (err: unknown) {
      if (isForbiddenError(err)) {
        setActionError('Bu işlem için yetkiniz yok.');
      } else if (err instanceof AdminApiError && err.code === 'MEDIA_IN_USE') {
        setActionError(err.message || 'Bu görsel başka bir içerikte kullanıldığı için silinemez.');
      } else {
        setActionError(err instanceof AdminApiError ? err.message : 'Görsel silinemedi.');
      }
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  if (!mounted || !open) {
    return null;
  }

  const emptySearch = Boolean(debouncedSearch) && !loading && !error && items.length === 0;
  const emptyLibrary = !debouncedSearch && !loading && !error && items.length === 0;
  const confirmEnabled = Boolean(pendingAsset && isPersistedMediaUrl(pendingAsset.url) && !uploading && !deleting);

  const dialog = (
    <div className="pc-media-picker-backdrop" role="presentation" onClick={requestClose}>
      <div
        ref={dialogRef}
        className="pc-media-picker"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-busy={uploading || deleting}
        onClick={(event) => event.stopPropagation()}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!uploading && !deleting) setDragActive(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!uploading && !deleting) setDragActive(true);
        }}
        onDragLeave={(event) => {
          if (!dialogRef.current?.contains(event.relatedTarget as Node | null)) {
            setDragActive(false);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          handleIncomingFiles(event.dataTransfer.files);
        }}
      >
        <header className="pc-media-picker__header">
          <div className="pc-media-picker__header-copy">
            <h3 id={titleId}>Medya Kütüphanesinden Seç</h3>
            <p>{description}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="pc-media-picker__close"
            onClick={requestClose}
            disabled={uploading || deleting}
            aria-label="Kapat"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="pc-media-picker__toolbar">
          <div className="pc-media-picker__toolbar-row">
            <label className="pc-media-picker__search">
              <Search size={16} aria-hidden="true" />
              <input
                ref={searchRef}
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Görsel ara…"
                aria-label="Görsel ara"
                disabled={uploading || deleting}
              />
            </label>
            <button
              type="button"
              className="pc-media-picker__upload-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || deleting}
            >
              <Upload size={16} aria-hidden="true" />
              {uploading ? 'Yükleniyor…' : 'Bilgisayardan Yükle'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_ATTR}
              className="pc-media-picker__file-input"
              tabIndex={-1}
              aria-hidden="true"
              disabled={uploading || deleting}
              onChange={(event) => {
                handleIncomingFiles(event.target.files);
              }}
            />
          </div>

          <div
            className={`pc-media-picker__dropzone${dragActive ? ' is-active' : ''}${uploading || deleting ? ' is-disabled' : ''}`}
            onClick={() => {
              if (!uploading && !deleting) fileInputRef.current?.click();
            }}
            role="button"
            tabIndex={0}
            aria-label="Görseli buraya sürükleyin veya bilgisayarınızdan seçin"
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                if (!uploading && !deleting) fileInputRef.current?.click();
              }
            }}
          >
            <Upload size={16} aria-hidden="true" />
            <span>Görseli buraya sürükleyin veya bilgisayarınızdan seçin</span>
          </div>

          {uploadError ? (
            <p className="pc-media-picker__upload-error" role="alert">
              {uploadError}
            </p>
          ) : null}
          {actionError ? (
            <p className="pc-media-picker__upload-error" role="alert">
              {actionError}
            </p>
          ) : null}
        </div>

        <div className="pc-media-picker__body" ref={bodyRef}>
          {loading ? (
            <div className="pc-media-picker__skeleton" aria-busy="true" aria-label="Yükleniyor">
              {Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className="pc-media-picker__skeleton-card" />
              ))}
            </div>
          ) : null}

          {!loading && error ? (
            <div className="pc-media-picker__status" role="alert">
              <p>{error}</p>
              <div className="pc-media-picker__status-actions">
                <button
                  type="button"
                  className="pc-media-picker__btn"
                  onClick={() => setReloadToken((value) => value + 1)}
                >
                  Tekrar dene
                </button>
              </div>
            </div>
          ) : null}

          {!loading && !error && emptyLibrary ? (
            <p className="pc-media-picker__status">
              Henüz görsel yok. Bilgisayardan yükleyebilir veya Medya Kütüphanesi’ne ekleyebilirsiniz.
            </p>
          ) : null}

          {!loading && !error && emptySearch ? (
            <p className="pc-media-picker__status">Aramanızla eşleşen görsel bulunamadı.</p>
          ) : null}

          {!loading && !error && items.length > 0 ? (
            <ul className="pc-media-picker__grid">
              {items.map((asset) => {
                const selected = pendingAsset?.id === asset.id;
                return (
                  <li key={asset.id} className="pc-media-picker__card">
                    <button
                      type="button"
                      className={`pc-media-picker__item${selected ? ' pc-media-picker__item--selected' : ''}`}
                      onClick={() => selectAsset(asset)}
                      onDoubleClick={(event) => {
                        event.preventDefault();
                        selectAsset(asset);
                        confirmSelection();
                      }}
                      aria-pressed={selected}
                      aria-label={`${asset.originalFilename} seç`}
                      disabled={uploading || deleting}
                    >
                      <span className="pc-media-picker__thumb">
                        <img src={asset.url} alt="" loading="lazy" decoding="async" />
                        {selected ? (
                          <span className="pc-media-picker__check" aria-hidden="true">
                            <Check size={12} strokeWidth={3} />
                          </span>
                        ) : null}
                      </span>
                      <span className="pc-media-picker__meta">
                        <span className="pc-media-picker__name">{asset.originalFilename}</span>
                        <span className="pc-media-picker__info">{assetMeta(asset)}</span>
                      </span>
                    </button>
                    {canDelete ? (
                      <button
                        type="button"
                        className="pc-media-picker__delete"
                        aria-label={`${asset.originalFilename} sil`}
                        disabled={uploading || deleting}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setActionError(null);
                          setDeleteTarget(asset);
                        }}
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>

        <footer className="pc-media-picker__footer">
          <button type="button" className="pc-media-picker__btn" onClick={requestClose} disabled={uploading || deleting}>
            İptal
          </button>
          <button
            type="button"
            className="pc-media-picker__btn pc-media-picker__btn--primary"
            disabled={!confirmEnabled}
            onClick={(event) => confirmSelection(event)}
          >
            Seçili görseli kullan
          </button>
        </footer>

        {deleteTarget ? (
          <div
            className="pc-media-picker__confirm-backdrop"
            role="presentation"
            onClick={() => {
              if (!deleting) setDeleteTarget(null);
            }}
          >
            <div
              className="pc-media-picker__confirm"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="pc-media-delete-title"
              aria-describedby="pc-media-delete-desc"
              onClick={(event) => event.stopPropagation()}
            >
              <h4 id="pc-media-delete-title">Görsel silinsin mi?</h4>
              <p id="pc-media-delete-desc">
                Bu görsel Medya Kütüphanesinden kalıcı olarak silinecek. Bu işlem geri alınamaz.
              </p>
              <div className="pc-media-picker__confirm-actions">
                <button
                  type="button"
                  className="pc-media-picker__btn"
                  disabled={deleting}
                  onClick={() => setDeleteTarget(null)}
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  className="pc-media-picker__btn pc-media-picker__btn--danger"
                  disabled={deleting}
                  onClick={() => void confirmDelete()}
                >
                  {deleting ? 'Siliniyor…' : 'Görseli Sil'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
