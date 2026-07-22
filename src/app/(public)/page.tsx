import { APP_NAME } from '@kurumsal/shared';
import { SiteHero } from '@/components/public/SiteHero';
import { fetchPublicHero } from '@/lib/public/hero';

export default async function HomePage() {
  const hero = await fetchPublicHero();

  return (
    <main className="page page--home">
      {hero ? <SiteHero hero={hero} /> : null}
      <div className="page__intro">
        {hero ? <p className="page__brand">{APP_NAME}</p> : <h1>{APP_NAME}</h1>}
        <p>Monorepo altyapısı hazır. Geliştirme yakında başlayacak.</p>
      </div>
    </main>
  );
}
