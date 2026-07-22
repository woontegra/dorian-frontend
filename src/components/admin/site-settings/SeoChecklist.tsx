'use client';

import { Check, Circle } from 'lucide-react';
import type { SiteSettingsFormValues } from '@/lib/site-settings/schema';

type SeoChecklistProps = {
  values: SiteSettingsFormValues;
  ogImageUrl: string | null;
};

const CHECKLIST_ITEMS = [
  {
    id: 'siteUrl',
    label: 'Site URL girilmiş',
    isComplete: (values: SiteSettingsFormValues) => Boolean(values.siteUrl?.trim()),
  },
  {
    id: 'seoTitle',
    label: 'SEO başlığı girilmiş',
    isComplete: (values: SiteSettingsFormValues) => Boolean(values.defaultSeoTitle?.trim()),
  },
  {
    id: 'metaDescription',
    label: 'Meta açıklaması girilmiş',
    isComplete: (values: SiteSettingsFormValues) => Boolean(values.defaultMetaDescription?.trim()),
  },
  {
    id: 'ogImage',
    label: 'Sosyal paylaşım görseli mevcut',
    isComplete: (_values: SiteSettingsFormValues, ogImageUrl: string | null) => Boolean(ogImageUrl),
  },
  {
    id: 'verification',
    label: 'Doğrulama kodlarından en az biri mevcut',
    isComplete: (values: SiteSettingsFormValues) =>
      Boolean(values.googleSiteVerification?.trim() || values.bingSiteVerification?.trim()),
  },
] as const;

export function SeoChecklist({ values, ogImageUrl }: SeoChecklistProps) {
  const completedCount = CHECKLIST_ITEMS.filter((item) => item.isComplete(values, ogImageUrl)).length;

  return (
    <section className="admin-settings-seo-checklist" aria-label="SEO tamamlanma kontrol listesi">
      <header className="admin-settings-seo-checklist__header">
        <h3 className="admin-settings-seo-checklist__title">SEO Kontrol Listesi</h3>
        <p className="admin-settings-seo-checklist__summary">
          {completedCount}/{CHECKLIST_ITEMS.length} tamamlandı
        </p>
      </header>
      <ul className="admin-settings-seo-checklist__list">
        {CHECKLIST_ITEMS.map((item) => {
          const done = item.isComplete(values, ogImageUrl);
          return (
            <li key={item.id} className={`admin-settings-seo-checklist__item${done ? ' admin-settings-seo-checklist__item--done' : ''}`}>
              <span className="admin-settings-seo-checklist__icon" aria-hidden="true">
                {done ? <Check size={16} /> : <Circle size={16} />}
              </span>
              <span>{item.label}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
