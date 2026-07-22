import { HeroSliderPageClient } from '@/components/admin/hero/HeroSliderPageClient';
import { ADMIN_MODULES } from '@/lib/admin/module-config';
import { createModuleMetadata } from '@/lib/admin/module-metadata';

const moduleConfig = ADMIN_MODULES.sliders;

export const metadata = createModuleMetadata(moduleConfig.title);

export default function AdminSlidersModulePage() {
  return <HeroSliderPageClient />;
}
