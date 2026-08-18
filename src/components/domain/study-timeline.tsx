import { Check, Circle } from "lucide-react";

import {
  STUDY_STATUSES,
  type StudyStatus,
} from "@/components/domain/study-status";
import { DateTime } from "@/components/domain/date-time";
import { cn } from "@/lib/utils";

/**
 * Ce que chaque étape signifie **pour la clinique**.
 *
 * Le vocabulaire change de côté : `in_progress` se dit « en cours de
 * lecture » à un établissement qui attend, et « en cours » à un
 * radiologue qui rédige. Même donnée, deux points de vue — et c'est le
 * point de vue de celui qui lit l'écran qui doit gagner.
 */
const STEP_LABELS: Record<StudyStatus, { title: string; detail: string }> = {
  received: {
    title: "Examen reçu",
    detail: "Les images sont arrivées sur la plateforme.",
  },
  assigned: {
    title: "Attribué à un radiologue",
    detail: "Un médecin a pris l'examen en charge.",
  },
  in_progress: {
    title: "Lecture en cours",
    detail: "Le compte-rendu est en cours de rédaction.",
  },
  reported: {
    title: "Compte-rendu signé",
    detail: "Le document est disponible au téléchargement.",
  },
  delivered: {
    title: "Compte-rendu remis",
    detail: "L'établissement a récupéré le document.",
  },
};

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
                  !done && !current && "bg-surface-active text-tertiary",
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
                {STEP_LABELS[step].title}
              </p>
              <p className="mt-0.5 text-xs text-tertiary">
                {date ? <DateTime date={date} /> : STEP_LABELS[step].detail}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
