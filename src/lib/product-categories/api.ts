import type {
  ProductCategory,
  ProductCategoryListResponse,
  ProductCategoryStatusFilter,
} from '@kurumsal/shared';
import { apiFetch } from '@/lib/api/client';
import { AdminApiError } from '@/lib/auth/types';

export type ProductCategoryPayload = {
  name: string;
  slug?: string;
  description?: string | null;
  imageId?: string | null;
  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

export type ProductCategoryListParams = {
  search?: string;
  status?: ProductCategoryStatusFilter;
};

export async function fetchProductCategories(
  params: ProductCategoryListParams = {},
): Promise<ProductCategoryListResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);
  const suffix = query.toString();
  return apiFetch<ProductCategoryListResponse>(`/api/admin/product-categories${suffix ? `?${suffix}` : ''}`);
}

export async function fetchProductCategory(id: string): Promise<ProductCategory> {
  return apiFetch<ProductCategory>(`/api/admin/product-categories/${id}`);
}

export async function createProductCategory(payload: ProductCategoryPayload): Promise<ProductCategory> {
  return apiFetch<ProductCategory>('/api/admin/product-categories', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateProductCategory(id: string, payload: ProductCategoryPayload): Promise<ProductCategory> {
  return apiFetch<ProductCategory>(`/api/admin/product-categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function updateProductCategoryStatus(id: string, isActive: boolean): Promise<ProductCategory> {
  return apiFetch<ProductCategory>(`/api/admin/product-categories/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
}

export async function reorderProductCategories(items: { id: string; sortOrder: number }[]): Promise<{ updated: true }> {
  return apiFetch<{ updated: true }>('/api/admin/product-categories/reorder', {
    method: 'PATCH',
    body: JSON.stringify({ items }),
  });
}

export async function deleteProductCategory(id: string): Promise<{ deleted: true }> {
  return apiFetch<{ deleted: true }>(`/api/admin/product-categories/${id}`, {
    method: 'DELETE',
  });
}

export function isForbiddenError(error: unknown): boolean {
  return error instanceof AdminApiError && error.code === 'FORBIDDEN';
}

export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof AdminApiError && error.code === 'UNAUTHORIZED';
}

export function isSlugConflictError(error: unknown): boolean {
  return error instanceof AdminApiError && error.code === 'SLUG_CONFLICT';
}

export function isCategoryHasChildrenError(error: unknown): boolean {
  return error instanceof AdminApiError && error.code === 'CATEGORY_HAS_CHILDREN';
}

export function isCategoryInUseError(error: unknown): boolean {
  return error instanceof AdminApiError && error.code === 'CATEGORY_IN_USE';
}
