import { Suspense } from 'react';
import { ProductsPageClient } from '@/components/admin/products/ProductsPageClient';
import '@/components/admin/products/products.css';
import '@/components/admin/product-categories/product-categories.css';
import { ADMIN_MODULES } from '@/lib/admin/module-config';
import { createModuleMetadata } from '@/lib/admin/module-metadata';

const moduleConfig = ADMIN_MODULES.products;

export const metadata = createModuleMetadata(moduleConfig.title);

export default function AdminProductsModulePage() {
  return (
    <Suspense fallback={<p className="admin-status">Ürünler yükleniyor…</p>}>
      <ProductsPageClient />
    </Suspense>
  );
}
