import { Suspense } from 'react';
import { ProductCategoriesPageClient } from '@/components/admin/product-categories/ProductCategoriesPageClient';
import '@/components/admin/product-categories/product-categories.css';
import { ADMIN_MODULES } from '@/lib/admin/module-config';
import { createModuleMetadata } from '@/lib/admin/module-metadata';

const moduleConfig = ADMIN_MODULES.productCategories;

export const metadata = createModuleMetadata(moduleConfig.title);

export default function AdminProductCategoriesModulePage() {
  return (
    <Suspense fallback={<p className="admin-status">Kategoriler yükleniyor…</p>}>
      <ProductCategoriesPageClient />
    </Suspense>
  );
}
