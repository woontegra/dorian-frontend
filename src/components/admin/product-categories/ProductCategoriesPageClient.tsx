'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ProductCategory, ProductCategoryStatusFilter } from '@kurumsal/shared';
import { Plus } from 'lucide-react';
import { AdminInlineNotice } from '@/components/admin/common/AdminInlineNotice';
import { ProductCategoryDeleteDialog } from '@/components/admin/product-categories/ProductCategoryDeleteDialog';
import { ProductCategoryEmptyState } from '@/components/admin/product-categories/ProductCategoryEmptyState';
import { ProductCategoryFormPanel } from '@/components/admin/product-categories/ProductCategoryFormPanel';
import { ProductCategorySkeleton } from '@/components/admin/product-categories/ProductCategorySkeleton';
import { flattenCategories, ProductCategoryTable } from '@/components/admin/product-categories/ProductCategoryTable';
import { ProductCategoryToolbar } from '@/components/admin/product-categories/ProductCategoryToolbar';
import { useAdminSession } from '@/components/admin/session/AdminSessionProvider';
import { AdminApiError } from '@/lib/auth/types';
import {
  createProductCategory,
  deleteProductCategory,
  fetchProductCategories,
  isCategoryHasChildrenError,
  isCategoryInUseError,
  isForbiddenError,
  isSlugConflictError,
  isUnauthorizedError,
  reorderProductCategories,
  updateProductCategory,
  updateProductCategoryStatus,
} from '@/lib/product-categories/api';
import type { ProductCategoryFormValues } from '@/lib/product-categories/schema';

type Notice = { tone: 'success' | 'error'; message: string } | null;

