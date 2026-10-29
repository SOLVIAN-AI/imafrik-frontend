"use client";

import {
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  SearchX,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { StudyAge } from "@/components/domain/study-age";
import {
  StudyStatusChip,
  UrgentMarker,
} from "@/components/domain/study-status";
import { EmptyState } from "@/components/ui/empty-state";
import { useNow } from "@/hooks/use-now";
import { useLocale, useMessages } from "@/i18n/client";
import type { Study } from "@/lib/data/studies";
import { formatPatientName } from "@/lib/format";
import { INTL_LOCALE } from "@/lib/i18n/locale";
import { hasModifier, isTyping } from "@/lib/keyboard";
import { cn } from "@/lib/utils";
import {
  deadlineOf,
  shortDemographics,
  type DeadlineTone,
} from "@/lib/worklist";

/** Ce que la dernière colonne dit de la prise en charge. */
export type FollowColumn = "status" | "reader" | "none";

/** Une section de la file. */
export interface ReadingGroup {
  key: string;
  /** Titre de la section ; sans titre, les lignes s'enchaînent. */
  title?: string;
  /** Une ligne d'aide sous le titre. */
  hint?: string;
  studies: Study[];
  /** Section repliée par défaut, ouverte d'un clic. */
  collapsible?: boolean;
  /** Lignes atténuées : rien à y faire, seulement à savoir. */
  muted?: boolean;
  /** Contenu de la colonne de suivi. */
  follow: FollowColumn;
  /**
   * Mention propre à l'écran dans la colonne de suivi, à la place de rien
   * (`follow: "none"`) : par exemple, pour l'équipe IMAFRIK, qui peut
   * recevoir un examen à attribuer.
   */
  note?: (study: Study) => React.ReactNode;
}

const DEADLINE_STYLES: Record<DeadlineTone, string> = {
  overdue: "bg-urgent-muted text-urgent font-semibold",
  soon: "bg-progress-muted text-progress font-medium",
  ok: "text-secondary",
};

/**
 * Échéance d'un examen : « reste 12 min », « dépassé de 3 h ».
 *
 * Calculée côté client seulement, comme toute durée relative (voir
 * `StudyAge`) : le premier rendu réserve la place, sans texte, pour ne
 * pas diverger de l'hydratation.
 */
export function DeadlineBadge({
  study,
  muted,
}: {
  study: Study;
  muted?: boolean;
}) {
  const now = useNow();
  const t = useMessages();
  const locale = useLocale();
  if (now === 0) return <span className="inline-block h-5 w-24" aria-hidden />;
  const deadline = deadlineOf(study, now, locale);
  const at = study.dueAt.toLocaleTimeString(INTL_LOCALE[locale], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <time
      dateTime={study.dueAt.toISOString()}
      title={t.worklist.deadline.dueAt(at)}
      className={cn(
        "inline-flex h-5 items-center rounded-md px-1.5 text-xs whitespace-nowrap tabular-nums",
        muted ? "text-tertiary" : DEADLINE_STYLES[deadline.tone],
      )}
    >
      {deadline.label}
    </time>
  );
}

/** Indicateur des renseignements cliniques, lisibles au survol et par les lecteurs d'écran. */
function ClinicalInfo({ text }: { text: string | null }) {
  const t = useMessages();
  if (!text) return null;
  const label = t.worklist.table.clinicalInfo(text);
  return (
    <span className="inline-flex shrink-0 text-tertiary" title={label}>
      <ClipboardList className="size-3.5" aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** Contenu de la colonne de suivi. */
function Follow({ study, group }: { study: Study; group: ReadingGroup }) {
  const t = useMessages();
  const follow = group.follow;
  if (follow === "status") return <StudyStatusChip status={study.status} />;
  if (follow === "reader")
    return (
      <span className="truncate text-secondary">
        {study.assignedToName ?? t.worklist.table.colleague}
      </span>
    );
  return group.note?.(study) ?? null;
}

/** Sexe, âge et identifiant, sur la seconde ligne du patient. */
function PatientLine({ study }: { study: Study }) {
  const locale = useLocale();
  const demographics = shortDemographics(study, locale);
  return (
    <span className="truncate text-2xs text-tertiary">
      {demographics && <span>{demographics} · </span>}
      <span className="font-mono">{study.patientId}</span>
    </span>
  );
}

/**
 * Navigation au clavier dans la file : `j` ou `↓` pour l'examen suivant,
 * `k` ou `↑` pour le précédent, `Entrée` pour l'ouvrir.
 *
 * Le focus se pose sur le **lien** de la ligne, pas sur une sélection
 * dessinée à part : `Entrée` l'ouvre nativement, les lecteurs d'écran
 * l'annoncent, et la tabulation reste cohérente. Seules les lignes
 * visibles comptent : le téléphone et l'ordinateur n'affichent pas la
 * même liste.
 */
function useRowNavigation(container: React.RefObject<HTMLElement | null>) {
  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || hasModifier(event)) return;
      if (isTyping(event.target)) return;
      if (document.querySelector("[role=dialog]")) return;
      const step =
        event.key === "j" || event.key === "ArrowDown"
          ? 1
          : event.key === "k" || event.key === "ArrowUp"
            ? -1
            : 0;
      if (step === 0 || !container.current) return;

      const links = [
        ...container.current.querySelectorAll<HTMLAnchorElement>(
          "a[data-row-link]",
        ),
      ].filter((link) => link.offsetParent !== null);
      if (links.length === 0) return;
      const current = links.indexOf(
        document.activeElement as HTMLAnchorElement,
      );
      // Les flèches ne détournent le défilement que dans la file.
      if (current === -1 && event.key.startsWith("Arrow")) return;
      event.preventDefault();
      const next =
        current === -1
          ? step > 0
            ? 0
            : links.length - 1
          : Math.min(links.length - 1, Math.max(0, current + step));
      links[next].focus();
      links[next].scrollIntoView({ block: "nearest" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [container]);
}

/**
 * L'action d'une carte, sur téléphone : sous la carte, hors de son lien,
 * pour qu'un toucher sur le bouton n'ouvre pas l'examen.
 */
function RowAction({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return <div className="flex justify-end px-4 pb-3">{children}</div>;
}

/** En-tête d'une section, repliable ou non. */
function GroupHeading({
  group,
  open,
  onToggle,
}: {
  group: ReadingGroup;
  open: boolean;
  onToggle: () => void;
}) {
  const label = (
    <>
      <span className="label-eyebrow text-secondary">{group.title}</span>
      <span className="rounded-full bg-surface-sunken px-1.5 text-2xs text-tertiary tabular-nums">
        {group.studies.length}
      </span>
      {group.hint && (
        <span className="hidden truncate text-2xs text-tertiary sm:inline">
          {group.hint}
        </span>
      )}
    </>
  );
  if (!group.collapsible)
    return <div className="flex items-center gap-2">{label}</div>;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="-my-1.5 flex min-h-9 w-full items-center gap-2 rounded-sm py-1.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <ChevronRight
        className={cn(
          "size-3.5 text-tertiary transition-transform",
          open && "rotate-90",
        )}
        aria-hidden
      />
      {label}
    </button>
  );
}

/**
 * Tableau de la file de lecture.
 *
 * - **Sections** : ce que le radiologue a déjà pris, ce qui est à prendre,
 *   et, repliés en fin de file, les examens pris par un confrère.
 * - **Échéance en première colonne** : c'est elle qui ordonne la file.
 *   L'ambre prévient au dernier quart du délai promis, le rouge dit le
 *   dépassement. L'ancienneté reste en fin de ligne.
 * - **Le patient se situe d'un coup d'œil** : sexe, âge, identifiant, et
 *   une icône quand la clinique a joint des renseignements cliniques.
 * - **Chaque ligne porte un vrai lien** sur le nom du patient : il se
 *   parcourt au clavier (`j`, `k`, flèches), s'annonce comme un lien, et
 *   s'ouvre dans un nouvel onglet au clic du milieu. Le clic sur le reste
 *   de la ligne reste un raccourci pour la souris.
 *
 * - **Une colonne d'action**, quand l'écran en donne une : pour l'équipe
 *   IMAFRIK, « Attribuer » ou « Réattribuer » sur chaque ligne (la file
 *   devient son poste de répartition), et dans le suivi des examens à
 *   attribuer, qui peut les recevoir (`ReadingGroup.note`). Un clic sur le
 *   bouton, ou dans la fenêtre qu'il ouvre, n'ouvre pas l'examen ; la
 *   navigation au clavier ne parcourt que les liens des lignes.
 *
 * @param groups  Sections, dans l'ordre d'affichage.
 * @param hrefFor Adresse ouverte pour un examen.
 * @param empty   Message quand aucune section n'a d'examen.
 * @param refreshNote Mention ajoutée à l'aide de bas de tableau.
 * @param action  Colonne d'action : son intitulé, et son contenu pour une
 *                ligne d'une section (rien pour une ligne sans action).
 */
export function ReadingTable({
  groups,
  hrefFor,
  empty,
  refreshNote,
  action,
}: {
  groups: ReadingGroup[];
  hrefFor: (study: Study) => string;
  empty?: { title: string; detail: string };
  /** Mention ajoutée à l'aide de bas de tableau, par exemple le rythme d'actualisation. */
  refreshNote?: string;
  action?: {
    label: string;
    render: (study: Study, group: ReadingGroup) => React.ReactNode;
  };
}) {
  const router = useRouter();
  const t = useMessages();
  const labels = t.worklist.table;
  const container = React.useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = React.useState<ReadonlySet<string>>(
    () => new Set(),
  );
  useRowNavigation(container);

  const visible = groups.filter((group) => group.studies.length > 0);
  if (visible.length === 0) {
    return (
      <EmptyState
        icon={empty ? SearchX : CheckCircle2}
        {...(empty ?? labels.empty)}
      />
    );
  }

  const isOpen = (group: ReadingGroup) =>
    !group.collapsible || expanded.has(group.key);
  const toggle = (key: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div ref={container} className="flex flex-col lg:min-h-0 lg:flex-1">
      {/* Téléphone : une carte par examen. Six colonnes ne tiennent pas
          sur 390 px, et un tableau qui défile de côté cache précisément
          l'échéance. */}
      <div className="lg:hidden">
        {visible.map((group) => (
          <section key={group.key} aria-label={group.title}>
            {group.title && (
              <div className="sticky top-0 z-10 border-b border-border-subtle bg-surface-raised px-4 py-2">
                <GroupHeading
                  group={group}
                  open={isOpen(group)}
                  onToggle={() => toggle(group.key)}
                />
              </div>
            )}
            {isOpen(group) && (
              <ul className="divide-y divide-border-subtle border-b border-border-subtle">
                {group.studies.map((study) => (
                  <li key={study.id}>
                    <Link
                      href={hrefFor(study)}
                      // Jamais de préchargement : rendre l'écran de lecture
                      // d'avance émettrait un jeton de visualisation, tracé
                      // comme une consultation que personne n'a faite.
                      prefetch={false}
                      data-row-link
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 transition-colors active:bg-surface-active",
                        "focus-visible:bg-surface-hover focus-visible:outline-none",
                        study.urgent && !group.muted && "rail-urgent",
                        group.muted && "opacity-70",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">
                            {formatPatientName(study.patientName)}
                          </span>
                          {study.urgent && <UrgentMarker />}
                          <ClinicalInfo text={study.clinicalInfo} />
                        </div>
                        <p className="mt-0.5 truncate text-xs text-secondary">
                          <span className="font-medium text-primary">
                            {study.modality}
                          </span>
                          {study.bodyPart && ` · ${study.bodyPart}`} ·{" "}
                          {study.clinic}
                        </p>
                        <p className="mt-0.5 flex min-w-0">
                          <PatientLine study={study} />
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <DeadlineBadge study={study} muted={group.muted} />
                        <Follow study={study} group={group} />
                      </div>
                    </Link>
                    {action && (
                      <RowAction>{action.render(study, group)}</RowAction>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <div className="hidden min-h-0 flex-1 overflow-auto lg:block">
        {/* Avec une colonne d'action, une largeur minimale : sans elle,
            l'examen, seule colonne sans largeur fixe, s'écrasait sous le
            suivi à 1024 px. Le tableau défile alors dans son conteneur. */}
        <table
          className={cn(
            "w-full table-fixed border-separate border-spacing-0 text-sm",
            action && "min-w-[60rem]",
          )}
        >
          <thead className="sticky top-0 z-20">
            <tr className="[&>th]:h-9 [&>th]:border-b [&>th]:border-border-subtle [&>th]:bg-surface-raised [&>th]:px-4 [&>th]:text-left [&>th]:font-medium">
              <th scope="col" className="w-34">
                <span className="label-eyebrow">{labels.columns.deadline}</span>
              </th>
              <th scope="col" className="w-[28%]">
                <span className="label-eyebrow">{labels.columns.patient}</span>
              </th>
              {/* À partir de 1536 px, l'examen garde la largeur du patient et
                  le suivi prend le reste, aligné à droite contre la date : la
                  colonne de l'examen ne s'étire plus en un grand vide. */}
              <th scope="col" className="2xl:w-[28%]">
                <span className="label-eyebrow">{labels.columns.study}</span>
              </th>
              {/* Assez large pour le statut le plus long des deux langues
                  (« In progress ») : une pastille tronquée ne se lit plus.
                  Avec une colonne d'action, pour « Personne d'éligible ». */}
              <th
                scope="col"
                className={cn(
                  "2xl:w-auto 2xl:!text-right",
                  action ? "w-44" : "w-36",
                )}
              >
                <span className="label-eyebrow">{labels.columns.follow}</span>
              </th>
              <th scope="col" className="w-20 !text-right">
                <span className="label-eyebrow">{labels.columns.received}</span>
              </th>
              {action && (
                // Collée à droite : l'action reste visible quand le tableau
                // défile en largeur.
                <th scope="col" className="sticky right-0 w-36 !text-right">
                  <span className="label-eyebrow">{action.label}</span>
                </th>
              )}
            </tr>
          </thead>

          {visible.map((group) => (
            <tbody key={group.key}>
              {group.title && (
                <tr>
                  <th
                    scope="colgroup"
                    colSpan={action ? 6 : 5}
                    className="h-9 border-b border-border-subtle bg-surface-sunken/60 px-4 text-left font-normal"
                  >
                    <GroupHeading
                      group={group}
                      open={isOpen(group)}
                      onToggle={() => toggle(group.key)}
                    />
                  </th>
                </tr>
              )}
              {isOpen(group) &&
                group.studies.map((study) => (
                  <tr
                    key={study.id}
                    onClick={(event) => {
                      // La fenêtre d'attribution est rendue hors de la ligne
                      // (portail), mais ses clics remontent l'arbre React
                      // jusqu'ici : ils ne doivent pas ouvrir l'examen.
                      if (!event.currentTarget.contains(event.target as Node))
                        return;
                      // Le lien et le bouton gèrent eux-mêmes leur clic.
                      if ((event.target as HTMLElement).closest("a, button"))
                        return;
                      router.push(hrefFor(study));
                    }}
                    className={cn(
                      "cursor-pointer",
                      "[&>td]:h-12 [&>td]:border-b [&>td]:border-border-subtle [&>td]:px-4",
                      "transition-colors duration-75",
                      "hover:bg-surface-hover focus-within:bg-surface-hover",
                      study.urgent && !group.muted && "rail-urgent",
                      group.muted && "text-secondary",
                    )}
                  >
                    <td>
                      <DeadlineBadge study={study} muted={group.muted} />
                    </td>

                    <td>
                      <div className="flex min-w-0 items-center gap-2">
                        <Link
                          href={hrefFor(study)}
                          prefetch={false}
                          data-row-link
                          className="truncate rounded-sm leading-5 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        >
                          {formatPatientName(study.patientName)}
                        </Link>
                        {study.urgent && <UrgentMarker />}
                      </div>
                      <div className="mt-0.5 flex min-w-0 leading-4">
                        <PatientLine study={study} />
                      </div>
                    </td>

                    <td>
                      <div className="flex min-w-0 items-center gap-1.5 whitespace-nowrap">
                        <span className="font-medium">{study.modality}</span>
                        {study.bodyPart && (
                          <span className="truncate text-secondary">
                            · {study.bodyPart}
                          </span>
                        )}
                        <ClinicalInfo text={study.clinicalInfo} />
                      </div>
                      {/* La clinique sous l'examen, comme l'identifiant sous
                          le nom : une colonne de plus tronquait l'une et
                          l'autre à 1024 px. */}
                      <div className="mt-0.5 truncate text-2xs leading-4 text-tertiary">
                        {study.clinic}
                      </div>
                    </td>

                    <td className="truncate 2xl:text-right">
                      <Follow study={study} group={group} />
                    </td>

                    <td className="text-right whitespace-nowrap tabular-nums">
                      <StudyAge date={study.receivedAt} muted />
                    </td>
                    {action && (
                      <td className="sticky right-0 bg-surface-raised text-right">
                        {action.render(study, group)}
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>
          ))}
        </table>
      </div>

      {/* L'aide du clavier ne sert qu'à partir de 1024 px ; le rythme
          d'actualisation se dit à toute largeur. */}
      <p
        className={cn(
          "border-t border-border-subtle px-4 py-2 text-2xs text-tertiary",
          !refreshNote && "hidden lg:block",
        )}
      >
        <span className="hidden lg:inline">
          <kbd className="font-sans">j</kbd> /{" "}
          <kbd className="font-sans">k</kbd> {labels.keyboard.browse}{" "}
          <kbd className="font-sans">{labels.keyboard.enter}</kbd>{" "}
          {labels.keyboard.open}{" "}
        </span>
        {refreshNote}
      </p>
    </div>
  );
}
