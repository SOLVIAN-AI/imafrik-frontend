"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as React from "react";

import {
  GAP,
  isCrowded,
  isInView,
  isUsableBox,
  placeBubble,
  spotlight,
  type Box,
  type BubblePosition,
} from "@/components/tour/geometry";
import {
  boxOf,
  findTarget,
  makeRoomBelow,
  resolveStep,
} from "@/components/tour/targets";
import type { TourId, TourStep } from "@/components/tour/tours";
import { Button } from "@/components/ui/button";
import { useMessages } from "@/i18n/client";
import { cn } from "@/lib/utils";

/**
 * Bulle d'une étape de visite, et le voile qui met son élément en lumière.
 *
 * C'est une boîte de dialogue modale (Radix) : le focus y est piégé, le
 * reste de la page est inerte et masqué aux lecteurs d'écran, Échap passe
 * la visite. Le voile est découpé autour de l'élément montré ; la bulle
 * se pose à côté, sans jamais sortir de la fenêtre (`geometry.ts`).
 *
 * L'élément est suivi à chaque image : un défilement, un redimensionnement
 * ou une animation de la page déplacent la découpe et la bulle avec lui.
 */

/** Textes d'une étape, dans les dictionnaires (`tour.tours`). */
interface StepText {
  title: string;
  body: string;
}

/** Disposition calculée : la découpe du voile et la place de la bulle. */
interface Layout {
  hole: Box | null;
  position: BubblePosition;
}

/** Rayon des angles de la découpe, celui des panneaux. */
const HOLE_RADIUS = 10;

/** Hauteur supposée de la bulle avant sa première mesure. */
const BUBBLE_HEIGHT = 200;

/** Largeur de la bulle avant sa première mesure : `22rem`, voir son style. */
const BUBBLE_WIDTH = 352;

function viewport() {
  return { width: window.innerWidth, height: window.innerHeight };
}

/** Empreinte d'une disposition, au pixel près : on ne rend qu'un changement. */
function signature(layout: Layout): string {
  const { hole, position } = layout;
  return [
    hole?.top,
    hole?.left,
    hole?.width,
    hole?.height,
    position.top,
    position.left,
  ]
    .map((value) => (value === undefined ? "" : Math.round(value)))
    .join(",");
}

/**
 * Bulle de l'étape `index` d'une visite.
 *
 * @param tourId     Visite, pour ses textes.
 * @param step       Étape montrée.
 * @param index      Position de l'étape, à partir de zéro.
 * @param total      Nombre d'étapes montrées.
 * @param onNext     Étape suivante.
 * @param onPrevious Étape précédente.
 * @param onClose    Fin de la visite, terminée ou passée.
 */
