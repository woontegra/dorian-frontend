import type {
  DashboardSummary,
  Project,
  ProjectFeaturedFilter,
  ProjectListResponse,
  ProjectSortOrder,
  ProjectStatusFilter,
} from '@kurumsal/shared';
import { apiFetch } from '@/lib/api/client';
import { AdminApiError } from '@/lib/auth/types';

export type ProjectListParams = {
  search?: string;
  status?: ProjectStatusFilter;
  featured?: ProjectFeaturedFilter;
  sector?: string;
  page?: number;
  pageSize?: number;
  sort?: ProjectSortOrder;
};

export type ProjectPayload = {
  name: string;
  slug?: string;
  shortDescription?: string | null;
  description?: string | null;
  coverImageId?: string | null;
  clientName?: string | null;
  showClientName?: boolean;
  sector?: string | null;
  completedAt?: string | null;
  websiteUrl?: string | null;
  isActive?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
  seoTitle?: string | null;
  seoDescription?: string | null;
  gallery?: Array<{ mediaAssetId: string; sortOrder?: number }>;
  technologies?: Array<{ label: string; sortOrder?: number }>;
};

export async function fetchProjects(params: ProjectListParams = {}): Promise<ProjectListResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);
  if (params.featured) query.set('featured', params.featured);
  if (params.sector) query.set('sector', params.sector);
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  if (params.sort) query.set('sort', params.sort);
  const suffix = query.toString();
  return apiFetch<ProjectListResponse>(`/api/admin/projects${suffix ? `?${suffix}` : ''}`);
}

export async function fetchProject(id: string): Promise<Project> {
  return apiFetch<Project>(`/api/admin/projects/${id}`);
}

export async function createProject(payload: ProjectPayload): Promise<Project> {
  return apiFetch<Project>('/api/admin/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateProject(id: string, payload: ProjectPayload): Promise<Project> {
  return apiFetch<Project>(`/api/admin/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function updateProjectStatus(id: string, isActive: boolean) {
  return apiFetch(`/api/admin/projects/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
}

export async function updateProjectFeatured(id: string, isFeatured: boolean) {
  return apiFetch(`/api/admin/projects/${id}/featured`, {
    method: 'PATCH',
    body: JSON.stringify({ isFeatured }),
  });
}

export async function reorderProjects(items: { id: string; sortOrder: number }[]) {
  return apiFetch('/api/admin/projects/reorder', {
    method: 'PATCH',
    body: JSON.stringify({ items }),
  });
}

export async function deleteProject(id: string) {
  return apiFetch(`/api/admin/projects/${id}`, { method: 'DELETE' });
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  return apiFetch<DashboardSummary>('/api/admin/dashboard/summary');
}

export function isUnauthorizedError(error: unknown) {
  return error instanceof AdminApiError && error.code === 'UNAUTHORIZED';
}

export function isForbiddenError(error: unknown) {
  return error instanceof AdminApiError && error.code === 'FORBIDDEN';
}

export function isProjectSlugConflictError(error: unknown) {
  return error instanceof AdminApiError && error.code === 'PROJECT_SLUG_CONFLICT';
}

export function isProjectNotFoundError(error: unknown) {
  return error instanceof AdminApiError && (error.code === 'PROJECT_NOT_FOUND' || error.statusCode === 404);
}
