'use client';

import { SettingsFormField } from '@/components/admin/site-settings/SettingsFormField';
import { SettingsSectionCard } from '@/components/admin/site-settings/SettingsSectionCard';
import type { SiteSettingsFormBaseProps } from '@/components/admin/site-settings/types';

export function GeneralSettingsForm({
  values,
  fieldErrors,
  readOnly,
  onFieldChange,
}: SiteSettingsFormBaseProps) {
  const inputClass = `admin-settings-input${readOnly ? ' admin-settings-input--readonly' : ''}`;

  return (
    <div className="admin-settings-stack">
      <SettingsSectionCard
        title="Kurumsal Kimlik"
        description="Sitenizin genel tanıtım bilgilerini düzenleyin."
      >
        <div className="admin-settings-form-grid admin-settings-form-grid--2">
          <SettingsFormField label="Site Adı" htmlFor="siteName" required error={fieldErrors.siteName}>
            <input
              id="siteName"
              className={inputClass}
              value={values.siteName}
              disabled={readOnly}
              onChange={(event) => onFieldChange('siteName', event.target.value)}
            />
          </SettingsFormField>
          <SettingsFormField label="Yasal Unvan" htmlFor="legalName">
            <input
              id="legalName"
              className={inputClass}
              value={values.legalName}
              disabled={readOnly}
              onChange={(event) => onFieldChange('legalName', event.target.value)}
            />
          </SettingsFormField>
          <SettingsFormField label="Slogan" htmlFor="slogan" fullWidth>
            <input
              id="slogan"
              className={inputClass}
              value={values.slogan}
              disabled={readOnly}
              onChange={(event) => onFieldChange('slogan', event.target.value)}
            />
          </SettingsFormField>
          <SettingsFormField label="Kısa Açıklama" htmlFor="shortDescription" fullWidth>
            <textarea
              id="shortDescription"
              className={`${inputClass} admin-settings-textarea admin-settings-textarea--tall`}
              rows={4}
              value={values.shortDescription}
              disabled={readOnly}
              onChange={(event) => onFieldChange('shortDescription', event.target.value)}
            />
          </SettingsFormField>
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Resmî Bilgiler"
        description="Vergi ve kuruluş bilgilerinizi yönetin."
      >
        <div className="admin-settings-form-grid admin-settings-form-grid--3">
          <SettingsFormField label="Kuruluş Yılı" htmlFor="foundedYear" error={fieldErrors.foundedYear}>
            <input
              id="foundedYear"
              className={inputClass}
              inputMode="numeric"
              value={values.foundedYear}
              disabled={readOnly}
              onChange={(event) => onFieldChange('foundedYear', event.target.value)}
            />
          </SettingsFormField>
          <SettingsFormField label="Vergi Dairesi" htmlFor="taxOffice">
            <input
              id="taxOffice"
              className={inputClass}
              value={values.taxOffice}
              disabled={readOnly}
              onChange={(event) => onFieldChange('taxOffice', event.target.value)}
            />
          </SettingsFormField>
          <SettingsFormField label="Vergi Numarası" htmlFor="taxNumber">
            <input
              id="taxNumber"
              className={inputClass}
              value={values.taxNumber}
              disabled={readOnly}
              onChange={(event) => onFieldChange('taxNumber', event.target.value)}
            />
          </SettingsFormField>
        </div>
      </SettingsSectionCard>
    </div>
  );
}
