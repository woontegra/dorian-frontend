import type { SiteSettings, SiteSettingsImageType, SiteSettingsImageUploadResponse } from '@kurumsal/shared';
import { apiFetch } from '@/lib/api/client';
import { AdminApiError } from '@/lib/auth/types';

export async function fetchSiteSettings(): Promise<SiteSettings> {
  return apiFetch<SiteSettings>('/api/admin/site-settings');
}

export async function updateSiteSettings(payload: Record<string, unknown>): Promise<SiteSettings> {
  return apiFetch<SiteSettings>('/api/admin/site-settings', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function uploadSiteSettingsImage(
  type: SiteSettingsImageType,
  file: File,
): Promise<SiteSettingsImageUploadResponse> {
  const formData = new FormData();
  formData.append('type', type);
  formData.append('file', file);

  const baseUrl = (await import('@/lib/api/client')).getApiBaseUrl();
  let response: Response;

  try {
    response = await fetch(`${baseUrl}/api/admin/site-settings/upload`, {
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

  const payload = (await response.json().catch(() => undefined)) as
    | SiteSettingsImageUploadResponse
    | { message?: string }
    | undefined;

  if (!response.ok) {
    const { mapApiError } = await import('@/lib/api/client');
    throw mapApiError(response.status, payload as { message?: string } | undefined);
  }

  return payload as SiteSettingsImageUploadResponse;
}

export async function deleteSiteSettingsImage(type: SiteSettingsImageType): Promise<SiteSettings> {
  return apiFetch<SiteSettings>(`/api/admin/site-settings/image/${type}`, {
    method: 'DELETE',
  });
}

export function isForbiddenError(error: unknown): boolean {
  return error instanceof AdminApiError && error.code === 'FORBIDDEN';
}

export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof AdminApiError && error.code === 'UNAUTHORIZED';
}
