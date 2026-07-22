'use client';

import type { MediaAsset } from '@kurumsal/shared';
import { ImageOff } from 'lucide-react';
import { useState } from 'react';

type MediaPreviewImageProps = {
  asset: Pick<MediaAsset, 'url' | 'mimeType' | 'originalFilename' | 'altText'>;
  className?: string;
  objectFit?: 'cover' | 'contain';
};

export function MediaPreviewImage({
  asset,
  className = '',
  objectFit = 'cover',
}: MediaPreviewImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={`media-preview-fallback ${className}`.trim()} aria-hidden="true">
        <ImageOff size={20} />
        <span>Önizleme yok</span>
      </div>
    );
  }

  return (
    <img
      src={asset.url}
      alt={asset.altText || asset.originalFilename}
      className={className}
      style={{ objectFit }}
      onError={() => setFailed(true)}
    />
  );
}
