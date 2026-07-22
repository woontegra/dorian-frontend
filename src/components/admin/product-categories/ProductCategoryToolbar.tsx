'use client';

import type { ProductCategoryStatusFilter } from '@kurumsal/shared';
import { Search } from 'lucide-react';

type ProductCategoryToolbarProps = {
  search: string;
  status: ProductCategoryStatusFilter;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: ProductCategoryStatusFilter) => void;
};

export function ProductCategoryToolbar({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: ProductCategoryToolbarProps) {
  return (
    <div className="pc-toolbar">
      <label className="pc-toolbar__search">
        <Search size={16} aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Kategori adı, slug veya açıklama ara…"
          aria-label="Kategori ara"
        />
      </label>

      <select
        className="pc-toolbar__status"
        value={status}
        onChange={(event) => onStatusChange(event.target.value as ProductCategoryStatusFilter)}
        aria-label="Durum filtresi"
      >
        <option value="all">Tümü</option>
        <option value="active">Aktif</option>
        <option value="inactive">Pasif</option>
      </select>
    </div>
  );
}
