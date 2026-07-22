'use client';

type ProductsEmptyStateProps = {
  filtered: boolean;
  onCreate: () => void;
  onClearFilters: () => void;
};

export function ProductsEmptyState({ filtered, onCreate, onClearFilters }: ProductsEmptyStateProps) {
  if (filtered) {
    return (
      <div className="products-empty">
        <h3 className="products-empty__title">Filtrelere uygun ürün bulunamadı</h3>
        <p className="products-empty__description">Arama veya filtre kriterlerinizi değiştirerek tekrar deneyin.</p>
        <button type="button" className="admin-button" onClick={onClearFilters}>
          Filtreleri Temizle
        </button>
      </div>
    );
  }

  return (
    <div className="products-empty">
      <h3 className="products-empty__title">Henüz ürün eklenmedi</h3>
      <p className="products-empty__description">Web sitenizde tanıtılacak ilk ürün veya çözümü oluşturun.</p>
      <button type="button" className="admin-button admin-button-primary" onClick={onCreate}>
        İlk Ürünü Oluştur
      </button>
    </div>
  );
}
