'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type {
  ProductFeaturedFilter,
  ProductListItem,
  ProductStatusFilter,
} from '@kurumsal/shared';
import { Plus } from 'lucide-react';
import { AdminInlineNotice } from '@/components/admin/common/AdminInlineNotice';
import { ProductsDeleteDialog } from '@/components/admin/products/ProductsDeleteDialog';
import { ProductsEmptyState } from '@/components/admin/products/ProductsEmptyState';
import { ProductsSkeleton } from '@/components/admin/products/ProductsSkeleton';
import { ProductsTable } from '@/components/admin/products/ProductsTable';
import { ProductsToolbar } from '@/components/admin/products/ProductsToolbar';
import { useAdminSession } from '@/components/admin/session/AdminSessionProvider';
import { AdminApiError } from '@/lib/auth/types';
import { fetchProductCategories } from '@/lib/product-categories/api';
import {
  deleteProduct,
  fetchProducts,
  isForbiddenError,
  isUnauthorizedError,
  reorderProducts,
  updateProductFeatured,
  updateProductStatus,
} from '@/lib/products/api';

type Notice = { tone: 'success' | 'error'; message: string } | null;

export function ProductsPageClient() {
  const router = useRouter();
  const { admin } = useAdminSession();
  const canDelete = admin.role === 'ADMIN';

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ProductListItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<ProductStatusFilter>('all');
  const [featured, setFeatured] = useState<ProductFeaturedFilter>('all');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Array<{ id: string; name: string; parentName?: string | null }>>([]);
  const [notice, setNotice] = useState<Notice>(null);
  const [statusLoadingId, setStatusLoadingId] = useState<string | null>(null);
  const [featuredLoadingId, setFeaturedLoadingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductListItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, featured, categoryId]);

  useEffect(() => {
    void fetchProductCategories({ status: 'all' })
      .then((response) => {
        const options: Array<{ id: string; name: string; parentName?: string | null }> = [];
        for (const parent of response.items) {
          options.push({ id: parent.id, name: parent.name });
          for (const child of parent.children) {
            options.push({ id: child.id, name: child.name, parentName: parent.name });
          }
        }
        setCategories(options);
      })
      .catch(() => {
        // Category filter is optional; keep page usable.
      });
  }, []);

  const loadProducts = useCallback(
    async (options?: { keepNotice?: boolean }) => {
      setLoading(true);
      if (!options?.keepNotice) {
        setNotice(null);
      }
      try {
        const response = await fetchProducts({
          search: debouncedSearch || undefined,
          status,
          featured,
          categoryId: categoryId || undefined,
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
          message: error instanceof AdminApiError ? error.message : 'Ürünler yüklenemedi.',
        });
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, status, featured, categoryId, page, router],
  );

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const filtersActive = Boolean(debouncedSearch || status !== 'all' || featured !== 'all' || categoryId);
  const showEmpty = !loading && items.length === 0;

  function clearFilters() {
    setSearch('');
    setStatus('all');
    setFeatured('all');
    setCategoryId('');
  }

  async function handleStatusChange(product: ProductListItem, isActive: boolean) {
    if (statusLoadingId) return;
    const previous = items;
    setStatusLoadingId(product.id);
    setItems((current) => current.map((item) => (item.id === product.id ? { ...item, isActive } : item)));
    try {
      await updateProductStatus(product.id, isActive);
      setNotice({ tone: 'success', message: 'Ürün durumu güncellendi.' });
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

  async function handleFeaturedChange(product: ProductListItem, isFeatured: boolean) {
    if (featuredLoadingId) return;
    const previous = items;
    setFeaturedLoadingId(product.id);
    setItems((current) => current.map((item) => (item.id === product.id ? { ...item, isFeatured } : item)));
    try {
      await updateProductFeatured(product.id, isFeatured);
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

  async function handleMove(productId: string, direction: -1 | 1) {
    const index = items.findIndex((item) => item.id === productId);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= items.length) {
      return;
    }

    const previous = items;
    const next = [...items];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    setItems(next);

    try {
      await reorderProducts(next.map((item, order) => ({ id: item.id, sortOrder: order })));
      setNotice({ tone: 'success', message: 'Ürün sıralaması güncellendi.' });
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
      await deleteProduct(deleteTarget.id);
      setDeleteTarget(null);
      setNotice({ tone: 'success', message: 'Ürün silindi.' });
      await loadProducts({ keepNotice: true });
    } catch (error) {
      if (isUnauthorizedError(error)) {
        router.replace('/admin/login');
        return;
      }
      setDeleteError(error instanceof AdminApiError ? error.message : 'Ürün silinemedi.');
    } finally {
      setDeleteLoading(false);
    }
  }

  const totalLabel = useMemo(() => `${totalItems} ürün`, [totalItems]);

  return (
    <div className="products-page">
      <header className="products-page-header">
        <div className="products-page-header__intro">
          <h2 className="products-page-header__title">Ürünler</h2>
          <p className="products-page-header__description">Web sitenizde tanıtılan ürün ve çözümleri yönetin.</p>
          <p className="products-page-header__count" role="status">
            {totalLabel}
          </p>
          {notice ? <AdminInlineNotice tone={notice.tone} message={notice.message} /> : null}
        </div>
        <Link href="/admin/products/new" className="admin-button admin-button-primary products-page-header__create">
          <Plus size={16} />
          Yeni Ürün
        </Link>
      </header>

      <ProductsToolbar
        search={search}
        status={status}
        featured={featured}
        categoryId={categoryId}
        categories={categories}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onFeaturedChange={setFeatured}
        onCategoryChange={setCategoryId}
        onClear={clearFilters}
      />

      {loading ? <ProductsSkeleton /> : null}
      {showEmpty ? (
        <ProductsEmptyState
          filtered={filtersActive}
          onCreate={() => router.push('/admin/products/new')}
          onClearFilters={clearFilters}
        />
      ) : null}

      {!loading && items.length > 0 ? (
        <>
          <ProductsTable
            items={items}
            canDelete={canDelete}
            statusLoadingId={statusLoadingId}
            featuredLoadingId={featuredLoadingId}
            onEdit={(product) => router.push(`/admin/products/${product.id}/edit`)}
            onDelete={(product) => {
              setDeleteTarget(product);
              setDeleteError(null);
            }}
            onStatusChange={(product, isActive) => void handleStatusChange(product, isActive)}
            onFeaturedChange={(product, isFeatured) => void handleFeaturedChange(product, isFeatured)}
            onMove={(productId, direction) => void handleMove(productId, direction)}
          />

          {totalPages > 1 ? (
            <div className="products-pagination">
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

      <ProductsDeleteDialog
        open={Boolean(deleteTarget)}
        product={deleteTarget}
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
