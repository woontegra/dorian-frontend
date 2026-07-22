'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { MediaAsset, ProductCategory } from '@kurumsal/shared';
import { X } from 'lucide-react';
import { ProductCategoryFormSection } from '@/components/admin/product-categories/ProductCategoryFormSection';
import { ProductCategoryImageField } from '@/components/admin/product-categories/ProductCategoryImageField';
import { ProductCategoryMediaPicker } from '@/components/admin/product-categories/ProductCategoryMediaPicker';
import { ProductCategorySeoSection } from '@/components/admin/product-categories/ProductCategorySeoSection';
import { ProductCategoryStatusSwitch } from '@/components/admin/product-categories/ProductCategoryStatusSwitch';
import {
  buildSlugFromName,
  categoryToFormValues,
  createEmptyFormValues,
  productCategoryFormSchema,
  type ProductCategoryFormValues,
} from '@/lib/product-categories/schema';

type ProductCategoryFormPanelProps = {
  open: boolean;
  saving: boolean;
  categories: ProductCategory[];
  editing: ProductCategory | null;
  restoreFocusRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  onSave: (values: ProductCategoryFormValues) => Promise<void>;
};

function getParentOptions(categories: ProductCategory[], editingId: string | null) {
  const excluded = new Set<string>();
  if (editingId) {
    excluded.add(editingId);
    const editing = categories.find((item) => item.id === editingId);
    editing?.children.forEach((child) => excluded.add(child.id));
  }

  return categories.filter((item) => !excluded.has(item.id));
}

function hasSeoValues(values: ProductCategoryFormValues): boolean {
  return Boolean(values.seoTitle?.trim() || values.seoDescription?.trim());
}

