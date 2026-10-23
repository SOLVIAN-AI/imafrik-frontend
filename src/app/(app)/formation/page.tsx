import { ArrowRight, BookOpenCheck, Eye, GraduationCap } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader, Panel } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { AppMessages } from "@/i18n";
import { getMessages } from "@/i18n/server";
import { listTrainingCases, type TrainingCase } from "@/lib/data/training";
import { requireSession } from "@/lib/session/server";
import { cn } from "@/lib/utils";

/** Titre de l'onglet, dans la langue de l'utilisateur. */
export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.training.page.title };
}

/** Teinte de l'état d'un exercice, sur le modèle des pastilles de la file. */
const STATE_STYLES: Record<TrainingCase["state"], string> = {
  todo: "bg-surface-active text-secondary",
  draft: "bg-accent-muted text-accent",
  submitted: "bg-done-muted text-done",
};

/**
 * Espace de formation : la liste des exercices.
 *
 * Des examens réels anonymisés, à lire et rédiger dans le vrai écran de
 * lecture, sans patient ni clinique (docs/formation.md du backend). La
 * liste dit d'abord le parcours, puis chaque cas avec son état et sa
 * source, citée comme la licence l'exige.
 *
 * Ouverte à tout radiologue, dossier validé ou non : c'est en attendant la
 * validation qu'on a le temps de s'exercer. L'équipe IMAFRIK y voit aussi
 * les cas en relecture, pour les faire relire avant publication.
 */
export default async function TrainingPage() {
  await requireSession(["radiologist", "platform_admin"]);
  const [{ t }, cases] = await Promise.all([
    getMessages(),
    listTrainingCases(),
  ]);
  const labels = t.training;

  return (
    <>
      <PageHeader
        title={labels.page.title}
        description={labels.page.description}
      />

      {/* La zone défile : le cadre de l'application tient dans l'écran et
          masque ce qui dépasse. Sans elle, les derniers cas étaient coupés,
          sans défilement possible (signalé le 23 octobre 2026). */}
      <div className="min-h-0 flex-1 space-y-6 overflow-auto px-4 pb-8 sm:px-6">
        <Panel className="px-5 py-4">
          <h2 className="label-eyebrow">{labels.page.stepsTitle}</h2>
          <ol className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {labels.page.steps.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm text-secondary">
                <span
                  className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-muted text-2xs font-semibold text-accent tabular-nums"
                  aria-hidden
                >
                  {index + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </Panel>

        {cases.length === 0 ? (
          <Panel>
            <EmptyState
              icon={GraduationCap}
              title={labels.page.emptyTitle}
              detail={labels.page.emptyDetail}
            />
          </Panel>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {cases.map((trainingCase) => (
              <li key={trainingCase.id} className="flex">
                <CaseCard trainingCase={trainingCase} labels={labels} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

/** Un exercice : examen, contexte, état, source, et l'entrée vers l'écran. */
function CaseCard({
  trainingCase,
  labels,
}: {
  trainingCase: TrainingCase;
  labels: AppMessages["training"];
}) {
  const action = !trainingCase.published
    ? { label: labels.actions.preview, icon: Eye }
    : {
        todo: { label: labels.actions.start, icon: ArrowRight },
        draft: { label: labels.actions.resume, icon: ArrowRight },
        submitted: { label: labels.actions.review, icon: BookOpenCheck },
      }[trainingCase.state];
  const Icon = action.icon;

  return (
    <Panel className="flex w-full flex-col p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-2xs text-tertiary">
          <span className="rounded-md bg-surface-active px-1.5 py-0.5 font-mono font-semibold text-secondary">
            {trainingCase.modality}
          </span>
          {trainingCase.bodyPart}
        </span>
        {trainingCase.published ? (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-2xs font-medium whitespace-nowrap",
              STATE_STYLES[trainingCase.state],
            )}
          >
            {labels.states[trainingCase.state]}
          </span>
        ) : (
          <span
            className="rounded-full bg-urgent-muted px-2 py-0.5 text-2xs font-medium whitespace-nowrap text-urgent"
            title={labels.underReviewHint}
          >
            {labels.underReview}
          </span>
        )}
      </div>

      <h2 className="mt-4 text-base font-semibold tracking-[-0.01em]">
        {trainingCase.title}
      </h2>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-secondary">
        {trainingCase.indication}
      </p>

      <div className="mt-4 space-y-1 text-2xs text-tertiary">
        {trainingCase.reviewedBy && (
          <p>{labels.reviewedBy(trainingCase.reviewedBy)}</p>
        )}
        {trainingCase.state === "submitted" && trainingCase.hasReference && (
          <p className="text-done">{labels.hasReference}</p>
        )}
        <p>
          {labels.source(trainingCase.source.name, trainingCase.source.license)}{" "}
          <a
            href={trainingCase.source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-border-default underline-offset-2 hover:text-secondary"
          >
            {labels.sourceLink}
          </a>
        </p>
      </div>

      <Button
        className="mt-5 self-start"
        size="sm"
        variant={trainingCase.state === "todo" ? "primary" : "secondary"}
        asChild
      >
        <Link href={`/formation/${trainingCase.slug}`}>
          {action.label}
          <Icon />
        </Link>
      </Button>
    </Panel>
  );
}
