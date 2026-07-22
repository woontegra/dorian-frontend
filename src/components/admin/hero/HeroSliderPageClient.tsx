'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
  HeroButtonStyle,
  HeroSettings,
  HeroSlide,
  HeroSlideContent,
  HeroTextBlock,
  HeroTitleBlock,
} from '@kurumsal/shared';
import {
  createDefaultHeroSlideContent,
  HERO_LIMITS,
  isSafeMenuHref,
  mergeHeroSlideContent,
} from '@kurumsal/shared';
import {
  AlignLeft,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Eye,
  Image as ImageIcon,
  Monitor,
  Move,
  Palette,
  Plus,
  RotateCcw,
  Save,
  Settings2,
  Smartphone,
  SquareMousePointer,
  Tablet,
  Type,
  X,
} from 'lucide-react';
import { AdminInlineNotice } from '@/components/admin/common/AdminInlineNotice';
import { AdminConfirmDialog } from '@/components/admin/common/AdminConfirmDialog';
import { ProductCategoryMediaPicker } from '@/components/admin/product-categories/ProductCategoryMediaPicker';
import {
  HeroAccordion,
  HeroAlignPicker,
  HeroColorField,
  HeroPositionPicker,
  HeroSegmented,
  HeroSelectField,
  HeroSliderField,
  HeroSwitch,
  HeroTextField,
} from '@/components/admin/hero/HeroEditorControls';
import { SiteHero } from '@/components/public/SiteHero';
import { useAdminSession } from '@/components/admin/session/AdminSessionProvider';
import { AdminApiError } from '@/lib/auth/types';
import {
  createHeroSlide,
  deleteHeroSlide,
  fetchHeroSettings,
  isForbiddenError,
  isUnauthorizedError,
  reorderHeroSlides,
  updateHeroSettings,
  updateHeroSlide,
} from '@/lib/hero/api';
import { mapPublicHeroFromAdmin } from '@/lib/hero/preview';
import '@/components/admin/hero/hero-admin.css';

type Notice = { tone: 'success' | 'error'; message: string } | null;
type InspectorSection =
  | 'visual'
  | 'content'
  | 'typography'
  | 'layout'
  | 'readability'
  | 'buttons'
  | 'mobile'
  | 'advanced'
  | null;
type PreviewDevice = 'desktop' | 'tablet' | 'mobile';
type MediaTarget = 'desktop' | 'mobile' | null;
type TextBlockKey = 'eyebrow' | 'title' | 'description';
type DraftMeta = {
  altText: string;
  isActive: boolean;
  objectFit: HeroSlide['objectFit'];
  desktopImageUrl: string;
  desktopImagePathname: string | null;
  mobileImageUrl: string | null;
  mobileImagePathname: string | null;
};

function slideLabel(slide: HeroSlide, index: number): string {
  return slide.altText.trim() || slide.content.title.text.trim() || `Slayt ${index + 1}`;
}

function emptyDraftMeta(): DraftMeta {
  return {
    altText: '',
    isActive: true,
    objectFit: 'COVER',
    desktopImageUrl: '',
    desktopImagePathname: null,
    mobileImageUrl: null,
    mobileImagePathname: null,
  };
}

