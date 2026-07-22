'use client';

import type { ProductFeaturedFilter, ProductStatusFilter } from '@kurumsal/shared';
import { Search } from 'lucide-react';

type ProductCategoryOption = {
  id: string;
  name: string;
  parentName?: string | null;
};

type ProductsToolbarProps = {
  search: string;
  status: ProductStatusFilter;
  featured: ProductFeaturedFilter;
  categoryId: string;
  categories: ProductCategoryOption[];
  onSearchChange: (value: string) => void;
  onStatusChange: (value: ProductStatusFilter) => void;
  onFeaturedChange: (value: ProductFeaturedFilter) => void;
  onCategoryChange: (value: string) => void;
  onClear: () => void;
};

export function ProductsToolbar({
  search,
  status,
  featured,
  categoryId,
  categories,
  onSearchChange,
  onStatusChange,
  onFeaturedChange,
  onCategoryChange,
  onClear,
}: ProductsToolbarProps) {
  const hasFilters = Boolean(search || status !== 'all' || featured !== 'all' || categoryId);

  return (
    <div className="products-toolbar">
      <label className="products-toolbar__search">
        <Search size={16} aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Ürün adı, slug veya açıklama ara…"
          aria-label="Ürün ara"
        />
      </label>

      <div className="products-toolbar__filters">
        <select
          className="products-toolbar__select"
          value={categoryId}
          onChange={(event) => onCategoryChange(event.target.value)}
          aria-label="Kategori filtresi"
        >
          <option value="">Tüm kategoriler</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.parentName ? `${category.parentName} › ${category.name}` : category.name}
            </option>
          ))}
        </select>

        <select
          className="products-toolbar__select"
          value={status}
          onChange={(event) => onStatusChange(event.target.value as ProductStatusFilter)}
          aria-label="Durum filtresi"
        >
          <option value="all">Tüm durumlar</option>
          <option value="active">Aktif</option>
          <option value="inactive">Pasif</option>
        </select>

        <select
          className="products-toolbar__select"
          value={featured}
          onChange={(event) => onFeaturedChange(event.target.value as ProductFeaturedFilter)}
          aria-label="Öne çıkan filtresi"
        >
          <option value="all">Tümü</option>
          <option value="featured">Öne çıkan</option>
          <option value="not_featured">Öne çıkmayan</option>
        </select>

        {hasFilters ? (
          <button type="button" className="admin-button products-toolbar__clear" onClick={onClear}>
            Filtreleri Temizle
          </button>
        ) : null}
      </div>
    </div>
  );
}
