"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

export type HeroSlide = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  cta: string;
};

export function HeroCarousel({ slides }: { slides: readonly HeroSlide[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (slides.length < 2 || paused || focused || hovered || reducedMotion) return;
    const timer = window.setInterval(
      () => setActiveIndex((index) => (index + 1) % slides.length),
      5_000,
    );
    return () => window.clearInterval(timer);
  }, [focused, hovered, paused, reducedMotion, slides.length]);

  if (slides.length === 0) return null;

  function move(offset: number) {
    setActiveIndex((index) => (index + offset + slides.length) % slides.length);
  }

  return (
    <section
      className="relative overflow-hidden bg-ink-900 text-surface"
      aria-roledescription="carousel"
      aria-label="추천 악보"
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <h1 className="sr-only">ScoreStore 디지털 악보 마켓</h1>
      <div
        className="absolute inset-0 bg-gradient-to-br from-brand-800 via-ink-900 to-ink-700 opacity-90"
        aria-hidden="true"
      />
      <div className="page-shell relative overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {slides.map((slide, index) => (
            <div
              className="flex min-h-72 min-w-full shrink-0 items-center pb-24 pt-6 md:min-h-96 md:py-16"
              key={slide.title}
              aria-hidden={index !== activeIndex}
            >
              <div className="max-w-2xl" aria-live="off">
                <p className="text-sm font-bold tracking-widest text-brand-100">{slide.eyebrow}</p>
                <h2 className="font-display mt-3 text-3xl font-semibold leading-tight md:text-5xl">
                  {slide.title}
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-6 text-brand-50 md:text-base">
                  {slide.description}
                </p>
                <Link
                  className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-surface px-5 text-sm font-bold text-brand-800 hover:bg-brand-50"
                  href={slide.href}
                  tabIndex={index === activeIndex ? undefined : -1}
                >
                  {slide.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {slides.length > 1 ? (
          <div className="absolute inset-x-4 bottom-4 flex items-center justify-between md:inset-x-8">
            <div
              className="flex items-center gap-1"
              aria-label={`${slides.length}개 중 ${activeIndex + 1}번째 슬라이드`}
            >
              {slides.map((slide, index) => (
                <button
                  className={`size-11 rounded-full p-4 ${index === activeIndex ? "bg-surface" : "bg-surface/30"}`}
                  type="button"
                  key={slide.title}
                  aria-label={`${index + 1}번째 슬라이드 보기`}
                  aria-current={index === activeIndex ? "true" : undefined}
                  onClick={() => setActiveIndex(index)}
                >
                  <span className="block size-3 rounded-full bg-current" aria-hidden="true" />
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              <Button
                className="rounded-full border-surface/40 bg-ink-900/50 text-surface hover:bg-ink-700"
                type="button"
                variant="outline"
                size="icon"
                aria-label="이전 슬라이드"
                onClick={() => move(-1)}
              >
                <ChevronLeft strokeWidth={1.5} aria-hidden="true" />
              </Button>
              <Button
                className="rounded-full border-surface/40 bg-ink-900/50 text-surface hover:bg-ink-700"
                type="button"
                variant="outline"
                size="icon"
                aria-label={paused ? "자동 재생" : "자동 재생 정지"}
                aria-pressed={paused}
                onClick={() => {
                  if (paused) {
                    setPaused(false);
                    setFocused(false);
                    setHovered(false);
                  } else {
                    setPaused(true);
                  }
                }}
              >
                {paused ? (
                  <Play strokeWidth={1.5} aria-hidden="true" />
                ) : (
                  <Pause strokeWidth={1.5} aria-hidden="true" />
                )}
              </Button>
              <Button
                className="rounded-full border-surface/40 bg-ink-900/50 text-surface hover:bg-ink-700"
                type="button"
                variant="outline"
                size="icon"
                aria-label="다음 슬라이드"
                onClick={() => move(1)}
              >
                <ChevronRight strokeWidth={1.5} aria-hidden="true" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
