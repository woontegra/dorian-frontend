import { AdminApiError, type ApiErrorPayload } from '@/lib/auth/types';

export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (!raw) {
    throw new AdminApiError(
      'API adresi yapılandırılmamış. NEXT_PUBLIC_API_URL değerini kontrol edin.',
      500,
      'INSECURE',
    );
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new AdminApiError('API adresi geçersiz. NEXT_PUBLIC_API_URL değerini kontrol edin.', 500, 'INSECURE');
  }

  if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
    throw new AdminApiError(
      'Güvenlik nedeniyle production ortamında API adresi HTTPS olmalıdır.',
      500,
      'INSECURE',
    );
  }

  return url.origin;
}

export function mapApiError(status: number, payload?: ApiErrorPayload): AdminApiError {
  if (status === 401) {
    return new AdminApiError('E-posta veya parola hatalı.', 401, 'UNAUTHORIZED');
  }

  if (status === 403) {
    return new AdminApiError('Bu işlem için yetkiniz yok.', 403, 'FORBIDDEN');
  }

  if (status === 429) {
    return new AdminApiError(
      'Çok fazla giriş denemesi yapıldı. Lütfen daha sonra tekrar deneyin.',
      429,
      'RATE_LIMIT',
    );
  }

  if (status === 400) {
    return new AdminApiError(
      payload?.message === 'Validation failed'
        ? 'Girdiğiniz bilgileri kontrol edin.'
        : (payload?.message ?? 'İstek geçersiz.'),
      400,
      'VALIDATION',
    );
  }

  if (status === 409 && payload?.code) {
    return new AdminApiError(payload.message ?? 'İşlem tamamlanamadı.', 409, payload.code as AdminApiError['code']);
  }

  if (status >= 400 && payload?.message) {
    return new AdminApiError(payload.message, status, 'UNKNOWN');
  }

  return new AdminApiError('Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.', status || 500, 'UNKNOWN');
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const headers = new Headers(init.headers);

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
      credentials: 'include',
    });
  } catch {
    throw new AdminApiError(
      'Sunucuya bağlanılamadı. İnternet bağlantınızı veya API adresini kontrol edin.',
      0,
      'NETWORK',
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const payload = (isJson ? await response.json().catch(() => undefined) : undefined) as
    | ApiErrorPayload
    | T
    | undefined;

  if (!response.ok) {
    throw mapApiError(response.status, payload as ApiErrorPayload | undefined);
  }

  return payload as T;
}
