import { PROJECT_LIMITS, SLUG_PATTERN, isSafeHttpOrRelativeUrl, slugifyTurkish } from '@kurumsal/shared';
import { z } from 'zod';

const optionalText = z.string().optional();

const COMPLETED_AT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const projectTechnologyFormSchema = z.object({
  label: z.string().trim().min(1, 'Teknoloji adı zorunludur.').max(PROJECT_LIMITS.technologyLabelMax),
});

export const projectFormSchema = z
  .object({
    name: z.string().trim().min(PROJECT_LIMITS.nameMin, 'Proje adı zorunludur.').max(PROJECT_LIMITS.nameMax),
    slug: z
      .string()
      .trim()
      .min(1, 'Slug zorunludur.')
      .max(PROJECT_LIMITS.slugMax)
      .regex(SLUG_PATTERN, 'Slug yalnızca küçük harf, rakam ve tire içerebilir.'),
    shortDescription: optionalText,
    description: optionalText,
    coverImageId: z.string().uuid().nullable(),
    clientName: optionalText,
    showClientName: z.boolean(),
    sector: optionalText,
    completedAt: z
      .string()
      .optional()
      .refine((value) => !value || COMPLETED_AT_PATTERN.test(value), 'Geçerli bir tarih girin.'),
    websiteUrl: optionalText,
    isActive: z.boolean(),
    isFeatured: z.boolean(),
    seoTitle: optionalText,
    seoDescription: optionalText,
    gallery: z.array(z.object({ mediaAssetId: z.string().uuid() })).max(PROJECT_LIMITS.maxGalleryImages),
    technologies: z.array(projectTechnologyFormSchema).max(PROJECT_LIMITS.maxTechnologies),
  })
  .superRefine((data, ctx) => {
    const url = data.websiteUrl?.trim();
    if (url && !isSafeHttpOrRelativeUrl(url)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Geçersiz veya güvenli olmayan bağlantı.',
        path: ['websiteUrl'],
      });
    }
  });

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

export function createEmptyProjectFormValues(): ProjectFormValues {
  return {
    name: '',
    slug: '',
    shortDescription: '',
    description: '',
    coverImageId: null,
    clientName: '',
    showClientName: true,
    sector: '',
    completedAt: '',
    websiteUrl: '',
    isActive: true,
    isFeatured: false,
    seoTitle: '',
    seoDescription: '',
    gallery: [],
    technologies: [],
  };
}

export function projectToFormValues(project: {
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  coverImage: { id: string } | null;
  clientName: string | null;
  showClientName: boolean;
  sector: string | null;
  completedAt: string | null;
  websiteUrl: string | null;
  isActive: boolean;
  isFeatured: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  gallery: Array<{ mediaAssetId: string }>;
  technologies: Array<{ label: string }>;
}): ProjectFormValues {
  return {
    name: project.name,
    slug: project.slug,
    shortDescription: project.shortDescription ?? '',
    description: project.description ?? '',
    coverImageId: project.coverImage?.id ?? null,
    clientName: project.clientName ?? '',
    showClientName: project.showClientName,
    sector: project.sector ?? '',
    completedAt: project.completedAt ? project.completedAt.slice(0, 10) : '',
    websiteUrl: project.websiteUrl ?? '',
    isActive: project.isActive,
    isFeatured: project.isFeatured,
    seoTitle: project.seoTitle ?? '',
    seoDescription: project.seoDescription ?? '',
    gallery: project.gallery.map((image) => ({ mediaAssetId: image.mediaAssetId })),
    technologies: project.technologies.map((technology) => ({ label: technology.label })),
  };
}

export function buildProjectSlug(name: string): string {
  return slugifyTurkish(name);
}

export function toProjectPayload(values: ProjectFormValues) {
  return {
    name: values.name,
    slug: values.slug,
    shortDescription: values.shortDescription?.trim() ? values.shortDescription.trim() : null,
    description: values.description?.trim() ? values.description.trim() : null,
    coverImageId: values.coverImageId,
    clientName: values.clientName?.trim() ? values.clientName.trim() : null,
    showClientName: values.showClientName,
    sector: values.sector?.trim() ? values.sector.trim() : null,
    completedAt: values.completedAt?.trim() ? values.completedAt.trim() : null,
    websiteUrl: values.websiteUrl?.trim() ? values.websiteUrl.trim() : null,
    isActive: values.isActive,
    isFeatured: values.isFeatured,
    seoTitle: values.seoTitle?.trim() ? values.seoTitle.trim() : null,
    seoDescription: values.seoDescription?.trim() ? values.seoDescription.trim() : null,
    gallery: values.gallery.map((image, index) => ({
      mediaAssetId: image.mediaAssetId,
      sortOrder: index,
    })),
    technologies: values.technologies
      .filter((technology) => technology.label.trim())
      .map((technology, index) => ({
        label: technology.label.trim(),
        sortOrder: index,
      })),
  };
}
