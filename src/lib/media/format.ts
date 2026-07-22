export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDimensions(width: number | null, height: number | null): string {
  if (width && height) {
    return `${width} × ${height}`;
  }
  return '—';
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export const ACCEPTED_MEDIA_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'] as const;

export function isAcceptedMediaFile(file: File): boolean {
  return ACCEPTED_MEDIA_TYPES.includes(file.type as (typeof ACCEPTED_MEDIA_TYPES)[number]);
}
