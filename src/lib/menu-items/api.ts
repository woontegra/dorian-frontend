import type {
  MenuItem,
  MenuItemCreateInput,
  MenuItemListResponse,
  MenuItemUpdateInput,
} from '@kurumsal/shared';
import { apiFetch } from '@/lib/api/client';
import { AdminApiError } from '@/lib/auth/types';

export async function fetchMenuItems(): Promise<MenuItemListResponse> {
  return apiFetch<MenuItemListResponse>('/api/admin/menu-items');
}

export async function fetchMenuItem(id: string): Promise<MenuItem> {
  return apiFetch<MenuItem>(`/api/admin/menu-items/${id}`);
}

export async function createMenuItem(payload: MenuItemCreateInput): Promise<MenuItem> {
  return apiFetch<MenuItem>('/api/admin/menu-items', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateMenuItem(id: string, payload: MenuItemUpdateInput): Promise<MenuItem> {
  return apiFetch<MenuItem>(`/api/admin/menu-items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function reorderMenuItems(items: { id: string; sortOrder: number }[]): Promise<{ updated: true }> {
  return apiFetch<{ updated: true }>('/api/admin/menu-items/reorder', {
    method: 'PATCH',
    body: JSON.stringify({ items }),
  });
}

export async function deleteMenuItem(id: string): Promise<{ deleted: true }> {
  return apiFetch<{ deleted: true }>(`/api/admin/menu-items/${id}`, {
    method: 'DELETE',
  });
}

export function isForbiddenError(error: unknown): boolean {
  return error instanceof AdminApiError && error.code === 'FORBIDDEN';
}

export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof AdminApiError && error.code === 'UNAUTHORIZED';
}

export function isMenuItemHasChildrenError(error: unknown): boolean {
  return error instanceof AdminApiError && error.code === 'MENU_ITEM_HAS_CHILDREN';
}
