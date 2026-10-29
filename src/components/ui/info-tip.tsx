"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { ArrowRight, Info } from "lucide-react";
import * as React from "react";

import {
  type GlossaryTerm,
  useOptionalHelp,
} from "@/components/help/help-context";
import { useMessages } from "@/i18n/client";
import { cn } from "@/lib/utils";

/** Délai avant l'ouverture au survol : un passage de souris n'ouvre rien. */
const OPEN_DELAY_MS = 150;

/** Délai avant la fermeture : le temps de passer du bouton à la bulle. */
const CLOSE_DELAY_MS = 300;

/**
 * Ce qu'une bulle explique : une phrase, précédée au besoin d'un titre
 * court, et un terme du glossaire quand il en dit nettement plus.
 *
 * Des données simples : une page rendue au serveur les passe telles
 * quelles à `Figure`, `Section` ou `ColumnLabel`.
 */
export interface InfoTipContent {
  /** L'explication, en une phrase. */
  text: string;
  /** Titre court, au-dessus de la phrase. */
  title?: string;
  /**
   * Terme du glossaire : la bulle propose « En savoir plus », qui ouvre le
   * panneau d'aide sur lui. Seulement quand sa définition dit nettement
   * plus que la bulle.
   */
  term?: GlossaryTerm;
}

/** Ce qui a ouvert la bulle : il décide de ce qui la ferme. */
type Reason = "hover" | "focus" | "click";

/** Vrai si le focus vient du clavier (le navigateur montre son contour). */
function focusVisible(element: Element): boolean {
  try {
    return element.matches(":focus-visible");
  } catch {
    // Moteur sans `:focus-visible` : tout focus compte.
    return true;
  }
}

/** Élément atteint par Tab après `from`, dans l'ordre du document. */
function nextTabbable(from: HTMLElement): HTMLElement | null {
  const candidates = [
    ...document.querySelectorAll<HTMLElement>(
      "a[href], button, input, select, textarea, [tabindex]",
    ),
  ].filter(
    (element) =>
      element.tabIndex >= 0 &&
      !element.matches(":disabled, [data-radix-focus-guard]") &&
      !element.closest("[data-radix-popper-content-wrapper]") &&
      element.getClientRects().length > 0,
  );
  return candidates[candidates.indexOf(from) + 1] ?? null;
}

/**
 * Bulle d'information : un bouton ⓘ qui explique un intitulé ou une
 * mesure, à côté de son libellé.
 *
 * Une explication va là, jamais dans un bloc à part : on la trouve à
 * l'endroit où la question se pose. Construite sur le `Popover` de Radix,
 * en « toggletip » :
 *
 * - **ouverture** au survol de la souris (après un court délai), au focus
 *   du clavier, au clic ou à l'appui du doigt ; un clic sur une bulle
 *   ouverte au survol la garde ouverte, un second la ferme ;
 * - **fermeture** par Échap, par un clic ailleurs, quand la souris quitte
 *   le bouton et la bulle, ou quand le focus s'en va ;
 * - **au clavier**, Tab depuis le bouton entre dans la bulle quand elle
 *   propose « En savoir plus » ; Tab encore en sort vers la suite de la
 *   page, Maj+Tab revient au bouton (WCAG 1.4.13 : on atteint son contenu
 *   sans qu'elle se ferme) ;
 * - **lecteurs d'écran** : le bouton se nomme « À propos de « … » », et
 *   l'explication est annoncée par une zone d'état à côté de lui, vide
 *   tant que la bulle est fermée (un intitulé de colonne mesuré par
 *   `e2e/en-tetes.spec.ts` ne contient alors aucun texte caché).
 *
 * Le contenu passe par un portail, au-dessus des en-têtes de tableau
 * collants, et ne dépasse jamais de l'écran, même à 390 px. Le bouton
 * fait 24 × 24 px (cible tactile, WCAG 2.5.8) sans grandir la ligne qui
 * le porte. Posé à côté d'un bouton de tri, jamais dedans : un clic sur ⓘ
 * ne trie pas.
 *
 * @param label Intitulé expliqué : nom du bouton, et de la bulle.
 * @param side  Côté où s'ouvre la bulle, s'il y a la place.
 */
