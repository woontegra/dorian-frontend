import { Suspense } from 'react';
import { SiteSettingsPageClient } from '@/components/admin/site-settings/SiteSettingsPageClient';
import '@/components/admin/site-settings/site-settings.css';
import { createModuleMetadata } from '@/lib/admin/module-metadata';

export const metadata = createModuleMetadata('Site Ayarları');

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<p className="admin-status">Site ayarları yükleniyor…</p>}>
      <SiteSettingsPageClient />
    </Suspense>
  );
}
