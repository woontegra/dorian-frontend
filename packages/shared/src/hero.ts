/** Hero / Slider shared types, limits, and defaults. */

export const HERO_DISPLAY_MODES = ['SINGLE', 'CAROUSEL'] as const;
export type HeroDisplayMode = (typeof HERO_DISPLAY_MODES)[number];

export const HERO_WIDTH_MODES = ['FULL', 'CONTAINED'] as const;
export type HeroWidthMode = (typeof HERO_WIDTH_MODES)[number];

export const HERO_HEIGHT_MODES = ['AUTO', 'FIXED', 'VIEWPORT'] as const;
export type HeroHeightMode = (typeof HERO_HEIGHT_MODES)[number];

export const HERO_OBJECT_FITS = ['COVER', 'CONTAIN'] as const;
export type HeroObjectFit = (typeof HERO_OBJECT_FITS)[number];

export const HERO_TRANSITIONS = ['FADE', 'SLIDE'] as const;
export type HeroTransitionEffect = (typeof HERO_TRANSITIONS)[number];

export const HERO_CONTROL_TONES = ['LIGHT', 'DARK'] as const;
export type HeroControlTone = (typeof HERO_CONTROL_TONES)[number];

export const HERO_CONTENT_POSITIONS = [
  'TOP_LEFT',
  'TOP_CENTER',
  'TOP_RIGHT',
  'MIDDLE_LEFT',
  'MIDDLE_CENTER',
  'MIDDLE_RIGHT',
  'BOTTOM_LEFT',
  'BOTTOM_CENTER',
  'BOTTOM_RIGHT',
] as const;
export type HeroContentPosition = (typeof HERO_CONTENT_POSITIONS)[number];

export const HERO_TEXT_ALIGNS = ['LEFT', 'CENTER', 'RIGHT'] as const;
export type HeroTextAlign = (typeof HERO_TEXT_ALIGNS)[number];

export const HERO_BUTTON_VARIANTS = ['SOLID', 'OUTLINE'] as const;
export type HeroButtonVariant = (typeof HERO_BUTTON_VARIANTS)[number];

export const HERO_BUTTON_LAYOUTS = ['ROW', 'COLUMN'] as const;
export type HeroButtonLayout = (typeof HERO_BUTTON_LAYOUTS)[number];

export const HERO_OVERLAY_MODES = ['SOLID', 'GRADIENT'] as const;
export type HeroOverlayMode = (typeof HERO_OVERLAY_MODES)[number];

export const HERO_GRADIENT_DIRECTIONS = [
  'TO_BOTTOM',
  'TO_TOP',
  'TO_RIGHT',
  'TO_LEFT',
  'TO_BOTTOM_RIGHT',
  'TO_BOTTOM_LEFT',
] as const;
export type HeroGradientDirection = (typeof HERO_GRADIENT_DIRECTIONS)[number];

export const HERO_FONT_WEIGHTS = [400, 500, 600, 700] as const;
export type HeroFontWeight = (typeof HERO_FONT_WEIGHTS)[number];

export const HERO_HEADING_LEVELS = [1, 2, 3] as const;
export type HeroHeadingLevel = (typeof HERO_HEADING_LEVELS)[number];

export const HERO_LIMITS = {
  maxWidthPxMin: 640,
  maxWidthPxMax: 1920,
  maxWidthPxDefault: 1400,
  fixedHeightMin: 160,
  fixedHeightMax: 1200,
  fixedHeightDesktopDefault: 560,
  fixedHeightMobileDefault: 420,
  autoplayIntervalSecMin: 2,
  autoplayIntervalSecMax: 30,
  autoplayIntervalSecDefault: 6,
  altTextMax: 200,
  eyebrowMax: 120,
  titleMax: 160,
  descriptionMax: 600,
  buttonLabelMax: 80,
  hrefMax: 500,
  fontSizeMin: 12,
  fontSizeMax: 96,
  lineHeightMin: 1,
  lineHeightMax: 2.2,
  letterSpacingMin: -0.08,
  letterSpacingMax: 0.2,
  spacingMin: 0,
  spacingMax: 96,
  offsetMin: -24,
  offsetMax: 24,
  contentMaxWidthMin: 200,
  contentMaxWidthMax: 1200,
  contentMaxWidthDefault: 560,
  contentPaddingMin: 0,
  contentPaddingMax: 64,
  opacityMin: 0,
  opacityMax: 1,
  radiusMin: 0,
  radiusMax: 48,
  borderWidthMin: 0,
  borderWidthMax: 6,
  buttonPadXMin: 8,
  buttonPadXMax: 64,
  buttonPadYMin: 4,
  buttonPadYMax: 32,
  maxSlides: 30,
  maxReorderItems: 50,
} as const;

export type HeroTextBlock = {
  enabled: boolean;
  text: string;
  fontSizeDesktop: number;
  fontSizeMobile: number;
  color: string;
  fontWeight: HeroFontWeight;
  lineHeight: number;
  letterSpacing: number;
  textAlign: HeroTextAlign;
  marginBottom: number;
};

export type HeroTitleBlock = HeroTextBlock & {
  headingLevel: HeroHeadingLevel;
};

