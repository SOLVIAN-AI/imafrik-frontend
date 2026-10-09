"use client";

import { Check, Circle } from "lucide-react";

import { type StudyStatus } from "@/components/domain/study-status";
import { DateTime } from "@/components/domain/date-time";
import { useMessages } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { STUDY_STATUSES } from "@/lib/study-status";

/**
 * Avancement d'un examen.
 *
 * **L'écran qui répond à la seule question que pose une clinique :** où
 * en est mon examen, et quand aurai-je le compte-rendu ? Sans lui, la
 * réponse passe par un appel téléphonique — c'est ce que ce produit doit
 * supprimer.
 *
 * Les étapes futures restent visibles, en gris. Les masquer donnerait
 * l'impression que le parcours s'arrête là où il en est, et priverait
 * l'utilisateur de ce qui l'intéresse : ce qui reste à venir.
 *
 * Le vocabulaire est celui de la clinique (`clinic.timeline`) :
 * `in_progress` se dit « lecture en cours » à un établissement qui attend,
 * et « en cours » à un radiologue qui rédige. Même donnée, deux points de
 * vue ; c'est celui de qui lit l'écran qui doit gagner.
 *
 * @param status Étape atteinte.
 * @param dates  Horodatages connus, par étape. Les étapes non encore
 *               franchies n'en ont pas.
 */
export function StudyTimeline({
  status,
  dates,
}: {
  status: StudyStatus;
  dates: Partial<Record<StudyStatus, Date>>;
}) {
  const labels = useMessages().clinic.timeline;
  const currentIndex = STUDY_STATUSES.indexOf(status);

  return (
    <ol className="flex flex-col">
      {STUDY_STATUSES.map((step, index) => {
        const done = index < currentIndex;
        const current = index === currentIndex;
        const date = dates[step];

        return (
          <li key={step} className="flex gap-3">
            {/* Colonne du repère : pastille et trait de liaison. Le trait
                s'arrête à la dernière étape, sinon il pendrait dans le
                vide. */}
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full",
                  done && "bg-done-muted text-done",
                  current && "bg-accent-muted text-accent",
                  !done && !current && "bg-surface-active text-secondary",
                )}
                aria-hidden
              >
                {done ? (
                  <Check className="size-3" />
                ) : (
                  <Circle className={cn("size-2", current && "fill-current")} />
                )}
              </span>
              {index < STUDY_STATUSES.length - 1 && (
                <span
                  className={cn(
                    "w-px flex-1",
                    done ? "bg-done/40" : "bg-border-default",
                  )}
                  aria-hidden
                />
              )}
            </div>

            <div
              className={cn(
                "pb-5",
                index === STUDY_STATUSES.length - 1 && "pb-0",
              )}
            >
              <p
                className={cn(
                  "text-sm",
                  current && "font-medium text-primary",
                  done && "text-primary",
                  !done && !current && "text-tertiary",
                )}
              >
                {labels[step].title}
              </p>
              <p className="mt-0.5 text-xs text-tertiary">
                {date ? <DateTime date={date} /> : labels[step].detail}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
