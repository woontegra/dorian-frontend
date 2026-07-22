import type { PublicBootstrapResponse, PublicSiteSettings } from '@kurumsal/shared';
import { APP_NAME } from '@kurumsal/shared';

function getPublicApiBaseUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!raw) {
    return null;
  }

  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

export function createEmptyPublicSiteSettings(): PublicSiteSettings {
  return {
    siteName: APP_NAME,
    legalName: null,
    logoUrl: null,
    logoAlt: null,
    darkLogoUrl: null,
    darkLogoAlt: null,
    faviconUrl: null,
    siteUrl: null,
    email: null,
    phone: null,
    address: null,
    workingHours: null,
    facebookUrl: null,
    instagramUrl: null,
    linkedinUrl: null,
    xUrl: null,
    youtubeUrl: null,
    defaultSeoTitle: null,
    titleTemplate: null,
    defaultMetaDescription: null,
    defaultOgImageUrl: null,
  };
}

export function createEmptyPublicBootstrap(): PublicBootstrapResponse {
  return {
    site: createEmptyPublicSiteSettings(),
    navigation: [],
  };
}

/**
 * Fetches public bootstrap (site + navigation). Never throws — returns empty defaults on failure.
 */
export async function fetchPublicBootstrap(): Promise<PublicBootstrapResponse> {
  const baseUrl = getPublicApiBaseUrl();
  if (!baseUrl) {
    return createEmptyPublicBootstrap();
  }

  try {
    const response = await fetch(`${baseUrl}/api/public/bootstrap`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      return createEmptyPublicBootstrap();
    }

    const payload = (await response.json()) as Partial<PublicBootstrapResponse>;
    const fallback = createEmptyPublicBootstrap();

    return {
      site: {
        ...fallback.site,
        ...(payload.site ?? {}),
        siteName: payload.site?.siteName?.trim() || fallback.site.siteName,
      },
      navigation: Array.isArray(payload.navigation) ? payload.navigation : [],
    };
  } catch {
    return createEmptyPublicBootstrap();
  }
}
