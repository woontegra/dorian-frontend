'use client';

import { Link2 } from 'lucide-react';
import { SettingsFormField } from '@/components/admin/site-settings/SettingsFormField';
import { SettingsSectionCard } from '@/components/admin/site-settings/SettingsSectionCard';
import type { SiteSettingsFormBaseProps } from '@/components/admin/site-settings/types';
import type { SiteSettingsFormValues } from '@/lib/site-settings/schema';

const SOCIAL_FIELDS = [
  {
    key: 'facebookUrl' as const,
    label: 'Facebook',
    hint: 'Facebook sayfa veya profil URL’si.',
    icon: Link2,
  },
  {
    key: 'instagramUrl' as const,
    label: 'Instagram',
    hint: 'Instagram profil bağlantısı.',
    icon: Link2,
  },
  {
    key: 'xUrl' as const,
    label: 'X (Twitter)',
    hint: 'X hesabı profil URL’si.',
    icon: Link2,
  },
  {
    key: 'linkedinUrl' as const,
    label: 'LinkedIn',
    hint: 'LinkedIn şirket veya profil sayfası.',
    icon: Link2,
  },
  {
    key: 'youtubeUrl' as const,
    label: 'YouTube',
    hint: 'YouTube kanal veya video URL’si.',
    icon: Link2,
  },
] satisfies Array<{
  key: keyof Pick<
    SiteSettingsFormValues,
    'facebookUrl' | 'instagramUrl' | 'xUrl' | 'linkedinUrl' | 'youtubeUrl'
  >;
  label: string;
  hint: string;
  icon: typeof Link2;
}>;

export function SocialSettingsForm({
  values,
  fieldErrors,
  readOnly,
  onFieldChange,
}: SiteSettingsFormBaseProps) {
  const inputClass = `admin-settings-input admin-settings-input--with-icon${readOnly ? ' admin-settings-input--readonly' : ''}`;

  return (
    <div className="admin-settings-stack">
      <SettingsSectionCard
        title="Sosyal Medya Bağlantıları"
        description="Ziyaretçilerin sosyal medya hesaplarınıza ulaşmasını sağlayın."
      >
        <div className="admin-settings-form-grid admin-settings-form-grid--2">
          {SOCIAL_FIELDS.map((field) => {
            const Icon = field.icon;
            return (
              <SettingsFormField
                key={field.key}
                label={field.label}
                htmlFor={field.key}
                hint={field.hint}
                error={fieldErrors[field.key]}
              >
                <div className="admin-settings-input-icon-wrap">
                  <span className="admin-settings-input-icon" aria-hidden="true">
                    <Icon size={16} strokeWidth={1.75} />
                  </span>
                  <input
                    id={field.key}
                    className={inputClass}
                    value={values[field.key]}
                    disabled={readOnly}
                    placeholder="https://"
                    onChange={(event) => onFieldChange(field.key, event.target.value)}
                  />
                </div>
              </SettingsFormField>
            );
          })}
        </div>
      </SettingsSectionCard>
    </div>
  );
}
