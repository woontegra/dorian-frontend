'use client';

import { ChevronLeft, ChevronRight, PanelsTopLeft } from 'lucide-react';
import { formatAdminRole } from '@/lib/auth/role-label';
import { getInitials } from '@/lib/admin/get-initials';
import { useAdminSession } from '@/components/admin/session/AdminSessionProvider';
import { AdminSidebarNav } from '@/components/admin/layout/AdminSidebarNav';

type AdminSidebarProps = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  showCollapseToggle: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
  id: string;
};

export function AdminSidebar({
  collapsed,
  onToggleCollapsed,
  showCollapseToggle,
  mobileOpen,
  onMobileClose,
  id,
}: AdminSidebarProps) {
  const { admin } = useAdminSession();

  return (
    <aside
      id={id}
      className={`admin-sidebar${collapsed ? ' admin-sidebar--collapsed' : ''}${mobileOpen ? ' admin-sidebar--open' : ''}`}
      aria-label="Kenar çubuğu"
    >
      <div className="admin-sidebar-header">
        <div className="admin-sidebar-brand">
          <span className="admin-sidebar-brand-icon" aria-hidden="true">
            <PanelsTopLeft size={20} strokeWidth={1.75} />
          </span>
          {!collapsed ? (
            <div className="admin-sidebar-brand-text">
              <span className="admin-sidebar-brand-title">Site Yönetimi</span>
              <span className="admin-sidebar-brand-subtitle">Kurumsal CMS</span>
            </div>
          ) : (
            <span className="admin-sr-only">Site Yönetimi</span>
          )}
        </div>

        {showCollapseToggle ? (
          <button
            type="button"
            className="admin-sidebar-collapse"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? 'Kenar çubuğunu genişlet' : 'Kenar çubuğunu daralt'}
            title={collapsed ? 'Kenar çubuğunu genişlet' : 'Kenar çubuğunu daralt'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        ) : null}
      </div>

      <div className="admin-sidebar-scroll">
        <AdminSidebarNav collapsed={collapsed} onNavigate={onMobileClose} />
      </div>

      <div className="admin-sidebar-footer">
        <div className="admin-sidebar-user" title={collapsed ? admin.fullName : undefined}>
          <span className="admin-sidebar-user-avatar" aria-hidden="true">
            {getInitials(admin.fullName)}
          </span>
          {!collapsed ? (
            <div className="admin-sidebar-user-meta">
              <span className="admin-sidebar-user-name">{admin.fullName}</span>
              <span className="admin-sidebar-user-role">{formatAdminRole(admin.role)}</span>
            </div>
          ) : (
            <span className="admin-sr-only">
              {admin.fullName}, {formatAdminRole(admin.role)}
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
