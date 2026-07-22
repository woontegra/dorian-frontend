import { Suspense, type ReactNode } from 'react';
import { SiteHeader } from '@/components/public/SiteHeader';
import '@/components/public/site-header.css';
import {
  createEmptyPublicBootstrap,
  fetchPublicBootstrap,
} from '@/lib/public/bootstrap';

async function PublicBootstrapHeader() {
  const bootstrap = await fetchPublicBootstrap();
  return <SiteHeader site={bootstrap.site} navigation={bootstrap.navigation} />;
}

export default function PublicSiteLayout({ children }: { children: ReactNode }) {
  const fallback = createEmptyPublicBootstrap();

  return (
    <div className="site-shell">
      <Suspense fallback={<SiteHeader site={fallback.site} navigation={[]} />}>
        <PublicBootstrapHeader />
      </Suspense>
      {children}
    </div>
  );
}
