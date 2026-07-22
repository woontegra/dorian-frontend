import { Suspense } from 'react';
import { ProductFormPageClient } from '@/components/admin/products/ProductFormPageClient';
import '@/components/admin/products/products.css';
import '@/components/admin/product-categories/product-categories.css';
import { createModuleMetadata } from '@/lib/admin/module-metadata';

export const metadata = createModuleMetadata('Ürünü Düzenle');

type AdminEditProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminEditProductPage({ params }: AdminEditProductPageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<p className="admin-status">Ürün formu yükleniyor…</p>}>
      <ProductFormPageClient mode="edit" productId={id} />
    </Suspense>
  );
}
