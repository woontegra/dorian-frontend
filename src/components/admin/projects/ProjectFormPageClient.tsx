'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { MediaAsset } from '@kurumsal/shared';
import { ArrowLeft, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { AdminInlineNotice } from '@/components/admin/common/AdminInlineNotice';
import { ProductCategoryImageField } from '@/components/admin/product-categories/ProductCategoryImageField';
import { ProductCategoryMediaPicker } from '@/components/admin/product-categories/ProductCategoryMediaPicker';
import { useAdminSession } from '@/components/admin/session/AdminSessionProvider';
import { AdminApiError } from '@/lib/auth/types';
import {
  createProject,
  fetchProject,
  isProjectNotFoundError,
  isProjectSlugConflictError,
  isUnauthorizedError,
  updateProject,
} from '@/lib/projects/api';
import {
  buildProjectSlug,
  createEmptyProjectFormValues,
  projectFormSchema,
  projectToFormValues,
  toProjectPayload,
  type ProjectFormValues,
} from '@/lib/projects/schema';

type ProjectFormPageClientProps = {
  mode: 'create' | 'edit';
  projectId?: string;
};

type Notice = { tone: 'success' | 'error'; message: string } | null;

type CompactSwitchProps = {
  label: string;
  value: boolean;
  activeLabel: string;
  inactiveLabel: string;
  hint: string;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
};

function CompactSwitch({ label, value, activeLabel, inactiveLabel, hint, disabled, onChange }: CompactSwitchProps) {
  return (
    <div className="pc-status-switch">
      <div className="pc-status-switch__copy">
        <p className="pc-status-switch__label">{label}</p>
        <p className="pc-status-switch__value">{value ? activeLabel : inactiveLabel}</p>
        <p className="pc-status-switch__hint">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        className={`pc-status-switch__control${value ? ' pc-status-switch__control--on' : ''}`}
        aria-checked={value}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!value)}
      >
        <span className="pc-status-switch__thumb" aria-hidden="true" />
      </button>
    </div>
  );
}

