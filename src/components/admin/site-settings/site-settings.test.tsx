import React from 'react';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { render, screen, waitFor, within } from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import { SiteSettingsPageClient } from '@/components/admin/site-settings/SiteSettingsPageClient';

import { SiteSettingsSeoPreview } from '@/components/admin/site-settings/SiteSettingsSeoPreview';

import { SeoChecklist } from '@/components/admin/site-settings/SeoChecklist';

import { SETTINGS_TABS } from '@/components/admin/site-settings/settings-tabs';

import { AdminApiError } from '@/lib/auth/types';

import { toFormValues } from '@/lib/site-settings/schema';

import type { SiteSettings } from '@kurumsal/shared';



const replaceMock = vi.fn();

let searchParams = new URLSearchParams('tab=general');



vi.mock('next/navigation', () => ({

  useRouter: () => ({ replace: replaceMock, push: vi.fn() }),

  useSearchParams: () => searchParams,

}));



vi.mock('@/components/admin/session/AdminSessionProvider', () => ({

  useAdminSession: vi.fn(),

}));



vi.mock('@/lib/site-settings/api', () => ({

  fetchSiteSettings: vi.fn(),

  updateSiteSettings: vi.fn(),

  uploadSiteSettingsImage: vi.fn(),

  deleteSiteSettingsImage: vi.fn(),

  isForbiddenError: (error: unknown) => error instanceof AdminApiError && error.code === 'FORBIDDEN',

  isUnauthorizedError: (error: unknown) => error instanceof AdminApiError && error.code === 'UNAUTHORIZED',

}));



import { useAdminSession } from '@/components/admin/session/AdminSessionProvider';

import {

  deleteSiteSettingsImage,

  fetchSiteSettings,

  updateSiteSettings,

  uploadSiteSettingsImage,

} from '@/lib/site-settings/api';



const mockedSession = useAdminSession as unknown as ReturnType<typeof vi.fn>;

const mockedFetch = fetchSiteSettings as unknown as ReturnType<typeof vi.fn>;

const mockedUpdate = updateSiteSettings as unknown as ReturnType<typeof vi.fn>;

const mockedUpload = uploadSiteSettingsImage as unknown as ReturnType<typeof vi.fn>;

const mockedDelete = deleteSiteSettingsImage as unknown as ReturnType<typeof vi.fn>;



const baseSettings: SiteSettings = {

  id: '1',

  siteName: 'Demo Site',

  legalName: null,

  slogan: null,

  shortDescription: null,

  foundedYear: null,

  taxOffice: null,

  taxNumber: null,

  logoUrl: null,

  logoPathname: null,

  logoAlt: null,

  darkLogoUrl: null,

  darkLogoPathname: null,

  faviconUrl: null,

  faviconPathname: null,

  primaryEmail: null,

  secondaryEmail: null,

  primaryPhone: null,

  secondaryPhone: null,

  whatsappNumber: null,

  address: null,

  district: null,

  city: null,

  postalCode: null,

  country: 'Türkiye',

  mapEmbedUrl: null,

  workingHours: null,

  facebookUrl: null,

  instagramUrl: null,

  xUrl: null,

  linkedinUrl: null,

  youtubeUrl: null,

  siteUrl: 'https://example.com',

  defaultSeoTitle: 'Demo SEO',

  titleTemplate: '%s | Demo',

  defaultMetaDescription: 'Demo açıklama',

  defaultOgImageUrl: null,

  defaultOgImagePathname: null,

  googleSiteVerification: null,

  bingSiteVerification: null,

  googleAnalyticsId: null,

  googleTagManagerId: null,

  createdAt: '2026-01-01T00:00:00.000Z',

  updatedAt: '2026-01-01T00:00:00.000Z',

};



function renderAsAdmin(tab = 'general') {

  searchParams = new URLSearchParams(`tab=${tab}`);

  mockedSession.mockReturnValue({

    admin: { id: '1', fullName: 'Admin', email: 'a@b.c', role: 'ADMIN' },

  });

  return render(<SiteSettingsPageClient />);

}



