'use client';

type ProductCategoryFormSectionProps = {
  title: string;
  children: React.ReactNode;
};

export function ProductCategoryFormSection({ title, children }: ProductCategoryFormSectionProps) {
  return (
    <section className="pc-drawer-section">
      <h3 className="pc-drawer-section__title">{title}</h3>
      <div className="pc-drawer-section__body">{children}</div>
    </section>
  );
}
