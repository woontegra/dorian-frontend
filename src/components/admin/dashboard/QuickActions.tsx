import Link from 'next/link';
import { FileText, LayoutGrid, Package, Upload } from 'lucide-react';

const QUICK_ACTIONS = [
  { label: 'Yeni Sayfa', href: '/admin/pages', icon: FileText },
  { label: 'Yeni Ürün', href: '/admin/products', icon: Package },
  { label: 'Yeni Proje', href: '/admin/projects/new', icon: LayoutGrid },
  { label: 'Medya Yükle', href: '/admin/media', icon: Upload },
] as const;

export function QuickActions() {
  return (
    <section className="admin-dashboard-section" aria-labelledby="quick-actions-title">
      <h2 id="quick-actions-title" className="admin-section-title">
        Hızlı İşlemler
      </h2>
      <div className="admin-quick-actions">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href} className="admin-quick-action">
              <Icon size={18} aria-hidden="true" strokeWidth={1.75} />
              <span>{action.label}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