export function ProjectFormPageClient({ mode, projectId }: ProjectFormPageClientProps) {
  const router = useRouter();
  useAdminSession();

  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [values, setValues] = useState<ProjectFormValues>(createEmptyProjectFormValues());
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [slugEdited, setSlugEdited] = useState(mode === 'edit');
  const [seoOpen, setSeoOpen] = useState(false);
  const [coverPreview, setCoverPreview] = useState<MediaAsset | null>(null);
  const [galleryPreviews, setGalleryPreviews] = useState<MediaAsset[]>([]);
  const [pickerTarget, setPickerTarget] = useState<'cover' | 'gallery' | null>(null);

  useEffect(() => {
    if (mode !== 'edit' || !projectId) {
      return;
    }

    let active = true;
    setLoading(true);
    void fetchProject(projectId)
      .then(async (project) => {
        if (!active) return;
        setValues(projectToFormValues(project));
        setSlugEdited(true);
        setSeoOpen(Boolean(project.seoTitle || project.seoDescription));
        setCoverPreview(
          project.coverImage
            ? ({
                id: project.coverImage.id,
                url: project.coverImage.url,
                altText: project.coverImage.altText,
                originalFilename: project.coverImage.originalFilename,
              } as MediaAsset)
            : null,
        );
        setGalleryPreviews(
          project.gallery.map(
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
        if (isProjectNotFoundError(error)) {
          setNotFound(true);
          return;
        }
        setNotice({
          tone: 'error',
          message: error instanceof AdminApiError ? error.message : 'Proje yüklenemedi.',
        });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [mode, projectId, router]);

  function updateField<K extends keyof ProjectFormValues>(key: K, value: ProjectFormValues[K]) {
    setValues((current) => {
      const next = { ...current, [key]: value };
      if (key === 'name' && !slugEdited && mode === 'create') {
        next.slug = buildProjectSlug(String(value));
      }
      return next;
    });
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function moveTechnology(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= values.technologies.length) {
      return;
    }
    const next = [...values.technologies];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    updateField('technologies', next);
  }

  function moveGalleryItem(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= galleryPreviews.length) {
      return;
    }
    const nextGallery = [...values.gallery];
    const nextPreviews = [...galleryPreviews];
    [nextGallery[index], nextGallery[targetIndex]] = [nextGallery[targetIndex], nextGallery[index]];
    [nextPreviews[index], nextPreviews[targetIndex]] = [nextPreviews[targetIndex], nextPreviews[index]];
    updateField('gallery', nextGallery);
    setGalleryPreviews(nextPreviews);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;

    const parsed = projectFormSchema.safeParse(values);
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
      const payload = toProjectPayload(parsed.data);
      if (mode === 'edit' && projectId) {
        await updateProject(projectId, payload);
        setNotice({ tone: 'success', message: 'Proje güncellendi.' });
      } else {
        await createProject(payload);
        router.push('/admin/projects');
        return;
      }
    } catch (error) {
      if (isUnauthorizedError(error)) {
        router.replace('/admin/login');
        return;
      }
      if (isProjectSlugConflictError(error)) {
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
        message: error instanceof AdminApiError ? error.message : 'Proje kaydedilemedi.',
      });
    } finally {
      setSaving(false);
    }
  }

  if (notFound) {
    return (
      <div className="project-form-page">
        <AdminInlineNotice tone="error" message="Proje bulunamadı." />
        <Link href="/admin/projects" className="admin-button">
          Listeye Dön
        </Link>
      </div>
    );
  }

  if (loading) {
    return <p className="admin-status">Proje formu yükleniyor…</p>;
  }

  return (
    <div className="project-form-page">
      <header className="project-form-header">
        <div className="project-form-header__copy">
          <Link href="/admin/projects" className="project-form-back">
            <ArrowLeft size={16} />
            Listeye dön
          </Link>
          <h2 className="project-form-header__title">{mode === 'edit' ? 'Projeyi Düzenle' : 'Yeni Proje'}</h2>
          <p className="project-form-header__description">
            Proje bilgilerini, görsellerini ve teknolojilerini yönetin.
          </p>
        </div>
        <button
          type="submit"
          form="project-form"
          className="admin-button admin-button-primary project-form-header__save"
          disabled={saving}
        >
          {saving ? 'Kaydediliyor…' : mode === 'edit' ? 'Değişiklikleri Kaydet' : 'Projeyi Oluştur'}
        </button>
        {notice ? <AdminInlineNotice tone={notice.tone} message={notice.message} /> : null}
      </header>

      <form id="project-form" className="project-form-layout" onSubmit={(event) => void handleSubmit(event)}>
        <div className="project-form-main">
          <section className="project-form-section">
            <h3>Temel Bilgiler</h3>
            <div className="project-form-row">
              <label className="project-form-field">
                <span>
                  Proje Adı <span className="project-form-required">*</span>
                </span>
                <input value={values.name} onChange={(event) => updateField('name', event.target.value)} required />
                {errors.name ? <span className="project-form-error">{errors.name}</span> : null}
              </label>
              <label className="project-form-field">
                <span>
                  Slug <span className="project-form-required">*</span>
                </span>
                <input
                  value={values.slug}
                  onChange={(event) => {
                    setSlugEdited(true);
                    updateField('slug', event.target.value);
                  }}
                  required
                />
                <span className="project-form-hint">URL adresinde kullanılacaktır.</span>
                {errors.slug ? <span className="project-form-error">{errors.slug}</span> : null}
              </label>
            </div>
            <label className="project-form-field">
              <span>Kısa Açıklama</span>
              <textarea
                className="project-form-textarea--short"
                value={values.shortDescription}
                onChange={(event) => updateField('shortDescription', event.target.value)}
                rows={2}
              />
            </label>
            <label className="project-form-field">
              <span>Detaylı Açıklama</span>
              <textarea
                className="project-form-textarea--detail"
                value={values.description}
                onChange={(event) => updateField('description', event.target.value)}
                rows={5}
              />
            </label>
          </section>

          <section className="project-form-section">
            <h3>Proje Görselleri</h3>
            <div className="project-form-field">
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
            <div className="project-form-field">
              <span>Galeri</span>
              <div className="project-gallery">
                {galleryPreviews.length === 0 ? (
                  <p className="project-form-repeat-empty">Henüz galeri görseli eklenmedi.</p>
                ) : (
                  <div className="project-gallery__grid">
                    {galleryPreviews.map((asset, index) => (
                      <div key={asset.id} className="project-gallery__item">
                        <img src={asset.url} alt={asset.altText ?? asset.originalFilename} />
                        <div className="project-gallery__actions">
                          <button
                            type="button"
                            className="admin-button"
                            disabled={index === 0}
                            aria-label={`${index + 1}. görseli yukarı taşı`}
                            onClick={() => moveGalleryItem(index, -1)}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className="admin-button"
                            disabled={index === galleryPreviews.length - 1}
                            aria-label={`${index + 1}. görseli aşağı taşı`}
                            onClick={() => moveGalleryItem(index, 1)}
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            className="admin-button"
                            aria-label={`${index + 1}. görseli kaldır`}
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
                  </div>
                )}
                <button
                  type="button"
                  className="admin-button admin-button-secondary"
                  onClick={() => setPickerTarget('gallery')}
                >
                  Galeriye Görsel Ekle
                </button>
              </div>
            </div>
          </section>

          <section className="project-form-section">
            <h3>Proje Bilgileri</h3>
            <div className="project-form-row">
              <label className="project-form-field">
                <span>Müşteri / Kurum Adı</span>
                <input value={values.clientName} onChange={(event) => updateField('clientName', event.target.value)} />
              </label>
              <div className="project-form-field">
                <CompactSwitch
                  label="Müşteri Adını Göster"
                  value={values.showClientName}
                  activeLabel="Görünür"
                  inactiveLabel="Gizli"
                  hint="Kapalı olduğunda müşteri veya kurum adı public proje sayfalarında gösterilmez."
                  disabled={saving}
                  onChange={(checked) => updateField('showClientName', checked)}
                />
              </div>
            </div>
            <div className="project-form-row">
              <label className="project-form-field">
                <span>Sektör</span>
                <input value={values.sector} onChange={(event) => updateField('sector', event.target.value)} />
              </label>
              <label className="project-form-field">
                <span>Tamamlanma Tarihi</span>
                <input
                  type="date"
                  value={values.completedAt}
                  onChange={(event) => updateField('completedAt', event.target.value)}
                />
                {errors.completedAt ? <span className="project-form-error">{errors.completedAt}</span> : null}
              </label>
            </div>
            <label className="project-form-field">
              <span>Web Sitesi</span>
              <input value={values.websiteUrl} onChange={(event) => updateField('websiteUrl', event.target.value)} />
              {errors.websiteUrl ? <span className="project-form-error">{errors.websiteUrl}</span> : null}
            </label>

            <div className="project-form-section__head">
              <h4>Teknolojiler</h4>
              <button
                type="button"
                className="admin-button admin-button-secondary"
                onClick={() => updateField('technologies', [...values.technologies, { label: '' }])}
              >
                <Plus size={14} />
                Teknoloji Ekle
              </button>
            </div>
            {values.technologies.length === 0 ? (
              <p className="project-form-repeat-empty">
                Henüz teknoloji eklenmedi. Satır eklemek için “Teknoloji Ekle”yi kullanın.
              </p>
            ) : (
              <div className="project-form-repeat-list">
                {values.technologies.map((technology, index) => (
                  <div key={`technology-${index}`} className="project-technology-row">
                    <input
                      value={technology.label}
                      onChange={(event) => {
                        const next = [...values.technologies];
                        next[index] = { ...next[index], label: event.target.value };
                        updateField('technologies', next);
                      }}
                      aria-label={`Teknoloji ${index + 1}`}
                      placeholder="Örn. React"
                    />
                    <div className="project-technology-row__actions">
                      <button
                        type="button"
                        className="admin-button"
                        aria-label={`${index + 1}. teknolojiyi yukarı taşı`}
                        disabled={index === 0}
                        onClick={() => moveTechnology(index, -1)}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="admin-button"
                        aria-label={`${index + 1}. teknolojiyi aşağı taşı`}
                        disabled={index === values.technologies.length - 1}
                        onClick={() => moveTechnology(index, 1)}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="admin-button"
                        aria-label={`${index + 1}. teknolojiyi sil`}
                        onClick={() => updateField('technologies', values.technologies.filter((_, i) => i !== index))}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="project-form-side">
          <section className="project-form-section">
            <h3>Yayın</h3>
            <CompactSwitch
              label="Yayın Durumu"
              value={values.isActive}
              activeLabel="Aktif"
              inactiveLabel="Pasif"
              hint="Pasif projeler sitede gösterilmez."
              disabled={saving}
              onChange={(checked) => updateField('isActive', checked)}
            />
            <CompactSwitch
              label="Öne Çıkan"
              value={values.isFeatured}
              activeLabel="Öne çıkan"
              inactiveLabel="Standart"
              hint="Liste ve vitrin vurgularında kullanılabilir."
              disabled={saving}
              onChange={(checked) => updateField('isFeatured', checked)}
            />
          </section>

          <section className="project-form-section project-form-section--seo">
            <button
              type="button"
              className="project-form-seo-toggle"
              aria-expanded={seoOpen}
              onClick={() => setSeoOpen((v) => !v)}
            >
              <span>
                SEO Ayarları <span className="project-form-hint">İsteğe bağlı</span>
              </span>
              <ChevronDown size={16} />
            </button>
            {seoOpen ? (
              <div className="project-form-seo-body">
                <label className="project-form-field">
                  <span>SEO Başlığı</span>
                  <input value={values.seoTitle} onChange={(event) => updateField('seoTitle', event.target.value)} />
                </label>
                <label className="project-form-field">
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
        selectedId={pickerTarget === 'cover' ? values.coverImageId : null}
        onClose={() => setPickerTarget(null)}
        onSelect={(asset) => {
          if (pickerTarget === 'cover') {
            setCoverPreview(asset);
            updateField('coverImageId', asset.id);
          } else if (pickerTarget === 'gallery') {
            if (asset.id === values.coverImageId) {
              setNotice({ tone: 'error', message: 'Kapak görseli galeriye eklenemez.' });
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
