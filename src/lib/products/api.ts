import type {
  Product,
  ProductFeaturedFilter,
  ProductListResponse,
  ProductSortOrder,
  ProductStatusFilter,
} from '@kurumsal/shared';
import { apiFetch } from '@/lib/api/client';
import { AdminApiError } from '@/lib/auth/types';

export type ProductListParams = {
  search?: string;
  status?: ProductStatusFilter;
  featured?: ProductFeaturedFilter;
  categoryId?: string;
  page?: number;
  pageSize?: number;
  sort?: ProductSortOrder;
};

export type ProductPayload = {
  name: string;
  slug?: string;
  shortDescription?: string | null;
  description?: string | null;
  categoryId?: string | null;
  coverImageId?: string | null;
  logoImageId?: string | null;
  isActive?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
  primaryButtonLabel?: string | null;
  primaryButtonUrl?: string | null;
  secondaryButtonLabel?: string | null;
  secondaryButtonUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  features?: Array<{ title: string; description?: string | null; sortOrder?: number }>;
  gallery?: Array<{ mediaAssetId: string; sortOrder?: number }>;
  specifications?: Array<{ label: string; value: string; sortOrder?: number }>;
};

export async function fetchProducts(params: ProductListParams = {}): Promise<ProductListResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);
  if (params.featured) query.set('featured', params.featured);
  if (params.categoryId) query.set('categoryId', params.categoryId);
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  if (params.sort) query.set('sort', params.sort);
  const suffix = query.toString();
  return apiFetch<ProductListResponse>(`/api/admin/products${suffix ? `?${suffix}` : ''}`);
}

export async function fetchProduct(id: string): Promise<Product> {
  return apiFetch<Product>(`/api/admin/products/${id}`);
}

export async function createProduct(payload: ProductPayload): Promise<Product> {
  return apiFetch<Product>('/api/admin/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateProduct(id: string, payload: ProductPayload): Promise<Product> {
  return apiFetch<Product>(`/api/admin/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function updateProductStatus(id: string, isActive: boolean) {
  return apiFetch(`/api/admin/products/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
}

export async function updateProductFeatured(id: string, isFeatured: boolean) {
  return apiFetch(`/api/admin/products/${id}/featured`, {
    method: 'PATCH',
    body: JSON.stringify({ isFeatured }),
  });
}

export async function reorderProducts(items: { id: string; sortOrder: number }[]) {
  return apiFetch('/api/admin/products/reorder', {
    method: 'PATCH',
    body: JSON.stringify({ items }),
  });
}

export async function deleteProduct(id: string) {
  return apiFetch(`/api/admin/products/${id}`, { method: 'DELETE' });
}

export function isUnauthorizedError(error: unknown) {
  return error instanceof AdminApiError && error.code === 'UNAUTHORIZED';
}

export function isForbiddenError(error: unknown) {
  return error instanceof AdminApiError && error.code === 'FORBIDDEN';
}

export function isProductSlugConflictError(error: unknown) {
  return error instanceof AdminApiError && error.code === 'PRODUCT_SLUG_CONFLICT';
}

export function isProductNotFoundError(error: unknown) {
  return error instanceof AdminApiError && (error.code === 'PRODUCT_NOT_FOUND' || error.statusCode === 404);
}
