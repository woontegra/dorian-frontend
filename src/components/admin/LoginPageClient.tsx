'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAdminMe } from '@/lib/auth/api';
import { AdminApiError } from '@/lib/auth/types';
import { LoginForm } from '@/components/admin/LoginForm';

type GateState = 'loading' | 'guest' | 'authenticated';

export function LoginPageClient() {
  const router = useRouter();
  const [state, setState] = useState<GateState>('loading');

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        await fetchAdminMe();
        if (!cancelled) {
          setState('authenticated');
          router.replace('/admin');
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof AdminApiError && error.code === 'INSECURE') {
          setState('guest');
          return;
        }

        setState('guest');
      }
    }

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (state === 'loading' || state === 'authenticated') {
    return (
      <div className="admin-status" role="status" aria-live="polite">
        Oturum kontrol ediliyor…
      </div>
    );
  }

  return (
    <div className="admin-login-card">
      <header className="admin-login-header">
        <h1>Site Yönetim Paneli</h1>
        <p>Yönetim alanına erişmek için giriş yapın.</p>
      </header>
      <LoginForm />
    </div>
  );
}