describe('SiteSettingsPageClient', () => {

  beforeEach(() => {

    vi.clearAllMocks();

    searchParams = new URLSearchParams('tab=general');

    mockedFetch.mockResolvedValue(baseSettings);

  });



  it('shows five settings navigation tabs', async () => {

    renderAsAdmin();



    await screen.findByDisplayValue('Demo Site');



    const nav = screen.getByRole('navigation', { name: 'Site ayarları bölümleri' });

    for (const tab of SETTINGS_TABS) {

      expect(within(nav).getByRole('tab', { name: new RegExp(tab.label, 'i') })).toBeInTheDocument();

    }

  });



  it('loads and fills form for ADMIN', async () => {

    renderAsAdmin();



    expect(await screen.findByDisplayValue('Demo Site')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Site Ayarları' })).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Değişiklikleri Kaydet' })).toBeDisabled();

    expect(screen.getByText('Tüm değişiklikler kayıtlı')).toBeInTheDocument();

  });



  it('switches tabs via navigation and preserves ?tab= behavior', async () => {

    const user = userEvent.setup();

    renderAsAdmin('general');



    await screen.findByDisplayValue('Demo Site');

    await user.click(screen.getByRole('tab', { name: /Marka ve Logo/i }));



    expect(replaceMock).toHaveBeenCalledWith('/admin/settings?tab=brand');

  });



  it('opens contact tab content when ?tab=contact', async () => {

    renderAsAdmin('contact');



    expect(await screen.findByLabelText('Birincil E-posta')).toBeInTheDocument();

    expect(screen.getByText('Adres Bilgileri')).toBeInTheDocument();

  });



  it('shows unsaved changes indicator and enables save button when dirty', async () => {

    const user = userEvent.setup();

    renderAsAdmin();



    const input = await screen.findByDisplayValue('Demo Site');

    const saveButton = screen.getByRole('button', { name: 'Değişiklikleri Kaydet' });



    expect(saveButton).toBeDisabled();



    await user.type(input, 'X');



    expect(screen.getByText('Kaydedilmemiş değişiklikler')).toBeInTheDocument();

    expect(saveButton).toBeEnabled();

  });



  it('shows loading state on save button while saving', async () => {

    const user = userEvent.setup();

    let resolveUpdate: (value: SiteSettings) => void = () => undefined;

    mockedUpdate.mockImplementation(

      () =>

        new Promise<SiteSettings>((resolve) => {

          resolveUpdate = resolve;

        }),

    );



    renderAsAdmin();

    const input = await screen.findByDisplayValue('Demo Site');

    await user.type(input, 'X');

    await user.click(screen.getByRole('button', { name: 'Değişiklikleri Kaydet' }));



    expect(await screen.findByRole('button', { name: 'Kaydediliyor…' })).toHaveAttribute('aria-busy', 'true');



    resolveUpdate({ ...baseSettings, siteName: 'Demo SiteX' });



    await waitFor(() => {

      expect(screen.getByText(/başarıyla kaydedildi/i)).toBeInTheDocument();

    });

  });



  it('shows read-only notice for EDITOR', async () => {

    searchParams = new URLSearchParams('tab=general');

    mockedSession.mockReturnValue({

      admin: { id: '2', fullName: 'Editor', email: 'e@b.c', role: 'EDITOR' },

    });



    render(<SiteSettingsPageClient />);



    expect(await screen.findByText(/düzenleme yetkiniz bulunmuyor/i)).toBeInTheDocument();

    expect(screen.queryByRole('button', { name: 'Değişiklikleri Kaydet' })).not.toBeInTheDocument();

    expect(screen.getByDisplayValue('Demo Site')).toBeDisabled();

  });



  it('saves changes for ADMIN and clears dirty state', async () => {

    const user = userEvent.setup();

    mockedUpdate.mockResolvedValue({ ...baseSettings, siteName: 'Yeni Site' });



    renderAsAdmin();

    const input = await screen.findByDisplayValue('Demo Site');

    await user.clear(input);

    await user.type(input, 'Yeni Site');



    await user.click(screen.getByRole('button', { name: 'Değişiklikleri Kaydet' }));



    await waitFor(() => {

      expect(mockedUpdate).toHaveBeenCalled();

      expect(screen.getByText(/başarıyla kaydedildi/i)).toBeInTheDocument();

      expect(screen.getByText('Tüm değişiklikler kayıtlı')).toBeInTheDocument();

    });

  });



  it('shows validation errors on invalid save', async () => {

    const user = userEvent.setup();

    renderAsAdmin();



    const input = await screen.findByDisplayValue('Demo Site');

    await user.clear(input);

    await user.click(screen.getByRole('button', { name: 'Değişiklikleri Kaydet' }));



    expect(await screen.findByText(/formdaki hatalı alanları düzeltin/i)).toBeInTheDocument();

    expect(screen.getByText('Site adı zorunludur.')).toBeInTheDocument();

  });



  it('handles image upload and remove on brand tab', async () => {

    const user = userEvent.setup();

    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: vi.fn(() => 'blob:preview'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: vi.fn(),
    });

    mockedUpload.mockResolvedValue({ url: 'https://blob/logo.png', pathname: 'logo.png' });

    mockedDelete.mockResolvedValue({ ...baseSettings, logoUrl: null, logoPathname: null });



    renderAsAdmin('brand');



    expect((await screen.findAllByText('Henüz görsel yüklenmedi')).length).toBeGreaterThan(0);



    const logoCard = screen.getByRole('article', { name: 'Logo' });

    const fileInput = logoCard.querySelector('input[type="file"]') as HTMLInputElement;

    const file = new File(['logo'], 'logo.png', { type: 'image/png' });

    await user.upload(fileInput, file);



    await user.click(within(logoCard).getByRole('button', { name: 'Yükle' }));



    await waitFor(() => {

      expect(mockedUpload).toHaveBeenCalledWith('logo', expect.any(File));

      expect(screen.getByText(/başarıyla yüklendi/i)).toBeInTheDocument();

    });



    await user.click(within(logoCard).getByRole('button', { name: 'Kaldır' }));

    const dialog = screen.getByRole('alertdialog');

    await user.click(within(dialog).getByRole('button', { name: 'Kaldır' }));



    await waitFor(() => {

      expect(mockedDelete).toHaveBeenCalledWith('logo');

    });

  });



  it('shows SEO preview and checklist on seo tab', async () => {

    renderAsAdmin('seo');



    expect(await screen.findByLabelText('Arama sonucu önizlemesi')).toBeInTheDocument();

    expect(screen.getByLabelText('SEO tamamlanma kontrol listesi')).toBeInTheDocument();

    expect(screen.getByText('Demo SEO | Demo')).toBeInTheDocument();

    expect(screen.getByText('3/5 tamamlandı')).toBeInTheDocument();

  });



  it('shows forbidden message without redirecting to login on 403', async () => {

    mockedUpdate.mockRejectedValue(new AdminApiError('Bu işlem için yetkiniz yok.', 403, 'FORBIDDEN'));



    const user = userEvent.setup();

    renderAsAdmin();

    const input = await screen.findByDisplayValue('Demo Site');

    await user.type(input, 'X');



    await user.click(screen.getByRole('button', { name: 'Değişiklikleri Kaydet' }));



    expect(await screen.findByText(/yetkiniz yok/i)).toBeInTheDocument();

    expect(replaceMock).not.toHaveBeenCalledWith('/admin/login');

  });



  it('redirects to login on 401', async () => {

    mockedFetch.mockRejectedValue(new AdminApiError('Unauthorized', 401, 'UNAUTHORIZED'));



    renderAsAdmin();



    await waitFor(() => {

      expect(replaceMock).toHaveBeenCalledWith('/admin/login');

    });

  });



  it('uses horizontal scrollable navigation on mobile viewport', async () => {

    Object.defineProperty(window, 'matchMedia', {

      writable: true,

      value: vi.fn().mockImplementation((query: string) => ({

        matches: query.includes('max-width'),

        media: query,

        onchange: null,

        addListener: vi.fn(),

        removeListener: vi.fn(),

        addEventListener: vi.fn(),

        removeEventListener: vi.fn(),

        dispatchEvent: vi.fn(),

      })),

    });



    renderAsAdmin();



    const nav = await screen.findByRole('navigation', { name: 'Site ayarları bölümleri' });

    expect(nav).toHaveClass('admin-settings-nav');

    expect(nav.querySelector('.admin-settings-nav__list')).toBeTruthy();

  });

});



