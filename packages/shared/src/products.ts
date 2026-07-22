export interface ProductMediaRef {
  id: string;
  url: string;
  altText: string | null;
  originalFilename: string;
  width: number | null;
  height: number | null;
}

export interface ProductCategoryRef {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  parentId: string | null;
  parentName: string | null;
}

export interface ProductFeature {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
}

export interface ProductGalleryImage {
  id: string;
  mediaAssetId: string;
  sortOrder: number;
  media: ProductMediaRef;
}

export interface ProductSpecification {
  id: string;
  label: string;
  value: string;
  sortOrder: number;
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  category: ProductCategoryRef | null;
  coverImage: ProductMediaRef | null;
  logoImage: ProductMediaRef | null;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product extends ProductListItem {
  description: string | null;
  primaryButtonLabel: string | null;
  primaryButtonUrl: string | null;
  secondaryButtonLabel: string | null;
  secondaryButtonUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  features: ProductFeature[];
  gallery: ProductGalleryImage[];
  specifications: ProductSpecification[];
}

export interface ProductListResponse {
  items: ProductListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export type ProductStatusFilter = 'all' | 'active' | 'inactive';
export type ProductFeaturedFilter = 'all' | 'featured' | 'not_featured';
export type ProductSortOrder = 'sortOrder' | 'newest' | 'oldest' | 'name_asc' | 'name_desc';

export const PRODUCT_LIMITS = {
  nameMin: 1,
  nameMax: 160,
  slugMax: 180,
  shortDescriptionMax: 320,
  descriptionMax: 20000,
  buttonLabelMax: 60,
  buttonUrlMax: 500,
  seoTitleMax: 120,
  seoDescriptionMax: 320,
  featureTitleMax: 120,
  featureDescriptionMax: 500,
  specLabelMax: 80,
  specValueMax: 240,
  maxFeatures: 30,
  maxGalleryImages: 20,
  maxSpecifications: 40,
  searchMax: 200,
  defaultPageSize: 20,
  maxPageSize: 100,
  maxReorderItems: 200,
} as const;

export type ProductErrorCode =
  | 'PRODUCT_NOT_FOUND'
  | 'PRODUCT_SLUG_CONFLICT'
  | 'INVALID_PRODUCT_CATEGORY'
  | 'INVALID_PRODUCT_MEDIA'
  | 'PRODUCT_MEDIA_DUPLICATE'
  | 'INVALID_PRODUCT_LINK'
  | 'PRODUCT_IN_USE';
