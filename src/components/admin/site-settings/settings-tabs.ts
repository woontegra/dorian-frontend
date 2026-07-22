import {
  Building2,
  Contact,
  ImageIcon,
  Search,
  Share2,
  type LucideIcon,
} from 'lucide-react';

export const SETTINGS_TABS = [
  {
    id: 'general',
    label: 'Genel Bilgiler',
    description: 'Kurumsal kimlik ve resmî bilgiler',
    icon: Building2,
  },
  {
    id: 'brand',
    label: 'Marka ve Logo',
    description: 'Logo, favicon ve paylaşım görselleri',
    icon: ImageIcon,
  },
  {
    id: 'contact',
    description: 'E-posta, telefon, adres ve harita',
    label: 'İletişim',
    icon: Contact,
  },
  {
    id: 'social',
    label: 'Sosyal Medya',
    description: 'Platform bağlantıları',
    icon: Share2,
  },
  {
    id: 'seo',
    label: 'Genel SEO',
    description: 'Arama motoru ve doğrulama ayarları',
    icon: Search,
  },
] as const;

export type SettingsTabId = (typeof SETTINGS_TABS)[number]['id'];

export type SettingsTabConfig = {
  id: SettingsTabId;
  label: string;
  description: string;
  icon: LucideIcon;
};

export function isValidSettingsTab(value: string | null): value is SettingsTabId {
  return SETTINGS_TABS.some((tab) => tab.id === value);
}
