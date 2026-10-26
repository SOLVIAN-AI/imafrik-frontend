"use client";

import * as React from "react";

import { marketingCopy } from "@/content/marketing";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { Locale } from "@/lib/i18n/locale";
import { ANCHORS } from "@/lib/i18n/routes";
import { cn } from "@/lib/utils";

import {
  DeliveryScene,
  GatewayScene,
  ReadingScene,
  RouteScene,
} from "./scenes";
import {
  ACTS,
  ACT_COUNT,
  actAt,
  actEnd,
  actProgress,
  clamp01,
} from "./timeline";

/**
 * Le parcours d'un examen, raconté en mouvement (demande du 20 octobre 2026).
 *
 * **Sur grand écran**, la scène reste à l'écran pendant que la page défile :
 * le défilement fait avancer l'histoire, au rythme du visiteur, et la
 * remonter la rejoue à l'envers. Les étapes écrites, à gauche, suivent.
 *
 * **Sur téléphone**, et partout où les animations sont réduites, les
 * étapes s'empilent : chacune joue sa scène une fois, à son arrivée à
 * l'écran, ou la montre achevée si l'on a demandé moins de mouvement.
 * Les deux formes sont dans la page ; le CSS n'en affiche qu'une, ce qui
 * évite tout changement de mise en page à l'hydratation.
 *
 * Les coupes de scanner ne se chargent qu'à l'approche de la section
 * (233 Ko pour 25 coupes), jamais avec le haut de la page.
 *
 * @param locale Langue de la page.
 */
export function Journey({ locale }: { locale: Locale }) {
  const t = marketingCopy(locale).journey;
  const root = React.useRef<HTMLElement>(null);
  const imagesReady = useNear(root);

  return (
    <section
      ref={root}
      id={ANCHORS.fonctionnement[locale]}
      aria-labelledby="parcours-titre"
      className="relative"
    >
      <div className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 md:pt-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="label-eyebrow text-accent">{t.eyebrow}</p>
          <h2
            id="parcours-titre"
            className="mt-3 text-3xl font-semibold text-balance md:text-4xl"
          >
            {t.title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-secondary">
            {t.lead}
          </p>
        </div>
      </div>

      <ScrollStory locale={locale} imagesReady={imagesReady} />
      <StackedStory locale={locale} imagesReady={imagesReady} />

      <p className="mx-auto max-w-2xl px-6 pb-16 text-center text-2xs leading-relaxed text-tertiary md:pb-24">
        {t.credit}{" "}
        <a
          href="https://doi.org/10.7937/K9/TCIA.2015.LO9QL9SX"
          className="underline underline-offset-2 hover:text-secondary"
          rel="noreferrer"
        >
          {t.creditLink}
        </a>
      </p>
    </section>
  );
}

/**
 * Vrai dès que l'élément approche de l'écran (un écran et demi avant),
 * puis le reste : de quoi charger les images juste à temps.
 */
function useNear(ref: React.RefObject<HTMLElement | null>): boolean {
  const [near, setNear] = React.useState(false);
  React.useEffect(() => {
    const element = ref.current;
    if (!element || near) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "150% 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, near]);
  return near;
}

/**
 * Avancement du défilement à travers un élément plus haut que l'écran :
 * 0 quand son haut touche le haut de l'écran, 1 quand son bas touche le bas.
 * Une mesure par image au plus, et seulement pendant le défilement.
 */
function useScrollProgress(ref: React.RefObject<HTMLElement | null>): number {
  const [progress, setProgress] = React.useState(0);
  React.useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const element = ref.current;
      if (!element || element.offsetParent === null) return;
      const rect = element.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      setProgress(travel > 0 ? clamp01(-rect.top / travel) : 0);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [ref]);
  return progress;
}

/** La scène d'un acte, à un avancement donné. */
function Scene({
  act,
  p,
  locale,
  imagesReady,
}: {
  act: number;
  p: number;
  locale: Locale;
  imagesReady: boolean;
}) {
  const copy = marketingCopy(locale).journey.scene;
  const t = actProgress(p, act);
  switch (act) {
    case 0:
      return <GatewayScene t={t} copy={copy} imagesReady={imagesReady} />;
    case 1:
      return <RouteScene t={t} copy={copy} />;
    case 2:
      return <ReadingScene t={t} p={p} copy={copy} imagesReady={imagesReady} />;
    default:
      return <DeliveryScene t={t} copy={copy} />;
  }
}

/** Fenêtre de l'application qui accueille une scène. */
function SceneFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border-default bg-surface-raised shadow-overlay",
        className,
      )}
      aria-hidden
    >
      <div className="flex h-9 items-center gap-1.5 border-b border-border-subtle bg-surface-sunken px-3.5">
        <span className="size-2 rounded-full bg-border-strong" />
        <span className="size-2 rounded-full bg-border-strong" />
        <span className="size-2 rounded-full bg-border-strong" />
      </div>
      {children}
    </div>
  );
}

