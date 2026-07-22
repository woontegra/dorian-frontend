'use client';

import { useEffect, useState } from 'react';
import type { MediaAsset } from '@kurumsal/shared';
import { Copy, Trash2, X } from 'lucide-react';
import { AdminConfirmDialog } from '@/components/admin/common/AdminConfirmDialog';
import { AdminInlineNotice } from '@/components/admin/common/AdminInlineNotice';
import { MediaPreviewImage } from '@/components/admin/media/MediaPreviewImage';
import { formatDate, formatDimensions, formatFileSize } from '@/lib/media/format';

type MediaDetailPanelProps = {
  asset: MediaAsset | null;
  readOnlyDelete: boolean;
  saving: boolean;
  deleting: boolean;
  notice: { tone: 'success' | 'error'; message: string } | null;
  onClose: () => void;
  onSave: (payload: { altText: string; title: string; caption: string }) => void;
  onDelete: () => void;
};

export function MediaDetailPanel({
  asset,
  readOnlyDelete,
  saving,
  deleting,
  notice,
  onClose,
  onSave,
  onDelete,
}: MediaDetailPanelProps) {
  const [altText, setAltText] = useState('');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!asset) {
      return;
    }
    setAltText(asset.altText ?? '');
    setTitle(asset.title ?? '');
    setCaption(asset.caption ?? '');
    setCopyMessage(null);
    setConfirmDelete(false);
  }, [asset]);

  useEffect(() => {
    if (!asset) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !saving && !deleting) {
        onClose();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [asset, saving, deleting, onClose]);

  if (!asset) {
    return null;
  }

  async function handleCopyUrl() {
    try {
      await navigator.clipboard.writeText(asset!.url);
      setCopyMessage('URL panoya kopyalandı.');
    } catch {
      setCopyMessage('URL kopyalanamadı.');
    }
  }

  return (
    <>
      <div className="media-panel-backdrop" role="presentation" onClick={saving || deleting ? undefined : onClose}>
        <aside
          className="media-detail-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="media-detail-title"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="media-panel-header">
            <div>
              <h2 id="media-detail-title" className="media-panel-header__title">
                Görsel Ayrıntıları
              </h2>
              <p className="media-panel-header__description">{asset.originalFilename}</p>
            </div>
            <button type="button" className="media-panel-close" onClick={onClose} disabled={saving || deleting} aria-label="Kapat">
              <X size={18} />
            </button>
          </header>

          {notice ? <AdminInlineNotice tone={notice.tone} message={notice.message} /> : null}

          <div className="media-detail-preview">
            <MediaPreviewImage asset={asset} className="media-detail-preview__image" objectFit="contain" />
          </div>

          <dl className="media-detail-meta">
            <div><dt>Format</dt><dd>{asset.extension.toUpperCase()}</dd></div>
            <div><dt>Boyut</dt><dd>{formatFileSize(asset.sizeBytes)}</dd></div>
            <div><dt>Ölçü</dt><dd>{formatDimensions(asset.width, asset.height)}</dd></div>
            <div><dt>Yüklenme</dt><dd>{formatDate(asset.createdAt)}</dd></div>
          </dl>

          <div className="media-detail-url">
            <label className="media-field">
              <span className="media-field__label">Dosya URL</span>
              <div className="media-detail-url__row">
                <input className="media-field__input" value={asset.url} readOnly />
                <button type="button" className="admin-button admin-button-secondary" onClick={() => void handleCopyUrl()}>
                  <Copy size={14} />
                  URL&apos;yi Kopyala
                </button>
              </div>
            </label>
            {copyMessage ? <p className="media-detail-url__message" role="status">{copyMessage}</p> : null}
          </div>

          <div className="media-detail-form">
            <label className="media-field" htmlFor="media-alt-text">
              <span className="media-field__label">ALT Metni</span>
              <input id="media-alt-text" className="media-field__input" value={altText} onChange={(event) => setAltText(event.target.value)} />
            </label>
            <label className="media-field" htmlFor="media-title">
              <span className="media-field__label">Başlık</span>
              <input id="media-title" className="media-field__input" value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label className="media-field" htmlFor="media-caption">
              <span className="media-field__label">Açıklama</span>
              <textarea id="media-caption" className="media-field__textarea" rows={3} value={caption} onChange={(event) => setCaption(event.target.value)} />
            </label>
          </div>

          <footer className="media-panel-footer media-panel-footer--split">
            {!readOnlyDelete ? (
              <button type="button" className="admin-button media-detail-delete" onClick={() => setConfirmDelete(true)} disabled={deleting || saving}>
                <Trash2 size={14} />
                Sil
              </button>
            ) : (
              <span />
            )}
            <div className="media-panel-footer__actions">
              <button type="button" className="admin-button" onClick={onClose} disabled={saving || deleting}>
                Kapat
              </button>
              <button
                type="button"
                className="admin-button admin-button-primary"
                onClick={() => onSave({ altText, title, caption })}
                disabled={saving || deleting}
              >
                {saving ? 'Kaydediliyor…' : 'Kaydet'}
              </button>
            </div>
          </footer>
        </aside>
      </div>

      <AdminConfirmDialog
        open={confirmDelete}
        title="Görseli sil"
        description="Bu görseli kalıcı olarak silmek istediğinize emin misiniz?"
        confirmLabel="Sil"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          onDelete();
        }}
      />
    </>
  );
}
