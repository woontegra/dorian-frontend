'use client';

import { useCallback, useId, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { getAdminPageTitle } from '@/lib/admin/navigation';
import { useBodyScrollLock } from '@/lib/admin/use-body-scroll-lock';
import { useEscapeKey } from '@/lib/admin/use-escape-key';
import { ADMIN_MOBILE_QUERY, useMediaQuery } from '@/lib/admin/use-media-query';
import { useSidebarCollapsed } from '@/lib/admin/use-sidebar-collapsed';
import { AdminSessionProvider } from '@/components/admin/session/AdminSessionProvider';
import { AdminSidebar } from '@/components/admin/layout/AdminSidebar';
import { AdminTopbar } from '@/components/admin/layout/AdminTopbar';

function AdminPanelShellInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const sidebarId = useId();
  const isMobile = useMediaQuery(ADMIN_MOBILE_QUERY);
  const { collapsed, toggleCollapsed, hydrated } = useSidebarCollapsed();
  const [mobileOpen, setMobileOpen] = useState(false);

  const pageTitle = getAdminPageTitle(pathname);
  const effectiveCollapsed = isMobile ? false : collapsed && hydrated;

  useBodyScrollLock(isMobile && mobileOpen);
  useEscapeKey(useCallback(() => setMobileOpen(false), []), isMobile && mobileOpen);

  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const openMobile = useCallback(() => setMobileOpen(true), []);

  return (
    <div
      className={`admin-panel${effectiveCollapsed ? ' admin-panel--collapsed' : ''}${isMobile ? ' admin-panel--mobile' : ''}`}
    >
      {isMobile && mobileOpen ? (
        <button
          type="button"
          className="admin-panel-overlay"
          aria-label="Menüyü kapat"
          onClick={closeMobile}
        />
      ) : null}

      <AdminSidebar
        id={sidebarId}
        collapsed={effectiveCollapsed}
        onToggleCollapsed={toggleCollapsed}
        showCollapseToggle={!isMobile && hydrated}
        mobileOpen={isMobile && mobileOpen}
        onMobileClose={closeMobile}
      />

      <div className="admin-panel-main">
        <AdminTopbar
          pageTitle={pageTitle}
          onOpenMobileMenu={openMobile}
          mobileMenuOpen={mobileOpen}
          sidebarControlsId={sidebarId}
        />
        <div className="admin-panel-content">{children}</div>
      </div>
    </div>
  );
}

export function AdminPanelLayout({ children }: { children: ReactNode }) {
  return (
    <AdminSessionProvider>
      <AdminPanelShellInner>{children}</AdminPanelShellInner>
    </AdminSessionProvider>
  );
}
