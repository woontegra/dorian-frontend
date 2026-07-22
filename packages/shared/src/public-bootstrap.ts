/**
 * Public-facing site summary for the corporate frontend shell.
 * Intentionally narrower than admin SiteSettings — no tax, analytics, or verification fields.
 */
export interface PublicSiteSettings {
  siteName: string;
  legalName: string | null;
  logoUrl: string | null;
  logoAlt: string | null;
  darkLogoUrl: string | null;
  /** No dedicated dark-logo alt in SiteSettings; always null until a model field exists. */
  darkLogoAlt: string | null;
  faviconUrl: string | null;
  siteUrl: string | null;
  /** Mapped from SiteSettings.primaryEmail */
  email: string | null;
  /** Mapped from SiteSettings.primaryPhone */
  phone: string | null;
  address: string | null;
  workingHours: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
  xUrl: string | null;
  youtubeUrl: string | null;
  defaultSeoTitle: string | null;
  titleTemplate: string | null;
  defaultMetaDescription: string | null;
  defaultOgImageUrl: string | null;
}

/**
 * Public navigation item for the corporate header.
 * Narrower than admin MenuItem — no parentId, isActive, sortOrder, or timestamps.
 */
export interface PublicNavigationItem {
  id: string;
  label: string;
  href: string | null;
  openInNewTab: boolean;
  children: PublicNavigationItem[];
}

export interface PublicBootstrapResponse {
  site: PublicSiteSettings;
  navigation: PublicNavigationItem[];
}
