import { PRODUCT_CATEGORY_LIMITS, SLUG_PATTERN, slugifyTurkish } from '@kurumsal/shared';
import { z } from 'zod';

export const productCategoryFormSchema = z.object({
  name: z.string().trim().min(PRODUCT_CATEGORY_LIMITS.nameMin, 'Kategori adı zorunludur.').max(PRODUCT_CATEGORY_LIMITS.nameMax),
  slug: z
    .string()
    .trim()
    .min(1, 'Slug zorunludur.')
    .max(PRODUCT_CATEGORY_LIMITS.slugMax)
    .regex(SLUG_PATTERN, 'Slug yalnızca küçük harf, rakam ve tire içerebilir.'),
  description: z.string().max(PRODUCT_CATEGORY_LIMITS.descriptionMax).optional(),
  parentId: z.string().uuid().nullable(),
  imageId: z.string().uuid().nullable(),
  isActive: z.boolean(),
  seoTitle: z.string().max(PRODUCT_CATEGORY_LIMITS.seoTitleMax).optional(),
  seoDescription: z.string().max(PRODUCT_CATEGORY_LIMITS.seoDescriptionMax).optional(),
});

export type ProductCategoryFormValues = z.infer<typeof productCategoryFormSchema>;

export function createEmptyFormValues(): ProductCategoryFormValues {
  return {
    name: '',
    slug: '',
    description: '',
    parentId: null,
    imageId: null,
    isActive: true,
    seoTitle: '',
    seoDescription: '',
  };
}

export function categoryToFormValues(category: {
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  image: { id: string } | null;
  isActive: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
}): ProductCategoryFormValues {
  return {
    name: category.name,
    slug: category.slug,
    description: category.description ?? '',
    parentId: category.parentId,
    imageId: category.image?.id ?? null,
    isActive: category.isActive,
    seoTitle: category.seoTitle ?? '',
    seoDescription: category.seoDescription ?? '',
  };
}

export function buildSlugFromName(name: string): string {
  return slugifyTurkish(name);
}
