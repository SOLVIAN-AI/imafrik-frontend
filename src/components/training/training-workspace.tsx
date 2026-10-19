"use client";

import { FileDown, FilePlus2, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { DateTime } from "@/components/domain/date-time";
import { ReportDocument } from "@/components/editor/report-document";
import {
  ReadingWorkspace,
  type WorkspaceAdapter,
} from "@/components/editor/report-workspace";
import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/input";
import { useLocale, useMessages } from "@/i18n/client";
import {
  addTrainingAddendum,
  openTrainingAttempt,
  readTrainingVersion,
  resetTraining,
  saveTrainingDraft,
  submitTraining,
} from "@/lib/actions/training";
import type { TrainingAttempt } from "@/lib/data/training";
import { clearReportBackup } from "@/lib/editor/backup";
import { ADDENDUM_MAX_LENGTH } from "@/lib/editor/payload";

/** Ce que reçoit l'écran d'exercice, en plus de celui de lecture. */
type TrainingWorkspaceProps = Omit<
  React.ComponentProps<typeof ReadingWorkspace>,
  "adapter"
> & {
  /** Nom court du cas, dans l'adresse. */
  slug: string;
  /** Titre du cas, à la place du nom d'un patient. */
  title: string;
  /** Cas en relecture, ouvert par l'équipe IMAFRIK : pas d'exercice. */
  preview: boolean;
  /** Exercice de l'utilisateur, s'il l'a pris en charge. */
  attempt: TrainingAttempt | null;
};

/**
 * Exercice de formation, dans l'écran de lecture réel.
 *
 * Mêmes volets, même éditeur, même fenêtre de signature que pour un vrai
 * examen : ce qu'on apprend ici est ce qu'on fera demain. Les actions,
 * elles, visent l'exercice (docs/formation.md du backend), jamais un
 * examen ni un compte-rendu réels. Une fois signé, l'exercice se
 * télécharge en PDF spécimen, se complète par un addendum, se compare au
 * corrigé quand il existe, et se recommence.
 */
export function TrainingWorkspace({
  slug,
  title,
  preview,
  attempt,
  ...reading
}: TrainingWorkspaceProps) {
  const t = useMessages().training;
  const router = useRouter();
  const signed = Boolean(attempt?.submittedAt);

  const adapter = React.useMemo<WorkspaceAdapter>(
    () => ({
      save: saveTrainingDraft,
      readVersion: () => readTrainingVersion(slug),
      sign: (id, version) => submitTraining(slug, id, version),
      claim: () => openTrainingAttempt(slug),
      release: (id) => resetTraining(slug, id),
      homeHref: "/formation",
      title,
      notice: preview ? t.workspace.previewNotice : t.workspace.notice,
      labels: t.workspace,
      signLabels: t.sign,
      signedActions: attempt ? (
        <>
          <RestartButton slug={slug} attemptId={attempt.id} />
          <SpecimenPdfButton slug={slug} />
        </>
      ) : null,
      footer:
        signed && attempt ? (
          <TrainingAfterword
            slug={slug}
            attempt={attempt}
            onChanged={() => router.refresh()}
          />
        ) : null,
    }),
    [attempt, preview, router, signed, slug, t, title],
  );

  return <ReadingWorkspace {...reading} adapter={adapter} />;
}

/**
 * PDF spécimen : la vraie mise en page, sans valeur médicale.
 *
 * Ouvert dans un nouvel onglet, relayé par `/formation/[cas]/pdf`. En
 * démonstration, aucun PDF n'est produit : le bouton le dit.
 */
function SpecimenPdfButton({ slug }: { slug: string }) {
  const t = useMessages().training.afterword;
  const { isDemo } = useSession();
  if (isDemo) {
    return (
      <Button size="sm" onClick={() => toast.info(t.pdfDemo)}>
        <FileDown />
        {t.pdf}
      </Button>
    );
  }
  return (
    <Button size="sm" asChild>
      <a href={`/formation/${slug}/pdf`} target="_blank" rel="noopener">
        <FileDown />
        {t.pdf}
      </a>
    </Button>
  );
}

/** Recommencer : l'exercice s'efface, signé ou non, après confirmation. */
function RestartButton({
  slug,
  attemptId,
}: {
  slug: string;
  attemptId: string;
}) {
  const t = useMessages().training;
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const restart = () => {
    if (!window.confirm(t.workspace.releaseConfirm)) return;
    startTransition(async () => {
      const result = await resetTraining(slug, attemptId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      clearReportBackup(attemptId);
      toast.success(t.afterword.restarted);
      router.refresh();
    });
  };
  return (
    <Button size="sm" variant="ghost" onClick={restart} loading={pending}>
      <RotateCcw />
      {t.afterword.restart}
    </Button>
  );
}

/**
 * Sous l'exercice signé : ce qu'il reste à faire, et le corrigé.
 *
 * Le volet défile à part, plafonné : le texte signé reste lisible au-dessus,
 * et un long corrigé ne repousse pas l'éditeur hors de l'écran.
 */
function TrainingAfterword({
  slug,
  attempt,
  onChanged,
}: {
  slug: string;
  attempt: TrainingAttempt;
  onChanged: () => void;
}) {
  const t = useMessages().training.afterword;
  const locale = useLocale();
  return (
    <section
      aria-label={t.title}
      className="max-h-[45%] shrink-0 overflow-y-auto border-t border-border-subtle bg-surface-raised/60 px-4 py-4"
    >
      <p className="text-2xs leading-relaxed text-secondary">{t.pdfHint}</p>

      <h2 className="label-eyebrow mt-5">{t.reference}</h2>
      {attempt.reference ? (
        <>
          <p className="mt-1 text-2xs text-tertiary">
            {t.referenceBy(attempt.reference.author)}
          </p>
          <ReportDocument
            sections={attempt.reference.sections}
            language={locale}
            className="mt-3 max-w-none shadow-none"
          />
        </>
      ) : (
        <p className="mt-1 text-xs text-tertiary">{t.noReference}</p>
      )}

      <h2 className="label-eyebrow mt-6">{t.addenda}</h2>
      {attempt.addenda.length > 0 && (
        <ol className="mt-2 divide-y divide-border-subtle rounded-lg border border-border-subtle bg-surface-raised">
          {attempt.addenda.map((addendum) => (
            <li key={addendum.createdAt.toISOString()} className="px-3 py-2.5">
              <p className="text-2xs text-tertiary">
                <DateTime date={addendum.createdAt} />
              </p>
              <p className="mt-1 text-sm whitespace-pre-wrap">
                {addendum.body}
              </p>
            </li>
          ))}
        </ol>
      )}
      <AddendumForm slug={slug} attemptId={attempt.id} onAdded={onChanged} />
    </section>
  );
}

/** Ajout d'un addendum d'exercice, comme sur un vrai compte-rendu signé. */
function AddendumForm({
  slug,
  attemptId,
  onAdded,
}: {
  slug: string;
  attemptId: string;
  onAdded: () => void;
}) {
  const t = useMessages().training.afterword;
  const [body, setBody] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const fieldId = `addendum-${attemptId}`;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await addTrainingAddendum(slug, attemptId, body);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setBody("");
      toast.success(t.addendumAdded);
      onAdded();
    });
  };

  return (
    <form onSubmit={submit} className="mt-3 flex flex-col gap-3">
      <Field id={fieldId} label={t.addendumLabel}>
        <Textarea
          id={fieldId}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={3}
          maxLength={ADDENDUM_MAX_LENGTH}
          placeholder={t.addendumPlaceholder}
        />
      </Field>
      <div className="flex justify-end">
        <Button
          type="submit"
          size="sm"
          variant="secondary"
          loading={pending}
          disabled={!body.trim()}
        >
          <FilePlus2 />
          {t.addendumSave}
        </Button>
      </div>
    </form>
  );
}
