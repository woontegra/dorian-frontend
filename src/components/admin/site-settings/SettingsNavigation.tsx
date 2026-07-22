'use client';

import type { SettingsTabId } from '@/components/admin/site-settings/settings-tabs';
import { SETTINGS_TABS } from '@/components/admin/site-settings/settings-tabs';

type SettingsNavigationProps = {
  activeTab: SettingsTabId;
  onTabChange: (tabId: SettingsTabId) => void;
};

export function SettingsNavigation({ activeTab, onTabChange }: SettingsNavigationProps) {
  return (
    <nav className="admin-settings-nav" aria-label="Site ayarları bölümleri">
      <ul className="admin-settings-nav__list" role="tablist">
        {SETTINGS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <li key={tab.id} role="none">
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`admin-settings-nav__item${isActive ? ' admin-settings-nav__item--active' : ''}`}
                onClick={() => onTabChange(tab.id)}
              >
                <span className="admin-settings-nav__icon" aria-hidden="true">
                  <Icon size={18} strokeWidth={1.75} />
                </span>
                <span className="admin-settings-nav__text">
                  <span className="admin-settings-nav__label">{tab.label}</span>
                  <span className="admin-settings-nav__description">{tab.description}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
