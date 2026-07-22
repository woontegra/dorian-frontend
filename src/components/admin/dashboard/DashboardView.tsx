'use client';

import { useEffect, useState } from 'react';
import { FileText, LayoutGrid, Mail, Package } from 'lucide-react';
import { QuickActions } from '@/components/admin/dashboard/QuickActions';
import { RecentActivityEmpty, SiteStatusCard } from '@/components/admin/dashboard/SiteStatusCard';
import { StatCard } from '@/components/admin/dashboard/StatCard';
import { fetchDashboardSummary } from '@/lib/projects/api';

const STATS = [
  { key: 'pages', title: 'Toplam Sayfa', href: '/admin/pages', icon: FileText },
  { key: 'products', title: 'Toplam Ürün', href: '/admin/products', icon: Package },
  { key: 'projects', title: 'Toplam Proje', href: '/admin/projects', icon: LayoutGrid },
  { key: 'messages', title: 'Okunmamış Mesaj', href: '/admin/messages', icon: Mail },
] as const;

export function DashboardView() {
  const [projectCount, setProjectCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    void fetchDashboardSummary()
      .then((summary) => {
        if (active) {
          setProjectCount(summary.projectCount);
        }
      })
      .catch(() => {
        // Dashboard summary is best-effort; keep the card showing "—" on failure.
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="admin-dashboard">
      <header className="admin-page-header">
        <h2 className="admin-page-heading">Genel Bakış</h2>
        <p className="admin-page-description">
          Web sitenizin içerik ve yönetim durumunu buradan takip edebilirsiniz.
        </p>
      </header>

      <div className="admin-stat-grid">
        {STATS.map((stat) => (
          <StatCard
            key={stat.href}
            title={stat.title}
            href={stat.href}
            icon={stat.icon}
            value={stat.key === 'projects' ? projectCount : undefined}
          />
        ))}
      </div>

      <QuickActions />

      <div className="admin-dashboard-grid">
        <SiteStatusCard />
        <RecentActivityEmpty />
      </div>
    </div>
  );
}
