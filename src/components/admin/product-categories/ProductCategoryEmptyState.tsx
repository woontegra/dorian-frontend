'use client';

type ProductCategoryEmptyStateProps = {
  searchActive: boolean;
  onCreate: () => void;
};

export function ProductCategoryEmptyState({ searchActive, onCreate }: ProductCategoryEmptyStateProps) {
  if (searchActive) {
    return (
      <div className="pc-empty">
        <h3 className="pc-empty__title">Sonuç bulunamadı</h3>
        <p className="pc-empty__description">Arama veya filtre kriterlerinize uygun kategori bulunamadı.</p>
      </div>
    );
  }

  return (
    <div className="pc-empty">
      <h3 className="pc-empty__title">Henüz kategori yok</h3>
      <p className="pc-empty__description">Ürünlerinizi düzenlemek için ilk kategorinizi oluşturun.</p>
      <button type="button" className="admin-button admin-button-primary" onClick={onCreate}>
        İlk Kategoriyi Oluştur
      </button>
    </div>
  );
}
