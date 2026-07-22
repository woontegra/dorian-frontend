import type { Metadata } from 'next';
import { APP_NAME } from '@/lib/shared';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: 'Kurumsal web sitesi ve yÃ¶netim paneli altyapÄ±sÄ±.',
  applicationName: APP_NAME,
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    siteName: APP_NAME,
    title: APP_NAME,
    description: 'Kurumsal web sitesi ve yÃ¶netim paneli altyapÄ±sÄ±.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}

