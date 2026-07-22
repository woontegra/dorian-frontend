import type { Metadata } from 'next';
import { DashboardView } from '@/components/admin/dashboard/DashboardView';

export const metadata: Metadata = {
  title: 'Genel Bakış',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminDashboardPage() {
  return <DashboardView />;
}