export type HeroButtonStyle = {
  enabled: boolean;
  label: string;
  href: string;
  openInNewTab: boolean;
  variant: HeroButtonVariant;
  fontSizeDesktop: number;
  fontSizeMobile: number;
  fontWeight: HeroFontWeight;
  textColor: string;
  backgroundColor: string;
  hoverTextColor: string;
  hoverBackgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  paddingX: number;
  paddingY: number;
};

export type HeroSlideContent = {
  eyebrow: HeroTextBlock;
  title: HeroTitleBlock;
  description: HeroTextBlock;
  positionDesktop: HeroContentPosition;
  positionMobile: HeroContentPosition;
  offsetXPercent: number;
  offsetYPercent: number;
  maxWidthPx: number;
  paddingPx: number;
  textAlign: HeroTextAlign;
  overlayEnabled: boolean;
  overlayColor: string;
  overlayOpacity: number;
  overlayMode: HeroOverlayMode;
  overlayGradientDirection: HeroGradientDirection;
  textShadow: boolean;
  panelEnabled: boolean;
  panelColor: string;
  panelOpacity: number;
  panelRadius: number;
  panelPadding: number;
  buttonLayout: HeroButtonLayout;
  buttonAlignDesktop: HeroTextAlign;
  buttonAlignMobile: HeroTextAlign;
  buttonGap: number;
  buttonMarginTop: number;
  buttonsFullWidthMobile: boolean;
  primaryButton: HeroButtonStyle;
  secondaryButton: HeroButtonStyle;
};

export type HeroSlide = {
  id: string;
  desktopImageUrl: string;
  desktopImagePathname: string | null;
  mobileImageUrl: string | null;
  mobileImagePathname: string | null;
  altText: string;
  isActive: boolean;
  sortOrder: number;
  objectFit: HeroObjectFit;
  content: HeroSlideContent;
  createdAt: string;
  updatedAt: string;
};

export type HeroSettings = {
  id: string;
  displayMode: HeroDisplayMode;
  widthMode: HeroWidthMode;
  maxWidthPx: number;
  heightMode: HeroHeightMode;
  fixedHeightDesktopPx: number;
  fixedHeightMobilePx: number;
  singleSlideId: string | null;
  autoplay: boolean;
  autoplayIntervalSec: number;
  showArrows: boolean;
  showDots: boolean;
  transitionEffect: HeroTransitionEffect;
  loop: boolean;
  controlTone: HeroControlTone;
  slides: HeroSlide[];
  createdAt: string;
  updatedAt: string;
};

export type HeroSettingsUpdateInput = {
  displayMode?: HeroDisplayMode;
  widthMode?: HeroWidthMode;
  maxWidthPx?: number;
  heightMode?: HeroHeightMode;
  fixedHeightDesktopPx?: number;
  fixedHeightMobilePx?: number;
  singleSlideId?: string | null;
  autoplay?: boolean;
  autoplayIntervalSec?: number;
  showArrows?: boolean;
  showDots?: boolean;
  transitionEffect?: HeroTransitionEffect;
  loop?: boolean;
  controlTone?: HeroControlTone;
};

export type HeroSlideCreateInput = {
  desktopImageUrl: string;
  desktopImagePathname?: string | null;
  mobileImageUrl?: string | null;
  mobileImagePathname?: string | null;
  altText?: string;
  isActive?: boolean;
  sortOrder?: number;
  objectFit?: HeroObjectFit;
  content?: Partial<HeroSlideContent> | HeroSlideContent;
};

export type HeroSlideUpdateInput = {
  desktopImageUrl?: string;
  desktopImagePathname?: string | null;
  mobileImageUrl?: string | null;
  mobileImagePathname?: string | null;
  altText?: string;
  isActive?: boolean;
  sortOrder?: number;
  objectFit?: HeroObjectFit;
  content?: Partial<HeroSlideContent> | HeroSlideContent;
};

export type HeroSlideReorderItemInput = {
  id: string;
  sortOrder: number;
};

export type HeroSlideReorderInput = {
  items: HeroSlideReorderItemInput[];
};

/** Public DTO — active slides only, safe fields. */
export type PublicHeroSlide = {
  id: string;
  desktopImageUrl: string;
  mobileImageUrl: string | null;
  altText: string;
  objectFit: HeroObjectFit;
  content: HeroSlideContent;
};

export type PublicHeroResponse = {
  displayMode: HeroDisplayMode;
  widthMode: HeroWidthMode;
  maxWidthPx: number;
  heightMode: HeroHeightMode;
  fixedHeightDesktopPx: number;
  fixedHeightMobilePx: number;
  autoplay: boolean;
  autoplayIntervalSec: number;
  showArrows: boolean;
  showDots: boolean;
  transitionEffect: HeroTransitionEffect;
  loop: boolean;
  controlTone: HeroControlTone;
  slides: PublicHeroSlide[];
} | null;

export type HeroErrorCode =
  | 'HERO_SETTINGS_NOT_FOUND'
  | 'HERO_SLIDE_NOT_FOUND'
  | 'HERO_SLIDE_IMAGE_REQUIRED'
  | 'HERO_SINGLE_SLIDE_INVALID'
  | 'HERO_REORDER_INVALID';

