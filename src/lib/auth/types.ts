export type AdminRole = 'ADMIN' | 'EDITOR';

export type AdminProfile = {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
};

export type ApiErrorPayload = {
  error?: string;
  message?: string;
  statusCode?: number;
  code?: string;
  details?: Array<{ path?: string; message?: string }>;
};

export class AdminApiError extends Error {
  readonly statusCode: number;
  readonly code:
    | 'NETWORK'
    | 'UNAUTHORIZED'
    | 'RATE_LIMIT'
    | 'VALIDATION'
    | 'FORBIDDEN'
    | 'INSECURE'
    | 'UNKNOWN'
    | 'SLUG_CONFLICT'
    | 'CATEGORY_HAS_CHILDREN'
    | 'CATEGORY_IN_USE'
    | 'MEDIA_IN_USE'
    | 'PRODUCT_SLUG_CONFLICT'
    | 'PRODUCT_NOT_FOUND'
    | 'PRODUCT_IN_USE'
    | 'INVALID_PRODUCT_CATEGORY'
    | 'INVALID_PRODUCT_MEDIA'
    | 'PRODUCT_MEDIA_DUPLICATE'
    | 'INVALID_PRODUCT_LINK'
    | 'PROJECT_SLUG_CONFLICT'
    | 'PROJECT_NOT_FOUND'
    | 'PROJECT_IN_USE'
    | 'INVALID_PROJECT_MEDIA'
    | 'PROJECT_MEDIA_DUPLICATE'
    | 'INVALID_PROJECT_LINK'
    | 'MENU_ITEM_HAS_CHILDREN';

  constructor(
    message: string,
    statusCode: number,
    code: AdminApiError['code'] = 'UNKNOWN',
  ) {
    super(message);
    this.name = 'AdminApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}
