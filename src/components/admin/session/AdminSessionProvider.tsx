'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { fetchAdminMe, logoutAdmin } from '@/lib/auth/api';
import { AdminApiError, type AdminProfile } from '@/lib/auth/types';

type GateState = 'loading' | 'ready' | 'redirecting';

type AdminSessionContextValue = {
  admin: AdminProfile;
  loggingOut: boolean;
  logout: () => Promise<void>;
};

const AdminSessionContext = createContext<AdminSessionContextValue | null>(null);

export function useAdminSession(): AdminSessionContextValue {
  const context = useContext(AdminSessionContext);
  if (!context) {
    throw new Error('useAdminSession must be used within AdminSessionProvider');
  }
  return context;
}

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<GateState>('loading');
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const profile = await fetchAdminMe();
        if (!cancelled) {
          setAdmin(profile);
          setState('ready');
        }
      } catch {
        if (!cancelled) {
          setState('redirecting');
          router.replace('/admin/login');
        }
      }
    }

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const logout = useCallback(async () => {
    setLoggingOut(true);

    try {
      await logoutAdmin();
    } catch (error) {
      if (!(error instanceof AdminApiError && (error.statusCode === 401 || error.code === 'NETWORK'))) {
        // Session already invalid still sends user to login
      }
    } finally {
      router.replace('/admin/login');
    }
  }, [router]);

  const value = useMemo(() => {
    if (!admin) {
      return null;
    }

    return { admin, loggingOut, logout };
  }, [admin, loggingOut, logout]);

  if (state !== 'ready' || !admin || !value) {
    return (
      <div className="admin-status admin-status-page" role="status" aria-live="polite">
        Oturum kontrol ediliyor…
      </div>
    );
  }

  return <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>;
}
