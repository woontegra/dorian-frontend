export const APP_NAME = 'Kurumsal Site Altyapısı';
export const APP_NAME_SHORT = 'Kurumsal';

export const API_SERVICE_NAME = 'kurumsal-api';

export type HealthStatus = 'ok' | 'degraded' | 'error';

export interface HealthResponse {
  status: HealthStatus;
  service: string;
  timestamp: string;
}

export interface ApiErrorBody {
  error: string;
  message: string;
  statusCode: number;
}