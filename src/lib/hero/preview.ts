import type { HeroSettings, HeroSlide, PublicHeroResponse } from '@kurumsal/shared';
import { resolvePublicHeroSlides } from '@kurumsal/shared';

/**
 * Builds the same public hero DTO used on the site, optionally overlaying an in-progress draft slide.
 * Admin drafts remain previewable even when inactive or not yet persisted.
 */
export function mapPublicHeroFromAdmin(
  settings: HeroSettings,
  draftSlide?: HeroSlide | null,
): PublicHeroResponse {
  const slides = settings.slides.map((slide) =>
    draftSlide && slide.id === draftSlide.id ? draftSlide : slide,
  );
  const withDraft =
    draftSlide && draftSlide.id === 'new' ? [...slides, draftSlide] : slides;

  let previewSlides = resolvePublicHeroSlides(settings, withDraft);

  if (draftSlide && draftSlide.desktopImageUrl.trim().length > 0) {
    if (settings.displayMode === 'SINGLE') {
      previewSlides = [draftSlide];
    } else if (!previewSlides.some((slide) => slide.id === draftSlide.id)) {
      previewSlides = [...previewSlides, draftSlide].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt),
      );
    } else {
      previewSlides = previewSlides.map((slide) =>
        slide.id === draftSlide.id ? draftSlide : slide,
      );
    }
  }

  if (previewSlides.length === 0) {
    return null;
  }

  const multi = previewSlides.length > 1 && settings.displayMode === 'CAROUSEL';

  return {
    displayMode: settings.displayMode,
    widthMode: settings.widthMode,
    maxWidthPx: settings.maxWidthPx,
    heightMode: settings.heightMode,
    fixedHeightDesktopPx: settings.fixedHeightDesktopPx,
    fixedHeightMobilePx: settings.fixedHeightMobilePx,
    autoplay: multi ? settings.autoplay : false,
    autoplayIntervalSec: settings.autoplayIntervalSec,
    showArrows: multi ? settings.showArrows : false,
    showDots: multi ? settings.showDots : false,
    transitionEffect: settings.transitionEffect,
    loop: multi ? settings.loop : false,
    controlTone: settings.controlTone,
    slides: previewSlides.map((slide) => ({
      id: slide.id,
      desktopImageUrl: slide.desktopImageUrl,
      mobileImageUrl: slide.mobileImageUrl,
      altText: slide.altText,
      objectFit: slide.objectFit,
      content: slide.content,
    })),
  };
}
