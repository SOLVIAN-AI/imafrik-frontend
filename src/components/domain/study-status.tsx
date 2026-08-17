import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Les cinq états d'un examen, tels que le schéma les définit.
 *
 * Ils forment une progression, et cet ordre compte : il détermine celui
 * des filtres et du tri. Voir `study_status` dans les migrations.
 */
export const STUDY_STATUSES = [
  "received",
  "assigned",
  "in_progress",
  "reported",
  "delivered",
] as const;

export type StudyStatus = (typeof STUDY_STATUSES)[number];

/**
 * Libellés affichés, et ce qu'ils décrivent réellement.
 *
 * On nomme les choses du point de vue de l'utilisateur, pas du système :
 * un radiologue voit « À lire », pas `received`. Le terme technique reste
 * dans le code, où il a sa place.
 */
const STATUS_LABELS: Record<StudyStatus, string> = {
  received: "À lire",
  assigned: "Attribué",
  in_progress: "En cours",
  reported: "Rendu",
  delivered: "Livré",
};

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
        delivered: "bg-surface-active text-tertiary",
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
  extends React.HTMLAttributes<HTMLSpanElement>,
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
  return (
    <span className={cn(statusStyles({ status }), className)} {...props}>
      <span
        className={cn("size-1.5 rounded-full", dotStyles[status])}
        aria-hidden
      />
      {STATUS_LABELS[status]}
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
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-urgent-muted px-2 py-0.5",
        "text-2xs font-semibold tracking-wide text-urgent uppercase",
        className,
      )}
    >
      Urgent
    </span>
  );
}
