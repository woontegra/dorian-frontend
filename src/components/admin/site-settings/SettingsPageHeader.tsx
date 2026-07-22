import type { ReactNode } from 'react';
import { AdminInlineNotice } from '@/components/admin/common/AdminInlineNotice';

type SettingsPageHeaderProps = {
  readOnly: boolean;
  isDirty: boolean;
  saving: boolean;
  notice: { tone: 'success' | 'error' | 'info'; message: string } | null;
  onSave: () => void;
  children?: ReactNode;
};

export function SettingsPageHeader({
  readOnly,
  isDirty,
  saving,
  notice,
  onSave,
  children,
}: SettingsPageHeaderProps) {
  return (
    <header className="admin-settings-header">
      <div className="admin-settings-header__intro">
        <h2 className="admin-settings-header__title">Site Ayarları</h2>
        <p className="admin-settings-header__description">
          Sitenizin kurumsal, iletişim ve genel SEO bilgilerini yönetin.
        </p>
        {readOnly ? (
          <AdminInlineNotice tone="info" message="Bu alanı düzenleme yetkiniz bulunmuyor." />
        ) : null}
        {notice ? <AdminInlineNotice tone={notice.tone} message={notice.message} /> : null}
        {children}
      </div>

      {!readOnly ? (
        <div className="admin-settings-header__actions">
          {isDirty ? (
            <span className="admin-settings-header__dirty" role="status">
              Kaydedilmemiş değişiklikler
            </span>
          ) : (
            <span className="admin-settings-header__saved" role="status">
              Tüm değişiklikler kayıtlı
            </span>
          )}
          <button
            type="button"
            className="admin-button admin-button-primary admin-settings-header__save"
            onClick={onSave}
            disabled={saving || !isDirty}
            aria-busy={saving}
          >
            {saving ? 'Kaydediliyor…' : 'Değişiklikleri Kaydet'}
          </button>
        </div>
      ) : null}
    </header>
  );
}
