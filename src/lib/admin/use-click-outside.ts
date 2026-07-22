'use client';

import { useEffect, type RefObject } from 'react';

export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  handler: () => void,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (ref.current?.contains(target)) {
        return;
      }

      handler();
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [enabled, handler, ref]);
}
