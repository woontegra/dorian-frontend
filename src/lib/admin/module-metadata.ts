import type { Metadata } from 'next';

export function createModuleMetadata(title: string): Metadata {
  return {
    title,
    robots: {
      index: false,
      follow: false,
    },
  };
}
