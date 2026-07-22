import type { AdminRole } from '@/lib/auth/types';

export function formatAdminRole(role: AdminRole): string {
  switch (role) {
    case 'ADMIN':
      return 'Yönetici';
    case 'EDITOR':
      return 'Editör';
    default:
      return role;
  }
}
