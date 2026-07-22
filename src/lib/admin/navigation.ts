import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeftRight,
  BookOpen,
  FileText,
  FolderTree,
  Footprints,
  GalleryHorizontalEnd,
  Globe,
  Home,
  Images,
  LayoutDashboard,
  LayoutGrid,
  Mail,
  Menu,
  Package,
  Search,
  Settings,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import type { AdminRole } from '@/lib/auth/types';

export type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** UI-only visibility; backend authorization is enforced separately. */
  roles?: AdminRole[];
};

export type AdminNavGroup = {
  title: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    title: 'Ana',
    items: [{ label: 'Dashboard', href: '/admin', icon: LayoutDashboard }],
  },
  {
    title: 'İçerik Yönetimi',
    items: [
      { label: 'Ana Sayfa', href: '/admin/home', icon: Home },
      { label: 'Sayfalar', href: '/admin/pages', icon: FileText },
      { label: 'Hero / Slider', href: '/admin/sliders', icon: SlidersHorizontal },
      { label: 'Ürünler', href: '/admin/products', icon: Package },
      { label: 'Ürün Kategorileri', href: '/admin/product-categories', icon: FolderTree },
      { label: 'Projeler', href: '/admin/projects', icon: LayoutGrid },
      { label: 'Galeri', href: '/admin/gallery', icon: Images },
      { label: 'Blog', href: '/admin/blog', icon: BookOpen },
    ],
  },
  {
    title: 'Site Yapısı',
    items: [
      { label: 'Menü Yönetimi', href: '/admin/menus', icon: Menu },
      { label: 'Footer Yönetimi', href: '/admin/footer', icon: Footprints },
      { label: 'Medya Kütüphanesi', href: '/admin/media', icon: GalleryHorizontalEnd },
    ],
  },
  {
    title: 'İletişim',
    items: [{ label: 'Mesajlar', href: '/admin/messages', icon: Mail }],
  },
  {
    title: 'SEO',
    items: [
      { label: 'SEO Yönetimi', href: '/admin/seo', icon: Search },
      { label: 'Yönlendirmeler', href: '/admin/redirects', icon: ArrowLeftRight },
    ],
  },
  {
    title: 'Sistem',
    items: [
      { label: 'Site Ayarları', href: '/admin/settings', icon: Settings },
      // UI-only: hidden for EDITOR; backend role checks will be added separately.
      { label: 'Kullanıcılar', href: '/admin/users', icon: Users, roles: ['ADMIN'] },
    ],
  },
];

export function filterNavGroupsForRole(role: AdminRole): AdminNavGroup[] {
  return ADMIN_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.roles || item.roles.includes(role)),
  })).filter((group) => group.items.length > 0);
}

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === '/admin') {
    return pathname === '/admin';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getAdminPageTitle(pathname: string): string {
  if (pathname === '/admin') {
    return 'Genel Bakış';
  }

  for (const group of ADMIN_NAV_GROUPS) {
    for (const item of group.items) {
      if (isNavItemActive(pathname, item.href)) {
        return item.label;
      }
    }
  }

  return 'Site Yönetim Paneli';
}

export function getPublicSiteUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export const VIEW_SITE_ICON = Globe;
