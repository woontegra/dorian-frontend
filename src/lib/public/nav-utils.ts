import { isSafeMenuHref } from '@kurumsal/shared';

export function isInternalNavHref(href: string): boolean {
  return href.startsWith('/') && !href.startsWith('//');
}

export function sanitizeNavHref(href: string | null | undefined): string | null {
  if (href == null) {
    return null;
  }

  const trimmed = href.trim();
  if (!trimmed || !isSafeMenuHref(trimmed)) {
    return null;
  }

  return trimmed;
}

export function hasNavChildren(
  children: Array<{ href?: string | null }> | null | undefined,
): boolean {
  return Array.isArray(children) && children.length > 0;
}
