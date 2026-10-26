"use client";

import * as React from "react";

import { VisualImage } from "@/components/marketing/visual-image";
import type { Visual } from "@/content/marketing/visuals";
import { cn } from "@/lib/utils";

/** Un écran présenté : onglet, public, texte, capture. */
export interface ProductScreenItem {
  tab: string;
  audience: string;
  text: string;
  alt: string;
  visual: Visual;
}

/** Largeur d'affichage des captures. */
const SIZES = "(min-width: 1280px) 72rem, calc(100vw - 2rem)";

/**
 * Onglets des captures de l'application.
 *
 * Un onglet par écran, selon le motif d'onglets de l'ARIA : flèches
 * gauche et droite, Début et Fin pour passer d'un onglet à l'autre, un
 * seul arrêt de tabulation sur la liste. Les trois captures restent dans
 * la page, superposées : passer de l'une à l'autre est un fondu, sans
 * attente de téléchargement ni saut de hauteur.
 *
 * @param label   Nom accessible de la liste d'onglets.
 * @param screens Écrans, dans l'ordre des onglets.
 */
export function ProductTabs({
  label,
  screens,
}: {
  label: string;
  screens: ProductScreenItem[];
}) {
  const [active, setActive] = React.useState(0);
  const tabsRef = React.useRef<(HTMLButtonElement | null)[]>([]);
  const id = React.useId();

  const select = (index: number) => {
    const next = (index + screens.length) % screens.length;
    setActive(next);
    tabsRef.current[next]?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const moves: Record<string, number> = {
      ArrowRight: active + 1,
      ArrowLeft: active - 1,
      Home: 0,
      End: screens.length - 1,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    select(moves[event.key]);
  };

  const current = screens[active];

  return (
    <div className="mt-12 md:mt-14">
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        className="mx-auto flex w-fit max-w-full flex-wrap justify-center gap-1 rounded-2xl border border-border-subtle bg-surface-raised p-1 shadow-raised sm:rounded-full"
      >
        {screens.map((screen, index) => (
          <button
            key={screen.tab}
            ref={(node) => {
              tabsRef.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${index}`}
            aria-selected={index === active}
            aria-controls={`${id}-panel`}
            tabIndex={index === active ? 0 : -1}
            onClick={() => setActive(index)}
            className={cn(
              "h-9 shrink-0 rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors",
              index === active
                ? "bg-accent text-accent-contrast shadow-[0_2px_10px_-2px_var(--glow-accent)]"
                : "text-secondary hover:bg-surface-hover hover:text-primary",
            )}
          >
            {screen.tab}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-tab-${active}`}
        className="relative mt-8"
      >
        <div
          className="pointer-events-none absolute -inset-x-10 -top-10 -bottom-10 -z-10"
          style={{
            background:
              "radial-gradient(50% 50% at 50% 45%, var(--glow-accent), transparent 70%)",
          }}
          aria-hidden
        />
        <div className="overflow-hidden rounded-xl border border-border-default bg-surface-sunken shadow-overlay sm:rounded-2xl">
          <div className="relative aspect-[1280/800]">
            {screens.map((screen, index) => (
              <VisualImage
                key={screen.tab}
                visual={screen.visual}
                alt={index === active ? screen.alt : ""}
                sizes={SIZES}
                className={cn(
                  "absolute inset-0 size-full transition-opacity duration-500 ease-(--ease-out-quart)",
                  index === active ? "opacity-100" : "opacity-0",
                )}
              />
            ))}
          </div>
        </div>

        <div className="mx-auto mt-7 flex max-w-2xl flex-col items-center gap-3 text-center">
          <p className="rounded-full bg-accent-muted px-2.5 py-0.5 text-2xs font-medium tracking-wide text-accent uppercase">
            {current.audience}
          </p>
          <p className="min-h-[3lh] text-base leading-relaxed text-pretty text-secondary md:min-h-[2lh]">
            {current.text}
          </p>
        </div>
      </div>
    </div>
  );
}
