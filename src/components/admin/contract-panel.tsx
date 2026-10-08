"use client";

import { AlertTriangle, Check, Copy, FileLock2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { DateTime } from "@/components/domain/date-time";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { useMessages } from "@/i18n/client";
import { type ContractEnded, endClinicContract } from "@/lib/actions/control";
import { confirmsClinicName } from "@/lib/contract-end";

/**
 * Contrat d'une clinique : son état, et le geste qui y met fin.
 *
 * **Sous contrat**, une zone de danger en bas de fiche ouvre une boîte
 * de dialogue qui dit exactement ce que le geste enclenche, et n'active
 * le bouton qu'une fois le nom de la clinique saisi : il faut lire
 * *quelle* clinique on coupe. Si des examens ne sont pas encore rendus,
 * le service refuse ; la boîte affiche alors son message et demande une
 * seconde confirmation, explicite, de leur abandon.
 *
 * **Une fois le contrat terminé**, la commande d'export renvoyée par le
 * service s'affiche avec son rappel : l'archive contient des données de
 * santé nominatives. Le composant reste monté quand la fiche se
 * rafraîchit en lecture seule, ce qui garde la commande à l'écran.
 *
 * @param clinicId   Clinique.
 * @param clinicName Son nom, à saisir pour confirmer.
 * @param endedAt    Fin du contrat (ISO 8601), ou `null` sous contrat.
 */
export function ContractPanel({
  clinicId,
  clinicName,
  endedAt,
}: {
  clinicId: string;
  clinicName: string;
  endedAt: string | null;
}) {
  const text = useMessages().admin.contract;
  // Effet du geste fait depuis cet écran : seul moment où la commande
  // d'export est connue.
  const [outcome, setOutcome] = React.useState<ContractEnded | null>(null);

  if (outcome) {
    return (
      <div className="flex flex-col gap-4">
        <EndedStatus endedAt={outcome.endedAt} />
        {outcome.abandonedStudies > 0 && (
          <p className="text-xs text-secondary">
            {text.abandoned(outcome.abandonedStudies)}
          </p>
        )}
        <ExportCommand command={outcome.exportCommand} />
      </div>
    );
  }

  if (endedAt) {
    return (
      <div className="flex flex-col gap-3">
        <EndedStatus endedAt={endedAt} />
        <p className="flex gap-2 text-xs leading-relaxed text-secondary">
          <FileLock2
            className="mt-0.5 size-3.5 shrink-0 text-tertiary"
            aria-hidden
          />
          {text.endedExportReminder}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-center gap-2 text-sm">
        <span className="size-2 rounded-full bg-done" aria-hidden />
        {text.underContract}
      </p>
      <section
        aria-labelledby="danger-zone-title"
        className="rounded-lg border border-urgent/40 p-4"
      >
        <h3
          id="danger-zone-title"
          className="text-2xs font-medium tracking-wide text-urgent uppercase"
        >
          {text.dangerZone}
        </h3>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium">{text.endTitle}</p>
            <p className="mt-0.5 text-xs text-tertiary">
              {text.endDescription}
            </p>
          </div>
          <EndContractDialog
            clinicId={clinicId}
            clinicName={clinicName}
            onEnded={setOutcome}
          />
        </div>
      </section>
    </div>
  );
}

/** « Contrat terminé le … », avec la date dans la langue de l'utilisateur. */
function EndedStatus({ endedAt }: { endedAt: string }) {
  const text = useMessages().admin.contract;
  return (
    <p className="flex items-center gap-2 text-sm font-medium">
      <span className="size-2 rounded-full bg-urgent" aria-hidden />
      <span>
        {text.endedOnBefore}
        <DateTime date={new Date(endedAt)} withTime={false} />
        {text.endedOnAfter}
      </span>
    </p>
  );
}

/**
 * Commande d'export, à copier, et son rappel.
 *
 * Le texte revient à la ligne plutôt que de défiler : la commande se lit
 * en entier, et se sélectionne d'un geste si le presse-papiers est refusé.
 */
function ExportCommand({ command }: { command: string }) {
  const text = useMessages().admin.contract;
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Presse-papiers refusé : la commande reste lisible et sélectionnable.
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">{text.exportTitle}</p>
      <p className="text-xs text-tertiary">{text.exportIntro}</p>
      <pre className="rounded-md border border-border-subtle bg-surface-sunken p-3 font-mono text-2xs leading-relaxed break-all whitespace-pre-wrap select-all">
        <code>{command}</code>
      </pre>
      <div>
        <Button type="button" size="sm" variant="secondary" onClick={copy}>
          {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          {copied ? text.copied : text.copy}
        </Button>
      </div>
      <p
        role="note"
        className="flex gap-2 rounded-lg bg-progress-muted px-3 py-2.5 text-xs leading-relaxed text-progress"
      >
        <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        {text.exportReminder}
      </p>
    </div>
  );
}

/**
 * Boîte de confirmation de la fin de contrat.
 *
 * Deux verrous : le nom saisi, toujours ; l'abandon des examens non
 * rendus, quand le service les a signalés. Le second n'apparaît qu'après
 * le refus du service, avec son nombre exact, pour que la décision porte
 * sur un fait et non sur une hypothèse.
 */
function EndContractDialog({
  clinicId,
  clinicName,
  onEnded,
}: {
  clinicId: string;
  clinicName: string;
  onEnded: (outcome: ContractEnded) => void;
}) {
  const t = useMessages();
  const text = t.admin.contract;
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [typed, setTyped] = React.useState("");
  const [unreported, setUnreported] = React.useState<{
    count: number;
    message: string;
  } | null>(null);
  const [abandon, setAbandon] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const nameOk = confirmsClinicName(typed, clinicName);
  const ready = nameOk && (unreported === null || abandon);

  const reset = () => {
    setTyped("");
    setUnreported(null);
    setAbandon(false);
    setError(null);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!ready) return;
    setError(null);
    startTransition(async () => {
      const result = await endClinicContract(clinicId, {
        confirmName: typed,
        abandonUnreported: unreported !== null && abandon,
      });
      if (result.ok) {
        onEnded(result.data);
        setOpen(false);
        reset();
        toast.success(text.done(clinicName));
        return;
      }
      if ("unreported" in result) {
        setUnreported({ count: result.unreported, message: result.error });
        setAbandon(false);
        return;
      }
      setError(result.error);
      // Contrat terminé entre-temps par une autre session : la fiche
      // passe en lecture seule.
      if (result.status === 409) router.refresh();
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="danger" size="sm" className="shrink-0">
          {text.endTitle}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{text.dialogTitle(clinicName)}</DialogTitle>
            <DialogDescription>{text.dialogDescription}</DialogDescription>
          </DialogHeader>

          <div className="flex max-h-[60dvh] flex-col gap-4 overflow-y-auto px-5 pb-5">
            <ul className="flex list-disc flex-col gap-1.5 pl-4 text-xs leading-relaxed text-secondary">
              {text.consequences.map((consequence) => (
                <li key={consequence}>{consequence}</li>
              ))}
            </ul>

            <p className="text-xs">
              {text.confirmBefore}
              <strong className="font-semibold select-all">{clinicName}</strong>
            </p>
            <Field
              id="confirm-clinic-name"
              label={text.confirmLabel}
              hint={text.confirmHint}
            >
              <Input
                id="confirm-clinic-name"
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                maxLength={200}
                className="h-9"
              />
            </Field>

            {unreported && (
              <div
                role="alert"
                className="flex flex-col gap-3 rounded-lg bg-urgent-muted px-3 py-3 text-xs text-urgent"
              >
                <p className="flex gap-2">
                  <AlertTriangle
                    className="mt-0.5 size-3.5 shrink-0"
                    aria-hidden
                  />
                  <span>
                    <span className="block font-medium">
                      {text.unreportedTitle(unreported.count)}
                    </span>
                    {unreported.message}
                  </span>
                </p>
                <label className="flex cursor-pointer items-start gap-2.5 text-primary">
                  <input
                    type="checkbox"
                    checked={abandon}
                    onChange={(event) => setAbandon(event.target.checked)}
                    className="mt-0.5 size-4 shrink-0 accent-urgent"
                  />
                  <span>
                    <span className="block font-medium">
                      {text.abandonLabel}
                    </span>
                    <span className="mt-0.5 block text-secondary">
                      {text.abandonDetail}
                    </span>
                  </span>
                </label>
              </div>
            )}

            {error && (
              <p role="alert" className="text-xs text-urgent">
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                // `onOpenChange` ne voit pas une fermeture commandée par
                // l'écran : la saisie est effacée ici aussi.
                setOpen(false);
                reset();
              }}
            >
              {t.common.actions.cancel}
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              loading={pending}
              disabled={!ready}
            >
              {text.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
