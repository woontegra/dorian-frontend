'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SiteSettings, SiteSettingsImageType } from '@kurumsal/shared';
import { AdminConfirmDialog } from '@/components/admin/common/AdminConfirmDialog';
import { AdminInlineNotice } from '@/components/admin/common/AdminInlineNotice';
import { BrandSettingsForm } from '@/components/admin/site-settings/forms/BrandSettingsForm';
import { ContactSettingsForm } from '@/components/admin/site-settings/forms/ContactSettingsForm';
import { GeneralSettingsForm } from '@/components/admin/site-settings/forms/GeneralSettingsForm';
import { SeoSettingsForm } from '@/components/admin/site-settings/forms/SeoSettingsForm';
import { SocialSettingsForm } from '@/components/admin/site-settings/forms/SocialSettingsForm';
import { SettingsLayout } from '@/components/admin/site-settings/SettingsLayout';
import { SettingsNavigation } from '@/components/admin/site-settings/SettingsNavigation';
import { SettingsPageHeader } from '@/components/admin/site-settings/SettingsPageHeader';
import { isValidSettingsTab, type SettingsTabId } from '@/components/admin/site-settings/settings-tabs';
import { useAdminSession } from '@/components/admin/session/AdminSessionProvider';
import { AdminApiError } from '@/lib/auth/types';
import {
  deleteSiteSettingsImage,
  fetchSiteSettings,
  isUnauthorizedError,
  updateSiteSettings,
  uploadSiteSettingsImage,
} from '@/lib/site-settings/api';
import {
  siteSettingsFormSchema,
  toFormValues,
  toUpdatePayload,
  type SiteSettingsFormValues,
} from '@/lib/site-settings/schema';
import { useBeforeUnloadWarning } from '@/lib/site-settings/use-unsaved-changes';

type Notice = { tone: 'success' | 'error' | 'info'; message: string } | null;

type PendingUpload = {
  file: File;
  previewUrl: string;
};

function serializeForm(values: SiteSettingsFormValues): string {
  return JSON.stringify(values);
}

