'use client';

type ImagePreviewVariant = 'logo' | 'favicon' | 'og';

type SiteSettingsImageFieldProps = {
  label: string;
  purpose: string;
  hint: string;
  previewVariant: ImagePreviewVariant;
  imageUrl: string | null;
  altText?: string;
  altLabel?: string;
  altValue?: string;
  onAltChange?: (value: string) => void;
  readOnly: boolean;
  uploading: boolean;
  pendingPreview: string | null;
  onSelectFile: (file: File) => void;
  onUpload: () => void;
  onRemove: () => void;
  selectedFileName: string | null;
};

export function SiteSettingsImageField({
  label,
  purpose,
  hint,
  previewVariant,
  imageUrl,
  altText,
  altLabel,
  altValue,
  onAltChange,
  readOnly,
  uploading,
  pendingPreview,
  onSelectFile,
  onUpload,
  onRemove,
  selectedFileName,
}: SiteSettingsImageFieldProps) {
  const previewUrl = pendingPreview ?? imageUrl;
  const inputClass = `admin-settings-input${readOnly ? ' admin-settings-input--readonly' : ''}`;

  return (
    <article className="admin-settings-upload-card" aria-label={label}>
      <header className="admin-settings-upload-card__header">
        <h3 className="admin-settings-upload-card__title">{label}</h3>
        <p className="admin-settings-upload-card__purpose">{purpose}</p>
        <p className="admin-settings-upload-card__hint">{hint}</p>
      </header>

      <div
        className={`admin-settings-upload-card__preview admin-settings-upload-card__preview--${previewVariant}`}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={altText || label}
            className={`admin-settings-upload-card__image admin-settings-upload-card__image--${previewVariant}`}
          />
        ) : (
          <div className="admin-settings-upload-card__empty">
            <span>Henüz görsel yüklenmedi</span>
          </div>
        )}
      </div>

      {altLabel && onAltChange ? (
        <label className="admin-settings-field admin-settings-field--full">
          <span className="admin-settings-field__label">{altLabel}</span>
          <input
            className={inputClass}
            value={altValue ?? ''}
            onChange={(event) => onAltChange(event.target.value)}
            disabled={readOnly}
          />
        </label>
      ) : null}

      {!readOnly ? (
        <div className="admin-settings-upload-card__actions">
          <label className="admin-button admin-button-secondary admin-settings-upload-card__file">
            Dosya Seç
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon,.ico"
              className="admin-sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  onSelectFile(file);
                }
                event.currentTarget.value = '';
              }}
            />
          </label>
          {selectedFileName ? (
            <span className="admin-settings-upload-card__filename">{selectedFileName}</span>
          ) : null}
          <button
            type="button"
            className="admin-button admin-button-primary"
            onClick={onUpload}
            disabled={!pendingPreview || uploading}
          >
            {uploading ? 'Yükleniyor…' : 'Yükle'}
          </button>
          {imageUrl ? (
            <button type="button" className="admin-button" onClick={onRemove} disabled={uploading}>
              Kaldır
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export type { ImagePreviewVariant };
