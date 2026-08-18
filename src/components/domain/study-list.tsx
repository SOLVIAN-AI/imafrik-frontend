"use client";

import { FileCheck, Inbox } from "lucide-react";
import { useRouter } from "next/navigation";

import { StudyAge } from "@/components/domain/study-age";
import {
  StudyStatusChip,
  UrgentMarker,
  type StudyStatus,
} from "@/components/domain/study-status";
import { formatPatientName } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Ce qu'il faut d'un examen pour l'afficher dans la liste d'une clinique. */
export interface ListedStudy {
  id: string;
  patientName: string;
  patientId: string;
  modality: string;
  bodyPart: string | null;
  status: StudyStatus;
  urgent: boolean;
  instanceCount: number;
  receivedAt: Date;
  /** Identifiant du compte-rendu signé, s'il existe. */
  reportId?: string;
}

/**
 * Liste des examens envoyés, vue de la clinique.
 *
 * **Elle ne ressemble pas à la worklist du radiologue, et c'est
 * volontaire.** Le radiologue trie une file de travail : il lui faut de
 * la densité, l'ancienneté, l'urgence, qui a pris quoi. La clinique
 * suit des dossiers : elle veut savoir où en est chacun et si le
 * compte-rendu est arrivé. Une seule table paramétrée pour les deux
 * usages finirait par mal servir les deux.
 *
 * La dernière colonne est la plus regardée : c'est celle qui dit si le
 * document est disponible.
 */
export function StudyList({ studies }: { studies: ListedStudy[] }) {
  const router = useRouter();

  if (studies.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-20">
        <Inbox className="size-5 text-tertiary" aria-hidden />
        <p className="text-sm font-medium">Aucun examen envoyé</p>
        <p className="text-xs text-tertiary">
          Les examens transmis depuis votre PACS apparaissent ici.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="[&>th]:h-9 [&>th]:border-b [&>th]:border-border-subtle [&>th]:bg-surface-raised [&>th]:px-4 [&>th]:text-left [&>th]:font-medium">
            <th scope="col" className="w-[30%]">
              <span className="label-eyebrow">Patient</span>
            </th>
            <th scope="col" className="w-[18%]">
              <span className="label-eyebrow">Examen</span>
            </th>
            <th scope="col" className="w-[16%]">
              <span className="label-eyebrow">Statut</span>
            </th>
            <th scope="col" className="w-[10%] text-right">
              <span className="label-eyebrow">Coupes</span>
            </th>
            <th scope="col" className="w-[10%] text-right">
              <span className="label-eyebrow">Envoyé</span>
            </th>
            <th scope="col" className="w-[16%] text-right">
              <span className="label-eyebrow">Compte-rendu</span>
            </th>
          </tr>
        </thead>

        <tbody>
          {studies.map((study) => (
            <tr
              key={study.id}
              tabIndex={0}
              onClick={() => router.push(`/examens/${study.id}`)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  router.push(`/examens/${study.id}`);
                }
              }}
              className={cn(
                "cursor-pointer outline-none",
                "[&>td]:h-11 [&>td]:border-b [&>td]:border-border-subtle [&>td]:px-4",
                "last:[&>td]:border-b-0",
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

              <td>
                <StudyStatusChip status={study.status} />
              </td>

              <td className="text-right text-secondary tabular-nums">
                {study.instanceCount.toLocaleString("fr-FR")}
              </td>

              <td className="text-right tabular-nums">
                <StudyAge
                  date={study.receivedAt}
                  muted={study.status === "delivered"}
                />
              </td>

              <td className="text-right">
                {study.reportId ? (
                  <span className="inline-flex items-center gap-1.5 text-2xs font-medium text-done">
                    <FileCheck className="size-3.5" aria-hidden />
                    Disponible
                  </span>
                ) : (
                  <span className="text-2xs text-tertiary">En attente</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
