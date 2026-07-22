'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { filterNavGroupsForRole, isNavItemActive } from '@/lib/admin/navigation';
import { useAdminSession } from '@/components/admin/session/AdminSessionProvider';

type AdminSidebarNavProps = {
  collapsed: boolean;
  onNavigate?: () => void;
};

export function AdminSidebarNav({ collapsed, onNavigate }: AdminSidebarNavProps) {
  const pathname = usePathname();
  const { admin } = useAdminSession();
  const groups = filterNavGroupsForRole(admin.role);

  return (
    <nav className="admin-sidebar-nav" aria-label="Yönetim menüsü">
      {groups.map((group) => (
        <div key={group.title} className="admin-sidebar-group">
          {!collapsed ? (
            <p className="admin-sidebar-group-title" aria-hidden="true">
              {group.title}
            </p>
          ) : (
            <div className="admin-sidebar-group-divider" aria-hidden="true" />
          )}
          <ul className="admin-sidebar-list">
            {group.items.map((item) => {
              const active = isNavItemActive(pathname, item.href);
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`admin-sidebar-link${active ? ' admin-sidebar-link--active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                    title={collapsed ? item.label : undefined}
                    onClick={onNavigate}
                  >
                    <Icon className="admin-sidebar-link-icon" aria-hidden="true" size={18} strokeWidth={1.75} />
                    {!collapsed ? <span className="admin-sidebar-link-label">{item.label}</span> : null}
                    {collapsed ? <span className="admin-sr-only">{item.label}</span> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
