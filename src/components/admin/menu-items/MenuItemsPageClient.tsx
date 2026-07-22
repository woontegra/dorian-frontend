'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { MenuItem } from '@kurumsal/shared';
import { Plus, RotateCcw } from 'lucide-react';
import { AdminInlineNotice } from '@/components/admin/common/AdminInlineNotice';
import { MenuItemDeleteDialog } from '@/components/admin/menu-items/MenuItemDeleteDialog';
import { MenuItemEmptyState } from '@/components/admin/menu-items/MenuItemEmptyState';
import { MenuItemFormPanel } from '@/components/admin/menu-items/MenuItemFormPanel';
import { MenuItemList } from '@/components/admin/menu-items/MenuItemList';
import { MenuItemSkeleton } from '@/components/admin/menu-items/MenuItemSkeleton';
import { useAdminSession } from '@/components/admin/session/AdminSessionProvider';
import { AdminApiError } from '@/lib/auth/types';
import {
  createMenuItem,
  deleteMenuItem,
  fetchMenuItems,
  isForbiddenError,
  isMenuItemHasChildrenError,
  isUnauthorizedError,
  reorderMenuItems,
  updateMenuItem,
} from '@/lib/menu-items/api';
import type { MenuItemFormValues } from '@/lib/menu-items/schema';
import { formValuesToMenuItemPayload } from '@/lib/menu-items/schema';

type Notice = { tone: 'success' | 'error'; message: string } | null;

function patchMenuItemTree(items: MenuItem[], id: string, patch: Partial<MenuItem>): MenuItem[] {
  return items.map((parent) => {
    if (parent.id === id) {
      return { ...parent, ...patch };
    }
    return {
      ...parent,
      children: parent.children.map((child) => (child.id === id ? { ...child, ...patch } : child)),
    };
  });
}

