import { MENU_ITEM_LIMITS, isSafeMenuHref } from '@kurumsal/shared';
import type { MenuItem } from '@kurumsal/shared';
import { z } from 'zod';

export type MenuItemPlacement = 'root' | 'child';

export type MenuItemFormValues = {
  label: string;
  href: string;
  placement: MenuItemPlacement;
  parentId: string | null;
  openInNewTab: boolean;
  isActive: boolean;
};

export const menuItemFormSchema = z
  .object({
    label: z
      .string()
      .trim()
      .min(MENU_ITEM_LIMITS.labelMin, 'Menü adı zorunludur.')
      .max(MENU_ITEM_LIMITS.labelMax, 'Menü adı çok uzun.'),
    href: z.string().max(MENU_ITEM_LIMITS.hrefMax, 'Bağlantı adresi çok uzun.'),
    placement: z.enum(['root', 'child']),
    parentId: z.string().uuid().nullable(),
    openInNewTab: z.boolean(),
    isActive: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (values.placement === 'child' && !values.parentId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['parentId'],
        message: 'Alt menü için bir üst menü seçin.',
      });
    }

    const trimmedHref = values.href.trim();

    if (values.placement === 'child') {
      if (!trimmedHref) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['href'],
          message: 'Alt menüler için bağlantı adresi zorunludur.',
        });
      } else if (!isSafeMenuHref(trimmedHref)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['href'],
          message:
            'Geçerli bir bağlantı girin. / ile başlayan yollar veya http(s) adresleri kabul edilir.',
        });
      }
      return;
    }

    if (trimmedHref && !isSafeMenuHref(trimmedHref)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['href'],
        message:
          'Geçerli bir bağlantı girin. / ile başlayan yollar veya http(s) adresleri kabul edilir.',
      });
    }
  });

export function createEmptyMenuItemFormValues(): MenuItemFormValues {
  return {
    label: '',
    href: '',
    placement: 'root',
    parentId: null,
    openInNewTab: false,
    isActive: true,
  };
}

export function menuItemToFormValues(item: MenuItem): MenuItemFormValues {
  return {
    label: item.label,
    href: item.href ?? '',
    placement: item.parentId ? 'child' : 'root',
    parentId: item.parentId,
    openInNewTab: item.openInNewTab,
    isActive: item.isActive,
  };
}

export function formValuesToMenuItemPayload(values: MenuItemFormValues) {
  const trimmedHref = values.href.trim();
  const parentId = values.placement === 'child' ? values.parentId : null;

  return {
    label: values.label.trim(),
    href: values.placement === 'root' ? (trimmedHref.length > 0 ? trimmedHref : null) : trimmedHref,
    parentId,
    openInNewTab: values.openInNewTab,
    isActive: values.isActive,
  };
}
