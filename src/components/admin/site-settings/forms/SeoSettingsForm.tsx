'use client';

import { SettingsFormField } from '@/components/admin/site-settings/SettingsFormField';
import { SettingsSectionCard } from '@/components/admin/site-settings/SettingsSectionCard';
import { SeoChecklist } from '@/components/admin/site-settings/SeoChecklist';
import { SiteSettingsSeoPreview } from '@/components/admin/site-settings/SiteSettingsSeoPreview';
import type { SiteSettingsFormBaseProps } from '@/components/admin/site-settings/types';

type SeoSettingsFormProps = SiteSettingsFormBaseProps & {
  ogImageUrl: string | null;
};

export function SeoSettingsForm({
  values,
  fieldErrors,
  readOnly,
  onFieldChange,
  ogImageUrl,
}: SeoSettingsFormProps) {
  const inputClass = `admin-settings-input${readOnly ? ' admin-settings-input--readonly' : ''}`;

  return (
    <div className="admin-settings-seo-layout">
      <div className="admin-settings-seo-main">
        <SettingsSectionCard
          title="Genel SEO Ayarları"
          description="Arama motorları ve analitik araçları için temel yapılandırma."
        >
          <div className="admin-settings-form-grid admin-settings-form-grid--2">
            <SettingsFormField label="Site URL" htmlFor="siteUrl" error={fieldErrors.siteUrl} fullWidth>
              <input
                id="siteUrl"
                className={inputClass}
                value={values.siteUrl}
                disabled={readOnly}
                placeholder="https://ornek-site.com"
                onChange={(event) => onFieldChange('siteUrl', event.target.value)}
              />
            </SettingsFormField>
            <SettingsFormField
              label="Varsayılan SEO Başlığı"
              htmlFor="defaultSeoTitle"
              error={fieldErrors.defaultSeoTitle}
              fullWidth
            >
              <input
                id="defaultSeoTitle"
                className={inputClass}
                value={values.defaultSeoTitle}
                disabled={readOnly}
                onChange={(event) => onFieldChange('defaultSeoTitle', event.target.value)}
              />
            </SettingsFormField>
            <SettingsFormField
              label="Başlık Şablonu"
              htmlFor="titleTemplate"
              hint="Örnek: %s | Firma Adı"
              fullWidth
            >
              <input
                id="titleTemplate"
                className={inputClass}
                value={values.titleTemplate}
                disabled={readOnly}
                placeholder="%s | Firma Adı"
                onChange={(event) => onFieldChange('titleTemplate', event.target.value)}
              />
            </SettingsFormField>
            <SettingsFormField label="Varsayılan Meta Açıklama" htmlFor="defaultMetaDescription" fullWidth>
              <textarea
                id="defaultMetaDescription"
                className={`${inputClass} admin-settings-textarea admin-settings-textarea--tall`}
                rows={4}
                value={values.defaultMetaDescription}
                disabled={readOnly}
                onChange={(event) => onFieldChange('defaultMetaDescription', event.target.value)}
              />
            </SettingsFormField>
            <SettingsFormField
              label="Google Site Verification"
              htmlFor="googleSiteVerification"
              hint="Yalnızca meta etiketindeki content değerini girin."
            >
              <input
                id="googleSiteVerification"
                className={inputClass}
                value={values.googleSiteVerification}
                disabled={readOnly}
                onChange={(event) => onFieldChange('googleSiteVerification', event.target.value)}
              />
            </SettingsFormField>
            <SettingsFormField
              label="Bing Site Verification"
              htmlFor="bingSiteVerification"
              hint="Yalnızca meta etiketindeki content değerini girin."
            >
              <input
                id="bingSiteVerification"
                className={inputClass}
                value={values.bingSiteVerification}
                disabled={readOnly}
                onChange={(event) => onFieldChange('bingSiteVerification', event.target.value)}
              />
            </SettingsFormField>
            <SettingsFormField
              label="Google Analytics ID"
              htmlFor="googleAnalyticsId"
              hint="Ölçüm kimliği; script enjekte edilmez."
            >
              <input
                id="googleAnalyticsId"
                className={inputClass}
                value={values.googleAnalyticsId}
                disabled={readOnly}
                placeholder="G-XXXXXXXXXX"
                onChange={(event) => onFieldChange('googleAnalyticsId', event.target.value)}
              />
            </SettingsFormField>
            <SettingsFormField
              label="Google Tag Manager ID"
              htmlFor="googleTagManagerId"
              hint="Konteyner kimliği; script enjekte edilmez."
            >
              <input
                id="googleTagManagerId"
                className={inputClass}
                value={values.googleTagManagerId}
                disabled={readOnly}
                placeholder="GTM-XXXXXXX"
                onChange={(event) => onFieldChange('googleTagManagerId', event.target.value)}
              />
            </SettingsFormField>
          </div>
        </SettingsSectionCard>
      </div>

      <aside className="admin-settings-seo-aside">
        <SiteSettingsSeoPreview values={values} siteUrl={values.siteUrl || null} ogImageUrl={ogImageUrl} />
        <SeoChecklist values={values} ogImageUrl={ogImageUrl} />
      </aside>
    </div>
  );
}
