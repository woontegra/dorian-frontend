import type { ReactNode } from 'react';

type SettingsLayoutProps = {
  header: ReactNode;
  navigation: ReactNode;
  content: ReactNode;
};

export function SettingsLayout({ header, navigation, content }: SettingsLayoutProps) {
  return (
    <div className="admin-settings-page">
      {header}
      <div className="admin-settings-body">
        {navigation}
        <div className="admin-settings-content" role="tabpanel">
          {content}
        </div>
      </div>
    </div>
  );
}
