import { Activity } from 'lucide-react';

const STATUS_ITEMS = [
  { label: 'Public site', status: 'Bağlantı bekleniyor' },
  { label: 'API bağlantısı', status: 'Bağlantı bekleniyor' },
  { label: 'SEO altyapısı', status: 'Hazırlanıyor' },
] as const;

export function SiteStatusCard() {
  return (
    <section className="admin-dashboard-card" aria-labelledby="site-status-title">
      <h2 id="site-status-title" className="admin-section-title">
        Site Durumu
      </h2>
      <ul className="admin-status-list">
        {STATUS_ITEMS.map((item) => (
          <li key={item.label} className="admin-status-list-item">
            <span className="admin-status-list-label">{item.label}</span>
            <span className="admin-status-list-value">{item.status}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function RecentActivityEmpty() {
  return (
    <section className="admin-dashboard-card admin-dashboard-card--wide" aria-labelledby="recent-activity-title">
      <h2 id="recent-activity-title" className="admin-section-title">
        Son Aktiviteler
      </h2>
      <div className="admin-empty-state">
        <span className="admin-empty-state-icon" aria-hidden="true">
          <Activity size={28} strokeWidth={1.5} />
        </span>
        <p className="admin-empty-state-title">Henüz aktivite kaydı yok</p>
        <p className="admin-empty-state-text">
          İçerik oluşturduğunuzda veya yönetim işlemleri yaptığınızda son hareketler burada
          listelenecektir.
        </p>
      </div>
    </section>
  );
}