export function ProductCategoriesPageClient() {
  const router = useRouter();
  const { admin } = useAdminSession();
  const canDelete = admin.role === 'ADMIN';

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ProductCategory[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<ProductCategoryStatusFilter>('all');
  const [notice, setNotice] = useState<Notice>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProductCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusLoadingId, setStatusLoadingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductCategory | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadCategories = useCallback(
    async (options?: { keepNotice?: boolean }) => {
      setLoading(true);
      if (!options?.keepNotice) {
        setNotice(null);
      }

      try {
        const response = await fetchProductCategories({
          search: debouncedSearch || undefined,
          status,
        });
        setItems(response.items);
        setTotalCount(response.totalCount);
      } catch (error) {
        if (isUnauthorizedError(error)) {
          router.replace('/admin/login');
          return;
        }
        setNotice({
          tone: 'error',
          message: error instanceof AdminApiError ? error.message : 'Kategoriler yüklenemedi.',
        });
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, status, router],
  );

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const visibleCount = useMemo(() => flattenCategories(items).length, [items]);
  const searchActive = debouncedSearch.length > 0 || status !== 'all';
  const showEmpty = !loading && visibleCount === 0;

  function rememberTrigger() {
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }

  function openCreate() {
    rememberTrigger();
    setEditing(null);
    setFormOpen(true);
    setNotice(null);
  }

  function openEdit(category: ProductCategory) {
    rememberTrigger();
    setEditing(category);
    setFormOpen(true);
    setNotice(null);
  }

  async function handleSave(values: ProductCategoryFormValues) {
    if (saving) {
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: values.name,
        slug: values.slug,
        description: values.description?.trim() ? values.description.trim() : null,
        parentId: values.parentId,
        imageId: values.imageId,
        isActive: values.isActive,
        seoTitle: values.seoTitle?.trim() ? values.seoTitle.trim() : null,
        seoDescription: values.seoDescription?.trim() ? values.seoDescription.trim() : null,
      };

      if (editing) {
        await updateProductCategory(editing.id, payload);
        setNotice({ tone: 'success', message: 'Kategori güncellendi.' });
      } else {
        await createProductCategory(payload);
        setNotice({ tone: 'success', message: 'Kategori oluşturuldu.' });
      }

      setFormOpen(false);
      setEditing(null);
      await loadCategories({ keepNotice: true });
    } catch (error) {
      if (isUnauthorizedError(error)) {
        router.replace('/admin/login');
        return;
      }
      if (isSlugConflictError(error)) {
        setNotice({ tone: 'error', message: error instanceof AdminApiError ? error.message : 'Slug zaten kullanılıyor.' });
        return;
      }
      setNotice({
        tone: 'error',
        message: error instanceof AdminApiError ? error.message : 'Kategori kaydedilemedi.',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(category: ProductCategory, isActive: boolean) {
    if (statusLoadingId) {
      return;
    }

    setStatusLoadingId(category.id);
    try {
      await updateProductCategoryStatus(category.id, isActive);
      await loadCategories({ keepNotice: true });
      setNotice({ tone: 'success', message: 'Kategori durumu güncellendi.' });
    } catch (error) {
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
      await loadCategories({ keepNotice: true });
    } finally {
      setStatusLoadingId(null);
    }
  }

  async function handleReorder(_parentId: string | null, orderedIds: string[]) {
    const previous = items;
    try {
      const payload = orderedIds.map((id, index) => ({ id, sortOrder: index }));
      await reorderProductCategories(payload);
      await loadCategories({ keepNotice: true });
      setNotice({ tone: 'success', message: 'Kategori sıralaması güncellendi.' });
    } catch (error) {
      setItems(previous);
      setNotice({
        tone: 'error',
        message: error instanceof AdminApiError ? error.message : 'Sıralama güncellenemedi.',
      });
      throw error;
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget || deleteLoading) {
      return;
    }

    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteProductCategory(deleteTarget.id);
      setDeleteTarget(null);
      setNotice({ tone: 'success', message: 'Kategori silindi.' });
      await loadCategories({ keepNotice: true });
    } catch (error) {
      if (isUnauthorizedError(error)) {
        router.replace('/admin/login');
        return;
      }
      if (isCategoryHasChildrenError(error) || isCategoryInUseError(error)) {
        setDeleteError(error instanceof AdminApiError ? error.message : 'Kategori silinemedi.');
        return;
      }
      setDeleteError(error instanceof AdminApiError ? error.message : 'Kategori silinemedi.');
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="pc-page">
      <header className="pc-page-header">
        <div className="pc-page-header__intro">
          <h2 className="pc-page-header__title">Ürün Kategorileri</h2>
          <p className="pc-page-header__description">Ürünlerinizi düzenlemek için ana ve alt kategorileri yönetin.</p>
          <p className="pc-page-header__count" role="status">
            {totalCount} kategori
          </p>
          {notice ? <AdminInlineNotice tone={notice.tone} message={notice.message} /> : null}
        </div>
        <button type="button" className="admin-button admin-button-primary pc-page-header__create" onClick={openCreate}>
          <Plus size={16} />
          Yeni Kategori
        </button>
      </header>

      <ProductCategoryToolbar search={search} status={status} onSearchChange={setSearch} onStatusChange={setStatus} />

      {loading ? <ProductCategorySkeleton /> : null}
      {showEmpty ? <ProductCategoryEmptyState searchActive={searchActive} onCreate={openCreate} /> : null}

      {!loading && visibleCount > 0 ? (
        <ProductCategoryTable
          items={items}
          canDelete={canDelete}
          statusLoadingId={statusLoadingId}
          onEdit={openEdit}
          onDelete={(category) => {
            setDeleteTarget(category);
            setDeleteError(null);
          }}
          onStatusChange={(category, isActive) => void handleStatusChange(category, isActive)}
          onReorder={handleReorder}
        />
      ) : null}

      <ProductCategoryFormPanel
        open={formOpen}
        saving={saving}
        categories={items}
        editing={editing}
        restoreFocusRef={restoreFocusRef}
        onClose={() => {
          if (!saving) {
            setFormOpen(false);
            setEditing(null);
          }
        }}
        onSave={handleSave}
      />

      <ProductCategoryDeleteDialog
        open={Boolean(deleteTarget)}
        category={deleteTarget}
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
