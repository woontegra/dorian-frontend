'use client';

type MenuItemEmptyStateProps = {
  onCreate: () => void;
};

export function MenuItemEmptyState({ onCreate }: MenuItemEmptyStateProps) {
  return (
    <div className="mi-empty">
      <h3 className="mi-empty__title">Henüz menü öğesi eklenmedi</h3>
      <p className="mi-empty__description">
        Üst menü ve alt menü öğelerini oluşturarak site navigasyonunu yönetebilirsiniz.
      </p>
      <button type="button" className="admin-button admin-button-primary" onClick={onCreate}>
        İlk Menü Öğesini Ekle
      </button>
    </div>
  );
}
