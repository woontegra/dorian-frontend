'use client';

import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import type { PublicNavigationItem } from '@kurumsal/shared';
import { ChevronDown, X } from 'lucide-react';
import { SiteNavLink } from '@/components/public/SiteNavLink';
import { hasNavChildren, sanitizeNavHref } from '@/lib/public/nav-utils';

type SiteMobileNavProps = {
  open: boolean;
  items: PublicNavigationItem[];
  openAccordionId: string | null;
  onToggleAccordion: (id: string) => void;
  onClose: () => void;
};

export function SiteMobileNav({
  open,
  items,
  openAccordionId,
  onToggleAccordion,
  onClose,
}: SiteMobileNavProps) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open || !mounted) {
    return null;
  }

  const overlay = (
    <div id="site-mobile-nav" className="site-mobile" role="presentation">
      <button
        type="button"
        className="site-mobile__backdrop"
        aria-label="Menüyü kapat"
        onClick={onClose}
      />
      <aside
        className="site-mobile__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="site-mobile__header">
          <h2 id={titleId} className="site-mobile__title">
            Menü
          </h2>
          <button type="button" className="site-mobile__close" aria-label="Menüyü kapat" onClick={onClose}>
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <nav className="site-mobile__nav" aria-label="Mobil ana menü">
          <ul className="site-mobile__list">
            {items.map((item) => {
              const href = sanitizeNavHref(item.href);
              const children = (item.children ?? [])
                .map((child) => ({ ...child, href: sanitizeNavHref(child.href) }))
                .filter((child) => Boolean(child.href));
              const hasChildren = hasNavChildren(children);
              const isOpen = openAccordionId === item.id;
              const panelId = `mobile-panel-${item.id}`;

              if (!hasChildren) {
                if (!href) {
                  return (
                    <li key={item.id} className="site-mobile__item">
                      <span className="site-mobile__inert">{item.label}</span>
                    </li>
                  );
                }

                return (
                  <li key={item.id} className="site-mobile__item">
                    <SiteNavLink
                      href={href}
                      openInNewTab={item.openInNewTab}
                      className="site-mobile__link"
                      onNavigate={onClose}
                    >
                      {item.label}
                    </SiteNavLink>
                  </li>
                );
              }

              return (
                <li key={item.id} className={`site-mobile__item${isOpen ? ' is-open' : ''}`}>
                  <div className="site-mobile__row">
                    {href ? (
                      <SiteNavLink
                        href={href}
                        openInNewTab={item.openInNewTab}
                        className="site-mobile__link"
                        onNavigate={onClose}
                      >
                        {item.label}
                      </SiteNavLink>
                    ) : (
                      <button
                        type="button"
                        className="site-mobile__accordion-label"
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        onClick={() => onToggleAccordion(item.id)}
                      >
                        {item.label}
                      </button>
                    )}
                    <button
                      type="button"
                      className="site-mobile__chevron"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      aria-label={`${item.label} alt menüsünü ${isOpen ? 'kapat' : 'aç'}`}
                      onClick={() => onToggleAccordion(item.id)}
                    >
                      <ChevronDown size={18} aria-hidden="true" />
                    </button>
                  </div>
                  <ul
                    id={panelId}
                    className="site-mobile__children"
                    hidden={!isOpen}
                    aria-hidden={!isOpen}
                  >
                    {children.map((child) => (
                      <li key={child.id}>
                        <SiteNavLink
                          href={child.href as string}
                          openInNewTab={child.openInNewTab}
                          className="site-mobile__child-link"
                          onNavigate={onClose}
                        >
                          {child.label}
                        </SiteNavLink>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </div>
  );

  return createPortal(overlay, document.body);
}
