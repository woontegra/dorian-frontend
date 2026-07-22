import type { SiteSettingsFormValues } from '@/lib/site-settings/schema';

export type SiteSettingsFieldChange = <K extends keyof SiteSettingsFormValues>(
  key: K,
  value: SiteSettingsFormValues[K],
) => void;

export type SiteSettingsFormBaseProps = {
  values: SiteSettingsFormValues;
  fieldErrors: Record<string, string>;
  readOnly: boolean;
  onFieldChange: SiteSettingsFieldChange;
};
