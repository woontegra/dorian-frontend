import { AdminPanelLayout } from '@/components/admin/layout/AdminPanelLayout';

export default function AdminPanelGroupLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AdminPanelLayout>{children}</AdminPanelLayout>;
}