/** Grand écran : l'histoire avance avec le défilement. */
function ScrollStory({
  locale,
  imagesReady,
}: {
  locale: Locale;
  imagesReady: boolean;
}) {
  const t = marketingCopy(locale).journey;
  const track = React.useRef<HTMLDivElement>(null);
  const p = useScrollProgress(track);
  const act = actAt(p);

  return (
    // Quatre écrans de défilement : assez pour que chaque acte se lise
    // sans hâte, sans que la page paraisse interminable.
    <div ref={track} className="relative hidden h-[400vh] lg:motion-safe:block">
      <div className="sticky top-0 flex h-screen items-center">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-center gap-12 px-6 lg:px-8">
          <ol className="flex flex-col gap-2">
            {t.steps.map((step, index) => {
              const active = index === act;
              const done = index < act;
              const [start, end] = ACTS[index];
              const fillRatio = clamp01((p - start) / (end - start));
              return (
                <li
                  key={step.title}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "rounded-xl border px-5 py-4 transition-colors duration-300",
                    active
                      ? "border-accent/40 bg-accent-muted"
                      : "border-transparent",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-300",
                        active
                          ? "bg-accent text-accent-contrast"
                          : done
                            ? "bg-done-muted text-done"
                            : "bg-surface-sunken text-tertiary",
                      )}
                    >
                      {index + 1}
                    </span>
                    <h3
                      className={cn(
                        "text-base font-semibold transition-colors duration-300",
                        !active && !done && "text-secondary",
                      )}
                    >
                      {step.title}
                    </h3>
                  </div>
                  <p
                    className={cn(
                      // Une couleur de texte, jamais une opacité : le contraste
                      // reste celui des jetons, dans les deux thèmes.
                      "prose-justify mt-2 pl-10 text-sm leading-relaxed transition-colors duration-300",
                      active ? "text-primary" : "text-secondary",
                    )}
                  >
                    {step.detail}
                  </p>
                  <span className="mt-3 ml-10 block h-0.5 overflow-hidden rounded-full bg-border-subtle">
                    <span
                      className="block h-full origin-left bg-accent"
                      style={{ transform: `scaleX(${fillRatio})` }}
                    />
                  </span>
                </li>
              );
            })}
          </ol>

          <SceneFrame className="h-[min(560px,72vh)]">
            {Array.from({ length: ACT_COUNT }, (_, index) => (
              <div
                key={index}
                className="absolute inset-x-0 top-9 bottom-0 transition-[opacity,transform] duration-500 ease-(--ease-out-quart)"
                style={{
                  opacity: index === act ? 1 : 0,
                  transform: `translateY(${index === act ? 0 : index < act ? -12 : 12}px)`,
                }}
              >
                <Scene
                  act={index}
                  p={
                    index === act
                      ? p
                      : index < act
                        ? actEnd(index)
                        : ACTS[index][0]
                  }
                  locale={locale}
                  imagesReady={imagesReady}
                />
              </div>
            ))}
          </SceneFrame>
        </div>
      </div>
    </div>
  );
}

/**
 * Avancement qui va de 0 à 1 une seule fois, quand l'élément arrive à
 * l'écran, en `duration` millisecondes. Figé à 1 si l'on a demandé moins
 * de mouvement.
 */
function usePlayOnce(
  ref: React.RefObject<HTMLElement | null>,
  duration: number,
): number {
  const [t, setT] = React.useState(0);
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)", false);
  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (reduced) return;
    let frame = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const value = clamp01((now - start) / duration);
      setT(value);
      if (value < 1) frame = window.requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.intersectionRatio >= 0.45)) {
          observer.disconnect();
          frame = window.requestAnimationFrame(tick);
        }
      },
      { threshold: [0, 0.45] },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, [ref, duration, reduced]);
  return reduced ? 1 : t;
}

/** Une étape empilée, avec sa scène. */
function StackedStep({
  index,
  locale,
  imagesReady,
}: {
  index: number;
  locale: Locale;
  imagesReady: boolean;
}) {
  const step = marketingCopy(locale).journey.steps[index];
  const ref = React.useRef<HTMLLIElement>(null);
  // La lecture, plus riche, dure un peu plus longtemps.
  const t = usePlayOnce(ref, index === 2 ? 4200 : 2800);
  const [start] = ACTS[index];
  const p = t >= 1 ? actEnd(index) : start + (actEnd(index) - start) * t;

  return (
    <li ref={ref} className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-contrast">
          {index + 1}
        </span>
        <h3 className="text-lg font-semibold">{step.title}</h3>
      </div>
      <p className="prose-justify text-sm leading-relaxed text-secondary">
        {step.detail}
      </p>
      <SceneFrame className="h-[360px] sm:h-[400px]">
        <div className="absolute inset-x-0 top-9 bottom-0">
          <Scene act={index} p={p} locale={locale} imagesReady={imagesReady} />
        </div>
      </SceneFrame>
    </li>
  );
}

/** Téléphone et mouvement réduit : les étapes s'empilent. */
function StackedStory({
  locale,
  imagesReady,
}: {
  locale: Locale;
  imagesReady: boolean;
}) {
  return (
    <ol className="mx-auto flex max-w-xl flex-col gap-14 px-6 py-12 lg:max-w-3xl lg:motion-safe:hidden">
      {Array.from({ length: ACT_COUNT }, (_, index) => (
        <StackedStep
          key={index}
          index={index}
          locale={locale}
          imagesReady={imagesReady}
        />
      ))}
    </ol>
  );
}
