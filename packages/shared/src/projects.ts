export interface ProjectMediaRef {
  id: string;
  url: string;
  altText: string | null;
  originalFilename: string;
  width: number | null;
  height: number | null;
}

export interface ProjectGalleryImage {
  id: string;
  mediaAssetId: string;
  sortOrder: number;
  media: ProjectMediaRef;
}

export interface ProjectTechnology {
  id: string;
  label: string;
  sortOrder: number;
}

export interface ProjectListItem {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  coverImage: ProjectMediaRef | null;
  clientName: string | null;
  showClientName: boolean;
  sector: string | null;
  completedAt: string | null;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Project extends ProjectListItem {
  description: string | null;
  websiteUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  gallery: ProjectGalleryImage[];
  technologies: ProjectTechnology[];
}

export interface ProjectListResponse {
  items: ProjectListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface DashboardSummary {
  projectCount: number;
}

export type ProjectStatusFilter = 'all' | 'active' | 'inactive';
export type ProjectFeaturedFilter = 'all' | 'featured' | 'not_featured';
export type ProjectSortOrder = 'sortOrder' | 'newest' | 'oldest' | 'name_asc' | 'name_desc';

export const PROJECT_LIMITS = {
  nameMin: 1,
  nameMax: 160,
  slugMax: 180,
  shortDescriptionMax: 320,
  descriptionMax: 20000,
  clientNameMax: 160,
  sectorMax: 120,
  websiteUrlMax: 500,
  seoTitleMax: 120,
  seoDescriptionMax: 320,
  technologyLabelMax: 80,
  maxTechnologies: 40,
  maxGalleryImages: 20,
  searchMax: 200,
  defaultPageSize: 20,
  maxPageSize: 100,
  maxReorderItems: 200,
} as const;

export type ProjectErrorCode =
  | 'PROJECT_NOT_FOUND'
  | 'PROJECT_SLUG_CONFLICT'
  | 'INVALID_PROJECT_MEDIA'
  | 'PROJECT_MEDIA_DUPLICATE'
  | 'INVALID_PROJECT_LINK'
  | 'PROJECT_IN_USE';
