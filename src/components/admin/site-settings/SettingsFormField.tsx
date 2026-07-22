import type { ReactNode } from 'react';

type SettingsFormFieldProps = {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  error?: string;
  fullWidth?: boolean;
  children: ReactNode;
};

export function SettingsFormField({
  label,
  htmlFor,
  required = false,
  hint,
  error,
  fullWidth = false,
  children,
}: SettingsFormFieldProps) {
  return (
    <div className={`admin-settings-field${fullWidth ? ' admin-settings-field--full' : ''}`}>
      <label className="admin-settings-field__label" htmlFor={htmlFor}>
        {label}
        {required ? <span className="admin-settings-field__required"> *</span> : null}
      </label>
      {children}
      {hint ? <p className="admin-settings-field__hint">{hint}</p> : null}
      {error ? (
        <p className="admin-settings-field__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
