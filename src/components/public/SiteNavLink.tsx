'use client';

import Link from 'next/link';
import { isInternalNavHref } from '@/lib/public/nav-utils';

type SiteNavLinkProps = {
  href: string;
  openInNewTab?: boolean;
  className?: string;
  children: React.ReactNode;
  onNavigate?: () => void;
};

export function SiteNavLink({
  href,
  openInNewTab = false,
  className,
  children,
  onNavigate,
}: SiteNavLinkProps) {
  const external = !isInternalNavHref(href);

  if (external || openInNewTab) {
    return (
      <a
        href={href}
        className={className}
        target={openInNewTab || external ? '_blank' : undefined}
        rel={openInNewTab || external ? 'noopener noreferrer' : undefined}
        onClick={() => onNavigate?.()}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className} onClick={() => onNavigate?.()}>
      {children}
    </Link>
  );
}
