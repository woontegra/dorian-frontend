import { ModulePlaceholder } from '@/components/admin/module/ModulePlaceholder';
import { ADMIN_MODULES } from '@/lib/admin/module-config';
import { createModuleMetadata } from '@/lib/admin/module-metadata';

const moduleConfig = ADMIN_MODULES.blog;

export const metadata = createModuleMetadata(moduleConfig.title);

export default function AdminBlogModulePage() {
  return <ModulePlaceholder title={moduleConfig.title} description={moduleConfig.description} />;
}
