import { Suspense } from 'react';
import { MediaLibraryPageClient } from '@/components/admin/media/MediaLibraryPageClient';
import '@/components/admin/media/media.css';
import { createModuleMetadata } from '@/lib/admin/module-metadata';

export const metadata = createModuleMetadata('Medya Kütüphanesi');

export default function AdminMediaPage() {
  return (
    <Suspense fallback={<p className="admin-status">Medya kütüphanesi yükleniyor…</p>}>
      <MediaLibraryPageClient />
    </Suspense>
  );
}
