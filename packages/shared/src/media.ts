export interface MediaAsset {
  id: string;
  filename: string;
  originalFilename: string;
  url: string;
  pathname: string;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  title: string | null;
  caption: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MediaAssetListResponse {
  items: MediaAsset[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface MediaUploadResultItem {
  originalFilename: string;
  success: boolean;
  asset?: MediaAsset;
  error?: string;
}

export interface MediaUploadResponse {
  results: MediaUploadResultItem[];
}

export interface MediaDeleteBlockedResponse {
  error: string;
  message: string;
  statusCode: number;
  code: 'MEDIA_IN_USE';
  usageCount: number;
}

export const MEDIA_LIMITS = {
  maxFilesPerUpload: 10,
  defaultPageSize: 24,
  maxPageSize: 100,
  defaultMaxImageSizeMb: 5,
  altTextMax: 500,
  titleMax: 200,
  captionMax: 1000,
  searchMax: 200,
} as const;

export const MEDIA_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'svg'] as const;

export type MediaSortOrder = 'newest' | 'oldest';

export type MediaFileTypeFilter = 'image';