export function ProductCategoryFormPanel({
  open,
  saving,
  categories,
  editing,
  restoreFocusRef,
  onClose,
  onSave,
}: ProductCategoryFormPanelProps) {
  const drawerRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [values, setValues] = useState<ProductCategoryFormValues>(createEmptyFormValues());
  const [errors, setErrors] = useState<Partial<Record<keyof ProductCategoryFormValues, string>>>({});
  const [slugEdited, setSlugEdited] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [preview, setPreview] = useState<MediaAsset | null>(null);
  const [seoOpen, setSeoOpen] = useState(false);

  const parentOptions = useMemo(() => getParentOptions(categories, editing?.id ?? null), [categories, editing]);

  const isParentCategory = editing ? editing.childCount > 0 : false;

  useEffect(() => {
    if (!open) {
      return;
    }

    if (editing) {
      const nextValues = categoryToFormValues(editing);
      setValues(nextValues);
      setPreview(
        editing.image
          ? ({
              id: editing.image.id,
              url: editing.image.url,
              altText: editing.image.altText,
              originalFilename: editing.name,
            } as MediaAsset)
          : null,
      );
      setSlugEdited(true);
      setSeoOpen(hasSeoValues(nextValues));
    } else {
      setValues(createEmptyFormValues());
      setPreview(null);
      setSlugEdited(false);
      setSeoOpen(false);
    }
    setErrors({});
    setMediaPickerOpen(false);
  }, [open, editing]);

  useEffect(() => {
    if (!open) {
      return;
    }

    closeButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !saving) {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) {
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, saving, onClose]);

  useEffect(() => {
    if (open) {
      return;
    }

    restoreFocusRef.current?.focus();
  }, [open, restoreFocusRef]);

  if (!open) {
    return null;
  }

  function updateField<K extends keyof ProductCategoryFormValues>(key: K, value: ProductCategoryFormValues[K]) {
    setValues((current) => {
      const next = { ...current, [key]: value };
      if (key === 'name' && !slugEdited && !editing) {
        next.slug = buildSlugFromName(String(value));
      }
      return next;
    });
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = productCategoryFormSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof ProductCategoryFormValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof ProductCategoryFormValues;
        if (!fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      if (fieldErrors.seoTitle || fieldErrors.seoDescription) {
        setSeoOpen(true);
      }
      return;
    }

    await onSave(parsed.data);
  }

  const title = editing ? 'Kategoriyi Düzenle' : 'Yeni Kategori';
  const description = editing
    ? editing.name
    : 'Ürünlerinizi düzenlemek için yeni bir kategori oluşturun.';

  return (
    <>
      <div
        className="pc-drawer-backdrop"
        role="presentation"
        onClick={saving ? undefined : onClose}
      />

      <aside
        ref={drawerRef}
        className="pc-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pc-drawer-title"
        aria-describedby="pc-drawer-description"
      >
        <header className="pc-drawer__header">
          <div className="pc-drawer__header-copy">
            <h2 id="pc-drawer-title" className="pc-drawer__title">
              {title}
            </h2>
            <p id="pc-drawer-description" className="pc-drawer__description">
              {description}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="pc-drawer__close"
            onClick={onClose}
            disabled={saving}
            aria-label="Paneli kapat"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <form className="pc-drawer__form" onSubmit={(event) => void handleSubmit(event)}>
          <div className="pc-drawer__body">
            <ProductCategoryFormSection title="Temel Bilgiler">
              <div className="pc-drawer-field-row">
                <label className="pc-drawer-field" htmlFor="pc-category-name">
                  <span>
                    Kategori Adı <span className="pc-drawer-field__required">*</span>
                  </span>
                  <input
                    id="pc-category-name"
                    value={values.name}
                    onChange={(event) => updateField('name', event.target.value)}
                    required
                  />
                  {errors.name ? <span className="pc-drawer-field__error">{errors.name}</span> : null}
                </label>

                <label className="pc-drawer-field" htmlFor="pc-category-slug">
                  <span>
                    Slug <span className="pc-drawer-field__required">*</span>
                  </span>
                  <input
                    id="pc-category-slug"
                    value={values.slug}
                    onChange={(event) => {
                      setSlugEdited(true);
                      updateField('slug', event.target.value);
                    }}
                    required
                  />
                  <span className="pc-drawer-field__hint">URL adresinde kullanılacaktır.</span>
                  {errors.slug ? <span className="pc-drawer-field__error">{errors.slug}</span> : null}
                </label>
              </div>

              <label className="pc-drawer-field" htmlFor="pc-category-description">
                <span>Açıklama</span>
                <textarea
                  id="pc-category-description"
                  value={values.description}
                  onChange={(event) => updateField('description', event.target.value)}
                  rows={3}
                />
                {errors.description ? <span className="pc-drawer-field__error">{errors.description}</span> : null}
              </label>

              <label className="pc-drawer-field" htmlFor="pc-category-parent">
                <span>Üst Kategori</span>
                <select
                  id="pc-category-parent"
                  value={values.parentId ?? ''}
                  onChange={(event) => updateField('parentId', event.target.value ? event.target.value : null)}
                >
                  <option value="">Ana Kategori</option>
                  {parentOptions.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
            </ProductCategoryFormSection>

            <ProductCategoryFormSection title="Görsel ve Yayın Durumu">
              <ProductCategoryImageField
                preview={preview}
                onOpenPicker={() => setMediaPickerOpen(true)}
                onRemove={() => {
                  setPreview(null);
                  updateField('imageId', null);
                }}
              />

              <ProductCategoryStatusSwitch
                checked={values.isActive}
                disabled={saving}
                showParentInactiveHint={isParentCategory}
                onChange={(checked) => updateField('isActive', checked)}
              />
            </ProductCategoryFormSection>

            <ProductCategorySeoSection
              open={seoOpen}
              values={{ seoTitle: values.seoTitle ?? '', seoDescription: values.seoDescription ?? '' }}
              errors={{ seoTitle: errors.seoTitle, seoDescription: errors.seoDescription }}
              onToggle={() => setSeoOpen((current) => !current)}
              onChange={(key, value) => updateField(key, value)}
            />
          </div>

          <footer className="pc-drawer__footer">
            <button type="button" className="admin-button pc-drawer__cancel" onClick={onClose} disabled={saving}>
              İptal
            </button>
            <button type="submit" className="admin-button admin-button-primary pc-drawer__submit" disabled={saving}>
              {saving ? 'Kaydediliyor…' : editing ? 'Değişiklikleri Kaydet' : 'Kaydet'}
            </button>
          </footer>
        </form>
      </aside>

      <ProductCategoryMediaPicker
        open={mediaPickerOpen}
        selectedId={values.imageId}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(asset) => {
          setPreview(asset);
          updateField('imageId', asset.id);
          setMediaPickerOpen(false);
        }}
      />
    </>
  );
}
