export interface MenuItem {
  id: string;
  label: string;
  href: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  openInNewTab: boolean;
  childCount: number;
  children: MenuItem[];
  createdAt: string;
  updatedAt: string;
}

export interface MenuItemListResponse {
  items: MenuItem[];
  totalCount: number;
}

export interface MenuItemCreateInput {
  label: string;
  /** Required for child items; optional/null for top-level items. */
  href?: string | null;
  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  openInNewTab?: boolean;
}

export interface MenuItemUpdateInput {
  label?: string;
  href?: string | null;
  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  openInNewTab?: boolean;
}

export interface MenuItemReorderItemInput {
  id: string;
  sortOrder: number;
}

export interface MenuItemReorderInput {
  items: MenuItemReorderItemInput[];
}

export interface MenuItemDeleteBlockedResponse {
  error: string;
  message: string;
  statusCode: number;
  code: 'MENU_ITEM_HAS_CHILDREN';
  childCount: number;
}

export type MenuItemErrorCode =
  | 'MENU_ITEM_NOT_FOUND'
  | 'MENU_ITEM_HAS_CHILDREN'
  | 'MENU_ITEM_INVALID_PARENT'
  | 'MENU_ITEM_DEPTH_EXCEEDED'
  | 'MENU_ITEM_REORDER_INVALID'
  | 'MENU_ITEM_HREF_REQUIRED';

export const MENU_ITEM_LIMITS = {
  labelMin: 1,
  labelMax: 120,
  hrefMax: 500,
  maxListItems: 500,
  maxReorderItems: 200,
} as const;
