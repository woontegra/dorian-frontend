import { apiFetch } from '@/lib/api/client';
import type { AdminProfile } from '@/lib/auth/types';

export async function fetchAdminMe(): Promise<AdminProfile> {
  return apiFetch<AdminProfile>('/api/admin/auth/me', {
    method: 'GET',
  });
}

export async function loginAdmin(email: string, password: string): Promise<AdminProfile> {
  return apiFetch<AdminProfile>('/api/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function logoutAdmin(): Promise<void> {
  await apiFetch<void>('/api/admin/auth/logout', {
    method: 'POST',
  });
}
