export interface ProductCategoryImage {
  id: string;
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  parentName: string | null;
  sortOrder: number;
  isActive: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  childCount: number;
  productCount: number;
  image: ProductCategoryImage | null;
  children: ProductCategory[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategoryListResponse {
  items: ProductCategory[];
  totalCount: number;
}

export interface ProductCategoryDeleteBlockedResponse {
  error: string;
  message: string;
  statusCode: number;
  code: 'CATEGORY_IN_USE' | 'CATEGORY_HAS_CHILDREN';
  childCount?: number;
  productCount?: number;
}

export type ProductCategoryStatusFilter = 'all' | 'active' | 'inactive';

export const PRODUCT_CATEGORY_LIMITS = {
  nameMin: 1,
  nameMax: 120,
  slugMax: 160,
  descriptionMax: 2000,
  seoTitleMax: 120,
  seoDescriptionMax: 320,
  searchMax: 200,
  maxListItems: 500,
  maxReorderItems: 200,
} as const;
