"use client";

import { CheckCircle2, SearchX } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { StudyAge } from "@/components/domain/study-age";
import {
  StudyStatusChip,
  UrgentMarker,
} from "@/components/domain/study-status";
import { EmptyState } from "@/components/ui/empty-state";
import type { Study } from "@/lib/data/studies";
import { formatPatientName } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Ce que la table affiche.
 *
 * Alias du type de la couche de données : la table n'a pas de forme à
 * elle. Redéclarer les champs ici obligerait à les tenir en phase à la
 * main, et le jour où l'API en ajoute un, la duplication se voit au
 * mauvais moment.
 */
export type WorklistStudy = Study;

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
 * **Chaque ligne porte un vrai lien**, sur le nom du patient : il se
 * parcourt à la tabulation, s'annonce comme un lien aux lecteurs d'écran
 * et s'ouvre dans un nouvel onglet au clic du milieu. Le clic n'importe
 * où sur la ligne reste un raccourci pour la souris. Une ligne rendue
 * focusable à la main, sans rôle et sans anneau de focus, n'offrait rien
 * de tout cela.
 *
 * @param studies Examens à afficher.
 * @param hrefFor Adresse ouverte pour un examen.
 * @param empty   Message affiché quand la liste est vide.
 */
export function WorklistTable({
  studies,
  hrefFor,
  empty,
}: {
  studies: WorklistStudy[];
  hrefFor: (study: WorklistStudy) => string;
  empty?: { title: string; detail: string };
}) {
  const router = useRouter();

  if (studies.length === 0) {
    return (
      <EmptyState
        icon={empty ? SearchX : CheckCircle2}
        {...(empty ?? DEFAULT_EMPTY)}
      />
    );
  }

  return (
    <>
      {/* Téléphone : une carte par examen. Sept colonnes ne tiennent pas
          sur 390 px, et un tableau qui défile de côté cache précisément
          ce qu'on cherche — le statut et l'attente. */}
      <ul className="min-h-0 flex-1 divide-y divide-border-subtle overflow-auto lg:hidden">
        {studies.map((study) => (
          <li key={study.id}>
            <Link
              href={hrefFor(study)}
              className={cn(
                "flex items-start gap-3 px-4 py-3 transition-colors active:bg-surface-active",
                study.urgent && "rail-urgent",
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">
                    {formatPatientName(study.patientName)}
                  </span>
                  {study.urgent && <UrgentMarker />}
                </div>
                <p className="mt-0.5 truncate text-xs text-secondary">
                  <span className="font-medium text-primary">
                    {study.modality}
                  </span>
                  {study.bodyPart && ` · ${study.bodyPart}`} · {study.clinic}
                </p>
                <p className="mt-0.5 truncate font-mono text-2xs text-tertiary">
                  {study.patientId}
                  {study.assignedToName && (
                    <span className="font-sans"> · {study.assignedToName}</span>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <StudyAge
                  date={study.receivedAt}
                  muted={study.status === "delivered"}
                />
                <StudyStatusChip status={study.status} />
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <div className="hidden min-h-0 flex-1 overflow-auto lg:block">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="[&>th]:h-9 [&>th]:border-b [&>th]:border-border-subtle [&>th]:bg-surface-raised [&>th]:px-4 [&>th]:text-left [&>th]:font-medium">
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
            {studies.map((study) => (
              <tr
                key={study.id}
                onClick={(event) => {
                  // Le lien gère lui-même son clic (et ses modificateurs).
                  if ((event.target as HTMLElement).closest("a")) return;
                  router.push(hrefFor(study));
                }}
                className={cn(
                  "cursor-pointer",
                  "[&>td]:h-11 [&>td]:border-b [&>td]:border-border-subtle [&>td]:px-4",
                  "last:[&>td]:border-b-0",
                  "transition-colors duration-75",
                  "hover:bg-surface-hover focus-within:bg-surface-hover",
                  study.urgent && "rail-urgent",
                )}
              >
                <td>
                  <div className="flex items-center gap-2">
                    <Link
                      href={hrefFor(study)}
                      className="-my-1 truncate rounded-sm py-1 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      {formatPatientName(study.patientName)}
                    </Link>
                    {study.urgent && <UrgentMarker />}
                  </div>
                  <span className="font-mono text-2xs text-tertiary">
                    {study.patientId}
                  </span>
                </td>

                <td className="whitespace-nowrap">
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
                  {study.assignedToName ?? (
                    <span className="text-tertiary">—</span>
                  )}
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/**
 * État vide.
 *
 * Il dit ce qui se passe, pas seulement qu'il ne se passe rien. Une file
 * vide est une bonne nouvelle dans ce métier — l'écran doit le refléter
 * plutôt que ressembler à une erreur de chargement.
 */
const DEFAULT_EMPTY = {
  title: "File à jour",
  detail:
    "Aucun examen n’attend de lecture. Les nouveaux examens apparaissent ici dès leur réception.",
};
