import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/components/admin/LoginForm';
import { LoginPageClient } from '@/components/admin/LoginPageClient';
import { PasswordField } from '@/components/admin/PasswordField';
import { AdminApiError } from '@/lib/auth/types';

const replaceMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
    push: vi.fn(),
  }),
}));

vi.mock('@/lib/auth/api', () => ({
  loginAdmin: vi.fn(),
  logoutAdmin: vi.fn(),
  fetchAdminMe: vi.fn(),
}));

import { fetchAdminMe, loginAdmin } from '@/lib/auth/api';

const mockedLogin = loginAdmin as unknown as ReturnType<typeof vi.fn>;
const mockedMe = fetchAdminMe as unknown as ReturnType<typeof vi.fn>;

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logs in successfully and redirects to /admin', async () => {
    const user = userEvent.setup();
    mockedLogin.mockResolvedValue({
      id: '1',
      email: 'admin@example.com',
      fullName: 'Admin',
      role: 'ADMIN',
    });

    render(<LoginForm />);

    await user.type(screen.getByLabelText('E-posta'), 'admin@example.com');
    await user.type(screen.getByLabelText('Parola'), 'ValidPass123!');
    await user.click(screen.getByRole('button', { name: 'Giriş Yap' }));

    await waitFor(() => {
      expect(mockedLogin).toHaveBeenCalledWith('admin@example.com', 'ValidPass123!');
      expect(replaceMock).toHaveBeenCalledWith('/admin');
    });
  });

  it('shows auth error and clears password on failed login', async () => {
    const user = userEvent.setup();
    mockedLogin.mockRejectedValue(new AdminApiError('E-posta veya parola hatalı.', 401, 'UNAUTHORIZED'));

    render(<LoginForm />);

    const email = screen.getByLabelText('E-posta');
    const password = screen.getByLabelText('Parola');

    await user.type(email, 'admin@example.com');
    await user.type(password, 'wrong');
    await user.click(screen.getByRole('button', { name: 'Giriş Yap' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/E-posta veya parola/);
    expect(password).toHaveValue('');
    expect(email).toHaveValue('admin@example.com');
  });

  it('shows rate limit message', async () => {
    const user = userEvent.setup();
    mockedLogin.mockRejectedValue(
      new AdminApiError(
        'Çok fazla giriş denemesi yapıldı. Lütfen daha sonra tekrar deneyin.',
        429,
        'RATE_LIMIT',
      ),
    );

    render(<LoginForm />);
    await user.type(screen.getByLabelText('E-posta'), 'admin@example.com');
    await user.type(screen.getByLabelText('Parola'), 'ValidPass123!');
    await user.click(screen.getByRole('button', { name: 'Giriş Yap' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/Çok fazla giriş denemesi/);
  });
});

describe('LoginPageClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects authenticated users away from login', async () => {
    mockedMe.mockResolvedValue({
      id: '1',
      email: 'admin@example.com',
      fullName: 'Admin',
      role: 'ADMIN',
    });

    render(<LoginPageClient />);

    expect(screen.getByRole('status')).toHaveTextContent(/Oturum kontrol/);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/admin');
    });
  });
});

describe('PasswordField', () => {
  it('toggles password visibility accessibly', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<PasswordField value="secret" onChange={onChange} />);

    const input = screen.getByLabelText('Parola');
    expect(input).toHaveAttribute('type', 'password');

    const toggle = screen.getByRole('button', { name: 'Parolayı göster' });
    await user.click(toggle);

    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Parolayı gizle' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
