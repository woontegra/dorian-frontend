'use client';

import { ChevronDown } from 'lucide-react';
import type { ProductCategoryFormValues } from '@/lib/product-categories/schema';

type ProductCategorySeoSectionProps = {
  open: boolean;
  values: Pick<ProductCategoryFormValues, 'seoTitle' | 'seoDescription'>;
  errors: Partial<Record<'seoTitle' | 'seoDescription', string>>;
  onToggle: () => void;
  onChange: <K extends 'seoTitle' | 'seoDescription'>(key: K, value: ProductCategoryFormValues[K]) => void;
};

export function ProductCategorySeoSection({ open, values, errors, onToggle, onChange }: ProductCategorySeoSectionProps) {
  return (
    <section className="pc-drawer-section pc-drawer-section--collapsible">
      <button
        type="button"
        className="pc-drawer-section__toggle"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span className="pc-drawer-section__toggle-label">
          SEO Ayarları
          <span className="pc-drawer-section__optional">İsteğe bağlı</span>
        </span>
        <ChevronDown size={16} className={`pc-drawer-section__chevron${open ? ' pc-drawer-section__chevron--open' : ''}`} aria-hidden="true" />
      </button>

      {open ? (
        <div className="pc-drawer-section__body">
          <label className="pc-drawer-field" htmlFor="pc-category-seo-title">
            <span>SEO Başlığı</span>
            <input
              id="pc-category-seo-title"
              value={values.seoTitle}
              onChange={(event) => onChange('seoTitle', event.target.value)}
            />
            {errors.seoTitle ? <span className="pc-drawer-field__error">{errors.seoTitle}</span> : null}
          </label>

          <label className="pc-drawer-field" htmlFor="pc-category-seo-description">
            <span>SEO Açıklaması</span>
            <textarea
              id="pc-category-seo-description"
              value={values.seoDescription}
              onChange={(event) => onChange('seoDescription', event.target.value)}
              rows={3}
            />
            {errors.seoDescription ? <span className="pc-drawer-field__error">{errors.seoDescription}</span> : null}
          </label>
        </div>
      ) : null}
    </section>
  );
}
