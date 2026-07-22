'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { MEDIA_LIMITS } from '@kurumsal/shared';
import { formatFileSize, isAcceptedMediaFile } from '@/lib/media/format';

export type UploadQueueItem = {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
};

type MediaUploadPanelProps = {
  open: boolean;
  uploading: boolean;
  queue: UploadQueueItem[];
  onClose: () => void;
  onQueueChange: (items: UploadQueueItem[]) => void;
  onStartUpload: () => void;
};

function createQueueItem(file: File): UploadQueueItem {
  return {
    id: `${file.name}-${file.size}-${file.lastModified}`,
    file,
    previewUrl: URL.createObjectURL(file),
    status: 'pending',
  };
}

export function MediaUploadPanel({
  open,
  uploading,
  queue,
  onClose,
  onQueueChange,
  onStartUpload,
}: MediaUploadPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !uploading) {
        onClose();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, uploading, onClose]);

  const pendingCount = useMemo(() => queue.filter((item) => item.status === 'pending').length, [queue]);

  function addFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList);
    const next = [...queue];
    const existingIds = new Set(queue.map((item) => item.id));

    for (const file of incoming) {
      if (next.length >= MEDIA_LIMITS.maxFilesPerUpload) {
        break;
      }
      const item = createQueueItem(file);
      if (existingIds.has(item.id)) {
        continue;
      }
      if (!isAcceptedMediaFile(file)) {
        item.status = 'error';
        item.error = 'Desteklenmeyen dosya türü.';
      }
      next.push(item);
      existingIds.add(item.id);
    }

    onQueueChange(next);
  }

  function removeItem(id: string) {
    onQueueChange(
      queue.filter((item) => {
        if (item.id === id) {
          URL.revokeObjectURL(item.previewUrl);
          return false;
        }
        return true;
      }),
    );
  }

  if (!open) {
    return null;
  }

  return (
    <div className="media-panel-backdrop" role="presentation" onClick={uploading ? undefined : onClose}>
      <aside
        className="media-upload-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="media-upload-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="media-panel-header">
          <div>
            <h2 id="media-upload-title" className="media-panel-header__title">
              Görsel Yükle
            </h2>
            <p className="media-panel-header__description">En fazla {MEDIA_LIMITS.maxFilesPerUpload} görsel ekleyebilirsiniz.</p>
          </div>
          <button type="button" className="media-panel-close" onClick={onClose} disabled={uploading} aria-label="Kapat">
            <X size={18} />
          </button>
        </header>

        <div
          className={`media-dropzone${dragActive ? ' media-dropzone--active' : ''}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            if (event.dataTransfer.files.length > 0) {
              addFiles(event.dataTransfer.files);
            }
          }}
        >
          <Upload size={24} aria-hidden="true" />
          <p>Görselleri sürükleyip bırakın veya dosya seçin</p>
          <div className="media-dropzone__select-wrap">
            <button
              type="button"
              className="admin-button admin-button-secondary media-dropzone__select"
              onClick={() => inputRef.current?.click()}
            >
              Dosya Seç
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              multiple
              className="admin-sr-only"
              onChange={(event) => {
                if (event.target.files) {
                  addFiles(event.target.files);
                }
                event.currentTarget.value = '';
              }}
            />
          </div>
        </div>

        {queue.length > 0 ? (
          <ul className="media-upload-queue">
            {queue.map((item) => (
              <li key={item.id} className={`media-upload-queue__item media-upload-queue__item--${item.status}`}>
                <img src={item.previewUrl} alt="" className="media-upload-queue__preview" />
                <div className="media-upload-queue__meta">
                  <p className="media-upload-queue__name">{item.file.name}</p>
                  <p className="media-upload-queue__size">{formatFileSize(item.file.size)}</p>
                  {item.error ? <p className="media-upload-queue__error">{item.error}</p> : null}
                  {item.status === 'uploading' ? <p className="media-upload-queue__status">Yükleniyor…</p> : null}
                  {item.status === 'success' ? <p className="media-upload-queue__status">Yüklendi</p> : null}
                </div>
                {item.status === 'pending' ? (
                  <button type="button" className="media-upload-queue__remove" onClick={() => removeItem(item.id)} aria-label="Kaldır">
                    <X size={14} />
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}

        <footer className="media-panel-footer">
          <button type="button" className="admin-button" onClick={onClose} disabled={uploading}>
            İptal
          </button>
          <button
            type="button"
            className="admin-button admin-button-primary"
            onClick={onStartUpload}
            disabled={uploading || pendingCount === 0}
          >
            {uploading ? 'Yükleniyor…' : 'Yüklemeyi Başlat'}
          </button>
        </footer>
      </aside>
    </div>
  );
}

export function revokeUploadQueue(items: UploadQueueItem[]) {
  for (const item of items) {
    URL.revokeObjectURL(item.previewUrl);
  }
}
