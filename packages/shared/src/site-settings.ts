export type SiteSettingsImageType = 'logo' | 'darkLogo' | 'favicon' | 'defaultOgImage';

export interface SiteSettings {
  id: string | null;
  siteName: string;
  legalName: string | null;
  slogan: string | null;
  shortDescription: string | null;
  foundedYear: number | null;
  taxOffice: string | null;
  taxNumber: string | null;
  logoUrl: string | null;
  logoPathname: string | null;
  logoAlt: string | null;
  darkLogoUrl: string | null;
  darkLogoPathname: string | null;
  faviconUrl: string | null;
  faviconPathname: string | null;
  primaryEmail: string | null;
  secondaryEmail: string | null;
  primaryPhone: string | null;
  secondaryPhone: string | null;
  whatsappNumber: string | null;
  address: string | null;
  district: string | null;
  city: string | null;
  postalCode: string | null;
  country: string;
  mapEmbedUrl: string | null;
  workingHours: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  xUrl: string | null;
  linkedinUrl: string | null;
  youtubeUrl: string | null;
  siteUrl: string | null;
  defaultSeoTitle: string | null;
  titleTemplate: string | null;
  defaultMetaDescription: string | null;
  defaultOgImageUrl: string | null;
  defaultOgImagePathname: string | null;
  googleSiteVerification: string | null;
  bingSiteVerification: string | null;
  googleAnalyticsId: string | null;
  googleTagManagerId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface SiteSettingsImageUploadResponse {
  type: SiteSettingsImageType;
  url: string;
  pathname: string;
}

export const SITE_SETTINGS_IMAGE_TYPES = [
  'logo',
  'darkLogo',
  'favicon',
  'defaultOgImage',
] as const satisfies readonly SiteSettingsImageType[];

export const SITE_SETTINGS_DEFAULT_COUNTRY = 'Türkiye';

export const SITE_SETTINGS_LIMITS = {
  siteNameMax: 200,
  seoTitleMax: 70,
  metaDescriptionMax: 160,
  titleTemplateMax: 100,
  foundedYearMin: 1800,
} as const;
