'use client';

import { useEffect, useId, useRef } from 'react';
import type { PublicNavigationItem } from '@kurumsal/shared';
import { ChevronDown } from 'lucide-react';
import { SiteNavLink } from '@/components/public/SiteNavLink';
import { hasNavChildren, sanitizeNavHref } from '@/lib/public/nav-utils';

type SiteDesktopNavProps = {
  items: PublicNavigationItem[];
  openId: string | null;
  onOpenChange: (id: string | null) => void;
};

export function SiteDesktopNav({ items, openId, onOpenChange }: SiteDesktopNavProps) {
  const baseId = useId();
  const closeTimerRef = useRef<number | null>(null);
  const openTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current != null) {
        window.clearTimeout(closeTimerRef.current);
      }
      if (openTimerRef.current != null) {
        window.clearTimeout(openTimerRef.current);
      }
    };
  }, []);

  function clearCloseTimer() {
    if (closeTimerRef.current != null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  function clearOpenTimer() {
    if (openTimerRef.current != null) {
      window.clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  }

  function scheduleOpen(id: string) {
    clearCloseTimer();
    clearOpenTimer();
    // Delay hover-open so the same pointer gesture's click can toggle without racing.
    openTimerRef.current = window.setTimeout(() => onOpenChange(id), 80);
  }

  function scheduleClose() {
    clearOpenTimer();
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => onOpenChange(null), 160);
  }

  function toggleOpen(id: string, isOpen: boolean) {
    clearOpenTimer();
    clearCloseTimer();
    onOpenChange(isOpen ? null : id);
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <nav className="site-nav site-nav--desktop" aria-label="Ana menü">
      <ul className="site-nav__list">
        {items.map((item) => {
          const href = sanitizeNavHref(item.href);
          const children = (item.children ?? [])
            .map((child) => ({ ...child, href: sanitizeNavHref(child.href) }))
            .filter((child) => Boolean(child.href));
          const hasChildren = hasNavChildren(children);
          const isOpen = openId === item.id;
          const panelId = `${baseId}-panel-${item.id}`;
          const triggerId = `${baseId}-trigger-${item.id}`;

          if (!hasChildren) {
            if (!href) {
              return (
                <li key={item.id} className="site-nav__item">
                  <span className="site-nav__label site-nav__label--inert">{item.label}</span>
                </li>
              );
            }

            return (
              <li key={item.id} className="site-nav__item">
                <SiteNavLink
                  href={href}
                  openInNewTab={item.openInNewTab}
                  className="site-nav__link"
                >
                  {item.label}
                </SiteNavLink>
              </li>
            );
          }

          return (
            <li
              key={item.id}
              className={`site-nav__item site-nav__item--has-children${isOpen ? ' is-open' : ''}`}
              onMouseEnter={() => scheduleOpen(item.id)}
              onMouseLeave={scheduleClose}
            >
              <div className="site-nav__trigger-row">
                {href ? (
                  <SiteNavLink
                    href={href}
                    openInNewTab={item.openInNewTab}
                    className="site-nav__link"
                  >
                    {item.label}
                  </SiteNavLink>
                ) : (
                  <button
                    type="button"
                    id={triggerId}
                    className="site-nav__button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    aria-haspopup="true"
                    onClick={() => toggleOpen(item.id, isOpen)}
                  >
                    {item.label}
                  </button>
                )}
                <button
                  type="button"
                  className="site-nav__chevron"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  aria-label={`${item.label} alt menüsünü ${isOpen ? 'kapat' : 'aç'}`}
                  onClick={() => toggleOpen(item.id, isOpen)}
                >
                  <ChevronDown size={16} aria-hidden="true" />
                </button>
              </div>

              <div
                id={panelId}
                className="site-nav__dropdown"
                role="region"
                aria-label={`${item.label} alt menü`}
                hidden={!isOpen}
                onMouseEnter={() => {
                  clearOpenTimer();
                  clearCloseTimer();
                }}
              >
                <ul className="site-nav__dropdown-list">
                  {children.map((child) => (
                    <li key={child.id}>
                      <SiteNavLink
                        href={child.href as string}
                        openInNewTab={child.openInNewTab}
                        className="site-nav__dropdown-link"
                        onNavigate={() => onOpenChange(null)}
                      >
                        {child.label}
                      </SiteNavLink>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
