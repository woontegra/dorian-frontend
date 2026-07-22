'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'admin-sidebar-collapsed';

export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'true') {
        setCollapsed(true);
      }
    } catch {
      // localStorage unavailable — keep default expanded state
    } finally {
      setHydrated(true);
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((previous) => {
      const next = !previous;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // ignore write failures
      }
      return next;
    });
  }, []);

  return { collapsed, toggleCollapsed, hydrated };
}
