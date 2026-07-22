import { Suspense } from 'react';
import { ProjectsPageClient } from '@/components/admin/projects/ProjectsPageClient';
import '@/components/admin/projects/projects.css';
import '@/components/admin/product-categories/product-categories.css';
import { ADMIN_MODULES } from '@/lib/admin/module-config';
import { createModuleMetadata } from '@/lib/admin/module-metadata';

const moduleConfig = ADMIN_MODULES.projects;

export const metadata = createModuleMetadata(moduleConfig.title);

export default function AdminProjectsModulePage() {
  return (
    <Suspense fallback={<p className="admin-status">Projeler yükleniyor…</p>}>
      <ProjectsPageClient />
    </Suspense>
  );
}
