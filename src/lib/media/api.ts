import type {
  MediaAsset,
  MediaAssetListResponse,
  MediaSortOrder,
  MediaUploadResponse,
} from '@kurumsal/shared';
import { apiFetch } from '@/lib/api/client';
import { AdminApiError } from '@/lib/auth/types';

export type MediaListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: MediaSortOrder;
};

export async function fetchMediaAssets(params: MediaListParams = {}): Promise<MediaAssetListResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  if (params.search) query.set('search', params.search);
  if (params.sort) query.set('sort', params.sort);
  query.set('type', 'image');

  const suffix = query.toString();
  return apiFetch<MediaAssetListResponse>(`/api/admin/media${suffix ? `?${suffix}` : ''}`);
}

export async function fetchMediaAsset(id: string): Promise<MediaAsset> {
  return apiFetch<MediaAsset>(`/api/admin/media/${id}`);
}

export async function updateMediaAsset(
  id: string,
  payload: { altText?: string | null; title?: string | null; caption?: string | null },
): Promise<MediaAsset> {
  return apiFetch<MediaAsset>(`/api/admin/media/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteMediaAsset(id: string): Promise<{ deleted: true; usageCount: number }> {
  return apiFetch<{ deleted: true; usageCount: number }>(`/api/admin/media/${id}`, {
    method: 'DELETE',
  });
}

export async function uploadMediaAssets(files: File[]): Promise<MediaUploadResponse> {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }

  const baseUrl = (await import('@/lib/api/client')).getApiBaseUrl();
  let response: Response;

  try {
    response = await fetch(`${baseUrl}/api/admin/media/upload`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
  } catch {
    throw new AdminApiError(
      'Sunucuya bağlanılamadı. İnternet bağlantınızı veya API adresini kontrol edin.',
      0,
      'NETWORK',
    );
  }

  const payload = (await response.json().catch(() => undefined)) as MediaUploadResponse | { message?: string } | undefined;

  if (!response.ok) {
    const { mapApiError } = await import('@/lib/api/client');
    throw mapApiError(response.status, payload as { message?: string } | undefined);
  }

  return payload as MediaUploadResponse;
}

export function isForbiddenError(error: unknown): boolean {
  return error instanceof AdminApiError && error.code === 'FORBIDDEN';
}

export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof AdminApiError && error.code === 'UNAUTHORIZED';
}

export function isMediaInUseError(error: unknown): boolean {
  return error instanceof AdminApiError && error.code === 'MEDIA_IN_USE';
}
