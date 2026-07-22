'use client';

import { SITE_SETTINGS_LIMITS } from '@kurumsal/shared';
import type { SiteSettingsFormValues } from '@/lib/site-settings/schema';

type SiteSettingsSeoPreviewProps = {
  values: SiteSettingsFormValues;
  siteUrl: string | null;
  ogImageUrl: string | null;
};

export function SiteSettingsSeoPreview({ values, siteUrl, ogImageUrl }: SiteSettingsSeoPreviewProps) {
  const siteLabel = values.siteName || 'Site Adı';
  const titleTemplate = values.titleTemplate || '%s | Firma Adı';
  const pageTitle = values.defaultSeoTitle || siteLabel;
  const previewTitle = titleTemplate.includes('%s')
    ? titleTemplate.replace('%s', pageTitle)
    : pageTitle;
  const description =
    values.defaultMetaDescription ||
    'Meta açıklama burada görünecek. Bu yalnızca yaklaşık bir önizlemedir.';
  const displayUrl = siteUrl || values.siteUrl || 'www.ornek-site.com';

  return (
    <section className="admin-settings-seo-preview" aria-label="Arama sonucu önizlemesi">
      <h3 className="admin-settings-seo-preview__title">Arama Sonucu Önizlemesi</h3>
      <p className="admin-settings-seo-preview__note">
        Bu önizleme yalnızca yaklaşık bir görünüm sunar; gerçek Google sonucu garantisi değildir.
      </p>
      <div className="admin-settings-seo-preview__card">
        <p className="admin-settings-seo-preview__url">{displayUrl}</p>
        <p className="admin-settings-seo-preview__result-title">{previewTitle}</p>
        <p className="admin-settings-seo-preview__description">{description}</p>
        {ogImageUrl ? (
          <img src={ogImageUrl} alt="" className="admin-settings-seo-preview__image" />
        ) : null}
      </div>
      <div className="admin-settings-seo-counters">
        <div className="admin-settings-seo-counter">
          <span className="admin-settings-seo-counter__label">SEO başlığı</span>
          <span className="admin-settings-seo-counter__value">
            {(values.defaultSeoTitle ?? '').length}/{SITE_SETTINGS_LIMITS.seoTitleMax}
          </span>
        </div>
        <div className="admin-settings-seo-counter">
          <span className="admin-settings-seo-counter__label">Meta açıklama</span>
          <span className="admin-settings-seo-counter__value">
            {(values.defaultMetaDescription ?? '').length}/{SITE_SETTINGS_LIMITS.metaDescriptionMax}
          </span>
        </div>
      </div>
    </section>
  );
}
