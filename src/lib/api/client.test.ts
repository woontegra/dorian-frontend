import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { getApiBaseUrl, mapApiError, apiFetch } from '@/lib/api/client';
import { AdminApiError } from '@/lib/auth/types';

describe('api client', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, NEXT_PUBLIC_API_URL: 'http://localhost:4000' };
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('reads API url from environment', () => {
    expect(getApiBaseUrl()).toBe('http://localhost:4000');
  });

  it('rejects non-https API url in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_API_URL = 'http://api.example.com';
    expect(() => getApiBaseUrl()).toThrow(/HTTPS/);
  });

  it('maps unauthorized and rate limit errors to Turkish messages', () => {
    expect(mapApiError(401).message).toMatch(/E-posta veya parola/);
    expect(mapApiError(429).code).toBe('RATE_LIMIT');
  });

  it('separates network failures from auth failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );

    await expect(apiFetch('/api/admin/auth/me')).rejects.toMatchObject({
      code: 'NETWORK',
    });
  });

  it('sends credentials include', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        id: '1',
        email: 'a@b.c',
        fullName: 'A',
        role: 'ADMIN',
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await apiFetch('/api/admin/auth/me');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/api/admin/auth/me',
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('throws AdminApiError for 401 responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({ message: 'Invalid email or password', statusCode: 401 }, { status: 401 }),
      ),
    );

    await expect(apiFetch('/api/admin/auth/login', { method: 'POST' })).rejects.toBeInstanceOf(
      AdminApiError,
    );
  });
});