function createBlankSlide(sortOrder: number): HeroSlide {
  return {
    id: 'new',
    desktopImageUrl: '',
    desktopImagePathname: null,
    mobileImageUrl: null,
    mobileImagePathname: null,
    altText: '',
    isActive: true,
    sortOrder,
    objectFit: 'COVER',
    content: createDefaultHeroSlideContent(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function typographyPreset(
  target: TextBlockKey,
  desktop: number,
  mobile: number,
): 'small' | 'balanced' | 'large' | 'custom' {
  const presets =
    target === 'title'
      ? { small: [32, 24], balanced: [42, 28], large: [56, 34] }
      : target === 'eyebrow'
        ? { small: [12, 11], balanced: [13, 12], large: [15, 13] }
        : { small: [14, 13], balanced: [17, 15], large: [20, 17] };
  if (desktop === presets.small[0] && mobile === presets.small[1]) return 'small';
  if (desktop === presets.balanced[0] && mobile === presets.balanced[1]) return 'balanced';
  if (desktop === presets.large[0] && mobile === presets.large[1]) return 'large';
  return 'custom';
}

export function HeroSliderPageClient() {
  const router = useRouter();
  const { admin } = useAdminSession();
  const canDelete = admin.role === 'ADMIN';

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [settings, setSettings] = useState<HeroSettings | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<HeroSlide | null>(null);
  const [draftContent, setDraftContent] = useState<HeroSlideContent>(createDefaultHeroSlideContent());
  const [draftMeta, setDraftMeta] = useState<DraftMeta>(emptyDraftMeta());
  const [baseline, setBaseline] = useState('');
  const [inspector, setInspector] = useState<InspectorSection>('visual');
  const [textTarget, setTextTarget] = useState<TextBlockKey>('title');
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('desktop');
  const [previewScale, setPreviewScale] = useState(100);
  const [fitPreview, setFitPreview] = useState(true);
  const [mediaTarget, setMediaTarget] = useState<MediaTarget>(null);
  const [deleteTarget, setDeleteTarget] = useState<HeroSlide | null>(null);
  const [pendingLeave, setPendingLeave] = useState<'back' | 'discard' | null>(null);
  const [mobilePanel, setMobilePanel] = useState<'slides' | 'preview' | 'inspector'>('preview');
  const [useDesktopPositionOnMobile, setUseDesktopPositionOnMobile] = useState(false);
  const [buttonErrors, setButtonErrors] = useState<{ primary?: string; secondary?: string }>({});
  const mediaTargetRef = useRef<MediaTarget>(null);
  const editingRef = useRef<HeroSlide | null>(null);
  const loadGenerationRef = useRef(0);

  useEffect(() => {
    editingRef.current = editing;
  }, [editing]);

  function openMediaPicker(target: 'desktop' | 'mobile') {
    mediaTargetRef.current = target;
    setMediaTarget(target);
  }

  function closeMediaPicker() {
    mediaTargetRef.current = null;
    setMediaTarget(null);
  }

  function startBlankDraft(options?: {
    desktopImageUrl?: string;
    desktopImagePathname?: string | null;
    mobileImageUrl?: string | null;
    mobileImagePathname?: string | null;
    altText?: string;
  }) {
    const slide = createBlankSlide(settings?.slides.length ?? 0);
    const content = mergeHeroSlideContent(slide.content);
    const emptyMeta: DraftMeta = {
      altText: '',
      isActive: true,
      objectFit: 'COVER',
      desktopImageUrl: '',
      desktopImagePathname: null,
      mobileImageUrl: null,
      mobileImagePathname: null,
    };
    const meta: DraftMeta = {
      ...emptyMeta,
      desktopImageUrl: options?.desktopImageUrl ?? '',
      desktopImagePathname: options?.desktopImagePathname ?? null,
      mobileImageUrl: options?.mobileImageUrl ?? null,
      mobileImagePathname: options?.mobileImagePathname ?? null,
      altText: options?.altText ?? '',
    };

    setSelectedId(slide.id);
    setEditing(slide);
    editingRef.current = slide;
    setDraftContent(content);
    setDraftMeta(meta);
    // Baseline is the empty slide so applying a media selection marks the form dirty.
    setBaseline(snapshot(emptyMeta, content));
    setUseDesktopPositionOnMobile(content.positionMobile === content.positionDesktop);
    setButtonErrors({});
    setInspector('visual');
    setMobilePanel('inspector');
  }

  function snapshot(meta: DraftMeta, content: HeroSlideContent): string {
    return JSON.stringify({ meta, content });
  }

  const isDirty = Boolean(editing && snapshot(draftMeta, draftContent) !== baseline);

  useEffect(() => {
    if (!isDirty) return;
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = '';
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  const load = useCallback(
    async (options?: { keepNotice?: boolean; selectId?: string | null; soft?: boolean }) => {
      const generation = ++loadGenerationRef.current;
      if (!options?.soft) setLoading(true);
      setLoadError(null);
      if (!options?.keepNotice) setNotice(null);
      try {
        const data = await fetchHeroSettings();
        if (generation !== loadGenerationRef.current) return;
        setSettings(data);
        const ordered = [...data.slides].sort((a, b) => a.sortOrder - b.sortOrder);
        const preferred = options?.selectId !== undefined ? options.selectId : null;
        const nextId = preferred ?? ordered[0]?.id ?? null;
        if (nextId && nextId !== 'new') {
          const slide = ordered.find((item) => item.id === nextId) ?? ordered[0] ?? null;
          if (slide) {
            applySlide(slide);
          } else if (editingRef.current?.id !== 'new') {
            setEditing(null);
            editingRef.current = null;
            setSelectedId(null);
            setBaseline('');
          }
        } else if (!ordered.length) {
          // Keep an in-progress local draft if the user already started one
          // (e.g. empty-state media pick racing the initial load).
          if (editingRef.current?.id !== 'new') {
            setEditing(null);
            editingRef.current = null;
            setSelectedId(null);
            setBaseline('');
          }
        }
      } catch (error) {
        if (generation !== loadGenerationRef.current) return;
        if (isUnauthorizedError(error)) {
          router.replace('/admin/login');
          return;
        }
        setLoadError(error instanceof AdminApiError ? error.message : 'Hero ayarları yüklenemedi.');
        setSettings(null);
      } finally {
        if (generation === loadGenerationRef.current) {
          setLoading(false);
        }
      }
    },
    [router],
  );

  function applySlide(slide: HeroSlide) {
    const content = mergeHeroSlideContent(slide.content);
    const meta: DraftMeta = {
      altText: slide.altText,
      isActive: slide.isActive,
      objectFit: slide.objectFit,
      desktopImageUrl: slide.desktopImageUrl,
      desktopImagePathname: slide.desktopImagePathname,
      mobileImageUrl: slide.mobileImageUrl,
      mobileImagePathname: slide.mobileImagePathname,
    };
    setSelectedId(slide.id);
    setEditing(slide);
    editingRef.current = slide;
    setDraftContent(content);
    setDraftMeta(meta);
    setBaseline(snapshot(meta, content));
    setUseDesktopPositionOnMobile(content.positionMobile === content.positionDesktop);
    setButtonErrors({});
    setInspector('visual');
  }

  function selectSlide(slide: HeroSlide, warnIfDirty = true) {
    if (warnIfDirty && isDirty) {
      const ok = window.confirm('Kaydedilmemiş değişiklikler var. Devam etmek istiyor musunuz?');
      if (!ok) return;
    }
    applySlide(slide);
  }

  useEffect(() => {
    void load();
  }, [load]);

  const previewHero = useMemo(() => {
    if (!settings) return null;
    const draftSlide: HeroSlide | null = editing
      ? {
          ...editing,
          ...draftMeta,
          content: draftContent,
        }
      : null;
    return mapPublicHeroFromAdmin(settings, draftSlide);
  }, [settings, editing, draftMeta, draftContent]);

  function patchContent<K extends keyof HeroSlideContent>(key: K, value: HeroSlideContent[K]) {
    setDraftContent((current) => {
      const next = { ...current, [key]: value };
      if (key === 'positionDesktop' && useDesktopPositionOnMobile) {
        next.positionMobile = value as HeroSlideContent['positionMobile'];
      }
      return next;
    });
  }

  function patchTextBlock(key: TextBlockKey, patch: Partial<HeroTextBlock | HeroTitleBlock>) {
    setDraftContent((current) => ({
      ...current,
      [key]: { ...current[key], ...patch },
    }));
  }

  function patchButton(key: 'primaryButton' | 'secondaryButton', patch: Partial<HeroButtonStyle>) {
    setDraftContent((current) => ({
      ...current,
      [key]: { ...current[key], ...patch },
    }));
  }

  function openCreate() {
    if (isDirty) {
      const ok = window.confirm('Kaydedilmemiş değişiklikler var. Yeni slayta geçilsin mi?');
      if (!ok) return;
    }
    startBlankDraft();
  }

  function applySelectedMedia(asset: {
    url: string;
    pathname?: string | null;
    altText?: string | null;
  }) {
    const target = mediaTargetRef.current ?? mediaTarget;
    const url = asset.url?.trim() ?? '';
    if (!url || /^(blob:|file:|data:)/i.test(url)) {
      setNotice({ tone: 'error', message: 'Seçilen görsel kullanılamıyor. Kalıcı bir medya kaydı seçin.' });
      return;
    }

    const currentEditing = editingRef.current;
    if (!currentEditing) {
      if (target === 'mobile') {
        startBlankDraft({
          mobileImageUrl: url,
          mobileImagePathname: asset.pathname || null,
          altText: asset.altText || '',
        });
      } else {
        startBlankDraft({
          desktopImageUrl: url,
          desktopImagePathname: asset.pathname || null,
          altText: asset.altText || '',
        });
      }
      closeMediaPicker();
      return;
    }

    if (target === 'desktop') {
      setDraftMeta((current) => ({
        ...current,
        desktopImageUrl: url,
        desktopImagePathname: asset.pathname || null,
        altText: current.altText || asset.altText || '',
      }));
    } else if (target === 'mobile') {
      setDraftMeta((current) => ({
        ...current,
        mobileImageUrl: url,
        mobileImagePathname: asset.pathname || null,
      }));
    }
    closeMediaPicker();
  }

  async function saveCurrent() {
    if (!editing) return;
    if (!draftMeta.desktopImageUrl.trim()) {
      setNotice({ tone: 'error', message: 'Masaüstü görseli zorunludur.' });
      setInspector('visual');
      return;
    }

    const errors: { primary?: string; secondary?: string } = {};
    if (draftContent.primaryButton.enabled) {
      if (!draftContent.primaryButton.label.trim()) errors.primary = 'Buton metni gerekli.';
      else if (!draftContent.primaryButton.href.trim() || !isSafeMenuHref(draftContent.primaryButton.href.trim())) {
        errors.primary = 'Geçerli bir bağlantı girin.';
      }
    }
    if (draftContent.secondaryButton.enabled) {
      if (!draftContent.secondaryButton.label.trim()) errors.secondary = 'Buton metni gerekli.';
      else if (
        !draftContent.secondaryButton.href.trim() ||
        !isSafeMenuHref(draftContent.secondaryButton.href.trim())
      ) {
        errors.secondary = 'Geçerli bir bağlantı girin.';
      }
    }
    setButtonErrors(errors);
    if (errors.primary || errors.secondary) {
      setInspector('buttons');
      setNotice({ tone: 'error', message: 'Buton ayarlarını kontrol edin.' });
      return;
    }

    setSaving(true);
    setNotice(null);
    try {
      const payload = { ...draftMeta, content: draftContent };
      const saved =
        editing.id === 'new' ? await createHeroSlide(payload) : await updateHeroSlide(editing.id, payload);
      setNotice({ tone: 'success', message: editing.id === 'new' ? 'Slayt eklendi.' : 'Slayt kaydedildi.' });
      await load({ keepNotice: true, selectId: saved.id, soft: true });
    } catch (error) {
      if (isUnauthorizedError(error)) {
        router.replace('/admin/login');
        return;
      }
      setNotice({
        tone: 'error',
        message: error instanceof AdminApiError ? error.message : 'Slayt kaydedilemedi.',
      });
    } finally {
      setSaving(false);
    }
  }

  function discardChanges() {
    if (!editing) return;
    if (editing.id === 'new') {
      setEditing(null);
      editingRef.current = null;
      setSelectedId(null);
      setBaseline('');
      return;
    }
    const original = settings?.slides.find((item) => item.id === editing.id);
    if (original) selectSlide(original, false);
  }

  async function saveSettingsPatch(patch: Partial<HeroSettings>) {
    if (!settings) return;
    try {
      const updated = await updateHeroSettings({
        displayMode: patch.displayMode ?? settings.displayMode,
        widthMode: patch.widthMode ?? settings.widthMode,
        maxWidthPx: patch.maxWidthPx ?? settings.maxWidthPx,
        heightMode: patch.heightMode ?? settings.heightMode,
        fixedHeightDesktopPx: patch.fixedHeightDesktopPx ?? settings.fixedHeightDesktopPx,
        fixedHeightMobilePx: patch.fixedHeightMobilePx ?? settings.fixedHeightMobilePx,
        singleSlideId: patch.singleSlideId !== undefined ? patch.singleSlideId : settings.singleSlideId,
        autoplay: patch.autoplay ?? settings.autoplay,
        autoplayIntervalSec: patch.autoplayIntervalSec ?? settings.autoplayIntervalSec,
        showArrows: patch.showArrows ?? settings.showArrows,
        showDots: patch.showDots ?? settings.showDots,
        transitionEffect: patch.transitionEffect ?? settings.transitionEffect,
        loop: patch.loop ?? settings.loop,
        controlTone: patch.controlTone ?? settings.controlTone,
      });
      setSettings(updated);
      setNotice({ tone: 'success', message: 'Genel ayarlar kaydedildi.' });
    } catch (error) {
      setNotice({
        tone: 'error',
        message: error instanceof AdminApiError ? error.message : 'Ayarlar kaydedilemedi.',
      });
    }
  }

  async function moveSlide(slide: HeroSlide, direction: -1 | 1) {
    if (!settings) return;
    const ordered = [...settings.slides].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = ordered.findIndex((item) => item.id === slide.id);
    const swapWith = ordered[index + direction];
    if (!swapWith) return;
    const items = ordered.map((item, itemIndex) => {
      if (itemIndex === index) return { id: item.id, sortOrder: swapWith.sortOrder };
      if (itemIndex === index + direction) return { id: item.id, sortOrder: slide.sortOrder };
      return { id: item.id, sortOrder: item.sortOrder };
    });
    await reorderHeroSlides({ items });
    await load({ keepNotice: true, selectId: slide.id, soft: true });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteHeroSlide(deleteTarget.id);
      setDeleteTarget(null);
      setNotice({ tone: 'success', message: 'Slayt silindi.' });
      if (selectedId === deleteTarget.id) {
        setEditing(null);
        editingRef.current = null;
        setSelectedId(null);
      }
      await load({ keepNotice: true, selectId: null, soft: true });
    } catch (error) {
      setNotice({
        tone: 'error',
        message: isForbiddenError(error)
          ? 'Silmek için yönetici yetkisi gerekir.'
          : error instanceof AdminApiError
            ? error.message
            : 'Slayt silinemedi.',
      });
    }
  }

  const textBlock = draftContent[textTarget];
  const orderedSlides = useMemo(
    () => (settings ? [...settings.slides].sort((a, b) => a.sortOrder - b.sortOrder) : []),
    [settings],
  );

  if (loading) {
    return <p className="admin-muted">Hero editörü yükleniyor…</p>;
  }

  if (loadError || !settings) {
    return (
      <div className="hero-editor" style={{ padding: '1rem' }}>
        <AdminInlineNotice tone="error" message={loadError ?? 'Veri yüklenemedi.'} />
        <button type="button" className="he-btn" onClick={() => void load()}>
          <RotateCcw size={15} /> Yeniden dene
        </button>
      </div>
    );
  }

  return (
    <div className="hero-editor">
      {notice ? (
        <div className="hero-editor__notice">
          <AdminInlineNotice tone={notice.tone} message={notice.message} />
        </div>
      ) : null}

      <header className="hero-editor__toolbar">
        <div className="hero-editor__toolbar-meta">
          <h1 className="hero-editor__toolbar-title">
            Hero / Slider
            {isDirty ? <span className="hero-editor__dirty">Kaydedilmedi</span> : null}
          </h1>
          <p className="hero-editor__toolbar-sub">
            {editing ? (editing.id === 'new' ? 'Yeni slayt' : slideLabel(editing, 0)) : 'Slayt seçin veya ekleyin'}
          </p>
        </div>
        <div className="hero-editor__toolbar-actions">
          <button
            type="button"
            className="he-btn he-btn--ghost"
            onClick={() => {
              if (isDirty) {
                setPendingLeave('back');
                return;
              }
              router.push('/admin');
            }}
          >
            <ArrowLeft size={15} /> Geri
          </button>
          <button
            type="button"
            className="he-btn"
            disabled={!isDirty}
            onClick={() => {
              if (!isDirty) return;
              setPendingLeave('discard');
            }}
          >
            <X size={15} /> İptal
          </button>
          <button type="button" className="he-btn" onClick={() => setMobilePanel('preview')}>
            <Eye size={15} /> Önizle
          </button>
          <button type="button" className="he-btn he-btn--primary" disabled={!editing || saving} onClick={() => void saveCurrent()}>
            <Save size={15} /> {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      </header>

      <div className="hero-editor__mobile-toggles">
        <button type="button" className={`he-btn${mobilePanel === 'slides' ? ' he-btn--primary' : ''}`} onClick={() => setMobilePanel('slides')}>
          Slaytlar
        </button>
        <button type="button" className={`he-btn${mobilePanel === 'preview' ? ' he-btn--primary' : ''}`} onClick={() => setMobilePanel('preview')}>
          Önizleme
        </button>
        <button type="button" className={`he-btn${mobilePanel === 'inspector' ? ' he-btn--primary' : ''}`} onClick={() => setMobilePanel('inspector')}>
          Ayarlar
        </button>
      </div>

      <div className="hero-editor__workspace">
        <aside className={`hero-editor__left${mobilePanel === 'slides' ? ' is-open' : ''}`}>
          <div className="hero-editor__left-head">
            <h2>Slaytlar</h2>
            <button type="button" className="he-btn he-btn--primary" onClick={openCreate}>
              <Plus size={15} /> Yeni
            </button>
          </div>
          <ul className="hero-editor__slides">
            {orderedSlides.map((slide, index) => (
              <li key={slide.id}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.35rem' }}>
                  <button
                    type="button"
                    className={`hero-editor__slide-card${selectedId === slide.id ? ' is-selected' : ''}`}
                    onClick={() => selectSlide(slide)}
                  >
                    {slide.desktopImageUrl ? (
                      <img src={slide.desktopImageUrl} alt="" className="hero-editor__slide-thumb" />
                    ) : (
                      <div className="hero-editor__slide-thumb hero-editor__slide-thumb--empty">Görsel yok</div>
                    )}
                    <div className="hero-editor__slide-meta">
                      <strong>{slideLabel(slide, index)}</strong>
                      <span className={`hero-editor__badge${slide.isActive ? ' hero-editor__badge--on' : ''}`}>
                        {slide.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                      {settings.displayMode === 'SINGLE' && settings.singleSlideId === slide.id ? (
                        <span className="hero-editor__badge hero-editor__badge--single">Tek görsel</span>
                      ) : null}
                    </div>
                  </button>
                  <div className="hero-editor__slide-tools">
                    <button type="button" className="hero-editor__icon-btn" disabled={index === 0} onClick={() => void moveSlide(slide, -1)} aria-label="Yukarı taşı">
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      className="hero-editor__icon-btn"
                      disabled={index === orderedSlides.length - 1}
                      onClick={() => void moveSlide(slide, 1)}
                      aria-label="Aşağı taşı"
                    >
                      <ArrowDown size={14} />
                    </button>
                    {canDelete ? (
                      <button type="button" className="hero-editor__icon-btn" onClick={() => setDeleteTarget(slide)} aria-label="Sil">
                        <X size={14} />
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
            {editing?.id === 'new' ? (
              <li>
                <button type="button" className="hero-editor__slide-card is-selected" aria-current="true">
                  {draftMeta.desktopImageUrl ? (
                    <img src={draftMeta.desktopImageUrl} alt="" className="hero-editor__slide-thumb" />
                  ) : (
                    <div className="hero-editor__slide-thumb hero-editor__slide-thumb--empty">Yeni</div>
                  )}
                  <div className="hero-editor__slide-meta">
                    <strong>Yeni slayt</strong>
                    <span className="hero-editor__badge">Taslak</span>
                  </div>
                </button>
              </li>
            ) : null}
          </ul>

          <details className="hero-editor__settings">
            <summary>Genel Hero ayarları</summary>
            <div className="hero-editor__settings-body">
              <HeroSegmented
                ariaLabel="Gösterim türü"
                value={settings.displayMode}
                onChange={(value) => void saveSettingsPatch({ displayMode: value })}
                options={[
                  { value: 'SINGLE', label: 'Tek Görsel' },
                  { value: 'CAROUSEL', label: 'Carousel' },
                ]}
              />
              {settings.displayMode === 'SINGLE' ? (
                <HeroSelectField
                  label="Gösterilecek slayt"
                  value={(settings.singleSlideId as string) || ''}
                  options={[
                    { value: '', label: 'İlk aktif slayt' },
                    ...orderedSlides.map((slide) => ({ value: slide.id, label: slideLabel(slide, slide.sortOrder) })),
                  ]}
                  onChange={(value) => void saveSettingsPatch({ singleSlideId: value || null })}
                />
              ) : null}
              <HeroSegmented
                ariaLabel="Genişlik"
                value={settings.widthMode}
                onChange={(value) => void saveSettingsPatch({ widthMode: value })}
                options={[
                  { value: 'FULL', label: 'Tam genişlik' },
                  { value: 'CONTAINED', label: 'Sınırlı' },
                ]}
              />
              {settings.widthMode === 'CONTAINED' ? (
                <HeroSliderField
                  label="Maks. genişlik"
                  value={settings.maxWidthPx}
                  min={HERO_LIMITS.maxWidthPxMin}
                  max={HERO_LIMITS.maxWidthPxMax}
                  suffix="px"
                  onChange={(value) => void saveSettingsPatch({ maxWidthPx: value })}
                />
              ) : null}
              <HeroSelectField
                label="Yükseklik"
                value={settings.heightMode}
                options={[
                  { value: 'AUTO', label: 'Otomatik' },
                  { value: 'FIXED', label: 'Sabit' },
                  { value: 'VIEWPORT', label: 'Tam ekran' },
                ]}
                onChange={(value) => void saveSettingsPatch({ heightMode: value })}
              />
              {settings.heightMode === 'FIXED' ? (
                <>
                  <HeroSliderField
                    label="Masaüstü yükseklik"
                    value={settings.fixedHeightDesktopPx}
                    min={HERO_LIMITS.fixedHeightMin}
                    max={HERO_LIMITS.fixedHeightMax}
                    suffix="px"
                    onChange={(value) => void saveSettingsPatch({ fixedHeightDesktopPx: value })}
                  />
                  <HeroSliderField
                    label="Mobil yükseklik"
                    value={settings.fixedHeightMobilePx}
                    min={HERO_LIMITS.fixedHeightMin}
                    max={HERO_LIMITS.fixedHeightMax}
                    suffix="px"
                    onChange={(value) => void saveSettingsPatch({ fixedHeightMobilePx: value })}
                  />
                </>
              ) : null}
              {settings.displayMode === 'CAROUSEL' ? (
                <>
                  <HeroSwitch label="Otomatik oynatma" checked={settings.autoplay} onChange={(value) => void saveSettingsPatch({ autoplay: value })} />
                  <HeroSliderField
                    label="Geçiş süresi"
                    value={settings.autoplayIntervalSec}
                    min={HERO_LIMITS.autoplayIntervalSecMin}
                    max={HERO_LIMITS.autoplayIntervalSecMax}
                    suffix="sn"
                    onChange={(value) => void saveSettingsPatch({ autoplayIntervalSec: value })}
                  />
                  <HeroSwitch label="Okları göster" checked={settings.showArrows} onChange={(value) => void saveSettingsPatch({ showArrows: value })} />
                  <HeroSwitch label="Noktaları göster" checked={settings.showDots} onChange={(value) => void saveSettingsPatch({ showDots: value })} />
                  <HeroSegmented
                    ariaLabel="Geçiş efekti"
                    value={settings.transitionEffect}
                    onChange={(value) => void saveSettingsPatch({ transitionEffect: value })}
                    options={[
                      { value: 'FADE', label: 'Fade' },
                      { value: 'SLIDE', label: 'Slide' },
                    ]}
                  />
                  <HeroSwitch label="Döngü" checked={settings.loop} onChange={(value) => void saveSettingsPatch({ loop: value })} />
                  <HeroSegmented
                    ariaLabel="Kontrol tonu"
                    value={settings.controlTone}
                    onChange={(value) => void saveSettingsPatch({ controlTone: value })}
                    options={[
                      { value: 'LIGHT', label: 'Açık' },
                      { value: 'DARK', label: 'Koyu' },
                    ]}
                  />
                </>
              ) : null}
            </div>
          </details>
        </aside>

        <section className={`hero-editor__center${mobilePanel === 'preview' ? ' is-open' : ''}`}>
          <div className="hero-editor__preview-bar">
            <strong>
              {previewDevice === 'desktop' ? '1280×720' : previewDevice === 'tablet' ? '768×1024' : '390×844'}
            </strong>
            <div className="hero-editor__preview-controls">
              <button type="button" className={`he-btn${previewDevice === 'desktop' ? ' he-btn--primary' : ''}`} onClick={() => setPreviewDevice('desktop')} aria-label="Masaüstü">
                <Monitor size={15} />
              </button>
              <button type="button" className={`he-btn${previewDevice === 'tablet' ? ' he-btn--primary' : ''}`} onClick={() => setPreviewDevice('tablet')} aria-label="Tablet">
                <Tablet size={15} />
              </button>
              <button type="button" className={`he-btn${previewDevice === 'mobile' ? ' he-btn--primary' : ''}`} onClick={() => setPreviewDevice('mobile')} aria-label="Mobil">
                <Smartphone size={15} />
              </button>
              <button type="button" className={`he-btn${fitPreview ? ' he-btn--primary' : ''}`} onClick={() => setFitPreview((v) => !v)}>
                Alana sığdır
              </button>
              {!fitPreview ? (
                <label className="he-field" style={{ margin: 0, minWidth: '7rem' }}>
                  <span className="he-field__label">Ölçek %{previewScale}</span>
                  <input type="range" min={50} max={100} value={previewScale} onChange={(e) => setPreviewScale(Number(e.target.value))} />
                </label>
              ) : null}
            </div>
          </div>
          <div className="hero-editor__canvas-wrap">
            <div
              className={`hero-editor__canvas hero-editor__canvas--${previewDevice}`}
              style={{ transform: fitPreview ? undefined : `scale(${previewScale / 100})` }}
            >
              {previewHero ? (
                <SiteHero
                  hero={previewHero}
                  previewMode
                  previewViewport={previewDevice}
                />
              ) : (
                <div className="hero-editor__empty-preview">
                  <ImageIcon size={28} />
                  <p>Önizleme için aktif bir slayt ve masaüstü görseli gerekli.</p>
                  <button type="button" className="he-btn he-btn--primary" onClick={() => openMediaPicker('desktop')}>
                    Medya seç
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        <aside className={`hero-editor__right${mobilePanel === 'inspector' ? ' is-open' : ''}`}>
          {!editing ? (
            <div className="hero-editor__empty-preview">
              <p>Düzenlemek için sol listeden bir slayt seçin.</p>
            </div>
          ) : (
            <>
              <HeroAccordion id="visual" title="Görsel" icon={<ImageIcon size={16} />} open={inspector === 'visual'} onToggle={() => setInspector((c) => (c === 'visual' ? null : 'visual'))}>
                <div className="he-card">
                  <p className="he-card__title">Masaüstü görseli *</p>
                  <div className="he-media">
                    {draftMeta.desktopImageUrl ? (
                      <img src={draftMeta.desktopImageUrl} alt="" />
                    ) : (
                      <div className="he-media__empty">Yok</div>
                    )}
                    <div className="he-media__actions">
                      <button type="button" className="he-btn" onClick={() => openMediaPicker('desktop')}>
                        {draftMeta.desktopImageUrl ? 'Değiştir' : 'Medya seç'}
                      </button>
                      {draftMeta.desktopImageUrl ? (
                        <button
                          type="button"
                          className="he-btn"
                          onClick={() => setDraftMeta((c) => ({ ...c, desktopImageUrl: '', desktopImagePathname: null }))}
                        >
                          Kaldır
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="he-card">
                  <p className="he-card__title">Mobil görsel</p>
                  <div className="he-media">
                    {draftMeta.mobileImageUrl ? (
                      <img src={draftMeta.mobileImageUrl} alt="" />
                    ) : (
                      <div className="he-media__empty">Yok</div>
                    )}
                    <div className="he-media__actions">
                      <button type="button" className="he-btn" onClick={() => openMediaPicker('mobile')}>
                        {draftMeta.mobileImageUrl ? 'Değiştir' : 'Medya seç'}
                      </button>
                      {draftMeta.mobileImageUrl ? (
                        <button
                          type="button"
                          className="he-btn"
                          onClick={() => setDraftMeta((c) => ({ ...c, mobileImageUrl: null, mobileImagePathname: null }))}
                        >
                          Kaldır
                        </button>
                      ) : null}
                    </div>
                  </div>
                  {!draftMeta.mobileImageUrl ? (
                    <p className="he-switch__hint">Mobil görsel yoksa masaüstü görseli kullanılacak.</p>
                  ) : null}
                </div>
                <HeroTextField
                  label="Alternatif metin"
                  value={draftMeta.altText}
                  maxLength={HERO_LIMITS.altTextMax}
                  onChange={(value) => setDraftMeta((c) => ({ ...c, altText: value }))}
                />
                <HeroSegmented
                  ariaLabel="Görsel yerleşimi"
                  value={draftMeta.objectFit}
                  onChange={(value) => setDraftMeta((c) => ({ ...c, objectFit: value }))}
                  options={[
                    { value: 'COVER', label: 'Cover' },
                    { value: 'CONTAIN', label: 'Contain' },
                  ]}
                />
                <HeroSwitch label="Aktif" checked={draftMeta.isActive} onChange={(value) => setDraftMeta((c) => ({ ...c, isActive: value }))} />
              </HeroAccordion>

              <HeroAccordion id="content" title="İçerik" icon={<Type size={16} />} open={inspector === 'content'} onToggle={() => setInspector((c) => (c === 'content' ? null : 'content'))}>
                {(['eyebrow', 'title', 'description'] as const).map((key) => {
                  const block = draftContent[key];
                  const label = key === 'eyebrow' ? 'Üst küçük metin' : key === 'title' ? 'Ana başlık' : 'Açıklama';
                  const max =
                    key === 'description' ? HERO_LIMITS.descriptionMax : key === 'title' ? HERO_LIMITS.titleMax : HERO_LIMITS.eyebrowMax;
                  return (
                    <div key={key} className="he-card">
                      <HeroSwitch
                        label={label}
                        checked={block.enabled}
                        onChange={(value) => patchTextBlock(key, { enabled: value })}
                      />
                      {block.enabled ? (
                        <>
                          <HeroTextField
                            label="Metin"
                            value={block.text}
                            maxLength={max}
                            multiline={key === 'description'}
                            onChange={(value) => patchTextBlock(key, { text: value })}
                          />
                          <button type="button" className="he-btn" onClick={() => { setTextTarget(key); setInspector('typography'); }}>
                            Tipografi ayarları
                          </button>
                        </>
                      ) : null}
                    </div>
                  );
                })}
              </HeroAccordion>

              <HeroAccordion id="typography" title="Tipografi" icon={<AlignLeft size={16} />} open={inspector === 'typography'} onToggle={() => setInspector((c) => (c === 'typography' ? null : 'typography'))}>
                <HeroSegmented
                  ariaLabel="Metin öğesi"
                  value={textTarget}
                  onChange={setTextTarget}
                  options={[
                    { value: 'eyebrow', label: 'Üst' },
                    { value: 'title', label: 'Başlık' },
                    { value: 'description', label: 'Açıklama' },
                  ]}
                />
                <HeroSegmented
                  ariaLabel="Hızlı boyut"
                  value={typographyPreset(textTarget, textBlock.fontSizeDesktop, textBlock.fontSizeMobile)}
                  onChange={(value) => {
                    if (value === 'small') {
                      patchTextBlock(textTarget, {
                        fontSizeDesktop: textTarget === 'title' ? 32 : textTarget === 'eyebrow' ? 12 : 14,
                        fontSizeMobile: textTarget === 'title' ? 24 : textTarget === 'eyebrow' ? 11 : 13,
                      });
                    }
                    if (value === 'balanced') {
                      patchTextBlock(textTarget, {
                        fontSizeDesktop: textTarget === 'title' ? 42 : textTarget === 'eyebrow' ? 13 : 17,
                        fontSizeMobile: textTarget === 'title' ? 28 : textTarget === 'eyebrow' ? 12 : 15,
                      });
                    }
                    if (value === 'large') {
                      patchTextBlock(textTarget, {
                        fontSizeDesktop: textTarget === 'title' ? 56 : textTarget === 'eyebrow' ? 15 : 20,
                        fontSizeMobile: textTarget === 'title' ? 34 : textTarget === 'eyebrow' ? 13 : 17,
                      });
                    }
                  }}
                  options={[
                    { value: 'small', label: 'Küçük' },
                    { value: 'balanced', label: 'Dengeli' },
                    { value: 'large', label: 'Büyük' },
                    { value: 'custom', label: 'Özel' },
                  ]}
                />
                <HeroSliderField
                  label="Masaüstü font"
                  value={textBlock.fontSizeDesktop}
                  min={HERO_LIMITS.fontSizeMin}
                  max={HERO_LIMITS.fontSizeMax}
                  suffix="px"
                  onChange={(value) => patchTextBlock(textTarget, { fontSizeDesktop: value })}
                />
                <HeroSliderField
                  label="Mobil font"
                  value={textBlock.fontSizeMobile}
                  min={HERO_LIMITS.fontSizeMin}
                  max={HERO_LIMITS.fontSizeMax}
                  suffix="px"
                  onChange={(value) => patchTextBlock(textTarget, { fontSizeMobile: value })}
                />
                <HeroColorField label="Yazı rengi" value={textBlock.color} onChange={(value) => patchTextBlock(textTarget, { color: value })} />
                <HeroSelectField
                  label="Font ağırlığı"
                  value={String(textBlock.fontWeight) as '400' | '500' | '600' | '700'}
                  options={[
                    { value: '400', label: 'Regular 400' },
                    { value: '500', label: 'Medium 500' },
                    { value: '600', label: 'Semibold 600' },
                    { value: '700', label: 'Bold 700' },
                  ]}
                  onChange={(value) => patchTextBlock(textTarget, { fontWeight: Number(value) as 400 | 500 | 600 | 700 })}
                />
                <HeroSliderField
                  label="Satır yüksekliği"
                  value={textBlock.lineHeight}
                  min={HERO_LIMITS.lineHeightMin}
                  max={HERO_LIMITS.lineHeightMax}
                  step={0.05}
                  suffix=""
                  displayValue={textBlock.lineHeight.toFixed(2)}
                  onChange={(value) => patchTextBlock(textTarget, { lineHeight: value })}
                />
                <HeroSliderField
                  label="Harf aralığı"
                  value={textBlock.letterSpacing}
                  min={HERO_LIMITS.letterSpacingMin}
                  max={HERO_LIMITS.letterSpacingMax}
                  step={0.01}
                  suffix="em"
                  displayValue={`${textBlock.letterSpacing.toFixed(2)}em`}
                  onChange={(value) => patchTextBlock(textTarget, { letterSpacing: value })}
                />
                <div className="he-field">
                  <span className="he-field__label">Metin hizası</span>
                  <HeroAlignPicker value={textBlock.textAlign} onChange={(value) => patchTextBlock(textTarget, { textAlign: value })} />
                </div>
                <HeroSliderField
                  label="Alt boşluk"
                  value={textBlock.marginBottom}
                  min={HERO_LIMITS.spacingMin}
                  max={HERO_LIMITS.spacingMax}
                  suffix="px"
                  onChange={(value) => patchTextBlock(textTarget, { marginBottom: value })}
                />
              </HeroAccordion>

              <HeroAccordion id="layout" title="Yerleşim" icon={<Move size={16} />} open={inspector === 'layout'} onToggle={() => setInspector((c) => (c === 'layout' ? null : 'layout'))}>
                <div className="he-field">
                  <span className="he-field__label">Masaüstü konum</span>
                  <HeroPositionPicker value={draftContent.positionDesktop} onChange={(value) => patchContent('positionDesktop', value)} />
                </div>
                <HeroSliderField
                  label="Yatay ince ayar"
                  value={draftContent.offsetXPercent}
                  min={HERO_LIMITS.offsetMin}
                  max={HERO_LIMITS.offsetMax}
                  suffix="%"
                  displayValue={`${draftContent.offsetXPercent > 0 ? '+' : ''}${draftContent.offsetXPercent}%`}
                  onChange={(value) => patchContent('offsetXPercent', value)}
                />
                <HeroSliderField
                  label="Dikey ince ayar"
                  value={draftContent.offsetYPercent}
                  min={HERO_LIMITS.offsetMin}
                  max={HERO_LIMITS.offsetMax}
                  suffix="%"
                  displayValue={`${draftContent.offsetYPercent > 0 ? '+' : ''}${draftContent.offsetYPercent}%`}
                  onChange={(value) => patchContent('offsetYPercent', value)}
                />
                <HeroSliderField
                  label="İçerik max genişlik"
                  value={draftContent.maxWidthPx}
                  min={HERO_LIMITS.contentMaxWidthMin}
                  max={HERO_LIMITS.contentMaxWidthMax}
                  suffix="px"
                  onChange={(value) => patchContent('maxWidthPx', value)}
                />
                <HeroSliderField
                  label="İç boşluk"
                  value={draftContent.paddingPx}
                  min={HERO_LIMITS.contentPaddingMin}
                  max={HERO_LIMITS.contentPaddingMax}
                  suffix="px"
                  onChange={(value) => patchContent('paddingPx', value)}
                />
                <div className="he-field">
                  <span className="he-field__label">Genel metin hizası</span>
                  <HeroAlignPicker value={draftContent.textAlign} onChange={(value) => patchContent('textAlign', value)} />
                </div>
              </HeroAccordion>

              <HeroAccordion id="readability" title="Okunabilirlik" icon={<Palette size={16} />} open={inspector === 'readability'} onToggle={() => setInspector((c) => (c === 'readability' ? null : 'readability'))}>
                <HeroSwitch label="Overlay" checked={draftContent.overlayEnabled} onChange={(value) => patchContent('overlayEnabled', value)} />
                {draftContent.overlayEnabled ? (
                  <>
                    <HeroSegmented
                      ariaLabel="Overlay modu"
                      value={draftContent.overlayMode}
                      onChange={(value) => patchContent('overlayMode', value)}
                      options={[
                        { value: 'SOLID', label: 'Düz renk' },
                        { value: 'GRADIENT', label: 'Gradient' },
                      ]}
                    />
                    <HeroColorField label="Overlay rengi" value={draftContent.overlayColor} onChange={(value) => patchContent('overlayColor', value)} />
                    <HeroSliderField
                      label="Opaklık"
                      value={Math.round(draftContent.overlayOpacity * 100)}
                      min={0}
                      max={100}
                      suffix="%"
                      displayValue={`%${Math.round(draftContent.overlayOpacity * 100)}`}
                      onChange={(value) => patchContent('overlayOpacity', value / 100)}
                    />
                    {draftContent.overlayMode === 'GRADIENT' ? (
                      <HeroSegmented
                        ariaLabel="Gradient yönü"
                        value={draftContent.overlayGradientDirection}
                        onChange={(value) => patchContent('overlayGradientDirection', value)}
                        options={[
                          { value: 'TO_RIGHT', label: '→' },
                          { value: 'TO_LEFT', label: '←' },
                          { value: 'TO_BOTTOM', label: '↓' },
                          { value: 'TO_TOP', label: '↑' },
                          { value: 'TO_BOTTOM_RIGHT', label: '↘' },
                          { value: 'TO_BOTTOM_LEFT', label: '↙' },
                        ]}
                      />
                    ) : null}
                  </>
                ) : null}
                <HeroSwitch label="Metin gölgesi" checked={draftContent.textShadow} onChange={(value) => patchContent('textShadow', value)} />
                <HeroSwitch label="İçerik paneli" checked={draftContent.panelEnabled} onChange={(value) => patchContent('panelEnabled', value)} />
                {draftContent.panelEnabled ? (
                  <>
                    <HeroColorField label="Panel rengi" value={draftContent.panelColor} onChange={(value) => patchContent('panelColor', value)} />
                    <HeroSliderField
                      label="Panel opaklığı"
                      value={Math.round(draftContent.panelOpacity * 100)}
                      min={0}
                      max={100}
                      suffix="%"
                      displayValue={`%${Math.round(draftContent.panelOpacity * 100)}`}
                      onChange={(value) => patchContent('panelOpacity', value / 100)}
                    />
                    <HeroSliderField
                      label="Köşe yuvarlaklığı"
                      value={draftContent.panelRadius}
                      min={HERO_LIMITS.radiusMin}
                      max={HERO_LIMITS.radiusMax}
                      suffix="px"
                      onChange={(value) => patchContent('panelRadius', value)}
                    />
                    <HeroSliderField
                      label="Panel iç boşluk"
                      value={draftContent.panelPadding}
                      min={HERO_LIMITS.contentPaddingMin}
                      max={HERO_LIMITS.contentPaddingMax}
                      suffix="px"
                      onChange={(value) => patchContent('panelPadding', value)}
                    />
                  </>
                ) : null}
              </HeroAccordion>

              <HeroAccordion id="buttons" title="Butonlar" icon={<SquareMousePointer size={16} />} open={inspector === 'buttons'} onToggle={() => setInspector((c) => (c === 'buttons' ? null : 'buttons'))}>
                {(['primaryButton', 'secondaryButton'] as const).map((key) => {
                  const button = draftContent[key];
                  const err = key === 'primaryButton' ? buttonErrors.primary : buttonErrors.secondary;
                  return (
                    <div key={key} className="he-card">
                      <HeroSwitch
                        label={key === 'primaryButton' ? 'Birinci buton' : 'İkinci buton'}
                        checked={button.enabled}
                        onChange={(value) => patchButton(key, { enabled: value })}
                      />
                      {button.enabled ? (
                        <>
                          <p className="he-card__title">İçerik ve bağlantı</p>
                          <HeroTextField label="Etiket" value={button.label} maxLength={HERO_LIMITS.buttonLabelMax} onChange={(value) => patchButton(key, { label: value })} />
                          <HeroTextField label="Link" value={button.href} error={err} onChange={(value) => patchButton(key, { href: value })} />
                          <HeroSwitch label="Yeni sekmede aç" checked={button.openInNewTab} onChange={(value) => patchButton(key, { openInNewTab: value })} />
                          <p className="he-card__title">Normal görünüm</p>
                          <HeroSegmented
                            ariaLabel="Buton stili"
                            value={button.variant}
                            onChange={(value) => patchButton(key, { variant: value })}
                            options={[
                              { value: 'SOLID', label: 'Dolu' },
                              { value: 'OUTLINE', label: 'Çerçeveli' },
                            ]}
                          />
                          <HeroColorField label="Yazı rengi" value={button.textColor} onChange={(value) => patchButton(key, { textColor: value })} />
                          <HeroColorField
                            label="Arka plan"
                            value={button.backgroundColor.startsWith('#') ? button.backgroundColor : '#1f4e79'}
                            onChange={(value) => patchButton(key, { backgroundColor: value })}
                          />
                          <p className="he-card__title">Hover görünümü</p>
                          <HeroColorField label="Hover yazı" value={button.hoverTextColor} onChange={(value) => patchButton(key, { hoverTextColor: value })} />
                          <HeroColorField
                            label="Hover arka plan"
                            value={button.hoverBackgroundColor.startsWith('#') ? button.hoverBackgroundColor.slice(0, 7) : '#183d5f'}
                            onChange={(value) => patchButton(key, { hoverBackgroundColor: value })}
                          />
                          <p className="he-card__title">Ölçü ve köşe</p>
                          <HeroColorField label="Kenarlık rengi" value={button.borderColor} onChange={(value) => patchButton(key, { borderColor: value })} />
                          <HeroSliderField label="Kenarlık" value={button.borderWidth} min={0} max={6} suffix="px" onChange={(value) => patchButton(key, { borderWidth: value })} />
                          <HeroSliderField label="Köşe" value={button.borderRadius} min={0} max={48} suffix="px" onChange={(value) => patchButton(key, { borderRadius: value })} />
                          <HeroSliderField label="Yatay boşluk" value={button.paddingX} min={8} max={64} suffix="px" onChange={(value) => patchButton(key, { paddingX: value })} />
                          <HeroSliderField label="Dikey boşluk" value={button.paddingY} min={4} max={32} suffix="px" onChange={(value) => patchButton(key, { paddingY: value })} />
                          <HeroSliderField
                            label="Font boyutu"
                            value={button.fontSizeDesktop}
                            min={HERO_LIMITS.fontSizeMin}
                            max={HERO_LIMITS.fontSizeMax}
                            suffix="px"
                            onChange={(value) => patchButton(key, { fontSizeDesktop: value })}
                          />
                          <HeroSelectField
                            label="Font ağırlığı"
                            value={String(button.fontWeight) as '400' | '500' | '600' | '700'}
                            options={[
                              { value: '400', label: 'Regular 400' },
                              { value: '500', label: 'Medium 500' },
                              { value: '600', label: 'Semibold 600' },
                              { value: '700', label: 'Bold 700' },
                            ]}
                            onChange={(value) => patchButton(key, { fontWeight: Number(value) as 400 | 500 | 600 | 700 })}
                          />
                          <p className="he-card__title">Mobil görünüm</p>
                          <HeroSliderField
                            label="Mobil font"
                            value={button.fontSizeMobile}
                            min={HERO_LIMITS.fontSizeMin}
                            max={HERO_LIMITS.fontSizeMax}
                            suffix="px"
                            onChange={(value) => patchButton(key, { fontSizeMobile: value })}
                          />
                          <div
                            className="he-btn-preview"
                            style={{
                              color: button.textColor,
                              background: button.backgroundColor,
                              border: `${button.borderWidth}px solid ${button.borderColor}`,
                              borderRadius: button.borderRadius,
                              padding: `${button.paddingY}px ${button.paddingX}px`,
                              fontSize: button.fontSizeDesktop,
                              fontWeight: button.fontWeight,
                            }}
                          >
                            {button.label || 'Örnek'}
                          </div>
                        </>
                      ) : null}
                    </div>
                  );
                })}
                <div className="he-card">
                  <p className="he-card__title">Buton grubu</p>
                  <HeroSegmented
                    ariaLabel="Dizilim"
                    value={draftContent.buttonLayout}
                    onChange={(value) => patchContent('buttonLayout', value)}
                    options={[
                      { value: 'ROW', label: 'Yatay' },
                      { value: 'COLUMN', label: 'Dikey' },
                    ]}
                  />
                  <div className="he-field">
                    <span className="he-field__label">Masaüstü hizalama</span>
                    <HeroAlignPicker value={draftContent.buttonAlignDesktop} onChange={(value) => patchContent('buttonAlignDesktop', value)} />
                  </div>
                  <HeroSliderField label="Buton aralığı" value={draftContent.buttonGap} min={0} max={96} suffix="px" onChange={(value) => patchContent('buttonGap', value)} />
                  <HeroSliderField label="Üst boşluk" value={draftContent.buttonMarginTop} min={0} max={96} suffix="px" onChange={(value) => patchContent('buttonMarginTop', value)} />
                </div>
              </HeroAccordion>

              <HeroAccordion id="mobile" title="Mobil" icon={<Smartphone size={16} />} open={inspector === 'mobile'} onToggle={() => setInspector((c) => (c === 'mobile' ? null : 'mobile'))}>
                <HeroSwitch
                  label="Masaüstü konumunu kullan"
                  checked={useDesktopPositionOnMobile}
                  onChange={(value) => {
                    setUseDesktopPositionOnMobile(value);
                    if (value) patchContent('positionMobile', draftContent.positionDesktop);
                  }}
                />
                {!useDesktopPositionOnMobile ? (
                  <div className="he-field">
                    <span className="he-field__label">Mobil konum</span>
                    <HeroPositionPicker value={draftContent.positionMobile} onChange={(value) => patchContent('positionMobile', value)} />
                  </div>
                ) : null}
                <div className="he-field">
                  <span className="he-field__label">Mobil buton hizası</span>
                  <HeroAlignPicker value={draftContent.buttonAlignMobile} onChange={(value) => patchContent('buttonAlignMobile', value)} />
                </div>
                <HeroSwitch
                  label="Mobilde tam genişlik buton"
                  checked={draftContent.buttonsFullWidthMobile}
                  onChange={(value) => patchContent('buttonsFullWidthMobile', value)}
                />
              </HeroAccordion>

              <HeroAccordion id="advanced" title="Gelişmiş" icon={<Settings2 size={16} />} open={inspector === 'advanced'} onToggle={() => setInspector((c) => (c === 'advanced' ? null : 'advanced'))}>
                <p className="he-switch__hint">Gelişmiş alanlar içerik, tipografi ve yerleşim panellerinde yönetilir. Public render kuralları SiteHero ile ortaktır.</p>
                <HeroSelectField
                  label="Başlık seviyesi"
                  value={String(draftContent.title.headingLevel) as '1' | '2' | '3'}
                  options={[
                    { value: '1', label: 'H1' },
                    { value: '2', label: 'H2' },
                    { value: '3', label: 'H3' },
                  ]}
                  onChange={(value) => patchTextBlock('title', { headingLevel: Number(value) as 1 | 2 | 3 })}
                />
              </HeroAccordion>
            </>
          )}
        </aside>
      </div>

      <AdminConfirmDialog
        open={pendingLeave === 'discard'}
        title="Değişiklikler iptal edilsin mi?"
        description="Kaydedilmemiş düzenlemeler kaybolacak."
        confirmLabel="İptal et"
        cancelLabel="Vazgeç"
        onCancel={() => setPendingLeave(null)}
        onConfirm={() => {
          discardChanges();
          setPendingLeave(null);
        }}
      />

      <AdminConfirmDialog
        open={pendingLeave === 'back'}
        title="Kaydedilmemiş değişiklikler"
        description="Kaydedilmemiş değişiklikleriniz var. Sayfadan ayrılmak istiyor musunuz?"
        confirmLabel="Ayrıl"
        cancelLabel="Vazgeç"
        onCancel={() => setPendingLeave(null)}
        onConfirm={() => {
          setPendingLeave(null);
          router.push('/admin');
        }}
      />

      <AdminConfirmDialog
        open={deleteTarget != null}
        title="Slayt silinsin mi?"
        description="Bu işlem geri alınamaz."
        confirmLabel="Sil"
        cancelLabel="Vazgeç"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />

      <ProductCategoryMediaPicker
        open={mediaTarget != null}
        selectedId={null}
        description={
          mediaTarget === 'mobile'
            ? 'Mobil görsel için bir görsel seçin. Onaylanana kadar form değeri değişmez.'
            : 'Masaüstü görseli için bir görsel seçin. Onaylanana kadar form değeri değişmez.'
        }
        onClose={closeMediaPicker}
        onSelect={(asset) => {
          applySelectedMedia(asset);
        }}
      />
    </div>
  );
}
