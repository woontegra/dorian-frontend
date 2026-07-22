import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Paneli',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  return (
    <main className="page">
      <h1>Admin Paneli</h1>
      <p>Yönetim arayüzü henüz hazır değil. Bu geçici bir sayfadır.</p>
    </main>
  );
}
