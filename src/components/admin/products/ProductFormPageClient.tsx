'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { MediaAsset, ProductCategory } from '@kurumsal/shared';
import { ArrowLeft, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { AdminInlineNotice } from '@/components/admin/common/AdminInlineNotice';
import { ProductCategoryImageField } from '@/components/admin/product-categories/ProductCategoryImageField';
import { ProductCategoryMediaPicker } from '@/components/admin/product-categories/ProductCategoryMediaPicker';
import { ProductCategoryStatusSwitch } from '@/components/admin/product-categories/ProductCategoryStatusSwitch';
import { useAdminSession } from '@/components/admin/session/AdminSessionProvider';
import { AdminApiError } from '@/lib/auth/types';
import { fetchProductCategories } from '@/lib/product-categories/api';
import {
  createProduct,
  fetchProduct,
  isProductNotFoundError,
  isProductSlugConflictError,
  isUnauthorizedError,
  updateProduct,
} from '@/lib/products/api';
import {
  buildProductSlug,
  createEmptyProductFormValues,
  productFormSchema,
  productToFormValues,
  toProductPayload,
  type ProductFormValues,
} from '@/lib/products/schema';

type ProductFormPageClientProps = {
  mode: 'create' | 'edit';
  productId?: string;
};

type Notice = { tone: 'success' | 'error'; message: string } | null;

export function ProductFormPageClient({ mode, productId }: ProductFormPageClientProps) {
  const router = useRouter();
  useAdminSession();

  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [values, setValues] = useState<ProductFormValues>(createEmptyProductFormValues());
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [slugEdited, setSlugEdited] = useState(mode === 'edit');
  const [seoOpen, setSeoOpen] = useState(false);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [coverPreview, setCoverPreview] = useState<MediaAsset | null>(null);
  const [logoPreview, setLogoPreview] = useState<MediaAsset | null>(null);
  const [galleryPreviews, setGalleryPreviews] = useState<MediaAsset[]>([]);
  const [pickerTarget, setPickerTarget] = useState<'cover' | 'logo' | 'gallery' | null>(null);

  useEffect(() => {
    void fetchProductCategories({ status: 'all' })
      .then((response) => setCategories(response.items))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (mode !== 'edit' || !productId) {
      return;
    }

    let active = true;
    setLoading(true);
    void fetchProduct(productId)
      .then(async (product) => {
        if (!active) return;
        setValues(productToFormValues(product));
        setSlugEdited(true);
        setSeoOpen(Boolean(product.seoTitle || product.seoDescription));
        setCoverPreview(
          product.coverImage
            ? ({
                id: product.coverImage.id,
                url: product.coverImage.url,
                altText: product.coverImage.altText,
                originalFilename: product.coverImage.originalFilename,
              } as MediaAsset)
            : null,
        );
        setLogoPreview(
          product.logoImage
            ? ({
                id: product.logoImage.id,
                url: product.logoImage.url,
                altText: product.logoImage.altText,
                originalFilename: product.logoImage.originalFilename,
              } as MediaAsset)
            : null,
        );
        setGalleryPreviews(
          product.gallery.map(
            (image) =>
              ({
                id: image.media.id,
                url: image.media.url,
                altText: image.media.altText,
                originalFilename: image.media.originalFilename,
              }) as MediaAsset,
          ),
        );
      })
      .catch((error) => {
        if (isUnauthorizedError(error)) {
          router.replace('/admin/login');
          return;
        }
        if (isProductNotFoundError(error)) {
          setNotFound(true);
          return;
        }
        setNotice({
          tone: 'error',
          message: error instanceof AdminApiError ? error.message : 'Ürün yüklenemedi.',
        });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [mode, productId, router]);

  const categoryOptions = useMemo(() => {
    const options: Array<{ id: string; label: string; isActive: boolean }> = [];
    for (const parent of categories) {
      options.push({ id: parent.id, label: parent.name, isActive: parent.isActive });
      for (const child of parent.children) {
        options.push({
          id: child.id,
          label: `${parent.name} › ${child.name}`,
          isActive: child.isActive,
        });
      }
    }
    return options;
  }, [categories]);

  function updateField<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((current) => {
      const next = { ...current, [key]: value };
      if (key === 'name' && !slugEdited && mode === 'create') {
        next.slug = buildProductSlug(String(value));
      }
      return next;
    });
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;

    const parsed = productFormSchema.safeParse(values);
    if (!parsed.success) {
      const nextErrors: Partial<Record<string, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'form');
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      if (nextErrors.seoTitle || nextErrors.seoDescription) setSeoOpen(true);
      return;
    }

    setSaving(true);
    setNotice(null);
    try {
      const payload = toProductPayload(parsed.data);
      if (mode === 'edit' && productId) {
        await updateProduct(productId, payload);
        setNotice({ tone: 'success', message: 'Ürün güncellendi.' });
      } else {
        await createProduct(payload);
        router.push('/admin/products');
        return;
      }
    } catch (error) {
      if (isUnauthorizedError(error)) {
        router.replace('/admin/login');
        return;
      }
      if (isProductSlugConflictError(error)) {
        setErrors((current) => ({
          ...current,
          slug: error instanceof AdminApiError ? error.message : 'Slug zaten kullanılıyor.',
        }));
        setNotice({
          tone: 'error',
          message: error instanceof AdminApiError ? error.message : 'Slug zaten kullanılıyor.',
        });
        return;
      }
      setNotice({
        tone: 'error',
        message: error instanceof AdminApiError ? error.message : 'Ürün kaydedilemedi.',
      });
    } finally {
      setSaving(false);
    }
  }

  if (notFound) {
    return (
      <div className="product-form-page">
        <AdminInlineNotice tone="error" message="Ürün bulunamadı." />
        <Link href="/admin/products" className="admin-button">
          Listeye Dön
        </Link>
      </div>
    );
  }

  if (loading) {
    return <p className="admin-status">Ürün formu yükleniyor…</p>;
  }

  return (
    <div className="product-form-page">
      <header className="product-form-header">
        <Link href="/admin/products" className="product-form-back">
          <ArrowLeft size={16} />
          Listeye dön
        </Link>
        <div className="product-form-header__main">
          <div className="product-form-header__copy">
            <h2 className="product-form-header__title">{mode === 'edit' ? 'Ürünü Düzenle' : 'Yeni Ürün'}</h2>
            <p className="product-form-header__description">
              Ürün bilgilerini, görsellerini, özelliklerini ve yönlendirme butonlarını yönetin.
            </p>
          </div>
          <button
            type="submit"
            form="product-form"
            className="admin-button admin-button-primary product-form-header__save"
            disabled={saving}
          >
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
        {notice ? <AdminInlineNotice tone={notice.tone} message={notice.message} /> : null}
      </header>

      <form id="product-form" className="product-form-layout" onSubmit={(event) => void handleSubmit(event)}>
        <div className="product-form-main">
          <section className="product-form-section">
            <h3>Temel Bilgiler</h3>
            <div className="product-form-row">
              <label className="product-form-field">
                <span>
                  Ürün Adı <span className="product-form-required">*</span>
                </span>
                <input value={values.name} onChange={(event) => updateField('name', event.target.value)} required />
                {errors.name ? <span className="product-form-error">{errors.name}</span> : null}
              </label>
              <label className="product-form-field">
                <span>
                  Slug <span className="product-form-required">*</span>
                </span>
                <input
                  value={values.slug}
                  onChange={(event) => {
                    setSlugEdited(true);
                    updateField('slug', event.target.value);
                  }}
                  required
                />
                <span className="product-form-hint">URL adresinde kullanılacaktır.</span>
                {errors.slug ? <span className="product-form-error">{errors.slug}</span> : null}
              </label>
            </div>
            <label className="product-form-field">
              <span>Kısa Açıklama</span>
              <textarea
                className="product-form-textarea--short"
                value={values.shortDescription}
                onChange={(event) => updateField('shortDescription', event.target.value)}
                rows={2}
              />
            </label>
            <label className="product-form-field">
              <span>Detaylı Açıklama</span>
              <textarea
                className="product-form-textarea--detail"
                value={values.description}
                onChange={(event) => updateField('description', event.target.value)}
                rows={5}
              />
            </label>
          </section>

          <section className="product-form-section">
            <h3>Ürün Görselleri</h3>
            <div className="product-form-media-row">
              <div className="product-form-field">
                <span>Kapak Görseli</span>
                <ProductCategoryImageField
                  preview={coverPreview}
                  emptyTitle="Kapak görseli seçilmedi"
                  onOpenPicker={() => setPickerTarget('cover')}
                  onRemove={() => {
                    setCoverPreview(null);
                    updateField('coverImageId', null);
                  }}
                />
              </div>
              <div className="product-form-field">
                <span>Ürün Logosu / İkonu</span>
                <ProductCategoryImageField
                  preview={logoPreview}
                  emptyTitle="Ürün logosu / ikonu seçilmedi"
                  onOpenPicker={() => setPickerTarget('logo')}
                  onRemove={() => {
                    setLogoPreview(null);
                    updateField('logoImageId', null);
                  }}
                />
              </div>
            </div>
            <div className="product-form-field">
              <span>Galeri</span>
              <div className="product-gallery">
                {galleryPreviews.map((asset, index) => (
                  <div key={asset.id} className="product-gallery__item">
                    <img src={asset.url} alt={asset.altText ?? asset.originalFilename} />
                    <div className="product-gallery__actions">
                      <button
                        type="button"
                        className="admin-button"
                        disabled={index === 0}
                        onClick={() => {
                          const nextGallery = [...values.gallery];
                          const nextPreviews = [...galleryPreviews];
                          [nextGallery[index - 1], nextGallery[index]] = [nextGallery[index], nextGallery[index - 1]];
                          [nextPreviews[index - 1], nextPreviews[index]] = [nextPreviews[index], nextPreviews[index - 1]];
                          updateField('gallery', nextGallery);
                          setGalleryPreviews(nextPreviews);
                        }}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="admin-button"
                        disabled={index === galleryPreviews.length - 1}
                        onClick={() => {
                          const nextGallery = [...values.gallery];
                          const nextPreviews = [...galleryPreviews];
                          [nextGallery[index + 1], nextGallery[index]] = [nextGallery[index], nextGallery[index + 1]];
                          [nextPreviews[index + 1], nextPreviews[index]] = [nextPreviews[index], nextPreviews[index + 1]];
                          updateField('gallery', nextGallery);
                          setGalleryPreviews(nextPreviews);
                        }}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="admin-button"
                        onClick={() => {
                          updateField(
                            'gallery',
                            values.gallery.filter((_, i) => i !== index),
                          );
                          setGalleryPreviews((current) => current.filter((_, i) => i !== index));
                        }}
                      >
                        Kaldır
                      </button>
                    </div>
                  </div>
                ))}
                <button type="button" className="admin-button admin-button-secondary" onClick={() => setPickerTarget('gallery')}>
                  Galeriye Görsel Ekle
                </button>
              </div>
            </div>
          </section>

          <section className="product-form-section product-form-section--repeatable">
            <div className="product-form-section__head">
              <h3>Öne Çıkan Özellikler</h3>
              <button
                type="button"
                className="admin-button admin-button-secondary"
                onClick={() => updateField('features', [...values.features, { title: '', description: '' }])}
              >
                <Plus size={14} />
                Özellik Ekle
              </button>
            </div>
            {values.features.length === 0 ? (
              <p className="product-form-repeat-empty">Henüz özellik eklenmedi. Satır eklemek için “Özellik Ekle”yi kullanın.</p>
            ) : (
              <div className="product-form-repeat-list">
                {values.features.map((feature, index) => (
                  <div key={`feature-${index}`} className="product-repeat-row">
                    <label className="product-form-field">
                      <span>Başlık</span>
                      <input
                        value={feature.title}
                        onChange={(event) => {
                          const next = [...values.features];
                          next[index] = { ...next[index], title: event.target.value };
                          updateField('features', next);
                        }}
                      />
                    </label>
                    <label className="product-form-field">
                      <span>Açıklama</span>
                      <input
                        value={feature.description}
                        onChange={(event) => {
                          const next = [...values.features];
                          next[index] = { ...next[index], description: event.target.value };
                          updateField('features', next);
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      className="admin-button"
                      aria-label="Özelliği sil"
                      onClick={() => updateField('features', values.features.filter((_, i) => i !== index))}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="product-form-section product-form-section--repeatable">
            <div className="product-form-section__head">
              <h3>Teknik Bilgiler</h3>
              <button
                type="button"
                className="admin-button admin-button-secondary"
                onClick={() => updateField('specifications', [...values.specifications, { label: '', value: '' }])}
              >
                <Plus size={14} />
                Bilgi Ekle
              </button>
            </div>
            {values.specifications.length === 0 ? (
              <p className="product-form-repeat-empty">Henüz teknik bilgi eklenmedi. Satır eklemek için “Bilgi Ekle”yi kullanın.</p>
            ) : (
              <div className="product-form-repeat-list">
                {values.specifications.map((spec, index) => (
                  <div key={`spec-${index}`} className="product-repeat-row">
                    <label className="product-form-field">
                      <span>Etiket</span>
                      <input
                        value={spec.label}
                        onChange={(event) => {
                          const next = [...values.specifications];
                          next[index] = { ...next[index], label: event.target.value };
                          updateField('specifications', next);
                        }}
                      />
                    </label>
                    <label className="product-form-field">
                      <span>Değer</span>
                      <input
                        value={spec.value}
                        onChange={(event) => {
                          const next = [...values.specifications];
                          next[index] = { ...next[index], value: event.target.value };
                          updateField('specifications', next);
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      className="admin-button"
                      aria-label="Teknik bilgiyi sil"
                      onClick={() =>
                        updateField(
                          'specifications',
                          values.specifications.filter((_, i) => i !== index),
                        )
                      }
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="product-form-section">
            <h3>Yönlendirme Butonları</h3>
            <div className="product-form-buttons-grid">
              <label className="product-form-field">
                <span>Ana Buton Metni</span>
                <input
                  value={values.primaryButtonLabel}
                  onChange={(event) => updateField('primaryButtonLabel', event.target.value)}
                />
                {errors.primaryButtonLabel ? (
                  <span className="product-form-error">{errors.primaryButtonLabel}</span>
                ) : null}
              </label>
              <label className="product-form-field">
                <span>Ana Buton Bağlantısı</span>
                <input
                  value={values.primaryButtonUrl}
                  onChange={(event) => updateField('primaryButtonUrl', event.target.value)}
                />
                {errors.primaryButtonUrl ? <span className="product-form-error">{errors.primaryButtonUrl}</span> : null}
              </label>
              <label className="product-form-field">
                <span>İkinci Buton Metni</span>
                <input
                  value={values.secondaryButtonLabel}
                  onChange={(event) => updateField('secondaryButtonLabel', event.target.value)}
                />
              </label>
              <label className="product-form-field">
                <span>İkinci Buton Bağlantısı</span>
                <input
                  value={values.secondaryButtonUrl}
                  onChange={(event) => updateField('secondaryButtonUrl', event.target.value)}
                />
              </label>
            </div>
          </section>
        </div>

        <aside className="product-form-side">
          <section className="product-form-section">
            <h3>Yayın</h3>
            <ProductCategoryStatusSwitch
              checked={values.isActive}
              disabled={saving}
              onChange={(checked) => updateField('isActive', checked)}
            />
            <div className="pc-status-switch">
              <div className="pc-status-switch__copy">
                <p className="pc-status-switch__label">Öne Çıkan</p>
                <p className="pc-status-switch__value">{values.isFeatured ? 'Öne çıkan' : 'Standart'}</p>
                <p className="pc-status-switch__hint">Liste ve vitrin vurgularında kullanılabilir.</p>
              </div>
              <button
                type="button"
                role="switch"
                className={`pc-status-switch__control${values.isFeatured ? ' pc-status-switch__control--on' : ''}`}
                aria-checked={values.isFeatured}
                aria-label="Öne çıkan"
                disabled={saving}
                onClick={() => updateField('isFeatured', !values.isFeatured)}
              >
                <span className="pc-status-switch__thumb" aria-hidden="true" />
              </button>
            </div>
          </section>

          <section className="product-form-section">
            <h3>Kategori</h3>
            <label className="product-form-field">
              <span>Ürün Kategorisi</span>
              <select
                value={values.categoryId ?? ''}
                onChange={(event) => updateField('categoryId', event.target.value ? event.target.value : null)}
              >
                <option value="">Kategori seçilmedi</option>
                {categoryOptions.map((option) => {
                  const selectedInactive = values.categoryId === option.id && !option.isActive;
                  if (!option.isActive && values.categoryId !== option.id) {
                    return null;
                  }
                  return (
                    <option key={option.id} value={option.id}>
                      {option.label}
                      {selectedInactive || !option.isActive ? ' (Pasif)' : ''}
                    </option>
                  );
                })}
              </select>
            </label>
          </section>

          <section className="product-form-section product-form-section--seo">
            <button type="button" className="product-form-seo-toggle" aria-expanded={seoOpen} onClick={() => setSeoOpen((v) => !v)}>
              <span>
                SEO Ayarları <span className="product-form-hint">İsteğe bağlı</span>
              </span>
              <ChevronDown size={16} />
            </button>
            {seoOpen ? (
              <div className="product-form-seo-body">
                <label className="product-form-field">
                  <span>SEO Başlığı</span>
                  <input value={values.seoTitle} onChange={(event) => updateField('seoTitle', event.target.value)} />
                </label>
                <label className="product-form-field">
                  <span>SEO Açıklaması</span>
                  <textarea
                    value={values.seoDescription}
                    onChange={(event) => updateField('seoDescription', event.target.value)}
                    rows={3}
                  />
                </label>
              </div>
            ) : null}
          </section>
        </aside>
      </form>

      <ProductCategoryMediaPicker
        open={pickerTarget !== null}
        selectedId={
          pickerTarget === 'cover'
            ? values.coverImageId
            : pickerTarget === 'logo'
              ? values.logoImageId
              : null
        }
        onClose={() => setPickerTarget(null)}
        onSelect={(asset) => {
          if (pickerTarget === 'cover') {
            setCoverPreview(asset);
            updateField('coverImageId', asset.id);
          } else if (pickerTarget === 'logo') {
            setLogoPreview(asset);
            updateField('logoImageId', asset.id);
          } else if (pickerTarget === 'gallery') {
            if (asset.id === values.coverImageId || asset.id === values.logoImageId) {
              setNotice({ tone: 'error', message: 'Kapak veya logo görseli galeriye eklenemez.' });
            } else if (values.gallery.some((item) => item.mediaAssetId === asset.id)) {
              setNotice({ tone: 'error', message: 'Bu görsel galeride zaten var.' });
            } else {
              updateField('gallery', [...values.gallery, { mediaAssetId: asset.id }]);
              setGalleryPreviews((current) => [...current, asset]);
            }
          }
          setPickerTarget(null);
        }}
      />
    </div>
  );
}
