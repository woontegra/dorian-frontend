'use client';

import type { MediaAsset } from '@kurumsal/shared';
import { MoreHorizontal } from 'lucide-react';
import { formatDate, formatDimensions, formatFileSize } from '@/lib/media/format';
import { MediaPreviewImage } from '@/components/admin/media/MediaPreviewImage';

type MediaListViewProps = {
  items: MediaAsset[];
  onSelect: (asset: MediaAsset) => void;
};

export function MediaListView({ items, onSelect }: MediaListViewProps) {
  return (
    <div className="media-list" role="list">
      {items.map((asset) => (
        <button
          key={asset.id}
          type="button"
          className="media-list-row"
          role="listitem"
          onClick={() => onSelect(asset)}
        >
          <div className="media-list-row__preview">
            <MediaPreviewImage asset={asset} className="media-list-row__image" objectFit="cover" />
          </div>
          <div className="media-list-row__name">{asset.title || asset.originalFilename}</div>
          <div className="media-list-row__format">{asset.extension.toUpperCase()}</div>
          <div className="media-list-row__size">{formatDimensions(asset.width, asset.height)}</div>
          <div className="media-list-row__bytes">{formatFileSize(asset.sizeBytes)}</div>
          <div className="media-list-row__date">{formatDate(asset.createdAt)}</div>
          <span className="media-list-row__action" aria-hidden="true">
            <MoreHorizontal size={16} />
          </span>
        </button>
      ))}
    </div>
  );
}
