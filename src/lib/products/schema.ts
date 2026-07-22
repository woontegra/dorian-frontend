import { PRODUCT_LIMITS, SLUG_PATTERN, isSafeHttpOrRelativeUrl, slugifyTurkish } from '@kurumsal/shared';
import { z } from 'zod';

const optionalText = z.string().optional();

const buttonPairRefine = (
  label: string | undefined,
  url: string | undefined,
  labelPath: string,
  urlPath: string,
  ctx: z.RefinementCtx,
) => {
  const hasLabel = Boolean(label?.trim());
  const hasUrl = Boolean(url?.trim());
  if (hasLabel !== hasUrl) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Buton metni ve bağlantısı birlikte doldurulmalıdır.',
      path: [hasUrl ? labelPath : urlPath],
    });
  }
  if (hasUrl && url && !isSafeHttpOrRelativeUrl(url)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Geçersiz veya güvenli olmayan bağlantı.',
      path: [urlPath],
    });
  }
};

export const productFeatureFormSchema = z.object({
  title: z.string().trim().min(1, 'Özellik başlığı zorunludur.').max(PRODUCT_LIMITS.featureTitleMax),
  description: optionalText,
});

export const productSpecFormSchema = z.object({
  label: z.string().trim().min(1, 'Etiket zorunludur.').max(PRODUCT_LIMITS.specLabelMax),
  value: z.string().trim().min(1, 'Değer zorunludur.').max(PRODUCT_LIMITS.specValueMax),
});

export const productFormSchema = z
  .object({
    name: z.string().trim().min(PRODUCT_LIMITS.nameMin, 'Ürün adı zorunludur.').max(PRODUCT_LIMITS.nameMax),
    slug: z
      .string()
      .trim()
      .min(1, 'Slug zorunludur.')
      .max(PRODUCT_LIMITS.slugMax)
      .regex(SLUG_PATTERN, 'Slug yalnızca küçük harf, rakam ve tire içerebilir.'),
    shortDescription: optionalText,
    description: optionalText,
    categoryId: z.string().uuid().nullable(),
    coverImageId: z.string().uuid().nullable(),
    logoImageId: z.string().uuid().nullable(),
    isActive: z.boolean(),
    isFeatured: z.boolean(),
    primaryButtonLabel: optionalText,
    primaryButtonUrl: optionalText,
    secondaryButtonLabel: optionalText,
    secondaryButtonUrl: optionalText,
    seoTitle: optionalText,
    seoDescription: optionalText,
    features: z.array(productFeatureFormSchema).max(PRODUCT_LIMITS.maxFeatures),
    gallery: z.array(z.object({ mediaAssetId: z.string().uuid() })).max(PRODUCT_LIMITS.maxGalleryImages),
    specifications: z.array(productSpecFormSchema).max(PRODUCT_LIMITS.maxSpecifications),
  })
  .superRefine((data, ctx) => {
    buttonPairRefine(data.primaryButtonLabel, data.primaryButtonUrl, 'primaryButtonLabel', 'primaryButtonUrl', ctx);
    buttonPairRefine(
      data.secondaryButtonLabel,
      data.secondaryButtonUrl,
      'secondaryButtonLabel',
      'secondaryButtonUrl',
      ctx,
    );
  });

export type ProductFormValues = z.infer<typeof productFormSchema>;

export function createEmptyProductFormValues(): ProductFormValues {
  return {
    name: '',
    slug: '',
    shortDescription: '',
    description: '',
    categoryId: null,
    coverImageId: null,
    logoImageId: null,
    isActive: true,
    isFeatured: false,
    primaryButtonLabel: '',
    primaryButtonUrl: '',
    secondaryButtonLabel: '',
    secondaryButtonUrl: '',
    seoTitle: '',
    seoDescription: '',
    features: [],
    gallery: [],
    specifications: [],
  };
}

export function productToFormValues(product: {
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  category: { id: string } | null;
  coverImage: { id: string } | null;
  logoImage: { id: string } | null;
  isActive: boolean;
  isFeatured: boolean;
  primaryButtonLabel: string | null;
  primaryButtonUrl: string | null;
  secondaryButtonLabel: string | null;
  secondaryButtonUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  features: Array<{ title: string; description: string | null }>;
  gallery: Array<{ mediaAssetId: string }>;
  specifications: Array<{ label: string; value: string }>;
}): ProductFormValues {
  return {
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription ?? '',
    description: product.description ?? '',
    categoryId: product.category?.id ?? null,
    coverImageId: product.coverImage?.id ?? null,
    logoImageId: product.logoImage?.id ?? null,
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    primaryButtonLabel: product.primaryButtonLabel ?? '',
    primaryButtonUrl: product.primaryButtonUrl ?? '',
    secondaryButtonLabel: product.secondaryButtonLabel ?? '',
    secondaryButtonUrl: product.secondaryButtonUrl ?? '',
    seoTitle: product.seoTitle ?? '',
    seoDescription: product.seoDescription ?? '',
    features: product.features.map((feature) => ({
      title: feature.title,
      description: feature.description ?? '',
    })),
    gallery: product.gallery.map((image) => ({ mediaAssetId: image.mediaAssetId })),
    specifications: product.specifications.map((spec) => ({
      label: spec.label,
      value: spec.value,
    })),
  };
}

export function buildProductSlug(name: string): string {
  return slugifyTurkish(name);
}

export function toProductPayload(values: ProductFormValues) {
  return {
    name: values.name,
    slug: values.slug,
    shortDescription: values.shortDescription?.trim() ? values.shortDescription.trim() : null,
    description: values.description?.trim() ? values.description.trim() : null,
    categoryId: values.categoryId,
    coverImageId: values.coverImageId,
    logoImageId: values.logoImageId,
    isActive: values.isActive,
    isFeatured: values.isFeatured,
    primaryButtonLabel: values.primaryButtonLabel?.trim() ? values.primaryButtonLabel.trim() : null,
    primaryButtonUrl: values.primaryButtonUrl?.trim() ? values.primaryButtonUrl.trim() : null,
    secondaryButtonLabel: values.secondaryButtonLabel?.trim() ? values.secondaryButtonLabel.trim() : null,
    secondaryButtonUrl: values.secondaryButtonUrl?.trim() ? values.secondaryButtonUrl.trim() : null,
    seoTitle: values.seoTitle?.trim() ? values.seoTitle.trim() : null,
    seoDescription: values.seoDescription?.trim() ? values.seoDescription.trim() : null,
    features: values.features
      .filter((feature) => feature.title.trim())
      .map((feature, index) => ({
        title: feature.title.trim(),
        description: feature.description?.trim() ? feature.description.trim() : null,
        sortOrder: index,
      })),
    gallery: values.gallery.map((image, index) => ({
      mediaAssetId: image.mediaAssetId,
      sortOrder: index,
    })),
    specifications: values.specifications
      .filter((spec) => spec.label.trim() && spec.value.trim())
      .map((spec, index) => ({
        label: spec.label.trim(),
        value: spec.value.trim(),
        sortOrder: index,
      })),
  };
}