function textBlock(
  overrides: Partial<HeroTextBlock> & Pick<HeroTextBlock, 'fontSizeDesktop' | 'fontSizeMobile'>,
): HeroTextBlock {
  return {
    enabled: false,
    text: '',
    color: '#ffffff',
    fontWeight: 500,
    lineHeight: 1.4,
    letterSpacing: 0,
    textAlign: 'LEFT',
    marginBottom: 12,
    ...overrides,
  };
}

export function createDefaultHeroButton(variant: HeroButtonVariant): HeroButtonStyle {
  const solid = variant === 'SOLID';
  return {
    enabled: false,
    label: '',
    href: '',
    openInNewTab: false,
    variant,
    fontSizeDesktop: 15,
    fontSizeMobile: 14,
    fontWeight: 600,
    textColor: solid ? '#ffffff' : '#ffffff',
    backgroundColor: solid ? '#1f4e79' : 'transparent',
    hoverTextColor: '#ffffff',
    hoverBackgroundColor: solid ? '#183d5f' : '#ffffff22',
    borderColor: '#ffffff',
    borderWidth: solid ? 0 : 1,
    borderRadius: 8,
    paddingX: 22,
    paddingY: 12,
  };
}

export function createDefaultHeroSlideContent(): HeroSlideContent {
  return {
    eyebrow: textBlock({ fontSizeDesktop: 13, fontSizeMobile: 12, fontWeight: 600, letterSpacing: 0.06 }),
    title: {
      ...textBlock({ fontSizeDesktop: 42, fontSizeMobile: 28, fontWeight: 700, lineHeight: 1.15, marginBottom: 14 }),
      headingLevel: 1,
    },
    description: textBlock({
      fontSizeDesktop: 17,
      fontSizeMobile: 15,
      fontWeight: 400,
      lineHeight: 1.55,
      marginBottom: 22,
    }),
    positionDesktop: 'MIDDLE_LEFT',
    positionMobile: 'MIDDLE_CENTER',
    offsetXPercent: 0,
    offsetYPercent: 0,
    maxWidthPx: HERO_LIMITS.contentMaxWidthDefault,
    paddingPx: 24,
    textAlign: 'LEFT',
    overlayEnabled: true,
    overlayColor: '#0b1220',
    overlayOpacity: 0.38,
    overlayMode: 'GRADIENT',
    overlayGradientDirection: 'TO_RIGHT',
    textShadow: true,
    panelEnabled: false,
    panelColor: '#0b1220',
    panelOpacity: 0.45,
    panelRadius: 12,
    panelPadding: 20,
    buttonLayout: 'ROW',
    buttonAlignDesktop: 'LEFT',
    buttonAlignMobile: 'CENTER',
    buttonGap: 12,
    buttonMarginTop: 4,
    buttonsFullWidthMobile: true,
    primaryButton: createDefaultHeroButton('SOLID'),
    secondaryButton: createDefaultHeroButton('OUTLINE'),
  };
}

export function mergeHeroSlideContent(
  partial?: Partial<HeroSlideContent> | HeroSlideContent | null,
): HeroSlideContent {
  const base = createDefaultHeroSlideContent();
  if (!partial || typeof partial !== 'object') {
    return base;
  }

  return {
    ...base,
    ...partial,
    eyebrow: { ...base.eyebrow, ...(partial.eyebrow ?? {}) },
    title: { ...base.title, ...(partial.title ?? {}) },
    description: { ...base.description, ...(partial.description ?? {}) },
    primaryButton: { ...base.primaryButton, ...(partial.primaryButton ?? {}) },
    secondaryButton: { ...base.secondaryButton, ...(partial.secondaryButton ?? {}) },
  };
}

export function heroSlideHasVisibleContent(content: HeroSlideContent): boolean {
  const hasText =
    (content.eyebrow.enabled && content.eyebrow.text.trim().length > 0) ||
    (content.title.enabled && content.title.text.trim().length > 0) ||
    (content.description.enabled && content.description.text.trim().length > 0);
  const hasPrimary =
    content.primaryButton.enabled &&
    content.primaryButton.label.trim().length > 0 &&
    content.primaryButton.href.trim().length > 0;
  const hasSecondary =
    content.secondaryButton.enabled &&
    content.secondaryButton.label.trim().length > 0 &&
    content.secondaryButton.href.trim().length > 0;
  return hasText || hasPrimary || hasSecondary;
}

export function isValidHexColor(value: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value.trim());
}

export function resolvePublicHeroSlides(
  settings: Pick<HeroSettings, 'displayMode' | 'singleSlideId'>,
  slides: HeroSlide[],
): HeroSlide[] {
  const active = slides
    .filter((slide) => slide.isActive && slide.desktopImageUrl.trim().length > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));

  if (settings.displayMode === 'SINGLE') {
    if (settings.singleSlideId) {
      const selected = active.find((slide) => slide.id === settings.singleSlideId);
      if (selected) {
        return [selected];
      }
    }
    return active.slice(0, 1);
  }

  return active;
}
