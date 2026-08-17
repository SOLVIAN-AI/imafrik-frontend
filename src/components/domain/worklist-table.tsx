"use client";

import { Clock } from "lucide-react";
import * as React from "react";

import {
  StudyStatusChip,
  UrgentMarker,
  type StudyStatus,
} from "@/components/domain/study-status";
import { cn } from "@/lib/utils";

export interface WorklistStudy {
  id: string;
  patientName: string;
  patientId: string;
  modality: string;
  bodyPart: string | null;
  clinic: string;
  status: StudyStatus;
  urgent: boolean;
  instanceCount: number;
  receivedAt: Date;
  assignedTo: string | null;
}

/**
 * Formate un nom au format DICOM pour la lecture.
 *
 * DICOM stocke `NOM^Prénom`. Affiché tel quel, le séparateur trahit une
 * interface qui expose sa plomberie.
 *
 * @param dicomName Nom brut issu du tag PatientName.
 * @returns Le nom lisible, ou « — » s'il est absent.
 */
function formatPatientName(dicomName: string): string {
  const [family = "", given = ""] = dicomName.split("^");
  const formatted = [family.toUpperCase(), given].filter(Boolean).join(" ");
  return formatted || "—";
}

/**
 * Exprime une ancienneté en durée relative courte.
 *
 * Ce qui compte dans une worklist n'est pas l'horodatage mais le délai
 * écoulé : un examen reçu il y a trois heures appelle une action, une date
 * absolue oblige à faire le calcul soi-même.
 *
 * @param date Date de réception.
 * @param now Instant de référence, injectable pour les tests.
 * @returns Une durée compacte : « 12 min », « 3 h », « 2 j ».
 */
export function formatAge(date: Date, now: Date = new Date()): string {
  const minutes = Math.max(0, Math.round((now.getTime() - date.getTime()) / 60_000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h`;
  return `${Math.round(hours / 24)} j`;
}

/** Seuil au-delà duquel l'attente d'un examen est signalée. */
const STALE_AFTER_HOURS = 4;

/**
 * Tableau des examens à lire.
 *
 * Trois partis pris de densité, tous dictés par l'usage :
 *
 * - **Lignes de 40 px.** Un tableau confortable en afficherait vingt ; à
 *   cette densité on en voit une trentaine sans défiler, ce qui change la
 *   façon de travailler.
 * - **Le rail rouge plutôt qu'une ligne colorée.** Teinter le fond d'une
 *   ligne urgente la rendrait moins lisible et fatigante à la longue. Le
 *   rail se repère en périphérie sans rien coûter au texte.
 * - **L'ancienneté vire à l'ambre après quatre heures.** Une durée seule
 *   demande une comparaison mentale ; la couleur fait ressortir ce qui
 *   traîne sans qu'on ait à lire chaque ligne.
 *
 * La navigation clavier est complète : chaque ligne est un `<tr>`
 * focusable, activable par Entrée ou Espace. Un radiologue enchaîne les
 * examens plus vite au clavier qu'à la souris.
 */
export function WorklistTable({
  studies,
  onOpen,
}: {
  studies: WorklistStudy[];
  onOpen?: (study: WorklistStudy) => void;
}) {
  // Une seule référence temporelle pour tout le rendu : sinon deux lignes
  // calculées à une seconde d'écart pourraient afficher des âges
  // incohérents.
  const now = React.useMemo(() => new Date(), []);

  if (studies.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="[&>th]:h-8 [&>th]:border-b [&>th]:border-border-subtle [&>th]:bg-surface-base [&>th]:px-3 [&>th]:text-left [&>th]:font-medium">
            <th scope="col" className="w-[26%]">
              <span className="label-eyebrow">Patient</span>
            </th>
            <th scope="col" className="w-[14%]">
              <span className="label-eyebrow">Examen</span>
            </th>
            <th scope="col" className="w-[20%]">
              <span className="label-eyebrow">Clinique</span>
            </th>
            <th scope="col" className="w-[12%]">
              <span className="label-eyebrow">Statut</span>
            </th>
            <th scope="col" className="w-[14%]">
              <span className="label-eyebrow">Radiologue</span>
            </th>
            <th scope="col" className="w-[8%] text-right">
              <span className="label-eyebrow">Coupes</span>
            </th>
            <th scope="col" className="w-[6%] text-right">
              <span className="label-eyebrow">Attente</span>
            </th>
          </tr>
        </thead>

        <tbody>
          {studies.map((study) => {
            const ageHours = (now.getTime() - study.receivedAt.getTime()) / 3_600_000;
            const stale = ageHours > STALE_AFTER_HOURS && study.status !== "delivered";

            return (
              <tr
                key={study.id}
                tabIndex={0}
                onClick={() => onOpen?.(study)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onOpen?.(study);
                  }
                }}
                className={cn(
                  "cursor-pointer outline-none",
                  "[&>td]:h-10 [&>td]:border-b [&>td]:border-border-subtle [&>td]:px-3",
                  "transition-colors duration-75",
                  "hover:bg-surface-hover focus-visible:bg-surface-hover",
                  study.urgent && "rail-urgent",
                )}
              >
                <td>
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">
                      {formatPatientName(study.patientName)}
                    </span>
                    {study.urgent && <UrgentMarker />}
                  </div>
                  <span className="font-mono text-2xs text-tertiary">
                    {study.patientId}
                  </span>
                </td>

                <td>
                  <span className="font-medium">{study.modality}</span>
                  {study.bodyPart && (
                    <span className="text-secondary"> · {study.bodyPart}</span>
                  )}
                </td>

                <td className="truncate text-secondary">{study.clinic}</td>

                <td>
                  <StudyStatusChip status={study.status} />
                </td>

                <td className="truncate text-secondary">
                  {study.assignedTo ?? <span className="text-tertiary">—</span>}
                </td>

                <td className="text-right text-secondary tabular-nums">
                  {study.instanceCount.toLocaleString("fr-FR")}
                </td>

                <td
                  className={cn(
                    "text-right tabular-nums",
                    stale ? "text-progress" : "text-tertiary",
                  )}
                >
                  {formatAge(study.receivedAt, now)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * État vide.
 *
 * Il dit ce qui se passe, pas seulement qu'il ne se passe rien. Une file
 * vide est une bonne nouvelle dans ce métier — l'écran doit le refléter
 * plutôt que ressembler à une erreur de chargement.
 */
function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 py-20">
      <Clock className="size-5 text-tertiary" aria-hidden />
      <p className="text-sm font-medium">Aucun examen en attente</p>
      <p className="text-xs text-tertiary">
        Les nouveaux examens apparaissent ici dès leur réception.
      </p>
    </div>
  );
}
