'use client';

import { useCallback, useId, useRef, useState } from 'react';
import { ChevronDown, ExternalLink, LogOut, Menu, UserRound } from 'lucide-react';
import { formatAdminRole } from '@/lib/auth/role-label';
import { getInitials } from '@/lib/admin/get-initials';
import { getPublicSiteUrl, VIEW_SITE_ICON } from '@/lib/admin/navigation';
import { useClickOutside } from '@/lib/admin/use-click-outside';
import { useEscapeKey } from '@/lib/admin/use-escape-key';
import { useAdminSession } from '@/components/admin/session/AdminSessionProvider';

type AdminUserMenuProps = {
  compact?: boolean;
};

export function AdminUserMenu({ compact = false }: AdminUserMenuProps) {
  const menuId = useId();
  const { admin, loggingOut, logout } = useAdminSession();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => setOpen(false), []);

  useClickOutside(containerRef, closeMenu, open);
  useEscapeKey(closeMenu, open);

  return (
    <div className="admin-user-menu" ref={containerRef}>
      <button
        type="button"
        className="admin-user-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((previous) => !previous)}
      >
        <span className="admin-user-menu-avatar" aria-hidden="true">
          {getInitials(admin.fullName)}
        </span>
        {!compact ? (
          <span className="admin-user-menu-meta">
            <span className="admin-user-menu-name">{admin.fullName}</span>
            <span className="admin-user-menu-role">{formatAdminRole(admin.role)}</span>
          </span>
        ) : null}
        <ChevronDown className="admin-user-menu-chevron" aria-hidden="true" size={16} />
        <span className="admin-sr-only">Kullanıcı menüsü</span>
      </button>

      {open ? (
        <ul id={menuId} className="admin-user-menu-dropdown" role="menu">
          <li role="none">
            <button type="button" className="admin-user-menu-item admin-user-menu-item--disabled" role="menuitem" disabled>
              <UserRound size={16} aria-hidden="true" />
              <span>Profil</span>
              <span className="admin-user-menu-badge">Yakında</span>
            </button>
          </li>
          <li role="none">
            <button
              type="button"
              className="admin-user-menu-item"
              role="menuitem"
              disabled={loggingOut}
              onClick={() => {
                closeMenu();
                void logout();
              }}
            >
              <LogOut size={16} aria-hidden="true" />
              <span>{loggingOut ? 'Çıkış yapılıyor…' : 'Çıkış Yap'}</span>
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}

type AdminTopbarProps = {
  pageTitle: string;
  onOpenMobileMenu: () => void;
  mobileMenuOpen: boolean;
  sidebarControlsId: string;
};

export function AdminTopbar({
  pageTitle,
  onOpenMobileMenu,
  mobileMenuOpen,
  sidebarControlsId,
}: AdminTopbarProps) {
  const publicSiteUrl = getPublicSiteUrl();
  const ViewSiteIcon = VIEW_SITE_ICON;

  return (
    <header className="admin-topbar">
      <div className="admin-topbar-start">
        <button
          type="button"
          className="admin-topbar-menu-button"
          aria-label="Menüyü aç"
          aria-expanded={mobileMenuOpen}
          aria-controls={sidebarControlsId}
          onClick={onOpenMobileMenu}
        >
          <Menu size={20} aria-hidden="true" />
        </button>
        <h1 className="admin-topbar-title">{pageTitle}</h1>
      </div>

      <div className="admin-topbar-end">
        {publicSiteUrl ? (
          <a
            href={publicSiteUrl}
            className="admin-topbar-view-site"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ViewSiteIcon size={16} aria-hidden="true" />
            <span>Siteyi Görüntüle</span>
            <ExternalLink size={14} className="admin-topbar-view-site-external" aria-hidden="true" />
          </a>
        ) : (
          <button
            type="button"
            className="admin-topbar-view-site admin-topbar-view-site--disabled"
            disabled
            title="Site adresi yapılandırılmadı (NEXT_PUBLIC_SITE_URL)"
          >
            <ViewSiteIcon size={16} aria-hidden="true" />
            <span>Siteyi Görüntüle</span>
          </button>
        )}

        <AdminUserMenu />
      </div>
    </header>
  );
}
