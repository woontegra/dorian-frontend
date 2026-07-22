'use client';

import type { ProductListItem } from '@kurumsal/shared';
import { GripVertical, Pencil, Star, Trash2 } from 'lucide-react';

type ProductsTableProps = {
  items: ProductListItem[];
  canDelete: boolean;
  statusLoadingId: string | null;
  featuredLoadingId: string | null;
  onEdit: (product: ProductListItem) => void;
  onDelete: (product: ProductListItem) => void;
  onStatusChange: (product: ProductListItem, isActive: boolean) => void;
  onFeaturedChange: (product: ProductListItem, isFeatured: boolean) => void;
  onMove: (productId: string, direction: -1 | 1) => void;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function ProductsTable({
  items,
  canDelete,
  statusLoadingId,
  featuredLoadingId,
  onEdit,
  onDelete,
  onStatusChange,
  onFeaturedChange,
  onMove,
}: ProductsTableProps) {
  return (
    <div className="products-table-wrap">
      <table className="products-table">
        <thead>
          <tr>
            <th scope="col" aria-label="Sıralama" />
            <th scope="col">Ürün</th>
            <th scope="col">Kategori</th>
            <th scope="col">Durum</th>
            <th scope="col">Öne Çıkan</th>
            <th scope="col">Güncellenme</th>
            <th scope="col">İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {items.map((product, index) => {
            const thumb = product.coverImage ?? product.logoImage;
            return (
              <tr key={product.id}>
                <td>
                  <div className="products-table__order">
                    <button
                      type="button"
                      className="products-table__handle"
                      aria-label={`${product.name} sırasını yukarı taşı`}
                      disabled={index === 0}
                      onClick={() => onMove(product.id, -1)}
                    >
                      <GripVertical size={16} aria-hidden="true" />
                    </button>
                    <div className="products-table__order-buttons">
                      <button
                        type="button"
                        className="products-table__order-btn"
                        aria-label={`${product.name} yukarı`}
                        disabled={index === 0}
                        onClick={() => onMove(product.id, -1)}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="products-table__order-btn"
                        aria-label={`${product.name} aşağı`}
                        disabled={index === items.length - 1}
                        onClick={() => onMove(product.id, 1)}
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="products-table__product">
                    {thumb ? (
                      <img src={thumb.url} alt="" className="products-table__thumb" />
                    ) : (
                      <div className="products-table__thumb products-table__thumb--empty" aria-hidden="true" />
                    )}
                    <div>
                      <p className="products-table__name">{product.name}</p>
                      <p className="products-table__meta">{product.slug}</p>
                    </div>
                  </div>
                </td>
                <td>{product.category?.name ?? '—'}</td>
                <td>
                  <label className="products-table__switch">
                    <input
                      type="checkbox"
                      checked={product.isActive}
                      disabled={statusLoadingId === product.id}
                      aria-label={`${product.name} durumu`}
                      onChange={(event) => onStatusChange(product, event.target.checked)}
                    />
                    <span>{product.isActive ? 'Aktif' : 'Pasif'}</span>
                  </label>
                </td>
                <td>
                  <button
                    type="button"
                    className={`products-table__featured${product.isFeatured ? ' products-table__featured--on' : ''}`}
                    aria-pressed={product.isFeatured}
                    aria-label={`${product.name} öne çıkan durumu`}
                    disabled={featuredLoadingId === product.id}
                    onClick={() => onFeaturedChange(product, !product.isFeatured)}
                  >
                    <Star size={16} aria-hidden="true" />
                    <span>{product.isFeatured ? 'Öne çıkan' : 'Öne çıkar'}</span>
                  </button>
                </td>
                <td>{formatDate(product.updatedAt)}</td>
                <td>
                  <div className="products-table__actions">
                    <button
                      type="button"
                      className="products-table__action"
                      onClick={() => onEdit(product)}
                      aria-label={`${product.name} düzenle`}
                    >
                      <Pencil size={15} />
                    </button>
                    {canDelete ? (
                      <button
                        type="button"
                        className="products-table__action products-table__action--danger"
                        onClick={() => onDelete(product)}
                        aria-label={`${product.name} sil`}
                      >
                        <Trash2 size={15} />
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
