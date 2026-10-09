"use client";

import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { useMessages } from "@/i18n/client";
import { cn } from "@/lib/utils";

import type { StudyStatus } from "@/lib/study-status";

export type { StudyStatus } from "@/lib/study-status";

/*
 * Libellés affichés : ceux de l'utilisateur, pas du système. Un radiologue
 * voit « À lire », pas `received`. Ils vivent dans les textes de
 * l'application (`common.studyStatus`), dans chaque langue.
 */

/**
 * Teintes des statuts.
 *
 * Trois couleurs seulement pour cinq états, délibérément. `received` et
 * `assigned` restent neutres — ce ne sont pas des alertes, seulement des
 * files d'attente. Colorer chaque état produirait un arc-en-ciel où plus
 * rien ne ressort, et la couleur perdrait sa fonction de signal.
 */
const statusStyles = cva(
  [
    "inline-flex items-center gap-1.5",
    "rounded-full px-2 py-0.5",
    "text-2xs font-medium whitespace-nowrap",
  ],
  {
    variants: {
      status: {
        received: "bg-surface-active text-secondary",
        assigned: "bg-surface-active text-secondary",
        in_progress: "bg-progress-muted text-progress",
        reported: "bg-done-muted text-done",
        delivered: "bg-surface-active text-secondary",
      },
    },
    defaultVariants: { status: "received" },
  },
);

/** Couleur de la pastille, alignée sur la teinte du libellé. */
const dotStyles: Record<StudyStatus, string> = {
  received: "bg-tertiary",
  assigned: "bg-secondary",
  in_progress: "bg-progress",
  reported: "bg-done",
  delivered: "bg-tertiary",
};

export interface StudyStatusChipProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusStyles> {
  status: StudyStatus;
}

/**
 * Pastille d'état d'un examen.
 *
 * Elle porte **deux** signaux redondants : la couleur et la forme du
 * point, plus le texte. Une pastille qui ne reposerait que sur la couleur
 * serait illisible pour un daltonien — soit environ un homme sur douze,
 * proportion qu'un service de radiologie atteint vite.
 *
 * @example
 * ```tsx
 * <StudyStatusChip status="in_progress" />
 * ```
 */
export function StudyStatusChip({
  status,
  className,
  ...props
}: StudyStatusChipProps) {
  const t = useMessages();
  return (
    <span className={cn(statusStyles({ status }), className)} {...props}>
      <span
        className={cn("size-1.5 rounded-full", dotStyles[status])}
        aria-hidden
      />
      {t.common.studyStatus[status]}
    </span>
  );
}

/**
 * Marqueur d'urgence.
 *
 * Volontairement discret en typographie, mais accompagné du rail rouge en
 * bord de ligne (`.rail-urgent`) : c'est ce rail qui se repère en vision
 * périphérique, sans lire, dans une liste de quarante examens. Le texte
 * ne fait que confirmer.
 */
export function UrgentMarker({ className }: { className?: string }) {
  const t = useMessages();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-urgent-muted px-2 py-0.5",
        "text-2xs font-semibold tracking-wide text-urgent uppercase",
        className,
      )}
    >
      {t.common.urgent}
    </span>
  );
}
