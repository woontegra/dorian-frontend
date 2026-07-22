const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);
const MENU_HREF_PROTOCOLS = new Set(['http:', 'https:']);

export function isSafeHttpOrRelativeUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return !trimmed.toLowerCase().startsWith('/javascript:');
  }

  try {
    const parsed = new URL(trimmed);
    return ALLOWED_PROTOCOLS.has(parsed.protocol.toLowerCase());
  } catch {
    return false;
  }
}

/**
 * Menu item hrefs: relative path starting with `/` (not `//`), or http(s) only.
 * Rejects javascript:, data:, mailto:, tel:, and protocol-relative URLs.
 */
export function isSafeMenuHref(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return !trimmed.toLowerCase().startsWith('/javascript:');
  }

  try {
    const parsed = new URL(trimmed);
    return MENU_HREF_PROTOCOLS.has(parsed.protocol.toLowerCase());
  } catch {
    return false;
  }
}
