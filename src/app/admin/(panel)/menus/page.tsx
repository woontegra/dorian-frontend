import { Suspense } from 'react';
import { MenuItemsPageClient } from '@/components/admin/menu-items/MenuItemsPageClient';
import '@/components/admin/menu-items/menu-items.css';
import { ADMIN_MODULES } from '@/lib/admin/module-config';
import { createModuleMetadata } from '@/lib/admin/module-metadata';

const moduleConfig = ADMIN_MODULES.menus;

export const metadata = createModuleMetadata(moduleConfig.title);

export default function AdminMenusModulePage() {
  return (
    <Suspense fallback={<p className="admin-status">Menü öğeleri yükleniyor…</p>}>
      <MenuItemsPageClient />
    </Suspense>
  );
}
