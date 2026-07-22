import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PublicNavigationItem, PublicSiteSettings } from '@kurumsal/shared';
import { SiteHeader } from '@/components/public/SiteHeader';
import { createEmptyPublicSiteSettings } from '@/lib/public/bootstrap';

const replaceMock = vi.fn();
let mockPathname = '/';

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ replace: replaceMock, push: vi.fn() }),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
    onClick,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    [key: string]: unknown;
  }) => (
    <a href={href} className={className} onClick={onClick} {...rest}>
      {children}
    </a>
  ),
}));

const site: PublicSiteSettings = {
  ...createEmptyPublicSiteSettings(),
  siteName: 'Demo Taş',
  logoUrl: 'https://cdn.example.com/logo.png',
  logoAlt: 'Demo logo',
};

const navigation: PublicNavigationItem[] = [
  {
    id: '1',
    label: 'Ana Sayfa',
    href: '/',
    openInNewTab: false,
    children: [],
  },
  {
    id: '2',
    label: 'İç Mekan Ürünler',
    href: null,
    openInNewTab: false,
    children: [
      {
        id: '2a',
        label: 'Mermer',
        href: '/urunler/mermer',
        openInNewTab: false,
        children: [],
      },
      {
        id: '2b',
        label: 'Granit',
        href: '/urunler/granit',
        openInNewTab: false,
        children: [],
      },
    ],
  },
  {
    id: '3',
    label: 'Projeler',
    href: '/projeler',
    openInNewTab: false,
    children: [
      {
        id: '3a',
        label: 'Referanslar',
        href: '/projeler/referanslar',
        openInNewTab: true,
        children: [],
      },
    ],
  },
  {
    id: '4',
    label: 'Dış Bağlantı',
    href: 'https://example.com',
    openInNewTab: true,
    children: [],
  },
];

function renderHeader(items: PublicNavigationItem[] = navigation) {
  return render(<SiteHeader site={site} navigation={items} />);
}

