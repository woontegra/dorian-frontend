import type { CSSProperties } from 'react';
import type {
  HeroButtonStyle,
  HeroContentPosition,
  HeroSlideContent,
  HeroTextAlign,
  PublicHeroResponse,
  PublicHeroSlide,
} from '@kurumsal/shared';
import { heroSlideHasVisibleContent, isSafeMenuHref } from '@kurumsal/shared';

export function positionToCss(position: HeroContentPosition): CSSProperties {
  const map: Record<HeroContentPosition, CSSProperties> = {
    TOP_LEFT: { alignItems: 'flex-start', justifyContent: 'flex-start' },
    TOP_CENTER: { alignItems: 'flex-start', justifyContent: 'center' },
    TOP_RIGHT: { alignItems: 'flex-start', justifyContent: 'flex-end' },
    MIDDLE_LEFT: { alignItems: 'center', justifyContent: 'flex-start' },
    MIDDLE_CENTER: { alignItems: 'center', justifyContent: 'center' },
    MIDDLE_RIGHT: { alignItems: 'center', justifyContent: 'flex-end' },
    BOTTOM_LEFT: { alignItems: 'flex-end', justifyContent: 'flex-start' },
    BOTTOM_CENTER: { alignItems: 'flex-end', justifyContent: 'center' },
    BOTTOM_RIGHT: { alignItems: 'flex-end', justifyContent: 'flex-end' },
  };
  return map[position];
}

export function textAlignToCss(align: HeroTextAlign): CSSProperties['textAlign'] {
  if (align === 'CENTER') return 'center';
  if (align === 'RIGHT') return 'right';
  return 'left';
}

export function overlayBackground(content: HeroSlideContent): string | undefined {
  if (!content.overlayEnabled) {
    return undefined;
  }

  const color = content.overlayColor;
  const opacity = content.overlayOpacity;
  if (content.overlayMode === 'SOLID') {
    return hexToRgba(color, opacity);
  }

  const directionMap: Record<string, string> = {
    TO_BOTTOM: 'to bottom',
    TO_TOP: 'to top',
    TO_RIGHT: 'to right',
    TO_LEFT: 'to left',
    TO_BOTTOM_RIGHT: 'to bottom right',
    TO_BOTTOM_LEFT: 'to bottom left',
  };
  const direction = directionMap[content.overlayGradientDirection] ?? 'to right';
  return `linear-gradient(${direction}, ${hexToRgba(color, opacity)}, ${hexToRgba(color, Math.max(0, opacity - 0.25))})`;
}

export function hexToRgba(hex: string, alpha: number): string {
  const cleaned = hex.replace('#', '');
  const full =
    cleaned.length === 3
      ? cleaned
          .split('')
          .map((ch) => ch + ch)
          .join('')
      : cleaned.slice(0, 6);
  const r = Number.parseInt(full.slice(0, 2), 16);
  const g = Number.parseInt(full.slice(2, 4), 16);
  const b = Number.parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function isRenderableHeroButton(button: HeroButtonStyle): boolean {
  return (
    button.enabled &&
    button.label.trim().length > 0 &&
    button.href.trim().length > 0 &&
    isSafeMenuHref(button.href.trim())
  );
}

export function buildHeroFrameStyle(hero: NonNullable<PublicHeroResponse>): CSSProperties {
  const style: CSSProperties & Record<string, string> = {};
  if (hero.widthMode === 'CONTAINED') {
    style.maxWidth = `min(100%, ${hero.maxWidthPx}px)`;
    style.marginInline = 'auto';
  }

  if (hero.heightMode === 'FIXED') {
    style['--hero-fixed-desktop'] = `${hero.fixedHeightDesktopPx}px`;
    style['--hero-fixed-mobile'] = `${hero.fixedHeightMobilePx}px`;
  }

  return style;
}

export function slideHasContentLayer(slide: PublicHeroSlide): boolean {
  return heroSlideHasVisibleContent(slide.content);
}