export function SiteSettingsPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { admin } = useAdminSession();
  const readOnly = admin.role !== 'ADMIN';

  const tabParam = searchParams.get('tab');
  const activeTab: SettingsTabId = isValidSettingsTab(tabParam) ? tabParam : 'general';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [values, setValues] = useState<SiteSettingsFormValues | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [pendingUploads, setPendingUploads] = useState<Partial<Record<SiteSettingsImageType, PendingUpload>>>({});
  const [uploadingType, setUploadingType] = useState<SiteSettingsImageType | null>(null);
  const [confirmState, setConfirmState] = useState<
    | { kind: 'delete-image'; type: SiteSettingsImageType }
    | { kind: 'leave-page'; href: string }
    | null
  >(null);

  const isDirty = values ? serializeForm(values) !== savedSnapshot : false;

  useBeforeUnloadWarning(isDirty && !readOnly);

  const setTab = useCallback(
    (tabId: SettingsTabId) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', tabId);
      router.replace(`/admin/settings?${params.toString()}`);
    },
    [router, searchParams],
  );

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchSiteSettings();
      const formValues = toFormValues(data);
      setSettings(data);
      setValues(formValues);
      setSavedSnapshot(serializeForm(formValues));
    } catch (loadError) {
      if (isUnauthorizedError(loadError)) {
        router.replace('/admin/login');
        return;
      }
      setError(
        loadError instanceof AdminApiError
          ? loadError.message
          : 'Site ayarları yüklenemedi.',
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadSettings();
  }, []);

  useEffect(() => {
    if (!isDirty || readOnly) {
      return;
    }

    function handleClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }

      const nextPath = new URL(anchor.href, window.location.origin).pathname;
      if (nextPath === window.location.pathname) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setConfirmState({ kind: 'leave-page', href: anchor.href });
    }

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [isDirty, readOnly]);

  function updateField<K extends keyof SiteSettingsFormValues>(key: K, value: SiteSettingsFormValues[K]) {
    setValues((current) => (current ? { ...current, [key]: value } : current));
    setFieldErrors((current) => {
      if (!current[key]) {
        return current;
      }
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  async function handleSave() {
    if (!values || readOnly || saving) {
      return;
    }

    const parsed = siteSettingsFormSchema.safeParse(values);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === 'string' && !nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      setNotice({ tone: 'error', message: 'Lütfen formdaki hatalı alanları düzeltin.' });
      return;
    }

    setSaving(true);
    setNotice(null);
    setFieldErrors({});

    try {
      const updated = await updateSiteSettings(toUpdatePayload(parsed.data));
      const nextValues = toFormValues(updated);
      setSettings(updated);
      setValues(nextValues);
      setSavedSnapshot(serializeForm(nextValues));
      setNotice({ tone: 'success', message: 'Site ayarları başarıyla kaydedildi.' });
    } catch (saveError) {
      if (isUnauthorizedError(saveError)) {
        router.replace('/admin/login');
        return;
      }
      setNotice({
        tone: 'error',
        message:
          saveError instanceof AdminApiError
            ? saveError.message
            : 'Kaydetme sırasında bir hata oluştu.',
      });
    } finally {
      setSaving(false);
    }
  }

  function handleSelectFile(type: SiteSettingsImageType, file: File) {
    const previewUrl = URL.createObjectURL(file);
    setPendingUploads((current) => {
      const previous = current[type];
      if (previous) {
        URL.revokeObjectURL(previous.previewUrl);
      }
      return { ...current, [type]: { file, previewUrl } };
    });
  }

  async function handleUpload(type: SiteSettingsImageType) {
    const pending = pendingUploads[type];
    if (!pending || readOnly) {
      return;
    }

    setUploadingType(type);
    setNotice(null);

    try {
      const result = await uploadSiteSettingsImage(type, pending.file);
      setSettings((current) => {
        if (!current) {
          return current;
        }
        const next = { ...current };
        if (type === 'logo') {
          next.logoUrl = result.url;
          next.logoPathname = result.pathname;
        } else if (type === 'darkLogo') {
          next.darkLogoUrl = result.url;
          next.darkLogoPathname = result.pathname;
        } else if (type === 'favicon') {
          next.faviconUrl = result.url;
          next.faviconPathname = result.pathname;
        } else {
          next.defaultOgImageUrl = result.url;
          next.defaultOgImagePathname = result.pathname;
        }
        return next;
      });
      URL.revokeObjectURL(pending.previewUrl);
      setPendingUploads((current) => {
        const next = { ...current };
        delete next[type];
        return next;
      });
      setNotice({ tone: 'success', message: 'Görsel başarıyla yüklendi.' });
    } catch (uploadError) {
      setNotice({
        tone: 'error',
        message:
          uploadError instanceof AdminApiError
            ? uploadError.message
            : 'Görsel yüklenemedi.',
      });
    } finally {
      setUploadingType(null);
    }
  }

  async function handleDeleteImage(type: SiteSettingsImageType) {
    setUploadingType(type);
    setNotice(null);

    try {
      const updated = await deleteSiteSettingsImage(type);
      setSettings(updated);
      setNotice({ tone: 'success', message: 'Görsel kaldırıldı.' });
    } catch (deleteError) {
      setNotice({
        tone: 'error',
        message:
          deleteError instanceof AdminApiError
            ? deleteError.message
            : 'Görsel kaldırılamadı.',
      });
    } finally {
      setUploadingType(null);
      setConfirmState(null);
    }
  }

  const imageUrls = useMemo(
    () =>
      settings
        ? {
            logo: settings.logoUrl,
            darkLogo: settings.darkLogoUrl,
            favicon: settings.faviconUrl,
            defaultOgImage: settings.defaultOgImageUrl,
          }
        : {
            logo: null,
            darkLogo: null,
            favicon: null,
            defaultOgImage: null,
          },
    [settings],
  );

  const pendingUploadPreviews = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(pendingUploads).map(([type, pending]) => [
          type,
          pending ? { previewUrl: pending.previewUrl, fileName: pending.file.name } : undefined,
        ]),
      ) as Partial<Record<SiteSettingsImageType, { previewUrl: string; fileName: string }>>,
    [pendingUploads],
  );

  const formProps = {
    values: values!,
    fieldErrors,
    readOnly,
    onFieldChange: updateField,
  };

  if (loading) {
    return <p className="admin-status" role="status">Site ayarları yükleniyor…</p>;
  }

  if (error || !values || !settings) {
    return (
      <div className="admin-settings-page">
        <AdminInlineNotice tone="error" message={error ?? 'Site ayarları yüklenemedi.'} />
        <button type="button" className="admin-button admin-button-secondary" onClick={() => void loadSettings()}>
          Tekrar Dene
        </button>
      </div>
    );
  }

  const tabContent =
    activeTab === 'general' ? (
      <GeneralSettingsForm {...formProps} />
    ) : activeTab === 'brand' ? (
      <BrandSettingsForm
        {...formProps}
        imageUrls={imageUrls}
        pendingUploads={pendingUploadPreviews}
        uploadingType={uploadingType}
        onSelectFile={handleSelectFile}
        onUpload={(type) => void handleUpload(type)}
        onRemove={(type) => setConfirmState({ kind: 'delete-image', type })}
      />
    ) : activeTab === 'contact' ? (
      <ContactSettingsForm {...formProps} />
    ) : activeTab === 'social' ? (
      <SocialSettingsForm {...formProps} />
    ) : (
      <SeoSettingsForm {...formProps} ogImageUrl={settings.defaultOgImageUrl} />
    );

  return (
    <>
      <SettingsLayout
        header={
          <SettingsPageHeader
            readOnly={readOnly}
            isDirty={isDirty}
            saving={saving}
            notice={notice}
            onSave={() => void handleSave()}
          />
        }
        navigation={<SettingsNavigation activeTab={activeTab} onTabChange={setTab} />}
        content={tabContent}
      />

      <AdminConfirmDialog
        open={confirmState?.kind === 'delete-image'}
        title="Görseli kaldır"
        description="Bu görseli kaldırmak istediğinize emin misiniz? Bu işlem geri alınamaz."
        confirmLabel="Kaldır"
        onCancel={() => setConfirmState(null)}
        onConfirm={() => {
          if (confirmState?.kind === 'delete-image') {
            void handleDeleteImage(confirmState.type);
          }
        }}
      />

      <AdminConfirmDialog
        open={confirmState?.kind === 'leave-page'}
        title="Kaydedilmemiş değişiklikler"
        description="Kaydedilmemiş değişiklikleriniz var. Sayfadan ayrılmak istiyor musunuz?"
        confirmLabel="Ayrıl"
        onCancel={() => setConfirmState(null)}
        onConfirm={() => {
          if (confirmState?.kind === 'leave-page') {
            window.location.href = confirmState.href;
          }
        }}
      />
    </>
  );
}
