'use client';

import { ImagePlus } from 'lucide-react';

type MediaEmptyStateProps = {
  onUpload: () => void;
  searchActive?: boolean;
};

export function MediaEmptyState({ onUpload, searchActive = false }: MediaEmptyStateProps) {
  if (searchActive) {
    return (
      <div className="media-empty">
        <h3 className="media-empty__title">Sonuç bulunamadı</h3>
        <p className="media-empty__description">Arama kriterlerinize uygun görsel bulunamadı.</p>
      </div>
    );
  }

  return (
    <div className="media-empty">
      <div className="media-empty__icon" aria-hidden="true">
        <ImagePlus size={28} />
      </div>
      <h3 className="media-empty__title">Henüz görsel yok</h3>
      <p className="media-empty__description">
        Sitenizde kullanmak üzere PNG, JPEG, WebP veya SVG görselleri yükleyerek başlayın.
      </p>
      <button type="button" className="admin-button admin-button-primary" onClick={onUpload}>
        İlk Görseli Yükle
      </button>
    </div>
  );
}
