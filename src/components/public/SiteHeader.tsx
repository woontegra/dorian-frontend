'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { PublicNavigationItem, PublicSiteSettings } from '@kurumsal/shared';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { SiteDesktopNav } from '@/components/public/SiteDesktopNav';
import { SiteMobileNav } from '@/components/public/SiteMobileNav';

type SiteHeaderProps = {
  site: PublicSiteSettings;
  navigation: PublicNavigationItem[];
};

export function SiteHeader({ site, navigation }: SiteHeaderProps) {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const [desktopOpenId, setDesktopOpenId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileAccordionId, setMobileAccordionId] = useState<string | null>(null);

  const items = Array.isArray(navigation) ? navigation : [];

  useEffect(() => {
    setDesktopOpenId(null);
    setMobileOpen(false);
    setMobileAccordionId(null);
  }, [pathname]);

  useEffect(() => {
    // Drawer her açılış/kapanışta accordion’u sıfırla; açık menü kalıntısı taşınmasın.
    setMobileAccordionId(null);
  }, [mobileOpen]);

  function toggleMobileMenu() {
    setMobileOpen((current) => !current);
  }

  function toggleMobileAccordion(id: string) {
    setMobileAccordionId((current) => (current === id ? null : id));
  }
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') {
        return;
      }
      setDesktopOpenId(null);
      setMobileOpen(false);
      setMobileAccordionId(null);
    }

    function onPointerDown(event: MouseEvent) {
      if (!headerRef.current) {
        return;
      }
      if (!headerRef.current.contains(event.target as Node)) {
        setDesktopOpenId(null);
      }
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, []);

  useEffect(() => {
    function onResize() {
      if (window.matchMedia('(min-width: 901px)').matches) {
        setMobileOpen(false);
        setMobileAccordionId(null);
      } else {
        setDesktopOpenId(null);
      }
    }

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <header ref={headerRef} className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="site-header__brand" aria-label={site.siteName || 'Ana sayfa'}>
          {site.logoUrl ? (
            <img src={site.logoUrl} alt="" className="site-header__logo" />
          ) : (
            <span className="site-header__brand-text">{site.siteName || 'Kurumsal'}</span>
          )}
        </Link>

        <SiteDesktopNav items={items} openId={desktopOpenId} onOpenChange={setDesktopOpenId} />

        {items.length > 0 ? (
          <button
            type="button"
            className="site-header__menu-button"
            aria-expanded={mobileOpen}
            aria-controls="site-mobile-nav"
            aria-label={mobileOpen ? 'Menüyü kapat' : 'Menüyü aç'}
            onClick={toggleMobileMenu}
          >
            <Menu size={22} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <SiteMobileNav
        open={mobileOpen}
        items={items}
        openAccordionId={mobileAccordionId}
        onToggleAccordion={toggleMobileAccordion}
        onClose={() => {
          setMobileOpen(false);
          setMobileAccordionId(null);
        }}
      />
    </header>
  );
}