export function TourBubble({
  tourId,
  step,
  index,
  total,
  onNext,
  onPrevious,
  onClose,
}: {
  tourId: TourId;
  step: TourStep;
  index: number;
  total: number;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
}) {
  const t = useMessages();
  const texts = (t.tour.tours[tourId] as Record<string, StepText>)[step.id];
  const bubbleRef = React.useRef<HTMLDivElement>(null);
  const primaryRef = React.useRef<HTMLButtonElement>(null);
  const maskId = `tour-mask-${React.useId().replace(/[^\w-]/g, "")}`;
  const [layout, setLayout] = React.useState<Layout | null>(null);
  const last = index === total - 1;

  // Amène l'élément à l'écran, puis le suit à chaque image.
  React.useLayoutEffect(() => {
    let element = resolveStep(step);
    let restoreRoom = () => {};
    if (element) {
      const box = boxOf(element);
      const view = viewport();
      const size = {
        width: bubbleRef.current?.offsetWidth ?? BUBBLE_WIDTH,
        height: bubbleRef.current?.offsetHeight ?? BUBBLE_HEIGHT,
      };
      if (!isInView(box, view)) {
        // Défilement immédiat : un défilement doux s'interrompt au premier
        // autre appel de défilement, et laissait la bulle sur l'élément.
        // La bulle, elle, glisse jusqu'à sa nouvelle place.
        const room = view.height - size.height - 2 * GAP;
        element.scrollIntoView({
          // Un élément trop haut pour tenir avec la bulle est montré par
          // son début (l'en-tête d'un tableau), la bulle au bas de la
          // fenêtre.
          block: box.height > room ? "start" : "center",
          inline: "nearest",
          behavior: "instant",
        });
      }
      // Visible, mais sans place pour la bulle d'aucun côté (une file
      // courte au milieu d'un téléphone, en fin de page) : il remonte en
      // haut de la fenêtre, la bulle dessous. Son conteneur doit pouvoir
      // défiler jusque-là : la place est ménagée le temps de l'étape.
      if (isCrowded(boxOf(element), size, view)) {
        restoreRoom = makeRoomBelow(element, size.height + 2 * GAP);
        element.scrollIntoView({
          block: "start",
          inline: "nearest",
          behavior: "instant",
        });
      }
    }

    let frame = 0;
    let previous = "";
    const measure = () => {
      // Un élément remplacé par un nouveau rendu est recherché à nouveau.
      if (step.target && !element?.isConnected) element = resolveStep(step);
      const view = viewport();
      const target = element ? boxOf(element) : null;
      const usable = isUsableBox(target) ? target : null;
      const bubble = bubbleRef.current;
      const next: Layout = {
        hole: usable ? spotlight(usable, view) : null,
        position: placeBubble(
          usable,
          {
            width: bubble?.offsetWidth ?? 0,
            height: bubble?.offsetHeight ?? 0,
          },
          view,
          step.placement,
        ),
      };
      const current = signature(next);
      if (current !== previous) {
        previous = current;
        setLayout(next);
      }
      frame = window.requestAnimationFrame(measure);
    };
    measure();
    return () => {
      window.cancelAnimationFrame(frame);
      restoreRoom();
    };
  }, [step]);

  // À chaque étape, le focus revient sur l'action principale : Entrée
  // enchaîne les étapes, sans avoir à chercher le bouton.
  React.useEffect(() => {
    primaryRef.current?.focus({ preventScroll: true });
  }, [step]);

  return (
    <DialogPrimitive.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <svg
          aria-hidden
          className="pointer-events-auto fixed inset-0 z-[90] size-full"
        >
          <defs>
            <mask id={maskId}>
              <rect width="100%" height="100%" fill="white" />
              {layout?.hole && (
                <rect
                  x={layout.hole.left}
                  y={layout.hole.top}
                  width={layout.hole.width}
                  height={layout.hole.height}
                  rx={HOLE_RADIUS}
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            mask={`url(#${maskId})`}
            className="fill-ink-950/70 animate-[fade-in_150ms_var(--ease-out-quart)]"
          />
          {layout?.hole && (
            <rect
              x={layout.hole.left}
              y={layout.hole.top}
              width={layout.hole.width}
              height={layout.hole.height}
              rx={HOLE_RADIUS}
              fill="none"
              strokeWidth={2}
              className="stroke-accent"
            />
          )}
        </svg>
        <DialogPrimitive.Content
          ref={bubbleRef}
          data-tour-step={step.id}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            primaryRef.current?.focus({ preventScroll: true });
          }}
          onCloseAutoFocus={(event) => {
            // Le focus revient au bouton d'aide, d'où la visite se relance.
            const help = findTarget("help");
            if (help instanceof HTMLElement) {
              event.preventDefault();
              help.focus({ preventScroll: true });
            }
          }}
          // Le voile n'est pas une sortie : seuls « Passer » et Échap le sont.
          onPointerDownOutside={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
          onKeyDown={(event) => {
            // Les raccourcis de la page (J et K, ⌘ K, /) ne doivent pas
            // agir sous la visite : l'événement s'arrête ici, sans priver
            // le piège à focus de Radix, qui l'a déjà reçu.
            event.nativeEvent.stopImmediatePropagation();
            if (event.key === "ArrowRight" && !last) {
              event.preventDefault();
              onNext();
            } else if (event.key === "ArrowLeft" && index > 0) {
              event.preventDefault();
              onPrevious();
            }
          }}
          style={{
            top: layout?.position.top ?? 0,
            left: layout?.position.left ?? 0,
            // Invisible le temps de la première mesure : sa taille décide
            // de sa place.
            visibility: layout ? "visible" : "hidden",
          }}
          className={cn(
            "fixed z-[91] w-[min(22rem,calc(100vw-24px))]",
            "rounded-xl border border-border-default bg-surface-overlay shadow-overlay",
            "focus:outline-none",
            "transition-[top,left] duration-200 ease-(--ease-out-quart) motion-reduce:transition-none",
          )}
        >
          <div className="px-5 pt-4 pb-4">
            <p className="label-eyebrow">
              {t.tour.ui.progress(index + 1, total)}
            </p>
            <DialogPrimitive.Title className="mt-1.5 text-base font-semibold tracking-[-0.01em]">
              {texts.title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="prose-justify mt-1.5 text-sm leading-relaxed text-secondary">
              {texts.body}
            </DialogPrimitive.Description>
          </div>
          <div className="flex items-center gap-2 border-t border-border-subtle px-3 py-2.5">
            {!last && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                {t.tour.ui.skip}
              </Button>
            )}
            <div className="ml-auto flex items-center gap-2">
              {index > 0 && (
                <Button variant="secondary" size="sm" onClick={onPrevious}>
                  {t.tour.ui.previous}
                </Button>
              )}
              <Button
                ref={primaryRef}
                size="sm"
                onClick={last ? onClose : onNext}
              >
                {last ? t.tour.ui.finish : t.tour.ui.next}
              </Button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
