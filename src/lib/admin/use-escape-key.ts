'use client';

import { useEffect } from 'react';

export function useEscapeKey(handler: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        handler();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [enabled, handler]);
}
