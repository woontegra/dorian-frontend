'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import type { HeroButtonStyle, PublicHeroResponse, PublicHeroSlide } from '@kurumsal/shared';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  buildHeroFrameStyle,
  isRenderableHeroButton,
  overlayBackground,
  positionToCss,
  slideHasContentLayer,
  textAlignToCss,
  hexToRgba,
} from '@/lib/public/hero-style';
import { isInternalNavHref } from '@/lib/public/nav-utils';
import '@/components/public/site-hero.css';

type SiteHeroProps = {
  hero: NonNullable<PublicHeroResponse>;
  /** When true, disable autoplay timers and block link navigation (admin preview). */
  previewMode?: boolean;
  previewViewport?: 'desktop' | 'tablet' | 'mobile';
};

function HeroButton({
  button,
  fullWidthMobile,
  previewMode,
}: {
  button: HeroButtonStyle;
  fullWidthMobile: boolean;
  previewMode?: boolean;
}) {
  if (!isRenderableHeroButton(button)) {
    return null;
  }

  const href = button.href.trim();
  const className = `site-hero__btn site-hero__btn--${button.variant.toLowerCase()}${
    fullWidthMobile ? ' site-hero__btn--mobile-full' : ''
  }`;
  const style = {
    '--btn-color': button.textColor,
    '--btn-bg': button.backgroundColor,
    '--btn-hover-color': button.hoverTextColor,
    '--btn-hover-bg': button.hoverBackgroundColor,
    '--btn-border': button.borderColor,
    '--btn-border-w': `${button.borderWidth}px`,
    '--btn-radius': `${button.borderRadius}px`,
    '--btn-pad-x': `${button.paddingX}px`,
    '--btn-pad-y': `${button.paddingY}px`,
    '--btn-size-d': `${button.fontSizeDesktop}px`,
    '--btn-size-m': `${button.fontSizeMobile}px`,
    fontWeight: button.fontWeight,
  } as React.CSSProperties;

  const onPreviewClick = previewMode
    ? (event: React.MouseEvent) => {
        event.preventDefault();
      }
    : undefined;

  const external = !isInternalNavHref(href) || button.openInNewTab;

  if (external) {
    return (
      <a
        href={href}
        className={className}
        style={style}
        target={button.openInNewTab || !isInternalNavHref(href) ? '_blank' : undefined}
        rel={button.openInNewTab || !isInternalNavHref(href) ? 'noopener noreferrer' : undefined}
        onClick={onPreviewClick}
      >
        {button.label}
      </a>
    );
  }

  return (
    <Link href={href} className={className} style={style} onClick={onPreviewClick}>
      {button.label}
    </Link>
  );
}

