import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PublicHeroResponse } from '@kurumsal/shared';
import { createDefaultHeroSlideContent } from '@kurumsal/shared';
import { SiteHero } from '@/components/public/SiteHero';
import { mapPublicHeroFromAdmin } from '@/lib/hero/preview';
import type { HeroSettings, HeroSlide } from '@kurumsal/shared';

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

function baseHero(overrides: Partial<PublicHeroResponse> = {}): NonNullable<PublicHeroResponse> {
  const content = createDefaultHeroSlideContent();
  content.title.enabled = true;
  content.title.text = 'Başlık';
  return {
    displayMode: 'CAROUSEL',
    widthMode: 'FULL',
    maxWidthPx: 1400,
    heightMode: 'FIXED',
    fixedHeightDesktopPx: 400,
    fixedHeightMobilePx: 280,
    autoplay: false,
    autoplayIntervalSec: 6,
    showArrows: true,
    showDots: true,
    transitionEffect: 'FADE',
    loop: true,
    controlTone: 'LIGHT',
    slides: [
      {
        id: '1',
        desktopImageUrl: 'https://cdn.example.com/1.jpg',
        mobileImageUrl: null,
        altText: 'Bir',
        objectFit: 'COVER',
        content,
      },
      {
        id: '2',
        desktopImageUrl: 'https://cdn.example.com/2.jpg',
        mobileImageUrl: 'https://cdn.example.com/2-m.jpg',
        altText: 'İki',
        objectFit: 'CONTAIN',
        content: createDefaultHeroSlideContent(),
      },
    ],
    ...overrides,
  };
}

describe('SiteHero', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        media: '',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
  });
  it('hides arrows/dots/autoplay controls for single slide mode', () => {
    render(
      <SiteHero
        hero={baseHero({
          displayMode: 'SINGLE',
          showArrows: false,
          showDots: false,
          slides: [baseHero().slides[0]!],
        })}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Önceki slayt' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sonraki slayt' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });

  it('renders carousel controls and switches slides', async () => {
    const user = userEvent.setup();
    render(<SiteHero hero={baseHero()} />);
    expect(screen.getByRole('button', { name: 'Önceki slayt' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Slayt 1' })).toHaveAttribute('aria-selected', 'true');
    await user.click(screen.getByRole('button', { name: 'Sonraki slayt' }));
    expect(screen.getByRole('tab', { name: 'Slayt 2' })).toHaveAttribute('aria-selected', 'true');
  });

  it('renders optional title and omits empty content-only image slides content shell', () => {
    const hero = baseHero({
      slides: [
        {
          id: 'x',
          desktopImageUrl: 'https://cdn.example.com/x.jpg',
          mobileImageUrl: null,
          altText: 'Sadece görsel',
          objectFit: 'COVER',
          content: createDefaultHeroSlideContent(),
        },
      ],
      displayMode: 'SINGLE',
      showArrows: false,
      showDots: false,
    });
    render(<SiteHero hero={hero} />);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByAltText('Sadece görsel')).toBeInTheDocument();
  });
});

describe('mapPublicHeroFromAdmin', () => {
  it('does not keep inactive slides and respects single selection', () => {
    const content = createDefaultHeroSlideContent();
    const slides: HeroSlide[] = [
      {
        id: 'a',
        desktopImageUrl: 'https://cdn.example.com/a.jpg',
        desktopImagePathname: null,
        mobileImageUrl: null,
        mobileImagePathname: null,
        altText: 'A',
        isActive: false,
        sortOrder: 0,
        objectFit: 'COVER',
        content,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'b',
        desktopImageUrl: 'https://cdn.example.com/b.jpg',
        desktopImagePathname: null,
        mobileImageUrl: null,
        mobileImagePathname: null,
        altText: 'B',
        isActive: true,
        sortOrder: 1,
        objectFit: 'COVER',
        content,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ];

    const settings: HeroSettings = {
      id: 's',
      displayMode: 'SINGLE',
      widthMode: 'CONTAINED',
      maxWidthPx: 1200,
      heightMode: 'AUTO',
      fixedHeightDesktopPx: 500,
      fixedHeightMobilePx: 300,
      singleSlideId: 'b',
      autoplay: true,
      autoplayIntervalSec: 5,
      showArrows: true,
      showDots: true,
      transitionEffect: 'FADE',
      loop: true,
      controlTone: 'LIGHT',
      slides,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    const pub = mapPublicHeroFromAdmin(settings);
    expect(pub?.slides).toHaveLength(1);
    expect(pub?.slides[0]?.id).toBe('b');
    expect(pub?.showArrows).toBe(false);
  });

  it('previews inactive draft slide in admin overlay mode', () => {
    const content = createDefaultHeroSlideContent();
    content.title.enabled = true;
    content.title.text = 'Taslak';
    const draft: HeroSlide = {
      id: 'a',
      desktopImageUrl: 'https://cdn.example.com/a.jpg',
      desktopImagePathname: null,
      mobileImageUrl: null,
      mobileImagePathname: null,
      altText: 'A',
      isActive: false,
      sortOrder: 0,
      objectFit: 'COVER',
      content,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const settings: HeroSettings = {
      id: 's',
      displayMode: 'CAROUSEL',
      widthMode: 'FULL',
      maxWidthPx: 1400,
      heightMode: 'AUTO',
      fixedHeightDesktopPx: 500,
      fixedHeightMobilePx: 300,
      singleSlideId: null,
      autoplay: false,
      autoplayIntervalSec: 5,
      showArrows: true,
      showDots: true,
      transitionEffect: 'FADE',
      loop: true,
      controlTone: 'LIGHT',
      slides: [draft],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const pub = mapPublicHeroFromAdmin(settings, draft);
    expect(pub?.slides).toHaveLength(1);
    expect(pub?.slides[0]?.content.title.text).toBe('Taslak');
  });
});
