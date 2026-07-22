import type { PublicHeroResponse } from '@kurumsal/shared';

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

/**
 * Fetches public hero payload. Never throws — returns null on failure/empty.
 */
export async function fetchPublicHero(): Promise<PublicHeroResponse> {
  const baseUrl = getPublicApiBaseUrl();
  if (!baseUrl) {
    return null;
  }

  try {
    const response = await fetch(`${baseUrl}/api/public/hero`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { hero?: PublicHeroResponse };
    return payload.hero ?? null;
  } catch {
    return null;
  }
}
