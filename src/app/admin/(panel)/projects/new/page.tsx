import { Suspense } from 'react';
import { ProjectFormPageClient } from '@/components/admin/projects/ProjectFormPageClient';
import '@/components/admin/projects/projects.css';
import '@/components/admin/product-categories/product-categories.css';
import { createModuleMetadata } from '@/lib/admin/module-metadata';

export const metadata = createModuleMetadata('Yeni Proje');

export default function AdminNewProjectPage() {
  return (
    <Suspense fallback={<p className="admin-status">Proje formu yükleniyor…</p>}>
      <ProjectFormPageClient mode="create" />
    </Suspense>
  );
}
