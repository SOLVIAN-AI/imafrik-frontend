"use client";

import { Eraser, Undo2 } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { useMessages } from "@/i18n/client";
import type { StrokePoint } from "@/lib/signing";

/** Hauteur du cadre de signature, en pixels CSS. */
const PAD_HEIGHT = 180;

/** Couleur de l'encre : un bleu-noir de stylo, sur le papier blanc du cadre. */
const INK = "#172554";

/** Épaisseur du trait, en pixels CSS, pour une pression moyenne. */
const BASE_WIDTH = 2.6;

/** Un trait : ses points, et la pression de chacun (0 à 1). */
export type Stroke = (StrokePoint & { pressure: number })[];

/**
 * Épaisseur d'un segment selon la pression du stylet.
 *
 * Une souris ou un doigt ne transmettent pas de pression (0,5 par
 * convention) : le trait garde alors l'épaisseur de base.
 */
function widthFor(pressure: number): number {
  return BASE_WIDTH * (0.55 + Math.min(Math.max(pressure, 0), 1) * 0.9);
}

/**
 * Dessine les traits sur un contexte, à l'échelle voulue.
 *
 * @param context Contexte 2D.
 * @param strokes Traits à dessiner.
 * @param scale   Facteur entre pixels CSS et pixels du canevas.
 */
function paint(
  context: CanvasRenderingContext2D,
  strokes: readonly Stroke[],
  scale: number,
) {
  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = INK;
  context.fillStyle = INK;
  for (const stroke of strokes) {
    if (stroke.length === 1) {
      const [point] = stroke;
      context.beginPath();
      context.arc(
        point.x * scale,
        point.y * scale,
        (widthFor(point.pressure) * scale) / 2,
        0,
        Math.PI * 2,
      );
      context.fill();
      continue;
    }
    for (let index = 1; index < stroke.length; index += 1) {
      const from = stroke[index - 1];
      const to = stroke[index];
      context.lineWidth = widthFor((from.pressure + to.pressure) / 2) * scale;
      context.beginPath();
      context.moveTo(from.x * scale, from.y * scale);
      context.lineTo(to.x * scale, to.y * scale);
      context.stroke();
    }
  }
}

/**
 * Exporte le tracé en PNG transparent, encodé en base64 (sans en-tête).
 *
 * Rendu au double de la taille affichée : le service recadre au tracé et
 * réduit l'image à 1 200 × 400 pixels au plus. Le fond reste
 * transparent ; seule l'encre est gardée.
 *
 * @param strokes Traits.
 * @param width   Largeur du cadre, en pixels CSS.
 */
export function exportSignature(
  strokes: readonly Stroke[],
  width: number,
): string {
  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = PAD_HEIGHT * scale;
  const context = canvas.getContext("2d");
  if (!context) return "";
  paint(context, strokes, scale);
  const url = canvas.toDataURL("image/png");
  return url.slice(url.indexOf(",") + 1);
}

/**
 * Cadre où le radiologue trace sa signature : souris, stylet ou doigt.
 *
 * Événements `pointer*` (un seul code pour les trois), épaisseur selon la
 * pression quand le stylet la transmet, « Annuler le dernier trait » et
 * « Effacer ». Le défilement de la page est suspendu dans le cadre
 * (`touch-action: none`), sans quoi signer au doigt ferait défiler.
 *
 * Un tracé n'est pas accessible à tous : l'import d'une image est toujours
 * proposé à côté, par la carte qui accueille ce cadre.
 *
 * @param strokes   Traits déjà tracés.
 * @param onChange  Nouveaux traits.
 * @param onWidth   Largeur du cadre, pour l'export.
 */
export function SignaturePad({
  strokes,
  onChange,
  onWidth,
  describedBy,
}: {
  strokes: Stroke[];
  onChange: (strokes: Stroke[]) => void;
  onWidth: (width: number) => void;
  describedBy?: string;
}) {
  const text = useMessages().settings.signing.pad;
  const canvas = React.useRef<HTMLCanvasElement>(null);
  const current = React.useRef<Stroke | null>(null);
  const [size, setSize] = React.useState({ width: 0, ratio: 1 });

  // Le canevas suit la largeur de son cadre et la densité de l'écran : un
  // trait net sur un écran haute densité, sans flou d'agrandissement.
  React.useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const measure = () => {
      const width = element.getBoundingClientRect().width;
      setSize({ width, ratio: window.devicePixelRatio || 1 });
      onWidth(width);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [onWidth]);

  // Redessine tout à chaque changement : quelques centaines de segments
  // au plus, rien qui se ressente.
  React.useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext("2d");
    if (!element || !context || size.width === 0) return;
    element.width = Math.round(size.width * size.ratio);
    element.height = Math.round(PAD_HEIGHT * size.ratio);
    context.clearRect(0, 0, element.width, element.height);
    paint(
      context,
      current.current ? [...strokes, current.current] : strokes,
      size.ratio,
    );
  }, [strokes, size]);

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    return {
      x: event.clientX - box.left,
      y: event.clientY - box.top,
      // Horloge de la page plutôt que l'horodatage de l'événement : la même
      // pour tout le tracé, et que les tests savent avancer (`page.clock`).
      t: Date.now(),
      pressure: event.pointerType === "pen" ? event.pressure : 0.5,
    };
  };

  const drawSegment = (from: Stroke[number], to: Stroke[number]) => {
    const context = canvas.current?.getContext("2d");
    if (!context) return;
    paint(context, [[from, to]], size.ratio);
  };

  return (
    <div className="flex flex-col gap-2">
      <canvas
        ref={canvas}
        role="img"
        aria-label={text.label}
        aria-describedby={describedBy}
        // Fond blanc dans les deux thèmes : on signe sur du papier.
        className="block w-full cursor-crosshair touch-none rounded-lg border border-border-default bg-white"
        style={{ height: PAD_HEIGHT }}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          const start = point(event);
          current.current = [start];
          drawSegment(start, start);
        }}
        onPointerMove={(event) => {
          const stroke = current.current;
          if (!stroke) return;
          const next = point(event);
          drawSegment(stroke[stroke.length - 1], next);
          stroke.push(next);
        }}
        onPointerUp={() => {
          const stroke = current.current;
          current.current = null;
          if (stroke) onChange([...strokes, stroke]);
        }}
        onPointerCancel={() => {
          const stroke = current.current;
          current.current = null;
          if (stroke) onChange([...strokes, stroke]);
        }}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-2xs text-tertiary">{text.hint}</p>
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={strokes.length === 0}
            onClick={() => onChange(strokes.slice(0, -1))}
          >
            <Undo2 aria-hidden />
            {text.undo}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={strokes.length === 0}
            onClick={() => onChange([])}
          >
            <Eraser aria-hidden />
            {text.clear}
          </Button>
        </div>
      </div>
    </div>
  );
}
