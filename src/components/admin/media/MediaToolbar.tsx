'use client';

import { LayoutGrid, List, Search } from 'lucide-react';
import type { MediaSortOrder } from '@kurumsal/shared';

export type MediaViewMode = 'grid' | 'list';

type MediaToolbarProps = {
  search: string;
  sort: MediaSortOrder;
  viewMode: MediaViewMode;
  onSearchChange: (value: string) => void;
  onSortChange: (value: MediaSortOrder) => void;
  onViewModeChange: (value: MediaViewMode) => void;
};

export function MediaToolbar({
  search,
  sort,
  viewMode,
  onSearchChange,
  onSortChange,
  onViewModeChange,
}: MediaToolbarProps) {
  return (
    <div className="media-toolbar">
      <label className="media-toolbar__search">
        <Search size={16} aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Dosya adı, başlık veya ALT metni ara…"
          aria-label="Medya ara"
        />
      </label>

      <div className="media-toolbar__actions">
        <select
          className="media-toolbar__sort"
          value={sort}
          onChange={(event) => onSortChange(event.target.value as MediaSortOrder)}
          aria-label="Sıralama"
        >
          <option value="newest">En Yeni</option>
          <option value="oldest">En Eski</option>
        </select>

        <div className="media-view-toggle" role="group" aria-label="Görünüm">
          <button
            type="button"
            className={`media-view-toggle__btn${viewMode === 'grid' ? ' media-view-toggle__btn--active' : ''}`}
            onClick={() => onViewModeChange('grid')}
            aria-pressed={viewMode === 'grid'}
          >
            <LayoutGrid size={16} />
            Izgara
          </button>
          <button
            type="button"
            className={`media-view-toggle__btn${viewMode === 'list' ? ' media-view-toggle__btn--active' : ''}`}
            onClick={() => onViewModeChange('list')}
            aria-pressed={viewMode === 'list'}
          >
            <List size={16} />
            Liste
          </button>
        </div>
      </div>
    </div>
  );
}