describe('SiteHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = '/';
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('min-width: 901px'),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
  });

  it('renders bootstrap navigation labels in order', () => {
    renderHeader();
    const nav = screen.getByRole('navigation', { name: 'Ana menü' });
    const labels = within(nav)
      .getAllByRole('listitem')
      .map((item) => item.textContent ?? '');
    expect(labels[0]).toContain('Ana Sayfa');
    expect(labels[1]).toContain('İç Mekan Ürünler');
    expect(labels[2]).toContain('Projeler');
    expect(labels[3]).toContain('Dış Bağlantı');
  });

  it('renders childless linked items as links', () => {
    renderHeader();
    expect(screen.getByRole('link', { name: 'Ana Sayfa' })).toHaveAttribute('href', '/');
  });

  it('renders href:null parents as buttons, not anchors', async () => {
    const user = userEvent.setup();
    renderHeader();

    const trigger = screen.getByRole('button', { name: 'İç Mekan Ürünler' });
    expect(trigger.tagName).toBe('BUTTON');
    expect(screen.queryByRole('link', { name: 'İç Mekan Ürünler' })).not.toBeInTheDocument();

    await user.click(trigger);
    expect(screen.getByRole('link', { name: 'Mermer' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Granit' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/');
  });

  it('shows children in order and closes previous dropdown when another opens', async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole('button', { name: 'İç Mekan Ürünler' }));
    const firstPanel = screen.getByRole('region', { name: 'İç Mekan Ürünler alt menü' });
    const childLinks = within(firstPanel).getAllByRole('link');
    expect(childLinks.map((link) => link.textContent)).toEqual(['Mermer', 'Granit']);

    await user.click(screen.getByRole('button', { name: 'Projeler alt menüsünü aç' }));
    expect(screen.queryByRole('link', { name: 'Mermer' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Referanslar' })).toBeInTheDocument();
  });

  it('closes dropdown on Escape and outside click', async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole('button', { name: 'İç Mekan Ürünler' }));
    expect(screen.getByRole('link', { name: 'Mermer' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('link', { name: 'Mermer' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'İç Mekan Ürünler' }));
    expect(screen.getByRole('link', { name: 'Mermer' })).toBeInTheDocument();

    const outside = document.createElement('button');
    outside.type = 'button';
    outside.textContent = 'outside';
    document.body.appendChild(outside);
    await user.click(outside);
    outside.remove();
    expect(screen.queryByRole('link', { name: 'Mermer' })).not.toBeInTheDocument();
  });

  it('keeps link and chevron separate for linked parents with children', async () => {
    const user = userEvent.setup();
    renderHeader();

    const projectLink = screen.getByRole('link', { name: 'Projeler' });
    expect(projectLink).toHaveAttribute('href', '/projeler');

    await user.click(screen.getByRole('button', { name: 'Projeler alt menüsünü aç' }));
    expect(screen.getByRole('link', { name: 'Referanslar' })).toBeInTheDocument();
  });

  it('applies openInNewTab target and rel', () => {
    renderHeader();
    const external = screen.getByRole('link', { name: 'Dış Bağlantı' });
    expect(external).toHaveAttribute('target', '_blank');
    expect(external).toHaveAttribute('rel', 'noopener noreferrer');

    // open child with openInNewTab after opening dropdown via fireEvent in previous tests pattern
  });

  it('applies openInNewTab on dropdown children', async () => {
    const user = userEvent.setup();
    renderHeader();
    await user.click(screen.getByRole('button', { name: 'Projeler alt menüsünü aç' }));
    const child = screen.getByRole('link', { name: 'Referanslar' });
    expect(child).toHaveAttribute('target', '_blank');
    expect(child).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('does not break with empty navigation', () => {
    renderHeader([]);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Demo Taş' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Ana menü' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Menüyü aç/i })).not.toBeInTheDocument();
  });

  it('opens and closes mobile menu with hamburger', async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        media: '',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });

    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole('button', { name: 'Menüyü aç' }));
    expect(screen.getByRole('dialog', { name: 'Menü' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Mobil ana menü' })).toBeInTheDocument();

    const overlay = document.getElementById('site-mobile-nav');
    expect(overlay).not.toBeNull();
    expect(overlay?.parentElement).toBe(document.body);
    expect(overlay).toHaveClass('site-mobile');
    expect(document.body.style.overflow).toBe('hidden');

    const closeButtons = screen.getAllByRole('button', { name: 'Menüyü kapat' });
    await user.click(closeButtons[closeButtons.length - 1]!);
    expect(screen.queryByRole('dialog', { name: 'Menü' })).not.toBeInTheDocument();
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('supports mobile accordion for children and linkless parents', async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });

    const user = userEvent.setup();
    renderHeader();
    await user.click(screen.getByRole('button', { name: 'Menüyü aç' }));

    const mobileNav = screen.getByRole('navigation', { name: 'Mobil ana menü' });
    expect(within(mobileNav).queryByRole('link', { name: 'Mermer' })).not.toBeInTheDocument();

    const trigger = within(mobileNav).getByRole('button', { name: 'İç Mekan Ürünler' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(within(mobileNav).getByRole('link', { name: 'Mermer' })).toBeInTheDocument();

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(within(mobileNav).queryByRole('link', { name: 'Mermer' })).not.toBeInTheDocument();

    await user.click(trigger);
    expect(within(mobileNav).getByRole('link', { name: 'Mermer' })).toBeInTheDocument();

    await user.click(within(mobileNav).getByRole('button', { name: 'Projeler alt menüsünü aç' }));
    expect(within(mobileNav).queryByRole('link', { name: 'Mermer' })).not.toBeInTheDocument();
    expect(within(mobileNav).getByRole('link', { name: 'Referanslar' })).toBeInTheDocument();
  });

  it('resets accordion state when mobile drawer is reopened', async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });

    const user = userEvent.setup();
    renderHeader();
    await user.click(screen.getByRole('button', { name: 'Menüyü aç' }));

    const mobileNav = screen.getByRole('navigation', { name: 'Mobil ana menü' });
    await user.click(within(mobileNav).getByRole('button', { name: 'İç Mekan Ürünler' }));
    expect(within(mobileNav).getByRole('link', { name: 'Mermer' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Menüyü kapat', expanded: true }));
    await user.click(screen.getByRole('button', { name: 'Menüyü aç', expanded: false }));

    const reopenedNav = screen.getByRole('navigation', { name: 'Mobil ana menü' });
    expect(within(reopenedNav).queryByRole('link', { name: 'Mermer' })).not.toBeInTheDocument();
    expect(
      within(reopenedNav).getByRole('button', { name: 'İç Mekan Ürünler' }),
    ).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes mobile panel after navigating a link', async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });

    const user = userEvent.setup();
    renderHeader();
    await user.click(screen.getByRole('button', { name: 'Menüyü aç' }));
    const mobileNav = screen.getByRole('navigation', { name: 'Mobil ana menü' });
    await user.click(within(mobileNav).getByRole('link', { name: 'Ana Sayfa' }));
    expect(screen.queryByRole('dialog', { name: 'Menü' })).not.toBeInTheDocument();
  });

  it('clears open menus when route changes', async () => {
    const user = userEvent.setup();
    const { rerender } = renderHeader();

    await user.click(screen.getByRole('button', { name: 'İç Mekan Ürünler' }));
    expect(screen.getByRole('link', { name: 'Mermer' })).toBeInTheDocument();

    mockPathname = '/projeler';
    rerender(<SiteHeader site={site} navigation={navigation} />);
    expect(screen.queryByRole('link', { name: 'Mermer' })).not.toBeInTheDocument();
  });

  it('does not embed static Dorian or Woontegra menu labels', () => {
    renderHeader([]);
    expect(screen.queryByText(/Woontegra/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Dorian/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Yazılımlar/i)).not.toBeInTheDocument();
  });
});