export function MenuItemsPageClient() {
  const router = useRouter();
  const { admin } = useAdminSession();
  const canDelete = admin.role === 'ADMIN';

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [notice, setNotice] = useState<Notice>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusLoadingId, setStatusLoadingId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const loadItems = useCallback(
    async (options?: { keepNotice?: boolean }) => {
      setLoading(true);
      setLoadError(null);
      if (!options?.keepNotice) {
        setNotice(null);
      }

      try {
        const response = await fetchMenuItems();
        setItems(response.items);
        setTotalCount(response.totalCount);
      } catch (error) {
        if (isUnauthorizedError(error)) {
          router.replace('/admin/login');
          return;
        }
        setItems([]);
        setTotalCount(0);
        setLoadError(error instanceof AdminApiError ? error.message : 'Menü öğeleri yüklenemedi.');
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const showEmpty = !loading && !loadError && items.length === 0;
  const showList = !loading && !loadError && items.length > 0;

  function rememberTrigger() {
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }

  function openCreate() {
    rememberTrigger();
    setEditing(null);
    setFormOpen(true);
    setNotice(null);
  }

  function openEdit(item: MenuItem) {
    rememberTrigger();
    setEditing(item);
    setFormOpen(true);
    setNotice(null);
  }

  async function handleSave(values: MenuItemFormValues) {
    if (saving) {
      return;
    }

    setSaving(true);
    try {
      const payload = formValuesToMenuItemPayload(values);

      if (editing) {
        await updateMenuItem(editing.id, payload);
        setNotice({ tone: 'success', message: 'Menü öğesi güncellendi.' });
      } else {
        await createMenuItem(payload);
        setNotice({ tone: 'success', message: 'Menü öğesi oluşturuldu.' });
      }

      setFormOpen(false);
      setEditing(null);
      await loadItems({ keepNotice: true });
    } catch (error) {
      if (isUnauthorizedError(error)) {
        router.replace('/admin/login');
        return;
      }
      setNotice({
        tone: 'error',
        message: error instanceof AdminApiError ? error.message : 'Menü öğesi kaydedilemedi.',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(item: MenuItem, isActive: boolean) {
    if (statusLoadingId || reordering) {
      return;
    }

    const previous = items;
    setItems(patchMenuItemTree(items, item.id, { isActive }));
    setStatusLoadingId(item.id);

    try {
      await updateMenuItem(item.id, { isActive });
      setNotice({ tone: 'success', message: 'Menü durumu güncellendi.' });
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

  async function handleReorder(parentId: string | null, orderedIds: string[]) {
    if (reordering) {
      return;
    }

    const previous = items;
    setReordering(true);

    try {
      const payload = orderedIds.map((id, index) => ({ id, sortOrder: index }));
      await reorderMenuItems(payload);

      if (parentId === null) {
        const byId = new Map(items.map((item) => [item.id, item]));
        const nextRoots = orderedIds
          .map((id) => byId.get(id))
          .filter((item): item is MenuItem => Boolean(item))
          .map((item, index) => ({ ...item, sortOrder: index }));
        setItems(nextRoots);
      } else {
        setItems(
          items.map((parent) => {
            if (parent.id !== parentId) {
              return parent;
            }
            const byId = new Map(parent.children.map((child) => [child.id, child]));
            const children = orderedIds
              .map((id) => byId.get(id))
              .filter((item): item is MenuItem => Boolean(item))
              .map((item, index) => ({ ...item, sortOrder: index }));
            return { ...parent, children, childCount: children.length };
          }),
        );
      }

      setNotice({ tone: 'success', message: 'Menü sıralaması güncellendi.' });
    } catch (error) {
      setItems(previous);
      setNotice({
        tone: 'error',
        message: error instanceof AdminApiError ? error.message : 'Sıralama güncellenemedi.',
      });
      throw error;
    } finally {
      setReordering(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget || deleteLoading) {
      return;
    }

    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteMenuItem(deleteTarget.id);
      setDeleteTarget(null);
      setNotice({ tone: 'success', message: 'Menü öğesi silindi.' });
      await loadItems({ keepNotice: true });
    } catch (error) {
      if (isUnauthorizedError(error)) {
        router.replace('/admin/login');
        return;
      }
      if (isMenuItemHasChildrenError(error)) {
        setDeleteError(
          'Bu üst menüye bağlı alt menüler var. Önce alt menüleri silin veya başka bir üst menüye taşıyın.',
        );
        return;
      }
      setDeleteError(error instanceof AdminApiError ? error.message : 'Menü öğesi silinemedi.');
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="mi-page">
      <header className="mi-page-header">
        <div className="mi-page-header__intro">
          <h2 className="mi-page-header__title">Menü Yönetimi</h2>
          <p className="mi-page-header__description">
            Üst menü ve en fazla bir seviye alt menü oluşturabilirsiniz.
          </p>
          {!loadError ? (
            <p className="mi-page-header__count" role="status">
              {totalCount} menü öğesi
            </p>
          ) : null}
          {notice ? <AdminInlineNotice tone={notice.tone} message={notice.message} /> : null}
        </div>
        <button type="button" className="admin-button admin-button-primary mi-page-header__create" onClick={openCreate}>
          <Plus size={16} />
          Yeni Menü Öğesi
        </button>
      </header>

      {loading ? <MenuItemSkeleton /> : null}

      {!loading && loadError ? (
        <div className="mi-error" role="alert">
          <AdminInlineNotice tone="error" message={loadError} />
          <button
            type="button"
            className="admin-button"
            onClick={() => void loadItems()}
          >
            <RotateCcw size={15} />
            Yeniden dene
          </button>
        </div>
      ) : null}

      {showEmpty ? <MenuItemEmptyState onCreate={openCreate} /> : null}

      {showList ? (
        <MenuItemList
          items={items}
          canDelete={canDelete}
          statusLoadingId={statusLoadingId}
          reordering={reordering}
          onEdit={openEdit}
          onDelete={(item) => {
            setDeleteTarget(item);
            setDeleteError(null);
          }}
          onStatusChange={(item, isActive) => void handleStatusChange(item, isActive)}
          onReorder={handleReorder}
        />
      ) : null}

      <MenuItemFormPanel
        open={formOpen}
        saving={saving}
        items={items}
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

      <MenuItemDeleteDialog
        open={Boolean(deleteTarget)}
        item={deleteTarget}
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
