'use client';

import type { MediaAsset } from '@kurumsal/shared';
import { formatDimensions, formatFileSize } from '@/lib/media/format';
import { MediaPreviewImage } from '@/components/admin/media/MediaPreviewImage';

type MediaGridProps = {
  items: MediaAsset[];
  onSelect: (asset: MediaAsset) => void;
};

export function MediaGrid({ items, onSelect }: MediaGridProps) {
  return (
    <div className="media-grid" role="list">
      {items.map((asset) => (
        <button
          key={asset.id}
          type="button"
          className="media-grid-card"
          role="listitem"
          onClick={() => onSelect(asset)}
        >
          <div className="media-grid-card__preview">
            <MediaPreviewImage asset={asset} className="media-grid-card__image" objectFit="cover" />
          </div>
          <div className="media-grid-card__meta">
            <p className="media-grid-card__name">{asset.title || asset.originalFilename}</p>
            <p className="media-grid-card__details">
              {formatDimensions(asset.width, asset.height)} · {formatFileSize(asset.sizeBytes)}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
