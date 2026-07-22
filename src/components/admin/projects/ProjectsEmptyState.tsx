'use client';

type ProjectsEmptyStateProps = {
  filtered: boolean;
  onCreate: () => void;
  onClearFilters: () => void;
};

export function ProjectsEmptyState({ filtered, onCreate, onClearFilters }: ProjectsEmptyStateProps) {
  if (filtered) {
    return (
      <div className="projects-empty">
        <h3 className="projects-empty__title">Filtrelere uygun proje bulunamadı</h3>
        <p className="projects-empty__description">Arama veya filtre kriterlerinizi değiştirerek tekrar deneyin.</p>
        <button type="button" className="admin-button" onClick={onClearFilters}>
          Filtreleri Temizle
        </button>
      </div>
    );
  }

  return (
    <div className="projects-empty">
      <h3 className="projects-empty__title">Henüz proje eklenmedi</h3>
      <p className="projects-empty__description">Web sitenizde sergilenecek ilk projenizi oluşturun.</p>
      <button type="button" className="admin-button admin-button-primary" onClick={onCreate}>
        İlk Projeyi Oluştur
      </button>
    </div>
  );
}