function HeroSlideView({
  slide,
  active,
  priority,
  previewViewport,
  isTitleH1,
  previewMode,
}: {
  slide: PublicHeroSlide;
  active: boolean;
  priority: boolean;
  previewViewport?: 'desktop' | 'tablet' | 'mobile';
  isTitleH1: boolean;
  previewMode?: boolean;
}) {
  const content = slide.content;
  const showContent = slideHasContentLayer(slide);
  const position = previewViewport === 'mobile' ? content.positionMobile : content.positionDesktop;
  const TitleTag = (isTitleH1 ? 'h1' : 'h2') as 'h1' | 'h2';

  return (
    <div
      className={`site-hero__slide${active ? ' is-active' : ''}`}
      role="group"
      aria-roledescription="slayt"
      aria-hidden={!active}
    >
      <picture>
        {slide.mobileImageUrl && previewMode && previewViewport === 'mobile' ? (
          <source media="all" srcSet={slide.mobileImageUrl} />
        ) : null}
        {slide.mobileImageUrl && !previewMode ? (
          <source media="(max-width: 900px)" srcSet={slide.mobileImageUrl} />
        ) : null}
        <img
          src={
            previewMode && previewViewport === 'mobile' && slide.mobileImageUrl
              ? slide.mobileImageUrl
              : slide.desktopImageUrl
          }
          alt={slide.altText || ''}
          className={`site-hero__image site-hero__image--${slide.objectFit.toLowerCase()}`}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
        />
      </picture>

      {content.overlayEnabled ? (
        <div className="site-hero__overlay" style={{ background: overlayBackground(content) }} aria-hidden="true" />
      ) : null}

      {showContent ? (
        <div
          className="site-hero__content-shell"
          style={{
            ...positionToCss(position),
            ['--hero-offset-x' as string]: `${content.offsetXPercent}%`,
            ['--hero-offset-y' as string]: `${content.offsetYPercent}%`,
          }}
        >
          <div
            className={`site-hero__content${content.panelEnabled ? ' site-hero__content--panel' : ''}${
              content.textShadow ? ' site-hero__content--shadow' : ''
            }`}
            style={{
              maxWidth: `${content.maxWidthPx}px`,
              padding: `${content.panelEnabled ? content.panelPadding : content.paddingPx}px`,
              textAlign: textAlignToCss(content.textAlign),
              background: content.panelEnabled
                ? hexToRgba(content.panelColor, content.panelOpacity)
                : undefined,
              borderRadius: content.panelEnabled ? `${content.panelRadius}px` : undefined,
            }}
          >
            {content.eyebrow.enabled && content.eyebrow.text.trim() ? (
              <p
                className="site-hero__eyebrow"
                style={{
                  color: content.eyebrow.color,
                  fontWeight: content.eyebrow.fontWeight,
                  lineHeight: content.eyebrow.lineHeight,
                  letterSpacing: `${content.eyebrow.letterSpacing}em`,
                  marginBottom: content.eyebrow.marginBottom,
                  ['--t-size-d' as string]: `${content.eyebrow.fontSizeDesktop}px`,
                  ['--t-size-m' as string]: `${content.eyebrow.fontSizeMobile}px`,
                  textAlign: textAlignToCss(content.eyebrow.textAlign),
                }}
              >
                {content.eyebrow.text}
              </p>
            ) : null}

            {content.title.enabled && content.title.text.trim() ? (
              <TitleTag
                className="site-hero__title"
                style={{
                  color: content.title.color,
                  fontWeight: content.title.fontWeight,
                  lineHeight: content.title.lineHeight,
                  letterSpacing: `${content.title.letterSpacing}em`,
                  marginBottom: content.title.marginBottom,
                  ['--t-size-d' as string]: `${content.title.fontSizeDesktop}px`,
                  ['--t-size-m' as string]: `${content.title.fontSizeMobile}px`,
                  textAlign: textAlignToCss(content.title.textAlign),
                }}
              >
                {content.title.text}
              </TitleTag>
            ) : null}

            {content.description.enabled && content.description.text.trim() ? (
              <p
                className="site-hero__description"
                style={{
                  color: content.description.color,
                  fontWeight: content.description.fontWeight,
                  lineHeight: content.description.lineHeight,
                  letterSpacing: `${content.description.letterSpacing}em`,
                  marginBottom: content.description.marginBottom,
                  ['--t-size-d' as string]: `${content.description.fontSizeDesktop}px`,
                  ['--t-size-m' as string]: `${content.description.fontSizeMobile}px`,
                  textAlign: textAlignToCss(content.description.textAlign),
                  whiteSpace: 'pre-wrap',
                }}
              >
                {content.description.text}
              </p>
            ) : null}

            {(isRenderableHeroButton(content.primaryButton) ||
              isRenderableHeroButton(content.secondaryButton)) && (
              <div
                className={`site-hero__actions site-hero__actions--${content.buttonLayout.toLowerCase()}`}
                style={{
                  gap: content.buttonGap,
                  marginTop: content.buttonMarginTop,
                  justifyContent:
                    content.buttonAlignDesktop === 'CENTER'
                      ? 'center'
                      : content.buttonAlignDesktop === 'RIGHT'
                        ? 'flex-end'
                        : 'flex-start',
                  ['--actions-mobile-align' as string]:
                    content.buttonAlignMobile === 'CENTER'
                      ? 'center'
                      : content.buttonAlignMobile === 'RIGHT'
                        ? 'flex-end'
                        : 'flex-start',
                }}
              >
                <HeroButton
                  button={content.primaryButton}
                  fullWidthMobile={content.buttonsFullWidthMobile}
                  previewMode={previewMode}
                />
                <HeroButton
                  button={content.secondaryButton}
                  fullWidthMobile={content.buttonsFullWidthMobile}
                  previewMode={previewMode}
                />
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SiteHero({ hero, previewMode = false, previewViewport }: SiteHeroProps) {
  const slides = hero.slides;
  const multi = slides.length > 1 && hero.displayMode === 'CAROUSEL';
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotionRef = useRef(false);
  const rootId = useId();
  const timerRef = useRef<number | null>(null);

  const goTo = useCallback(
    (next: number) => {
      if (!multi) return;
      const total = slides.length;
      if (hero.loop) {
        setIndex(((next % total) + total) % total);
      } else {
        setIndex(Math.max(0, Math.min(total - 1, next)));
      }
    },
    [hero.loop, multi, slides.length],
  );

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      reducedMotionRef.current = false;
      return;
    }
    reducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    setIndex(0);
  }, [slides.map((s) => s.id).join('|')]);

  useEffect(() => {
    if (!multi || !hero.autoplay || paused || previewMode || reducedMotionRef.current) {
      return;
    }

    function clear() {
      if (timerRef.current != null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    function start() {
      clear();
      timerRef.current = window.setInterval(() => {
        if (document.visibilityState !== 'visible') return;
        setIndex((current) => {
          const next = current + 1;
          if (next >= slides.length) {
            return hero.loop ? 0 : current;
          }
          return next;
        });
      }, hero.autoplayIntervalSec * 1000);
    }

    start();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') start();
      else clear();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clear();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [hero.autoplay, hero.autoplayIntervalSec, hero.loop, multi, paused, previewMode, slides.length]);

  if (slides.length === 0) {
    return null;
  }

  const heightClass =
    hero.heightMode === 'VIEWPORT'
      ? 'site-hero--viewport'
      : hero.heightMode === 'FIXED'
        ? 'site-hero--fixed'
        : 'site-hero--auto';

  const widthClass = hero.widthMode === 'FULL' ? 'site-hero--full' : 'site-hero--contained';
  const toneClass = hero.controlTone === 'DARK' ? 'site-hero--tone-dark' : 'site-hero--tone-light';
  const transitionClass =
    hero.transitionEffect === 'SLIDE' && !reducedMotionRef.current
      ? 'site-hero--transition-slide'
      : 'site-hero--transition-fade';

  return (
    <section
      className={`site-hero ${heightClass} ${widthClass} ${toneClass} ${transitionClass}${
        previewMode && previewViewport === 'mobile' ? ' site-hero--preview-mobile' : ''
      }${previewMode && previewViewport === 'tablet' ? ' site-hero--preview-tablet' : ''}`}
      style={buildHeroFrameStyle(hero)}
      aria-roledescription={multi ? 'carousel' : undefined}
      aria-label="Ana sayfa görseli"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <div className="site-hero__viewport">
        {slides.map((slide, slideIndex) => (
          <HeroSlideView
            key={slide.id}
            slide={slide}
            active={slideIndex === index}
            priority={slideIndex === 0}
            previewViewport={previewViewport}
            previewMode={previewMode}
            isTitleH1={slideIndex === index}
          />
        ))}
      </div>

      {multi && hero.showArrows ? (
        <>
          <button
            type="button"
            className="site-hero__arrow site-hero__arrow--prev"
            aria-label="Önceki slayt"
            aria-controls={rootId}
            onClick={() => goTo(index - 1)}
          >
            <ChevronLeft size={22} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="site-hero__arrow site-hero__arrow--next"
            aria-label="Sonraki slayt"
            aria-controls={rootId}
            onClick={() => goTo(index + 1)}
          >
            <ChevronRight size={22} aria-hidden="true" />
          </button>
        </>
      ) : null}

      {multi && hero.showDots ? (
        <div className="site-hero__dots" id={rootId} role="tablist" aria-label="Slayt seçimi">
          {slides.map((slide, slideIndex) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              className={`site-hero__dot${slideIndex === index ? ' is-active' : ''}`}
              aria-label={`Slayt ${slideIndex + 1}`}
              aria-selected={slideIndex === index}
              tabIndex={slideIndex === index ? 0 : -1}
              onClick={() => setIndex(slideIndex)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
