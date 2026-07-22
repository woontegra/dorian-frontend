import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

type StatCardProps = {
  title: string;
  href: string;
  icon: LucideIcon;
  value?: number | string | null;
};

export function StatCard({ title, href, icon: Icon, value }: StatCardProps) {
  const hasValue = value !== null && value !== undefined;

  return (
    <Link href={href} className="admin-stat-card">
      <span className="admin-stat-card-icon" aria-hidden="true">
        <Icon size={20} strokeWidth={1.75} />
      </span>
      <div className="admin-stat-card-body">
        <span className="admin-stat-card-label">{title}</span>
        <span
          className="admin-stat-card-value"
          aria-label={hasValue ? `${title}: ${value}` : `${title}: veri yok`}
        >
          {hasValue ? value : '—'}
        </span>
      </div>
    </Link>
  );
}
