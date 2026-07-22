import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { HeroSettings, HeroSlide, MediaAsset, PublicHeroResponse } from '@kurumsal/shared';
import { createDefaultHeroSlideContent } from '@kurumsal/shared';
import { AdminApiError } from '@/lib/auth/types';

const { desktopAsset, mobileAsset, replaceMock, routerMock } = vi.hoisted(() => {
  const replaceMock = vi.fn();
  const routerMock = { replace: replaceMock, push: vi.fn() };
  const desktopAsset: MediaAsset = {
    id: 'media-desktop',
    filename: 'hero-desktop.jpg',
    originalFilename: 'hero-desktop.jpg',
    url: 'https://cdn.example.com/hero-desktop.jpg',
    pathname: 'media/2026/07/hero-desktop.jpg',
    mimeType: 'image/jpeg',
    extension: 'jpg',
    sizeBytes: 204800,
    width: 1600,
    height: 900,
    altText: 'Hero desktop',
    title: null,
    caption: null,
    createdById: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
  const mobileAsset: MediaAsset = {
    ...desktopAsset,
    id: 'media-mobile',
    filename: 'hero-mobile.jpg',
    originalFilename: 'hero-mobile.jpg',
    url: 'https://cdn.example.com/hero-mobile.jpg',
    pathname: 'media/2026/07/hero-mobile.jpg',
    altText: 'Hero mobile',
  };
  return { desktopAsset, mobileAsset, replaceMock, routerMock };
});

vi.mock('next/navigation', () => ({
  useRouter: () => routerMock,
}));

vi.mock('@/components/admin/session/AdminSessionProvider', () => ({
  useAdminSession: vi.fn(),
}));

vi.mock('@/lib/hero/api', () => ({
  fetchHeroSettings: vi.fn(),
  updateHeroSettings: vi.fn(),
  createHeroSlide: vi.fn(),
  updateHeroSlide: vi.fn(),
  reorderHeroSlides: vi.fn(),
  deleteHeroSlide: vi.fn(),
  isForbiddenError: (error: unknown) => error instanceof AdminApiError && error.code === 'FORBIDDEN',
  isUnauthorizedError: (error: unknown) => error instanceof AdminApiError && error.code === 'UNAUTHORIZED',
}));

vi.mock('@/components/public/SiteHero', () => ({
  SiteHero: ({ hero }: { hero: PublicHeroResponse }) => (
    <div data-testid="hero-live-preview">
      {hero.slides.map((slide) => (
        <img
          key={slide.id}
          data-testid="hero-preview-image"
          src={
            slide.mobileImageUrl && hero.slides.length
              ? slide.desktopImageUrl
              : slide.desktopImageUrl
          }
          data-desktop={slide.desktopImageUrl}
          data-mobile={slide.mobileImageUrl ?? ''}
          alt={slide.altText || 'hero-preview'}
        />
      ))}
    </div>
  ),
}));

/** Controllable stub: mirrors confirm/cancel flow without real media API. */
vi.mock('@/components/admin/product-categories/ProductCategoryMediaPicker', () => ({
  ProductCategoryMediaPicker: ({
    open,
    onClose,
    onSelect,
    description,
  }: {
    open: boolean;
    onClose: () => void;
    onSelect: (asset: MediaAsset) => void;
    description?: string;
  }) => {
    if (!open) return null;
    const isMobile = Boolean(description?.toLowerCase().includes('mobil görsel için'));
    const asset = isMobile ? mobileAsset : desktopAsset;
    return (
      <div role="dialog" aria-label="Medya Kütüphanesinden Seç">
        <p>{description}</p>
        <button
          type="button"
          onClick={() => {
            onSelect(asset);
            onClose();
          }}
        >
          Seçili görseli kullan
        </button>
        <button
          type="button"
          onClick={() => {
            onSelect({ ...asset, url: 'blob:http://localhost/fake' });
          }}
        >
          Blob URL kullan
        </button>
        <button type="button" onClick={onClose}>
          Vazgeç
        </button>
      </div>
    );
  },
}));

import { useAdminSession } from '@/components/admin/session/AdminSessionProvider';
import {
  createHeroSlide,
  fetchHeroSettings,
  updateHeroSlide,
} from '@/lib/hero/api';
import { HeroSliderPageClient } from '@/components/admin/hero/HeroSliderPageClient';

const mockedSession = useAdminSession as unknown as ReturnType<typeof vi.fn>;
const mockedFetch = fetchHeroSettings as unknown as ReturnType<typeof vi.fn>;
const mockedCreate = createHeroSlide as unknown as ReturnType<typeof vi.fn>;
const mockedUpdate = updateHeroSlide as unknown as ReturnType<typeof vi.fn>;

function baseSettings(slides: HeroSlide[] = []): HeroSettings {
  return {
    id: 'hero-1',
    displayMode: 'CAROUSEL',
    widthMode: 'FULL',
    maxWidthPx: 1200,
    heightMode: 'AUTO',
    fixedHeightDesktopPx: 560,
    fixedHeightMobilePx: 420,
    singleSlideId: null,
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
}

function existingSlide(overrides: Partial<HeroSlide> = {}): HeroSlide {
  return {
    id: 'slide-1',
    desktopImageUrl: 'https://cdn.example.com/existing-desktop.jpg',
    desktopImagePathname: 'media/existing-desktop.jpg',
    mobileImageUrl: 'https://cdn.example.com/existing-mobile.jpg',
    mobileImagePathname: 'media/existing-mobile.jpg',
    altText: 'Mevcut',
    isActive: true,
    sortOrder: 0,
    objectFit: 'COVER',
    content: createDefaultHeroSlideContent(),
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function draftCards() {
  return screen.getAllByText('Yeni slayt');
}

async function renderReady(settings: HeroSettings) {
  mockedFetch.mockResolvedValue(settings);
  render(<HeroSliderPageClient />);
  await waitFor(() => {
    expect(screen.queryByText(/Hero editörü yükleniyor/i)).not.toBeInTheDocument();
  });
  expect(screen.queryByText(/Hero ayarları yüklenemedi/i)).not.toBeInTheDocument();
}

describe('HeroSliderPageClient empty-slide media flow', () => {
  beforeEach(() => {
    mockedFetch.mockReset();
    mockedCreate.mockReset();
    mockedUpdate.mockReset();
    replaceMock.mockReset();
    mockedSession.mockReturnValue({
      admin: { id: '1', fullName: 'Admin', email: 'a@b.c', role: 'ADMIN' },
    });
  });

  it('creates one selected draft slide from empty-state media confirm without saving', async () => {
    const user = userEvent.setup();
    await renderReady(baseSettings([]));

    expect(screen.getByText('Düzenlemek için sol listeden bir slayt seçin.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Medya seç' })).toBeInTheDocument();
    expect(screen.queryByText('Taslak')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Medya seç' }));
    const dialog = await screen.findByRole('dialog', { name: 'Medya Kütüphanesinden Seç' });
    await user.click(within(dialog).getByRole('button', { name: 'Seçili görseli kullan' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    expect(draftCards().length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Taslak')).toBeInTheDocument();
    expect(screen.queryByText('Düzenlemek için sol listeden bir slayt seçin.')).not.toBeInTheDocument();
    expect(screen.getByText('Kaydedilmedi')).toBeInTheDocument();
    expect(screen.getByText('Masaüstü görseli *')).toBeInTheDocument();

    const desktopCard = screen.getByText('Masaüstü görseli *').closest('.he-card') as HTMLElement;
    expect(desktopCard.querySelector('img')).toHaveAttribute('src', desktopAsset.url);

    const preview = await screen.findByTestId('hero-preview-image');
    expect(preview).toHaveAttribute('data-desktop', desktopAsset.url);

    expect(mockedCreate).not.toHaveBeenCalled();
    expect(mockedUpdate).not.toHaveBeenCalled();
    expect(screen.getAllByText('Taslak')).toHaveLength(1);
  });

  it('does not create a slide when media picker is cancelled', async () => {
    const user = userEvent.setup();
    await renderReady(baseSettings([]));

    await user.click(screen.getByRole('button', { name: 'Medya seç' }));
    const dialog = await screen.findByRole('dialog', { name: 'Medya Kütüphanesinden Seç' });
    await user.click(within(dialog).getByRole('button', { name: 'Vazgeç' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    expect(screen.queryByText('Taslak')).not.toBeInTheDocument();
    expect(screen.getByText('Düzenlemek için sol listeden bir slayt seçin.')).toBeInTheDocument();
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it('rejects blob URLs without closing or creating a draft', async () => {
    const user = userEvent.setup();
    await renderReady(baseSettings([]));

    await user.click(screen.getByRole('button', { name: 'Medya seç' }));
    const dialog = await screen.findByRole('dialog', { name: 'Medya Kütüphanesinden Seç' });
    await user.click(within(dialog).getByRole('button', { name: 'Blob URL kullan' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/kalıcı bir medya kaydı seçin/i);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByText('Taslak')).not.toBeInTheDocument();
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it('includes the draft slide in create payload when Kaydet is pressed', async () => {
    const user = userEvent.setup();
    const saved = existingSlide({
      id: 'slide-saved',
      desktopImageUrl: desktopAsset.url,
      desktopImagePathname: desktopAsset.pathname,
      altText: desktopAsset.altText || '',
      mobileImageUrl: null,
      mobileImagePathname: null,
    });

    let currentSettings = baseSettings([]);
    mockedFetch.mockImplementation(async () => currentSettings);
    mockedCreate.mockImplementation(async (_payload: unknown) => {
      currentSettings = baseSettings([saved]);
      return saved;
    });

    render(<HeroSliderPageClient />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Medya seç' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Medya seç' }));
    await user.click(await screen.findByRole('button', { name: 'Seçili görseli kullan' }));
    await waitFor(() => expect(screen.getByText('Taslak')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Kaydet' }));

    await waitFor(() => {
      expect(mockedCreate).toHaveBeenCalledTimes(1);
    });

    expect(mockedCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        desktopImageUrl: desktopAsset.url,
        desktopImagePathname: desktopAsset.pathname,
        altText: desktopAsset.altText,
        mobileImageUrl: null,
        content: expect.any(Object),
      }),
    );
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it('creates a blank draft via + Yeni using the same draft helper', async () => {
    const user = userEvent.setup();
    await renderReady(baseSettings([]));

    await user.click(screen.getByRole('button', { name: /^\+?\s*Yeni$/i }));

    expect(screen.getByText('Taslak')).toBeInTheDocument();
    expect(screen.queryByText('Düzenlemek için sol listeden bir slayt seçin.')).not.toBeInTheDocument();
    expect(screen.getByText('Masaüstü görseli *')).toBeInTheDocument();
    expect(mockedCreate).not.toHaveBeenCalled();
  });
});

describe('HeroSliderPageClient existing-slide media flow', () => {
  beforeEach(() => {
    mockedFetch.mockReset();
    mockedCreate.mockReset();
    mockedUpdate.mockReset();
    replaceMock.mockReset();
    mockedSession.mockReturnValue({
      admin: { id: '1', fullName: 'Admin', email: 'a@b.c', role: 'ADMIN' },
    });
  });

  it('updates only desktop image on existing active slide', async () => {
    const user = userEvent.setup();
    const slide = existingSlide();
    await renderReady(baseSettings([slide]));

    expect(screen.queryByText('Taslak')).not.toBeInTheDocument();

    const desktopCard = screen.getByText('Masaüstü görseli *').closest('.he-card') as HTMLElement;
    await user.click(within(desktopCard).getByRole('button', { name: 'Değiştir' }));

    const dialog = await screen.findByRole('dialog', { name: 'Medya Kütüphanesinden Seç' });
    expect(within(dialog).getByText(/Masaüstü görseli için/i)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Seçili görseli kullan' }));

    await waitFor(() => {
      const card = screen.getByText('Masaüstü görseli *').closest('.he-card') as HTMLElement;
      expect(card.querySelector('img')).toHaveAttribute('src', desktopAsset.url);
    });

    const mobileCard = screen.getByText('Mobil görsel', { selector: '.he-card__title' }).closest('.he-card') as HTMLElement;
    expect(mobileCard.querySelector('img')).toHaveAttribute('src', slide.mobileImageUrl);

    const preview = screen.getByTestId('hero-preview-image');
    expect(preview).toHaveAttribute('data-desktop', desktopAsset.url);
    expect(preview).toHaveAttribute('data-mobile', slide.mobileImageUrl);

    expect(screen.queryByText('Taslak')).not.toBeInTheDocument();
    expect(mockedCreate).not.toHaveBeenCalled();
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it('updates only mobile image on existing active slide', async () => {
    const user = userEvent.setup();
    const slide = existingSlide();
    await renderReady(baseSettings([slide]));

    const mobileCard = screen.getByText('Mobil görsel', { selector: '.he-card__title' }).closest('.he-card') as HTMLElement;
    await user.click(within(mobileCard).getByRole('button', { name: 'Değiştir' }));

    const dialog = await screen.findByRole('dialog', { name: 'Medya Kütüphanesinden Seç' });
    expect(within(dialog).getByText(/Mobil görsel için/i)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Seçili görseli kullan' }));

    await waitFor(() => {
      const card = screen.getByText('Mobil görsel', { selector: '.he-card__title' }).closest('.he-card') as HTMLElement;
      expect(card.querySelector('img')).toHaveAttribute('src', mobileAsset.url);
    });

    const desktopCard = screen.getByText('Masaüstü görseli *').closest('.he-card') as HTMLElement;
    expect(desktopCard.querySelector('img')).toHaveAttribute('src', slide.desktopImageUrl);

    const preview = screen.getByTestId('hero-preview-image');
    expect(preview).toHaveAttribute('data-desktop', slide.desktopImageUrl);
    expect(preview).toHaveAttribute('data-mobile', mobileAsset.url);

    expect(screen.queryByText('Taslak')).not.toBeInTheDocument();
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it('does not create duplicate drafts from a single confirm', async () => {
    const user = userEvent.setup();
    await renderReady(baseSettings([]));

    await user.click(screen.getByRole('button', { name: 'Medya seç' }));
    await user.click(await screen.findByRole('button', { name: 'Seçili görseli kullan' }));

    await waitFor(() => expect(screen.getByText('Taslak')).toBeInTheDocument());
    expect(screen.getAllByText('Taslak')).toHaveLength(1);
  });
});
