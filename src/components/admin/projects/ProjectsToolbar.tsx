'use client';

import type { ProjectFeaturedFilter, ProjectStatusFilter } from '@kurumsal/shared';
import { Search } from 'lucide-react';

type ProjectsToolbarProps = {
  search: string;
  status: ProjectStatusFilter;
  featured: ProjectFeaturedFilter;
  sector: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: ProjectStatusFilter) => void;
  onFeaturedChange: (value: ProjectFeaturedFilter) => void;
  onSectorChange: (value: string) => void;
  onClear: () => void;
};

export function ProjectsToolbar({
  search,
  status,
  featured,
  sector,
  onSearchChange,
  onStatusChange,
  onFeaturedChange,
  onSectorChange,
  onClear,
}: ProjectsToolbarProps) {
  const hasFilters = Boolean(search || status !== 'all' || featured !== 'all' || sector);

  return (
    <div className="projects-toolbar">
      <label className="projects-toolbar__search">
        <Search size={16} aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Proje adı, slug veya açıklama ara…"
          aria-label="Proje ara"
        />
      </label>

      <div className="projects-toolbar__filters">
        <input
          type="text"
          className="projects-toolbar__sector"
          value={sector}
          onChange={(event) => onSectorChange(event.target.value)}
          placeholder="Sektör ara…"
          aria-label="Sektör filtresi"
        />

        <select
          className="projects-toolbar__select"
          value={status}
          onChange={(event) => onStatusChange(event.target.value as ProjectStatusFilter)}
          aria-label="Durum filtresi"
        >
          <option value="all">Tüm Durumlar</option>
          <option value="active">Aktif Projeler</option>
          <option value="inactive">Pasif Projeler</option>
        </select>

        <select
          className="projects-toolbar__select"
          value={featured}
          onChange={(event) => onFeaturedChange(event.target.value as ProjectFeaturedFilter)}
          aria-label="Öne çıkan filtresi"
        >
          <option value="all">Tüm Projeler</option>
          <option value="featured">Öne Çıkanlar</option>
          <option value="not_featured">Öne Çıkmayanlar</option>
        </select>

        {hasFilters ? (
          <button type="button" className="admin-button projects-toolbar__clear" onClick={onClear}>
            Filtreleri Temizle
          </button>
        ) : null}
      </div>
    </div>
  );
}
