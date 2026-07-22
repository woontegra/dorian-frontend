'use client';

import { useMemo, useState } from 'react';
import type { ProductCategory } from '@kurumsal/shared';
import { CornerDownRight, GripVertical, Pencil, Trash2 } from 'lucide-react';

export type ProductCategoryRow = {
  category: ProductCategory;
  level: 0 | 1;
  parentName?: string;
  parentId: string | null;
};

type ProductCategoryTableProps = {
  items: ProductCategory[];
  canDelete: boolean;
  statusLoadingId: string | null;
  onEdit: (category: ProductCategory) => void;
  onDelete: (category: ProductCategory) => void;
  onStatusChange: (category: ProductCategory, isActive: boolean) => void;
  onReorder: (parentId: string | null, orderedIds: string[]) => Promise<void>;
};

export function flattenCategories(items: ProductCategory[]): ProductCategoryRow[] {
  const rows: ProductCategoryRow[] = [];

  for (const parent of items) {
    rows.push({ category: parent, level: 0, parentId: null });
    for (const child of parent.children) {
      rows.push({ category: child, level: 1, parentName: parent.name, parentId: parent.id });
    }
  }

  return rows;
}

function groupRows(rows: ProductCategoryRow[]): ProductCategoryRow[][] {
  const groups = new Map<string, ProductCategoryRow[]>();

  for (const row of rows) {
    const key = row.parentId ?? 'root';
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  }

  return Array.from(groups.values());
}

export function ProductCategoryTable({
  items,
  canDelete,
  statusLoadingId,
  onEdit,
  onDelete,
  onStatusChange,
  onReorder,
}: ProductCategoryTableProps) {
  const [rows, setRows] = useState<ProductCategoryRow[]>(() => flattenCategories(items));
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  const displayRows = useMemo(() => {
    if (reordering || draggingId) {
      return rows;
    }
    return flattenCategories(items);
  }, [items, rows, reordering, draggingId]);

  function handleDragStart(row: ProductCategoryRow) {
    setDraggingId(row.category.id);
  }

  function handleDragOver(event: React.DragEvent, target: ProductCategoryRow) {
    event.preventDefault();
    if (!draggingId || draggingId === target.category.id) {
      return;
    }

    const source = displayRows.find((item) => item.category.id === draggingId);
    if (!source || source.parentId !== target.parentId) {
      return;
    }

    setRows((current) => {
      const next = [...current];
      const fromIndex = next.findIndex((item) => item.category.id === draggingId);
      const toIndex = next.findIndex((item) => item.category.id === target.category.id);
      if (fromIndex < 0 || toIndex < 0) {
        return current;
      }
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  async function handleDrop(row: ProductCategoryRow) {
    if (!draggingId) {
      return;
    }

    const source = displayRows.find((item) => item.category.id === draggingId);
    if (!source || source.parentId !== row.parentId) {
      setDraggingId(null);
      setRows(flattenCategories(items));
      return;
    }

    const group = displayRows.filter((item) => item.parentId === row.parentId);
    const orderedIds = group.map((item) => item.category.id);
    const previous = flattenCategories(items);

    setDraggingId(null);
    setReordering(true);

    try {
      await onReorder(row.parentId, orderedIds);
    } catch {
      setRows(previous);
    } finally {
      setReordering(false);
    }
  }

  function handleDragEnd() {
    setDraggingId(null);
    if (!reordering) {
      setRows(flattenCategories(items));
    }
  }

  function moveWithKeyboard(row: ProductCategoryRow, direction: -1 | 1) {
    const group = displayRows.filter((item) => item.parentId === row.parentId);
    const index = group.findIndex((item) => item.category.id === row.category.id);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= group.length) {
      return;
    }

    const orderedIds = group.map((item) => item.category.id);
    [orderedIds[index], orderedIds[targetIndex]] = [orderedIds[targetIndex], orderedIds[index]];
    void onReorder(row.parentId, orderedIds);
  }

  return (
    <div className="pc-table-wrap">
      <table className="pc-table">
        <thead>
          <tr>
            <th scope="col" aria-label="Sıralama" />
            <th scope="col">Görsel</th>
            <th scope="col">Kategori</th>
            <th scope="col">Slug</th>
            <th scope="col">Tür</th>
            <th scope="col">Üst Kategori</th>
            <th scope="col">Alt</th>
            <th scope="col">Ürün</th>
            <th scope="col">Durum</th>
            <th scope="col">İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row) => (
            <tr
              key={row.category.id}
              className={`pc-table__row pc-table__row--level-${row.level}${draggingId === row.category.id ? ' pc-table__row--dragging' : ''}`}
              onDragOver={(event) => handleDragOver(event, row)}
              onDrop={() => void handleDrop(row)}
            >
              <td>
                <button
                  type="button"
                  className="pc-table__handle"
                  draggable
                  aria-label={`${row.category.name} sırasını değiştir`}
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
              </td>
              <td>
                {row.category.image ? (
                  <img src={row.category.image.url} alt="" className="pc-table__thumb" />
                ) : (
                  <div className="pc-table__thumb pc-table__thumb--empty" aria-hidden="true" />
                )}
              </td>
              <td>
                <div className={`pc-table__name${row.level === 1 ? ' pc-table__name--child' : ''}`}>
                  {row.level === 1 ? <CornerDownRight size={14} aria-hidden="true" /> : null}
                  <span>{row.category.name}</span>
                </div>
              </td>
              <td>{row.category.slug}</td>
              <td>{row.level === 0 ? 'Ana Kategori' : 'Alt Kategori'}</td>
              <td>{row.parentName ?? '—'}</td>
              <td>{row.category.childCount}</td>
              <td>{row.category.productCount}</td>
              <td>
                <label className="pc-table__switch">
                  <input
                    type="checkbox"
                    checked={row.category.isActive}
                    disabled={statusLoadingId === row.category.id}
                    aria-label={`${row.category.name} durumu`}
                    onChange={(event) => onStatusChange(row.category, event.target.checked)}
                  />
                  <span>{row.category.isActive ? 'Aktif' : 'Pasif'}</span>
                </label>
              </td>
              <td>
                <div className="pc-table__actions">
                  <button type="button" className="pc-table__action" onClick={() => onEdit(row.category)} aria-label={`${row.category.name} düzenle`}>
                    <Pencil size={15} />
                  </button>
                  {canDelete ? (
                    <button
                      type="button"
                      className="pc-table__action pc-table__action--danger"
                      onClick={() => onDelete(row.category)}
                      aria-label={`${row.category.name} sil`}
                    >
                      <Trash2 size={15} />
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {groupRows(displayRows).length > 0 ? (
        <p className="pc-table__hint" role="note">
          Ana kategori pasif olduğunda alt kategoriler de sitede kullanılamaz. Alt kategoriler yalnızca kendi grubunda sıralanabilir.
        </p>
      ) : null}
    </div>
  );
}