describe('SiteSettingsSeoPreview', () => {

  it('shows character counters and approximate preview', () => {

    render(

      <SiteSettingsSeoPreview

        values={toFormValues(baseSettings)}

        siteUrl={baseSettings.siteUrl}

        ogImageUrl={null}

      />,

    );



    expect(screen.getByText('SEO başlığı')).toBeInTheDocument();

    expect(screen.getByText('8/70')).toBeInTheDocument();

    expect(screen.getByText('Meta açıklama')).toBeInTheDocument();

    expect(screen.getByText('13/160')).toBeInTheDocument();

    expect(screen.getByText(/yaklaşık bir görünüm sunar/i)).toBeInTheDocument();

    expect(screen.getByText('Demo SEO | Demo')).toBeInTheDocument();

  });

});



describe('SeoChecklist', () => {

  it('computes checklist completion from form values in real time', () => {

    const values = toFormValues({

      ...baseSettings,

      googleSiteVerification: 'abc123',

      defaultOgImageUrl: 'https://example.com/og.png',

    });



    render(<SeoChecklist values={values} ogImageUrl="https://example.com/og.png" />);



    expect(screen.getByText('5/5 tamamlandı')).toBeInTheDocument();

    expect(screen.getByText('Site URL girilmiş')).toBeInTheDocument();

  });

});

