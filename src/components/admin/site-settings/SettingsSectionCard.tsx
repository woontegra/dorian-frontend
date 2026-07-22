import type { ReactNode } from 'react';

type SettingsSectionCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function SettingsSectionCard({
  title,
  description,
  children,
  className = '',
}: SettingsSectionCardProps) {
  return (
    <section className={`admin-settings-section-card ${className}`.trim()}>
      <header className="admin-settings-section-card__header">
        <h3 className="admin-settings-section-card__title">{title}</h3>
        {description ? <p className="admin-settings-section-card__description">{description}</p> : null}
      </header>
      <div className="admin-settings-section-card__body">{children}</div>
    </section>
  );
}
