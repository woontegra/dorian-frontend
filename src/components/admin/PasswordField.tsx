'use client';

import { useId, useState } from 'react';

type PasswordFieldProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  autoComplete?: string;
};

export function PasswordField({
  value,
  onChange,
  disabled,
  error,
  autoComplete = 'current-password',
}: PasswordFieldProps) {
  const inputId = useId();
  const errorId = useId();
  const [visible, setVisible] = useState(false);

  return (
    <div className="admin-field">
      <label className="admin-label" htmlFor={inputId}>
        Parola
      </label>
      <div className="admin-password-row">
        <input
          id={inputId}
          className="admin-input"
          type={visible ? 'text' : 'password'}
          name="password"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        />
        <button
          type="button"
          className="admin-password-toggle"
          onClick={() => setVisible((current) => !current)}
          disabled={disabled}
          aria-pressed={visible}
          aria-label={visible ? 'Parolayı gizle' : 'Parolayı göster'}
        >
          {visible ? 'Gizle' : 'Göster'}
        </button>
      </div>
      {error ? (
        <p id={errorId} className="admin-field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
