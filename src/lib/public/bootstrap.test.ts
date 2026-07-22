import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  createEmptyPublicBootstrap,
  fetchPublicBootstrap,
} from '@/lib/public/bootstrap';

describe('fetchPublicBootstrap', () => {
  const originalFetch = global.fetch;
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:4000';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
  });

  it('returns navigation from bootstrap response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        site: { siteName: 'Demo' },
        navigation: [{ id: '1', label: 'Ana', href: '/', openInNewTab: false, children: [] }],
      }),
    }) as unknown as typeof fetch;

    const result = await fetchPublicBootstrap();
    expect(result.site.siteName).toBe('Demo');
    expect(result.navigation).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/public/bootstrap',
      expect.objectContaining({ cache: 'no-store' }),
    );
  });

  it('returns empty defaults when request fails', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('network')) as unknown as typeof fetch;
    const result = await fetchPublicBootstrap();
    expect(result).toEqual(createEmptyPublicBootstrap());
  });
});
