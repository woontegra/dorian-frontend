import type {
  HeroSettings,
  HeroSettingsUpdateInput,
  HeroSlide,
  HeroSlideCreateInput,
  HeroSlideReorderInput,
  HeroSlideUpdateInput,
} from '@kurumsal/shared';
import { apiFetch } from '@/lib/api/client';
import { AdminApiError } from '@/lib/auth/types';

export async function fetchHeroSettings(): Promise<HeroSettings> {
  return apiFetch<HeroSettings>('/api/admin/hero');
}

export async function updateHeroSettings(payload: HeroSettingsUpdateInput): Promise<HeroSettings> {
  return apiFetch<HeroSettings>('/api/admin/hero/settings', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function createHeroSlide(payload: HeroSlideCreateInput): Promise<HeroSlide> {
  return apiFetch<HeroSlide>('/api/admin/hero/slides', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateHeroSlide(id: string, payload: HeroSlideUpdateInput): Promise<HeroSlide> {
  return apiFetch<HeroSlide>(`/api/admin/hero/slides/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function reorderHeroSlides(payload: HeroSlideReorderInput): Promise<{ updated: true }> {
  return apiFetch<{ updated: true }>('/api/admin/hero/slides/reorder', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteHeroSlide(id: string): Promise<{ deleted: true }> {
  return apiFetch<{ deleted: true }>(`/api/admin/hero/slides/${id}`, {
    method: 'DELETE',
  });
}

export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof AdminApiError && error.code === 'UNAUTHORIZED';
}

export function isForbiddenError(error: unknown): boolean {
  return error instanceof AdminApiError && error.code === 'FORBIDDEN';
}
