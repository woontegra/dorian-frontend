'use client';

import { useId, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { loginAdmin } from '@/lib/auth/api';
import { loginFormSchema } from '@/lib/auth/login-schema';
import { AdminApiError } from '@/lib/auth/types';
import { PasswordField } from '@/components/admin/PasswordField';

export function LoginForm() {
  const router = useRouter();
  const emailId = useId();
  const formErrorId = useId();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = loginFormSchema.safeParse({ email, password });
    if (!parsed.success) {
      const nextErrors: { email?: string; password?: string } = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === 'email' || key === 'password') {
          nextErrors[key] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      await loginAdmin(parsed.data.email, parsed.data.password);
      router.replace('/admin');
    } catch (error) {
      setPassword('');
      if (error instanceof AdminApiError) {
        setFormError(error.message);
      } else {
        setFormError('Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="admin-login-form" onSubmit={handleSubmit} noValidate>
      <div className="admin-field">
        <label className="admin-label" htmlFor={emailId}>
          E-posta
        </label>
        <input
          id={emailId}
          className="admin-input"
          type="email"
          name="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={submitting}
          autoComplete="username"
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? `${emailId}-error` : undefined}
        />
        {fieldErrors.email ? (
          <p id={`${emailId}-error`} className="admin-field-error" role="alert">
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      <PasswordField
        value={password}
        onChange={setPassword}
        disabled={submitting}
        error={fieldErrors.password}
      />

      {formError ? (
        <p id={formErrorId} className="admin-form-error" role="alert">
          {formError}
        </p>
      ) : null}

      <button className="admin-button admin-button-primary" type="submit" disabled={submitting}>
        {submitting ? 'Giriş yapılıyor…' : 'Giriş Yap'}
      </button>
    </form>
  );
}
