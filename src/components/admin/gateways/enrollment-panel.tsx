"use client";

import { KeyRound, Timer } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { CopyButton } from "@/components/admin/gateways/copy-button";
import { DateTime } from "@/components/domain/date-time";
import { Button } from "@/components/ui/button";
import { useMessages } from "@/i18n/client";
import {
  type IssuedCode,
  cancelEnrollmentCode,
  issueEnrollmentCode,
} from "@/lib/actions/gateways";
import { formatCountdown, secondsLeft } from "@/lib/gateways";
import { cn } from "@/lib/utils";

/** Code en cours, sans sa valeur, tel que la fiche le transmet. */
export interface PendingCode {
  id: string;
  /** Échéance, ISO 8601. */
  expiresAt: string;
  attempts: number;
  createdBy: string | null;
}

/**
 * Émission d'un code d'enrôlement, sur la fiche d'une clinique.
 *
 * Le code n'est montré **qu'ici, une fois**, au retour du geste qui
 * l'émet : le service n'en garde que l'empreinte. Il s'affiche en grand,
 * groupé comme il se dicte, avec un compte à rebours à la seconde (le
 * temps restant pour le saisir sur le poste) et un bouton de copie. Un
 * rechargement de la page le fait disparaître : il faudra en émettre un
 * nouveau, ce qui annule l'ancien.
 *
 * Les codes en cours émis plus tôt (par cet écran ou un autre) restent
 * listés sans leur valeur, avec leurs essais et un geste d'annulation.
 *
 * @param clinicId  Clinique.
 * @param codes     Codes en cours.
 * @param blockedBy Motif qui interdit d'émettre (contrat terminé, clinique
 *                  suspendue), ou `null`.
 */
export function EnrollmentPanel({
  clinicId,
  codes,
  blockedBy,
}: {
  clinicId: string;
  codes: PendingCode[];
  blockedBy: string | null;
}) {
  const t = useMessages();
  const text = t.gateways.code;
  const router = useRouter();
  const [issued, setIssued] = React.useState<IssuedCode | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  // Le code affiché n'est plus « en cours » parmi les autres : il est
  // déjà à l'écran, avec sa valeur.
  const others = codes.filter((code) => code.id !== issued?.id);

  const issue = () => {
    if ((others.length > 0 || issued) && !window.confirm(text.confirmReplace)) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await issueEnrollmentCode(clinicId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setIssued(result.data);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs leading-relaxed text-secondary">
        {text.explanation}
      </p>

      {issued && <IssuedCodeCard code={issued} />}

      {others.length > 0 && (
        <ul className="flex flex-col gap-2">
          {others.map((code) => (
            <PendingCodeRow key={code.id} code={code} clinicId={clinicId} />
          ))}
        </ul>
      )}

      {blockedBy ? (
        <p className="text-xs text-tertiary">{blockedBy}</p>
      ) : (
        <div>
          <Button
            type="button"
            size="sm"
            variant={issued ? "secondary" : "primary"}
            onClick={issue}
            loading={pending}
          >
            <KeyRound aria-hidden />
            {issued || others.length > 0 ? text.issueAgain : text.issue}
          </Button>
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs text-urgent">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Le code émis, en grand, avec son compte à rebours et sa copie.
 *
 * Le compte à rebours bat à la seconde, avec son propre minuteur : l'horloge
 * partagée de l'application ne bat que toutes les trente secondes. Il
 * s'annonce aux lecteurs d'écran à la minute seulement, sans quoi il les
 * noierait.
 */
function IssuedCodeCard({ code }: { code: IssuedCode }) {
  const t = useMessages();
  const text = t.gateways.code;
  const expiresAt = React.useMemo(
    () => new Date(code.expiresAt),
    [code.expiresAt],
  );
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const left = secondsLeft(expiresAt, now);
  const expired = left === 0;

  return (
    <section
      aria-label={text.issued}
      className={cn(
        "flex flex-col gap-3 rounded-xl border p-4",
        expired
          ? "border-border-default bg-surface-sunken"
          : "border-accent/40 bg-accent-muted/40",
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-2xs font-medium tracking-wide text-secondary uppercase">
          {text.issued}
        </h3>
        <p
          className={cn(
            "inline-flex items-center gap-1.5 text-xs font-medium tabular-nums",
            expired ? "text-urgent" : left < 120 ? "text-progress" : "",
          )}
          data-testid="enrollment-countdown"
        >
          <Timer className="size-3.5" aria-hidden />
          {expired ? text.expiredNow : text.expiresIn(formatCountdown(left))}
        </p>
      </div>

      <p
        className={cn(
          "font-mono text-xl font-semibold tracking-wider break-all select-all sm:text-2xl",
          expired && "text-tertiary line-through",
        )}
        data-testid="enrollment-code"
      >
        {code.code}
      </p>
      {/* Annonce du temps restant à la minute, pour les lecteurs d'écran. */}
      <p className="sr-only" aria-live="polite">
        {expired
          ? text.expiredNow
          : text.expiresIn(formatCountdown(Math.ceil(left / 60) * 60))}
      </p>

      {!expired && (
        <div className="flex flex-wrap items-start gap-3">
          <CopyButton
            value={code.code}
            label={text.copy}
            copied={text.copied}
            failed={text.copyFailed}
          />
        </div>
      )}

      <p className="text-2xs leading-relaxed text-secondary">
        {code.demo ? text.demo : text.shownOnce}
      </p>
    </section>
  );
}

/** Un code en cours, sans sa valeur, et son annulation. */
function PendingCodeRow({
  code,
  clinicId,
}: {
  code: PendingCode;
  clinicId: string;
}) {
  const t = useMessages();
  const text = t.gateways.code;
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const expiresAt = new Date(code.expiresAt);

  const cancel = () => {
    startTransition(async () => {
      const result = await cancelEnrollmentCode(code.id, clinicId);
      if (result.ok) {
        toast.success(text.cancelled);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border-subtle px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 text-xs">
        <p className="font-medium">{text.inProgress}</p>
        <p className="text-2xs text-tertiary">
          <ExpiryText expiresAt={expiresAt} attempts={code.attempts} />
          {code.createdBy && <> · {text.issuedBy(code.createdBy)}</>}
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={cancel}
        loading={pending}
        className="shrink-0 self-start sm:self-auto"
      >
        {text.cancel}
      </Button>
    </li>
  );
}

/** « Valable jusqu'à 14:32 · 1 essai sur 5 », date dans la langue de l'écran. */
function ExpiryText({
  expiresAt,
  attempts,
}: {
  expiresAt: Date;
  attempts: number;
}) {
  const text = useMessages().gateways.code;
  // L'heure est rendue par `DateTime` (après hydratation, dans la langue
  // de l'utilisateur) ; le texte l'entoure.
  const [before, after] = text
    .inProgressDetail("\u0000", attempts)
    .split("\u0000");
  return (
    <>
      {before}
      <DateTime date={expiresAt} />
      {after}
    </>
  );
}
