'use client';

import { useMemo, useState } from 'react';
import type { MenuItem } from '@kurumsal/shared';
import { ExternalLink, GripVertical, Pencil, Trash2 } from 'lucide-react';

export type MenuItemRow = {
  item: MenuItem;
  level: 0 | 1;
  parentId: string | null;
};

type MenuItemListProps = {
  items: MenuItem[];
  canDelete: boolean;
  statusLoadingId: string | null;
  reordering: boolean;
  onEdit: (item: MenuItem) => void;
  onDelete: (item: MenuItem) => void;
  onStatusChange: (item: MenuItem, isActive: boolean) => void;
  onReorder: (parentId: string | null, orderedIds: string[]) => Promise<void>;
};

export function flattenMenuItems(items: MenuItem[]): MenuItemRow[] {
  const rows: MenuItemRow[] = [];
  for (const parent of items) {
    rows.push({ item: parent, level: 0, parentId: null });
    for (const child of parent.children) {
      rows.push({ item: child, level: 1, parentId: parent.id });
    }
  }
  return rows;
}

export function MenuItemList({
  items,
  canDelete,
  statusLoadingId,
  reordering,
  onEdit,
  onDelete,
  onStatusChange,
  onReorder,
}: MenuItemListProps) {
  const [rows, setRows] = useState<MenuItemRow[]>(() => flattenMenuItems(items));
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [localReordering, setLocalReordering] = useState(false);

  const displayRows = useMemo(() => {
    if (localReordering || draggingId) {
      return rows;
    }
    return flattenMenuItems(items);
  }, [items, rows, localReordering, draggingId]);

  const busy = reordering || localReordering;

  function handleDragStart(row: MenuItemRow) {
    if (busy) {
      return;
    }
    setDraggingId(row.item.id);
  }

  function handleDragOver(event: React.DragEvent, target: MenuItemRow) {
    event.preventDefault();
    if (!draggingId || draggingId === target.item.id || busy) {
      return;
    }

    const source = displayRows.find((item) => item.item.id === draggingId);
    if (!source || source.parentId !== target.parentId) {
      return;
    }

    setRows((current) => {
      const next = [...current];
      const fromIndex = next.findIndex((item) => item.item.id === draggingId);
      const toIndex = next.findIndex((item) => item.item.id === target.item.id);
      if (fromIndex < 0 || toIndex < 0) {
        return current;
      }
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  async function handleDrop(row: MenuItemRow) {
    if (!draggingId || busy) {
      return;
    }

    const source = displayRows.find((item) => item.item.id === draggingId);
    if (!source || source.parentId !== row.parentId) {
      setDraggingId(null);
      setRows(flattenMenuItems(items));
      return;
    }

    const group = displayRows.filter((item) => item.parentId === row.parentId);
    const orderedIds = group.map((item) => item.item.id);
    const previous = flattenMenuItems(items);

    setDraggingId(null);
    setLocalReordering(true);

    try {
      await onReorder(row.parentId, orderedIds);
    } catch {
      setRows(previous);
    } finally {
      setLocalReordering(false);
    }
  }

  function handleDragEnd() {
    setDraggingId(null);
    if (!localReordering) {
      setRows(flattenMenuItems(items));
    }
  }

  function moveWithKeyboard(row: MenuItemRow, direction: -1 | 1) {
    if (busy) {
      return;
    }

    const group = displayRows.filter((item) => item.parentId === row.parentId);
    const index = group.findIndex((item) => item.item.id === row.item.id);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= group.length) {
      return;
    }

    const orderedIds = group.map((item) => item.item.id);
    [orderedIds[index], orderedIds[targetIndex]] = [orderedIds[targetIndex], orderedIds[index]];
    void onReorder(row.parentId, orderedIds).catch(() => {
      setRows(flattenMenuItems(items));
    });
  }

  return (
    <div className="mi-card" role="list" aria-label="Menü öğeleri">
      {displayRows.map((row) => {
        const inactive = !row.item.isActive;
        return (
          <div
            key={row.item.id}
            role="listitem"
            className={[
              'mi-row',
              row.level === 1 ? 'mi-row--child' : '',
              inactive ? 'mi-row--inactive' : '',
              draggingId === row.item.id ? 'mi-row--dragging' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onDragOver={(event) => handleDragOver(event, row)}
            onDrop={() => void handleDrop(row)}
          >
            <button
              type="button"
              className="mi-row__handle"
              draggable={!busy}
              disabled={busy}
              aria-label={`${row.item.label} sırasını değiştir`}
              title="Sürükleyerek veya ok tuşlarıyla sıralayın"
              onDragStart={() => handleDragStart(row)}
              onDragEnd={handleDragEnd}
              onKeyDown={(event) => {
                if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  moveWithKeyboard(row, -1);
                }
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  moveWithKeyboard(row, 1);
                }
              }}
            >
              <GripVertical size={16} aria-hidden="true" />
            </button>

            <div className="mi-row__main">
              <div className="mi-row__title-line">
                <span className="mi-row__label">{row.item.label}</span>
                <span className={`mi-badge ${row.level === 0 ? 'mi-badge--root' : 'mi-badge--child'}`}>
                  {row.level === 0 ? 'Üst Menü' : 'Alt Menü'}
                </span>
              </div>
              {row.item.href ? (
                <a
                  className="mi-row__href"
                  href={row.item.href}
                  title={row.item.href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => event.preventDefault()}
                >
                  {row.item.href}
                </a>
              ) : (
                <span className="mi-row__href mi-row__href--empty">Yalnızca açılır menü başlığı</span>
              )}
            </div>

            <div className="mi-row__meta">
              {row.item.openInNewTab ? (
                <span className="mi-row__tab" title="Yeni sekmede açılır">
                  <ExternalLink size={14} aria-hidden="true" />
                  Yeni sekme
                </span>
              ) : (
                <span className="mi-row__tab mi-row__tab--muted">Aynı sekme</span>
              )}

              <label className="mi-row__switch">
                <input
                  type="checkbox"
                  checked={row.item.isActive}
                  disabled={statusLoadingId === row.item.id || busy}
                  aria-label={`${row.item.label} durumu`}
                  onChange={(event) => onStatusChange(row.item, event.target.checked)}
                />
                <span>{row.item.isActive ? 'Aktif' : 'Pasif'}</span>
              </label>

              <div className="mi-row__actions">
                <button
                  type="button"
                  className="mi-row__action"
                  onClick={() => onEdit(row.item)}
                  aria-label={`${row.item.label} düzenle`}
                  disabled={busy}
                >
                  <Pencil size={15} />
                </button>
                {canDelete ? (
                  <button
                    type="button"
                    className="mi-row__action mi-row__action--danger"
                    onClick={() => onDelete(row.item)}
                    aria-label={`${row.item.label} sil`}
                    disabled={busy}
                  >
                    <Trash2 size={15} />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
      <p className="mi-card__hint" role="note">
        Üst menüler kendi aralarında, alt menüler yalnızca bağlı oldukları üst menü grubunda sıralanır.
      </p>
    </div>
  );
}