export function InfoTip({
  label,
  text,
  title,
  term,
  side = "top",
  align = "center",
  className,
}: InfoTipContent & {
  label: string;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  className?: string;
}) {
  const t = useMessages();
  const help = useOptionalHelp();
  const [open, setOpen] = React.useState(false);
  const reason = React.useRef<Reason | null>(null);
  const timer = React.useRef<number | undefined>(undefined);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const moreRef = React.useRef<HTMLButtonElement>(null);
  // Le focus était dans la bulle quand elle s'est fermée : il revient au
  // bouton, et ce retour ne la rouvre pas.
  const returnFocus = React.useRef(false);
  const refocusing = React.useRef(false);
  // Sans panneau d'aide (écran qui n'en a pas), pas de lien.
  const glossary = term && help ? t.help.glossary[term] : undefined;

  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  const cancel = () => window.clearTimeout(timer.current);
  const show = (why: Reason) => {
    cancel();
    reason.current = why;
    setOpen(true);
  };
  const hide = () => {
    cancel();
    returnFocus.current =
      contentRef.current?.contains(document.activeElement) ?? false;
    reason.current = null;
    setOpen(false);
  };
  const later = (action: () => void, delay: number) => {
    cancel();
    timer.current = window.setTimeout(action, delay);
  };
  // La souris s'en va : la bulle se ferme, sauf ouverte par le clavier.
  const leave = (event: React.PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    if (!open) cancel();
    else if (reason.current !== "focus") later(hide, CLOSE_DELAY_MS);
  };

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(value) => {
        // Radix ne fait que fermer : Échap, clic ou focus ailleurs.
        if (!value) hide();
      }}
    >
      <PopoverPrimitive.Trigger asChild>
        <button
          ref={triggerRef}
          type="button"
          aria-label={t.common.infoTip.about(label)}
          onPointerEnter={(event) => {
            if (event.pointerType !== "mouse") return;
            if (open) cancel();
            else later(() => show("hover"), OPEN_DELAY_MS);
          }}
          onPointerLeave={leave}
          onFocus={(event) => {
            if (refocusing.current) {
              refocusing.current = false;
              return;
            }
            if (!open && focusVisible(event.currentTarget)) show("focus");
          }}
          onClick={(event) => {
            // Le basculement de Radix n'a pas lieu : une bulle ouverte au
            // survol ou au focus reste ouverte au clic, un second la ferme.
            event.preventDefault();
            if (open && reason.current === "click") hide();
            else show("click");
          }}
          onKeyDown={(event) => {
            if (
              event.key === "Tab" &&
              !event.shiftKey &&
              open &&
              moreRef.current
            ) {
              event.preventDefault();
              moreRef.current.focus();
            }
          }}
          className={cn(
            // 24 px de cible, 16 px dans la ligne : l'intitulé ne grandit pas.
            "-my-1 inline-flex size-6 shrink-0 items-center justify-center rounded-md align-middle",
            "text-tertiary transition-colors duration-75 hover:text-accent data-[state=open]:text-accent",
            "focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none",
            className,
          )}
        >
          <Info className="size-3.5" aria-hidden />
        </button>
      </PopoverPrimitive.Trigger>
      <span role="status" className="sr-only">
        {open && (
          <>
            {title && <span>{title}. </span>}
            {text}
          </>
        )}
      </span>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          ref={contentRef}
          side={side}
          align={align}
          sideOffset={6}
          collisionPadding={12}
          hideWhenDetached
          aria-label={title ?? label}
          // Le focus reste sur le bouton : la bulle s'ouvre aussi au survol.
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => {
            if (!returnFocus.current) {
              event.preventDefault();
              return;
            }
            // Radix rend le focus au bouton juste après.
            refocusing.current = true;
            window.setTimeout(() => (refocusing.current = false), 0);
          }}
          onPointerEnter={(event) => {
            if (event.pointerType === "mouse") cancel();
          }}
          onPointerLeave={leave}
          className={cn(
            "z-50 w-max max-w-[min(20rem,calc(100vw-1.5rem))] rounded-lg px-3 py-2.5",
            "border border-border-default bg-surface-overlay shadow-overlay",
            "text-left text-xs leading-relaxed font-normal tracking-normal whitespace-normal normal-case text-secondary",
            "animate-[fade-in_100ms_var(--ease-out-quart)] focus:outline-none",
          )}
        >
          {/* Déjà annoncée par la zone d'état : lue une seule fois. */}
          <div aria-hidden>
            {title && <p className="font-medium text-primary">{title}</p>}
            <p>{text}</p>
          </div>
          {glossary && term && (
            <button
              ref={moreRef}
              type="button"
              aria-label={t.common.infoTip.learnMoreAbout(glossary.term)}
              onClick={() => {
                hide();
                // Le panneau d'aide prend le focus : il ne revient pas ici.
                returnFocus.current = false;
                help?.openTerm(term);
              }}
              onKeyDown={(event) => {
                if (event.key !== "Tab") return;
                event.preventDefault();
                event.stopPropagation();
                const trigger = triggerRef.current;
                if (!trigger) return;
                if (event.shiftKey) {
                  trigger.focus();
                  return;
                }
                const next = nextTabbable(trigger);
                hide();
                returnFocus.current = false;
                next?.focus();
              }}
              className={cn(
                "mt-1 -mb-1 inline-flex min-h-6 items-center gap-1 rounded-sm font-medium text-accent",
                "hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              )}
            >
              {t.common.infoTip.learnMore}
              <ArrowRight className="size-3" aria-hidden />
            </button>
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

/**
 * Un intitulé et sa bulle ⓘ, sur une ligne : dans un `<th>`, dans le
 * `<dt>` d'une carte de téléphone, à côté du libellé d'une mesure.
 *
 * Sans `info`, l'intitulé seul, tel qu'avant. Avec `wrap`, l'intitulé
 * peut passer à la ligne (libellé d'une carte de mesure) : la bulle reste
 * collée à son dernier mot.
 *
 * @param label     Intitulé affiché.
 * @param info      Ce que la bulle explique.
 * @param textClass Classes de l'intitulé (`label-eyebrow` par défaut).
 */
export function ColumnLabel({
  label,
  info,
  wrap = false,
  textClass = "label-eyebrow",
  className,
}: {
  label: string;
  info?: InfoTipContent;
  wrap?: boolean;
  textClass?: string;
  className?: string;
}) {
  if (!info) return <span className={cn(textClass, className)}>{label}</span>;
  if (wrap) {
    const cut = label.lastIndexOf(" ") + 1;
    return (
      <span className={cn(textClass, className)}>
        {label.slice(0, cut)}
        <span className="whitespace-nowrap">
          {label.slice(cut)}
          <InfoTip label={label} {...info} />
        </span>
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center align-middle",
        className,
      )}
    >
      <span className={cn("min-w-0", textClass)}>{label}</span>
      <InfoTip label={label} {...info} />
    </span>
  );
}
