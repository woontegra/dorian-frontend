'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type {
  ProjectFeaturedFilter,
  ProjectListItem,
  ProjectStatusFilter,
} from '@kurumsal/shared';
import { Plus } from 'lucide-react';
import { AdminInlineNotice } from '@/components/admin/common/AdminInlineNotice';
import { ProjectsDeleteDialog } from '@/components/admin/projects/ProjectsDeleteDialog';
import { ProjectsEmptyState } from '@/components/admin/projects/ProjectsEmptyState';
import { ProjectsSkeleton } from '@/components/admin/projects/ProjectsSkeleton';
import { ProjectsTable } from '@/components/admin/projects/ProjectsTable';
import { ProjectsToolbar } from '@/components/admin/projects/ProjectsToolbar';
import { useAdminSession } from '@/components/admin/session/AdminSessionProvider';
import { AdminApiError } from '@/lib/auth/types';
import {
  deleteProject,
  fetchProjects,
  isForbiddenError,
  isUnauthorizedError,
  reorderProjects,
  updateProjectFeatured,
  updateProjectStatus,
} from '@/lib/projects/api';

type Notice = { tone: 'success' | 'error'; message: string } | null;

export function ProjectsPageClient() {
  const router = useRouter();
  const { admin } = useAdminSession();
  const canDelete = admin.role === 'ADMIN';

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ProjectListItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<ProjectStatusFilter>('all');
  const [featured, setFeatured] = useState<ProjectFeaturedFilter>('all');
  const [sector, setSector] = useState('');
  const [debouncedSector, setDebouncedSector] = useState('');
  const [notice, setNotice] = useState<Notice>(null);
  const [statusLoadingId, setStatusLoadingId] = useState<string | null>(null);
  const [featuredLoadingId, setFeaturedLoadingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectListItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSector(sector.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [sector]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, featured, debouncedSector]);

  const loadProjects = useCallback(
    async (options?: { keepNotice?: boolean }) => {
      setLoading(true);
      if (!options?.keepNotice) {
        setNotice(null);
      }
      try {
        const response = await fetchProjects({
          search: debouncedSearch || undefined,
          status,
          featured,
          sector: debouncedSector || undefined,
          page,
          pageSize: 20,
          sort: 'sortOrder',
        });
        setItems(response.items);
        setTotalItems(response.pagination.totalItems);
        setTotalPages(response.pagination.totalPages);
        if (response.items.length === 0 && response.pagination.totalItems > 0 && page > 1) {
          setPage((current) => Math.max(1, current - 1));
        }
      } catch (error) {
        if (isUnauthorizedError(error)) {
          router.replace('/admin/login');
          return;
        }
        setNotice({
          tone: 'error',
          message: error instanceof AdminApiError ? error.message : 'Projeler yüklenemedi.',
        });
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, status, featured, debouncedSector, page, router],
  );

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const filtersActive = Boolean(debouncedSearch || status !== 'all' || featured !== 'all' || debouncedSector);
  const showEmpty = !loading && items.length === 0;

  function clearFilters() {
    setSearch('');
    setStatus('all');
    setFeatured('all');
    setSector('');
  }

  async function handleStatusChange(project: ProjectListItem, isActive: boolean) {
    if (statusLoadingId) return;
    const previous = items;
    setStatusLoadingId(project.id);
    setItems((current) => current.map((item) => (item.id === project.id ? { ...item, isActive } : item)));
    try {
      await updateProjectStatus(project.id, isActive);
      setNotice({ tone: 'success', message: 'Proje durumu güncellendi.' });
    } catch (error) {
      setItems(previous);
      if (isUnauthorizedError(error)) {
        router.replace('/admin/login');
        return;
      }
      if (isForbiddenError(error)) {
        setNotice({ tone: 'error', message: 'Bu işlem için yetkiniz yok.' });
        return;
      }
      setNotice({
        tone: 'error',
        message: error instanceof AdminApiError ? error.message : 'Durum güncellenemedi.',
      });
    } finally {
      setStatusLoadingId(null);
    }
  }

  async function handleFeaturedChange(project: ProjectListItem, isFeatured: boolean) {
    if (featuredLoadingId) return;
    const previous = items;
    setFeaturedLoadingId(project.id);
    setItems((current) => current.map((item) => (item.id === project.id ? { ...item, isFeatured } : item)));
    try {
      await updateProjectFeatured(project.id, isFeatured);
      setNotice({ tone: 'success', message: 'Öne çıkan durumu güncellendi.' });
    } catch (error) {
      setItems(previous);
      if (isUnauthorizedError(error)) {
        router.replace('/admin/login');
        return;
      }
      setNotice({
        tone: 'error',
        message: error instanceof AdminApiError ? error.message : 'Öne çıkan durumu güncellenemedi.',
      });
    } finally {
      setFeaturedLoadingId(null);
    }
  }

  async function handleMove(projectId: string, direction: -1 | 1) {
    const index = items.findIndex((item) => item.id === projectId);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= items.length) {
      return;
    }

    const previous = items;
    const next = [...items];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    setItems(next);

    try {
      await reorderProjects(next.map((item, order) => ({ id: item.id, sortOrder: order })));
      setNotice({ tone: 'success', message: 'Proje sıralaması güncellendi.' });
    } catch (error) {
      setItems(previous);
      setNotice({
        tone: 'error',
        message: error instanceof AdminApiError ? error.message : 'Sıralama güncellenemedi.',
      });
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget || deleteLoading) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteProject(deleteTarget.id);
      setDeleteTarget(null);
      setNotice({ tone: 'success', message: 'Proje silindi.' });
      await loadProjects({ keepNotice: true });
    } catch (error) {
      if (isUnauthorizedError(error)) {
        router.replace('/admin/login');
        return;
      }
      setDeleteError(error instanceof AdminApiError ? error.message : 'Proje silinemedi.');
    } finally {
      setDeleteLoading(false);
    }
  }

  const totalLabel = useMemo(() => `${totalItems} proje`, [totalItems]);

  return (
    <div className="projects-page">
      <header className="projects-page-header">
        <div className="projects-page-header__intro">
          <h2 className="projects-page-header__title">Projeler</h2>
          <p className="projects-page-header__description">Tamamlanan ve devam eden projelerinizi yönetin.</p>
          <p className="projects-page-header__count" role="status">
            {totalLabel}
          </p>
          {notice ? <AdminInlineNotice tone={notice.tone} message={notice.message} /> : null}
        </div>
        <Link href="/admin/projects/new" className="admin-button admin-button-primary projects-page-header__create">
          <Plus size={16} />
          Yeni Proje
        </Link>
      </header>

      <ProjectsToolbar
        search={search}
        status={status}
        featured={featured}
        sector={sector}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onFeaturedChange={setFeatured}
        onSectorChange={setSector}
        onClear={clearFilters}
      />

      {loading ? <ProjectsSkeleton /> : null}
      {showEmpty ? (
        <ProjectsEmptyState
          filtered={filtersActive}
          onCreate={() => router.push('/admin/projects/new')}
          onClearFilters={clearFilters}
        />
      ) : null}

      {!loading && items.length > 0 ? (
        <>
          <ProjectsTable
            items={items}
            canDelete={canDelete}
            statusLoadingId={statusLoadingId}
            featuredLoadingId={featuredLoadingId}
            onEdit={(project) => router.push(`/admin/projects/${project.id}/edit`)}
            onDelete={(project) => {
              setDeleteTarget(project);
              setDeleteError(null);
            }}
            onStatusChange={(project, isActive) => void handleStatusChange(project, isActive)}
            onFeaturedChange={(project, isFeatured) => void handleFeaturedChange(project, isFeatured)}
            onMove={(projectId, direction) => void handleMove(projectId, direction)}
          />

          {totalPages > 1 ? (
            <div className="projects-pagination">
              <button type="button" className="admin-button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Önceki
              </button>
              <span role="status">
                Sayfa {page} / {totalPages}
              </span>
              <button
                type="button"
                className="admin-button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Sonraki
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      <ProjectsDeleteDialog
        open={Boolean(deleteTarget)}
        project={deleteTarget}
        loading={deleteLoading}
        errorMessage={deleteError}
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={() => {
          if (!deleteLoading) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
      />
    </div>
  );
}
