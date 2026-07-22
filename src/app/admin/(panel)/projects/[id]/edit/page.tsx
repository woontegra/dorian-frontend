import { Suspense } from 'react';
import { ProjectFormPageClient } from '@/components/admin/projects/ProjectFormPageClient';
import '@/components/admin/projects/projects.css';
import '@/components/admin/product-categories/product-categories.css';
import { createModuleMetadata } from '@/lib/admin/module-metadata';

export const metadata = createModuleMetadata('Projeyi Düzenle');

type AdminEditProjectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminEditProjectPage({ params }: AdminEditProjectPageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<p className="admin-status">Proje formu yükleniyor…</p>}>
      <ProjectFormPageClient mode="edit" projectId={id} />
    </Suspense>
  );
}
