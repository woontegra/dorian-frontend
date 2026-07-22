'use client';

import type { MediaAsset } from '@kurumsal/shared';
import { ImageIcon } from 'lucide-react';

type ProductCategoryImageFieldProps = {
  preview: MediaAsset | null;
  onOpenPicker: () => void;
  onRemove: () => void;
  /** Boş durum başlığı; varsayılan kategori metni korunur. */
  emptyTitle?: string;
  emptyHint?: string;
};

export function ProductCategoryImageField({
  preview,
  onOpenPicker,
  onRemove,
  emptyTitle = 'Kategori görseli seçilmedi',
  emptyHint = 'Medya Kütüphanesinden mevcut bir görsel seçebilirsiniz.',
}: ProductCategoryImageFieldProps) {
  if (preview) {
    return (
      <div className="pc-image-field pc-image-field--selected">
        <img
          src={preview.url}
          alt={preview.altText ?? preview.originalFilename}
          className="pc-image-field__preview"
        />
        <div className="pc-image-field__meta">
          <p className="pc-image-field__name">{preview.originalFilename}</p>
          <div className="pc-image-field__actions">
            <button type="button" className="admin-button admin-button-secondary pc-image-field__btn" onClick={onOpenPicker}>
              Değiştir
            </button>
            <button type="button" className="admin-button pc-image-field__btn" onClick={onRemove}>
              Görseli Kaldır
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pc-image-field">
      <div className="pc-image-field__empty-icon" aria-hidden="true">
        <ImageIcon size={22} />
      </div>
      <div className="pc-image-field__empty-copy">
        <p className="pc-image-field__empty-title">{emptyTitle}</p>
        <p className="pc-image-field__empty-hint">{emptyHint}</p>
      </div>
      <button type="button" className="admin-button admin-button-secondary pc-image-field__btn" onClick={onOpenPicker}>
        Medya Kütüphanesinden Seç
      </button>
    </div>
  );
}
