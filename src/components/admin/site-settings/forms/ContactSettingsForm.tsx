'use client';

import { SettingsFormField } from '@/components/admin/site-settings/SettingsFormField';
import { SettingsSectionCard } from '@/components/admin/site-settings/SettingsSectionCard';
import type { SiteSettingsFormBaseProps } from '@/components/admin/site-settings/types';

export function ContactSettingsForm({
  values,
  fieldErrors,
  readOnly,
  onFieldChange,
}: SiteSettingsFormBaseProps) {
  const inputClass = `admin-settings-input${readOnly ? ' admin-settings-input--readonly' : ''}`;

  return (
    <div className="admin-settings-stack">
      <SettingsSectionCard
        title="İletişim Kanalları"
        description="Ziyaretçilerin size ulaşacağı iletişim bilgileri."
      >
        <div className="admin-settings-form-grid admin-settings-form-grid--2">
          <SettingsFormField label="Birincil E-posta" htmlFor="primaryEmail" error={fieldErrors.primaryEmail}>
            <input
              id="primaryEmail"
              type="email"
              className={inputClass}
              value={values.primaryEmail}
              disabled={readOnly}
              onChange={(event) => onFieldChange('primaryEmail', event.target.value)}
            />
          </SettingsFormField>
          <SettingsFormField label="İkincil E-posta" htmlFor="secondaryEmail" error={fieldErrors.secondaryEmail}>
            <input
              id="secondaryEmail"
              type="email"
              className={inputClass}
              value={values.secondaryEmail}
              disabled={readOnly}
              onChange={(event) => onFieldChange('secondaryEmail', event.target.value)}
            />
          </SettingsFormField>
          <SettingsFormField label="Birincil Telefon" htmlFor="primaryPhone">
            <input
              id="primaryPhone"
              className={inputClass}
              value={values.primaryPhone}
              disabled={readOnly}
              onChange={(event) => onFieldChange('primaryPhone', event.target.value)}
            />
          </SettingsFormField>
          <SettingsFormField label="İkincil Telefon" htmlFor="secondaryPhone">
            <input
              id="secondaryPhone"
              className={inputClass}
              value={values.secondaryPhone}
              disabled={readOnly}
              onChange={(event) => onFieldChange('secondaryPhone', event.target.value)}
            />
          </SettingsFormField>
          <SettingsFormField
            label="WhatsApp Numarası"
            htmlFor="whatsappNumber"
            hint="Uluslararası format kullanabilirsiniz."
            fullWidth
          >
            <input
              id="whatsappNumber"
              className={inputClass}
              value={values.whatsappNumber}
              disabled={readOnly}
              onChange={(event) => onFieldChange('whatsappNumber', event.target.value)}
            />
          </SettingsFormField>
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard title="Adres Bilgileri" description="Fiziksel konum ve posta bilgileri.">
        <div className="admin-settings-form-grid admin-settings-form-grid--2">
          <SettingsFormField label="Açık Adres" htmlFor="address" fullWidth>
            <textarea
              id="address"
              className={`${inputClass} admin-settings-textarea`}
              rows={3}
              value={values.address}
              disabled={readOnly}
              onChange={(event) => onFieldChange('address', event.target.value)}
            />
          </SettingsFormField>
          <SettingsFormField label="İlçe" htmlFor="district">
            <input
              id="district"
              className={inputClass}
              value={values.district}
              disabled={readOnly}
              onChange={(event) => onFieldChange('district', event.target.value)}
            />
          </SettingsFormField>
          <SettingsFormField label="Şehir" htmlFor="city">
            <input
              id="city"
              className={inputClass}
              value={values.city}
              disabled={readOnly}
              onChange={(event) => onFieldChange('city', event.target.value)}
            />
          </SettingsFormField>
          <SettingsFormField label="Posta Kodu" htmlFor="postalCode">
            <input
              id="postalCode"
              className={inputClass}
              value={values.postalCode}
              disabled={readOnly}
              onChange={(event) => onFieldChange('postalCode', event.target.value)}
            />
          </SettingsFormField>
          <SettingsFormField label="Ülke" htmlFor="country">
            <input
              id="country"
              className={inputClass}
              value={values.country}
              disabled={readOnly}
              onChange={(event) => onFieldChange('country', event.target.value)}
            />
          </SettingsFormField>
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard title="Harita ve Çalışma Saatleri" description="Konum embed ve çalışma saatleri metni.">
        <div className="admin-settings-form-grid admin-settings-form-grid--1">
          <SettingsFormField
            label="Harita Embed URL"
            htmlFor="mapEmbedUrl"
            hint="Google Maps embed bağlantısını girin."
            error={fieldErrors.mapEmbedUrl}
            fullWidth
          >
            <input
              id="mapEmbedUrl"
              className={inputClass}
              value={values.mapEmbedUrl}
              disabled={readOnly}
              onChange={(event) => onFieldChange('mapEmbedUrl', event.target.value)}
            />
          </SettingsFormField>
          <SettingsFormField label="Çalışma Saatleri" htmlFor="workingHours" fullWidth>
            <textarea
              id="workingHours"
              className={`${inputClass} admin-settings-textarea admin-settings-textarea--tall`}
              rows={4}
              value={values.workingHours}
              disabled={readOnly}
              onChange={(event) => onFieldChange('workingHours', event.target.value)}
            />
          </SettingsFormField>
        </div>
      </SettingsSectionCard>
    </div>
  );
}
