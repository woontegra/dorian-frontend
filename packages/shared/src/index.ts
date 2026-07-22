export const APP_NAME = 'Kurumsal Site Altyapısı';
export const APP_NAME_SHORT = 'Kurumsal';

export const API_SERVICE_NAME = 'kurumsal-api';

export type HealthStatus = 'ok' | 'degraded' | 'error';

export type DatabaseHealthStatus = 'connected' | 'disconnected';

export interface HealthResponse {
  status: HealthStatus;
  service: string;
  timestamp: string;
  database: DatabaseHealthStatus;
}

export interface ApiErrorBody {
  error: string;
  message: string;
  statusCode: number;
}

export type {
  SiteSettings,
  SiteSettingsImageType,
  SiteSettingsImageUploadResponse,
} from './site-settings';

export {
  SITE_SETTINGS_DEFAULT_COUNTRY,
  SITE_SETTINGS_IMAGE_TYPES,
  SITE_SETTINGS_LIMITS,
} from './site-settings';

export type {
  PublicBootstrapResponse,
  PublicNavigationItem,
  PublicSiteSettings,
} from './public-bootstrap';

export type {
  MediaAsset,
  MediaAssetListResponse,
  MediaDeleteBlockedResponse,
  MediaFileTypeFilter,
  MediaSortOrder,
  MediaUploadResponse,
  MediaUploadResultItem,
} from './media';

export { MEDIA_IMAGE_EXTENSIONS, MEDIA_LIMITS } from './media';

export type {
  ProductCategory,
  ProductCategoryDeleteBlockedResponse,
  ProductCategoryImage,
  ProductCategoryListResponse,
  ProductCategoryStatusFilter,
} from './product-categories';

export { PRODUCT_CATEGORY_LIMITS } from './product-categories';

export type {
  Product,
  ProductCategoryRef,
  ProductErrorCode,
  ProductFeature,
  ProductFeaturedFilter,
  ProductGalleryImage,
  ProductListItem,
  ProductListResponse,
  ProductMediaRef,
  ProductSortOrder,
  ProductSpecification,
  ProductStatusFilter,
} from './products';

export { PRODUCT_LIMITS } from './products';

export type {
  DashboardSummary,
  Project,
  ProjectErrorCode,
  ProjectFeaturedFilter,
  ProjectGalleryImage,
  ProjectListItem,
  ProjectListResponse,
  ProjectMediaRef,
  ProjectSortOrder,
  ProjectStatusFilter,
  ProjectTechnology,
} from './projects';

export { PROJECT_LIMITS } from './projects';

export { isSafeHttpOrRelativeUrl, isSafeMenuHref } from './safe-url';

export type {
  MenuItem,
  MenuItemCreateInput,
  MenuItemDeleteBlockedResponse,
  MenuItemErrorCode,
  MenuItemListResponse,
  MenuItemReorderInput,
  MenuItemReorderItemInput,
  MenuItemUpdateInput,
} from './menu-items';

export { MENU_ITEM_LIMITS } from './menu-items';

export type {
  HeroButtonLayout,
  HeroButtonStyle,
  HeroButtonVariant,
  HeroContentPosition,
  HeroControlTone,
  HeroDisplayMode,
  HeroErrorCode,
  HeroFontWeight,
  HeroGradientDirection,
  HeroHeadingLevel,
  HeroHeightMode,
  HeroObjectFit,
  HeroOverlayMode,
  HeroSettings,
  HeroSettingsUpdateInput,
  HeroSlide,
  HeroSlideContent,
  HeroSlideCreateInput,
  HeroSlideReorderInput,
  HeroSlideReorderItemInput,
  HeroSlideUpdateInput,
  HeroTextAlign,
  HeroTextBlock,
  HeroTitleBlock,
  HeroTransitionEffect,
  HeroWidthMode,
  PublicHeroResponse,
  PublicHeroSlide,
} from './hero';

export {
  HERO_BUTTON_LAYOUTS,
  HERO_BUTTON_VARIANTS,
  HERO_CONTENT_POSITIONS,
  HERO_CONTROL_TONES,
  HERO_DISPLAY_MODES,
  HERO_FONT_WEIGHTS,
  HERO_GRADIENT_DIRECTIONS,
  HERO_HEADING_LEVELS,
  HERO_HEIGHT_MODES,
  HERO_LIMITS,
  HERO_OBJECT_FITS,
  HERO_OVERLAY_MODES,
  HERO_TEXT_ALIGNS,
  HERO_TRANSITIONS,
  HERO_WIDTH_MODES,
  createDefaultHeroButton,
  createDefaultHeroSlideContent,
  heroSlideHasVisibleContent,
  isValidHexColor,
  mergeHeroSlideContent,
  resolvePublicHeroSlides,
} from './hero';

export { SLUG_PATTERN, slugifyTurkish } from './slug';
