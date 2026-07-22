import { z } from 'zod';
import type { SiteSettings } from '@kurumsal/shared';
import { SITE_SETTINGS_DEFAULT_COUNTRY, SITE_SETTINGS_LIMITS } from '@kurumsal/shared';

const currentYear = new Date().getFullYear();

const optionalString = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .or(z.literal(''));

const optionalEmail = z.string().email('Geçerli bir e-posta adresi girin.').max(254).optional().or(z.literal(''));

const optionalUrl = z.string().url('Geçerli bir URL girin.').max(500).optional().or(z.literal(''));

export const siteSettingsFormSchema = z.object({
  siteName: z.string().trim().min(1, 'Site adı zorunludur.').max(SITE_SETTINGS_LIMITS.siteNameMax),
  legalName: optionalString(200),
  slogan: optionalString(200),
  shortDescription: optionalString(500),
  foundedYear: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (value) =>
        !value ||
        (/^\d{4}$/.test(value) &&
          Number(value) >= SITE_SETTINGS_LIMITS.foundedYearMin &&
          Number(value) <= currentYear + 1),
      `Kuruluş yılı ${SITE_SETTINGS_LIMITS.foundedYearMin}-${currentYear + 1} arasında olmalıdır.`,
    ),
  taxOffice: optionalString(120),
  taxNumber: optionalString(32),
  logoAlt: optionalString(200),
  primaryEmail: optionalEmail,
  secondaryEmail: optionalEmail,
  primaryPhone: optionalString(40),
  secondaryPhone: optionalString(40),
  whatsappNumber: optionalString(40),
  address: optionalString(500),
  district: optionalString(120),
  city: optionalString(120),
  postalCode: optionalString(20),
  country: z.string().max(120).optional().or(z.literal('')),
  mapEmbedUrl: optionalUrl,
  workingHours: optionalString(500),
  facebookUrl: optionalUrl,
  instagramUrl: optionalUrl,
  xUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  youtubeUrl: optionalUrl,
  siteUrl: optionalUrl,
  defaultSeoTitle: optionalString(SITE_SETTINGS_LIMITS.seoTitleMax),
  titleTemplate: optionalString(SITE_SETTINGS_LIMITS.titleTemplateMax),
  defaultMetaDescription: optionalString(SITE_SETTINGS_LIMITS.metaDescriptionMax),
  googleSiteVerification: optionalString(120),
  bingSiteVerification: optionalString(120),
  googleAnalyticsId: z
    .string()
    .regex(/^(G-[A-Z0-9]+|UA-\d+-\d+)?$/i, 'Geçerli bir Google Analytics kimliği girin.')
    .optional()
    .or(z.literal('')),
  googleTagManagerId: z
    .string()
    .regex(/^GTM-[A-Z0-9]*$/i, 'Geçerli bir Google Tag Manager kimliği girin.')
    .optional()
    .or(z.literal('')),
});

export type SiteSettingsFormValues = z.infer<typeof siteSettingsFormSchema>;

export function toFormValues(settings: SiteSettings): SiteSettingsFormValues {
  return {
    siteName: settings.siteName,
    legalName: settings.legalName ?? '',
    slogan: settings.slogan ?? '',
    shortDescription: settings.shortDescription ?? '',
    foundedYear: settings.foundedYear ? String(settings.foundedYear) : '',
    taxOffice: settings.taxOffice ?? '',
    taxNumber: settings.taxNumber ?? '',
    logoAlt: settings.logoAlt ?? '',
    primaryEmail: settings.primaryEmail ?? '',
    secondaryEmail: settings.secondaryEmail ?? '',
    primaryPhone: settings.primaryPhone ?? '',
    secondaryPhone: settings.secondaryPhone ?? '',
    whatsappNumber: settings.whatsappNumber ?? '',
    address: settings.address ?? '',
    district: settings.district ?? '',
    city: settings.city ?? '',
    postalCode: settings.postalCode ?? '',
    country: settings.country || SITE_SETTINGS_DEFAULT_COUNTRY,
    mapEmbedUrl: settings.mapEmbedUrl ?? '',
    workingHours: settings.workingHours ?? '',
    facebookUrl: settings.facebookUrl ?? '',
    instagramUrl: settings.instagramUrl ?? '',
    xUrl: settings.xUrl ?? '',
    linkedinUrl: settings.linkedinUrl ?? '',
    youtubeUrl: settings.youtubeUrl ?? '',
    siteUrl: settings.siteUrl ?? '',
    defaultSeoTitle: settings.defaultSeoTitle ?? '',
    titleTemplate: settings.titleTemplate ?? '',
    defaultMetaDescription: settings.defaultMetaDescription ?? '',
    googleSiteVerification: settings.googleSiteVerification ?? '',
    bingSiteVerification: settings.bingSiteVerification ?? '',
    googleAnalyticsId: settings.googleAnalyticsId ?? '',
    googleTagManagerId: settings.googleTagManagerId ?? '',
  };
}

export function toUpdatePayload(values: SiteSettingsFormValues) {
  return {
    siteName: values.siteName.trim(),
    legalName: values.legalName?.trim() || null,
    slogan: values.slogan?.trim() || null,
    shortDescription: values.shortDescription?.trim() || null,
    foundedYear: values.foundedYear ? Number(values.foundedYear) : null,
    taxOffice: values.taxOffice?.trim() || null,
    taxNumber: values.taxNumber?.trim() || null,
    logoAlt: values.logoAlt?.trim() || null,
    primaryEmail: values.primaryEmail?.trim() || null,
    secondaryEmail: values.secondaryEmail?.trim() || null,
    primaryPhone: values.primaryPhone?.trim() || null,
    secondaryPhone: values.secondaryPhone?.trim() || null,
    whatsappNumber: values.whatsappNumber?.trim() || null,
    address: values.address?.trim() || null,
    district: values.district?.trim() || null,
    city: values.city?.trim() || null,
    postalCode: values.postalCode?.trim() || null,
    country: values.country?.trim() || SITE_SETTINGS_DEFAULT_COUNTRY,
    mapEmbedUrl: values.mapEmbedUrl?.trim() || null,
    workingHours: values.workingHours?.trim() || null,
    facebookUrl: values.facebookUrl?.trim() || null,
    instagramUrl: values.instagramUrl?.trim() || null,
    xUrl: values.xUrl?.trim() || null,
    linkedinUrl: values.linkedinUrl?.trim() || null,
    youtubeUrl: values.youtubeUrl?.trim() || null,
    siteUrl: values.siteUrl?.trim() || null,
    defaultSeoTitle: values.defaultSeoTitle?.trim() || null,
    titleTemplate: values.titleTemplate?.trim() || null,
    defaultMetaDescription: values.defaultMetaDescription?.trim() || null,
    googleSiteVerification: values.googleSiteVerification?.trim() || null,
    bingSiteVerification: values.bingSiteVerification?.trim() || null,
    googleAnalyticsId: values.googleAnalyticsId?.trim() || null,
    googleTagManagerId: values.googleTagManagerId?.trim() || null,
  };
}
