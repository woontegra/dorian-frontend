import type { Metadata } from 'next';
import './admin.css';
import './admin-panel.css';

export const metadata: Metadata = {
  title: {
    default: 'Site Yönetim Paneli',
    template: '%s | Site Yönetim Paneli',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="admin-root">{children}</div>;
}
