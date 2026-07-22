import { AlignCenter, AlignLeft, AlignRight } from 'lucide-react';

export { AlignCenter, AlignLeft, AlignRight };

export function isValidHexColor(value: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value.trim());
}
