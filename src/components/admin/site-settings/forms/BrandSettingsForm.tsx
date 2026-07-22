'use client';

import type { SiteSettingsImageType } from '@kurumsal/shared';
import { SiteSettingsImageField } from '@/components/admin/site-settings/SiteSettingsImageField';
import type { SiteSettingsFormBaseProps } from '@/components/admin/site-settings/types';

type BrandSettingsFormProps = SiteSettingsFormBaseProps & {
  imageUrls: Record<SiteSettingsImageType, string | null>;
  pendingUploads: Partial<Record<SiteSettingsImageType, { previewUrl: string; fileName: string }>>;
  uploadingType: SiteSettingsImageType | null;
  onSelectFile: (type: SiteSettingsImageType, file: File) => void;
  onUpload: (type: SiteSettingsImageType) => void;
  onRemove: (type: SiteSettingsImageType) => void;
};

const BRAND_FIELDS = [
  {
    type: 'logo' as const,
    label: 'Logo',
    purpose: 'Açık zeminlerde kullanılan ana marka logosu.',
    hint: 'PNG, JPEG, WebP veya SVG · Önerilen: en az 240 px genişlik',
    previewVariant: 'logo' as const,
  },
  {
    type: 'darkLogo' as const,
    label: 'Koyu Zemin Logosu',
    purpose: 'Koyu arka planlarda kullanılacak alternatif logo.',
    hint: 'PNG, JPEG, WebP veya SVG · Şeffaf arka plan önerilir',
    previewVariant: 'logo' as const,
  },
  {
    type: 'favicon' as const,
    label: 'Favicon',
    purpose: 'Tarayıcı sekmesi ve kısayol simgesi.',
    hint: 'PNG, SVG veya ICO · Önerilen: 32×32 veya 64×64 px',
    previewVariant: 'favicon' as const,
  },
  {
    type: 'defaultOgImage' as const,
    label: 'Varsayılan Sosyal Paylaşım Görseli',
    purpose: 'Sosyal medya paylaşımlarında kullanılan varsayılan görsel.',
    hint: 'PNG, JPEG, WebP veya SVG · Önerilen: 1200×630 px',
    previewVariant: 'og' as const,
  },
];

export function BrandSettingsForm({
  values,
  readOnly,
  onFieldChange,
  imageUrls,
  pendingUploads,
  uploadingType,
  onSelectFile,
  onUpload,
  onRemove,
}: BrandSettingsFormProps) {
  return (
    <div className="admin-settings-stack">
      <div className="admin-settings-upload-grid">
        {BRAND_FIELDS.map((field) => (
          <SiteSettingsImageField
            key={field.type}
            label={field.label}
            purpose={field.purpose}
            hint={field.hint}
            previewVariant={field.previewVariant}
            imageUrl={imageUrls[field.type]}
            altText={field.type === 'logo' ? values.logoAlt || field.label : field.label}
            altLabel={field.type === 'logo' ? 'Logo ALT Metni' : undefined}
            altValue={field.type === 'logo' ? values.logoAlt : undefined}
            onAltChange={field.type === 'logo' ? (value) => onFieldChange('logoAlt', value) : undefined}
            readOnly={readOnly}
            uploading={uploadingType === field.type}
            pendingPreview={pendingUploads[field.type]?.previewUrl ?? null}
            selectedFileName={pendingUploads[field.type]?.fileName ?? null}
            onSelectFile={(file) => onSelectFile(field.type, file)}
            onUpload={() => onUpload(field.type)}
            onRemove={() => onRemove(field.type)}
          />
        ))}
      </div>
    </div>
  );
}
