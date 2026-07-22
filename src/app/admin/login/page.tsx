import type { Metadata } from 'next';
import { LoginPageClient } from '@/components/admin/LoginPageClient';

export const metadata: Metadata = {
  title: 'Admin Girişi',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLoginPage() {
  return (
    <main className="admin-login-page">
      <LoginPageClient />
    </main>
  );
}
