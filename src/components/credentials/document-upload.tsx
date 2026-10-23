"use client";

import {
  CheckCircle2,
  Clock,
  FileText,
  Paperclip,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useLocale, useMessages } from "@/i18n/client";
import { getDocumentGrant } from "@/lib/actions/credentials";
import { sendDocument } from "@/lib/credential-upload";
import {
  daysUntil,
  DOCUMENT_ACCEPT,
  type DocumentKind,
  MAX_DOCUMENT_BYTES,
  RENEWAL_NOTICE_DAYS,
  shortValidity,
} from "@/lib/credentials";
import type { CredentialDocument } from "@/lib/data/credentials";
import { formatBytes, formatDate } from "@/lib/format";
import type { Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

/** Types reconnus par le service ; le contenu réel est revérifié là-bas. */
const ACCEPTED_TYPES = new Set(DOCUMENT_ACCEPT.split(","));

/**
 * Avertissement sous une date de fin anormalement proche : sans bloquer,
 * il fait relire la date imprimée sur le document (voir `shortValidity`).
 *
 * @param days    Jours restants, ou `null` : rien ne s'affiche.
 * @param message Texte, selon les jours restants.
 */
export function ShortValidityWarning({
  days,
  message,
}: {
  days: number | null;
  message: (days: number) => string;
}) {
  if (days === null) return null;
  return (
    <p role="status" className="mt-1.5 text-xs font-medium text-progress">
      {message(days)}
    </p>
  );
}

/** Date du jour, `AAAA-MM-JJ`, en temps universel comme le service. */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Date `AAAA-MM-JJ` en toutes lettres, sans décalage de fuseau.
 *
 * @param day    Date au format ISO.
 * @param locale Langue de l'utilisateur.
 */
export function formatDay(day: string, locale: Locale): string {
  return formatDate(new Date(`${day}T00:00:00Z`), locale);
}

/** État d'un dépôt en préparation. */
export interface DocumentUploadState {
  kind: DocumentKind;
  file: File | null;
  validUntil: string;
  /** Fraction envoyée, ou `null` hors envoi. */
  progress: number | null;
  error: string | null;
  pick: (file: File | null) => void;
  setValidUntil: (value: string) => void;
  /**
   * Envoie le fichier choisi. Renvoie `true` une fois le justificatif
   * enregistré par le service ; sinon, `error` dit pourquoi.
   */
  send: () => Promise<boolean>;
}

/**
 * Dépôt d'un justificatif : choix du fichier, date de fin d'une
 * attestation, envoi direct à l'API avec sa progression.
 *
 * Les contrôles faits ici (taille, type, date) évitent un aller-retour
 * inutile ; le service les refait tous, et c'est lui qui reconnaît le
 * type au contenu du fichier.
 *
 * @param kind Justificatif qu'exige l'exercice déclaré.
 */
export function useDocumentUpload(kind: DocumentKind): DocumentUploadState {
  const t = useMessages().credentials.documents;
  const locale = useLocale();
  const router = useRouter();
  const [file, setFile] = React.useState<File | null>(null);
  const [validUntil, setValidUntil] = React.useState("");
  const [progress, setProgress] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const pick = (next: File | null) => {
    setError(null);
    if (next && next.size > MAX_DOCUMENT_BYTES) {
      setFile(null);
      setError(t.tooLarge);
      return;
    }
    if (next && next.type && !ACCEPTED_TYPES.has(next.type)) {
      setFile(null);
      setError(t.badType);
      return;
    }
    setFile(next);
  };

  const send = async (): Promise<boolean> => {
    if (!file) {
      setError(t.missingFile);
      return false;
    }
    const certificate = kind === "enrollment_certificate";
    if (certificate && !validUntil) {
      setError(t.validUntilRequired);
      return false;
    }
    if (certificate && validUntil < todayIso()) {
      setError(t.validUntilPast);
      return false;
    }
    setError(null);
    setProgress(0);
    try {
      const grant = await getDocumentGrant();
      if (!grant.ok) {
        setError(grant.error);
        return false;
      }
      const result = await sendDocument(
        grant.data,
        file,
        {
          fileName: file.name,
          ...(certificate ? { validUntil } : {}),
        },
        setProgress,
        locale,
      );
      if (!result.ok) {
        setError(
          result.reason ?? (result.status === 0 ? t.connectionLost : t.failed),
        );
        return false;
      }
      setFile(null);
      // L'état d'habilitation et la liste des dépôts se relisent.
      router.refresh();
      return true;
    } finally {
      setProgress(null);
    }
  };

  return { kind, file, validUntil, progress, error, pick, setValidUntil, send };
}

/**
 * Choix du fichier et, pour une attestation, de sa date de fin.
 *
 * Ce n'est pas un formulaire : il vit aussi bien dans une étape du
 * parcours d'accueil, dont le bouton « Continuer » envoie le fichier, que
 * dans les paramètres, avec son propre bouton d'envoi.
 *
 * @param upload État du dépôt (voir {@link useDocumentUpload}).
 * @param action Bouton d'envoi, quand l'écran en a un à lui.
 */
export function DocumentPicker({
  upload,
  action,
}: {
  upload: DocumentUploadState;
  action?: React.ReactNode;
}) {
  const t = useMessages().credentials.documents;
  const locale = useLocale();
  const input = React.useRef<HTMLInputElement>(null);
  const sending = upload.progress !== null;
  const errorId = `document-error-${upload.kind}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-dashed border-border-default p-4">
        <p className="flex items-center gap-2 text-sm font-medium">
          <FileText className="size-4 text-tertiary" aria-hidden />
          {t.kinds[upload.kind]}
        </p>
        <p className="mt-1 text-xs text-tertiary">{t.hints[upload.kind]}</p>

        <input
          ref={input}
          type="file"
          accept={DOCUMENT_ACCEPT}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(event) => {
            upload.pick(event.target.files?.[0] ?? null);
            // Le même fichier peut être choisi de nouveau après une erreur.
            event.target.value = "";
          }}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={sending}
            onClick={() => input.current?.click()}
            aria-describedby={upload.error ? errorId : undefined}
          >
            <Paperclip aria-hidden />
            {upload.file ? t.replace : t.choose}
          </Button>
          {upload.file && (
            <span
              className="min-w-0 truncate text-xs text-secondary"
              data-testid="document-selected"
            >
              {t.selected(
                upload.file.name,
                formatBytes(upload.file.size, locale),
              )}
            </span>
          )}
        </div>
        <p className="mt-3 text-2xs leading-relaxed text-tertiary">
          {t.formats} {t.privacy}
        </p>
      </div>

      {upload.kind === "enrollment_certificate" && (
        <Field
          id="document-valid-until"
          label={t.validUntil}
          hint={t.validUntilHint}
        >
          <Input
            id="document-valid-until"
            type="date"
            className="h-10 sm:max-w-56"
            value={upload.validUntil}
            min={todayIso()}
            onChange={(event) => upload.setValidUntil(event.target.value)}
            disabled={sending}
            suppressHydrationWarning
          />
          <ShortValidityWarning
            days={shortValidity(upload.validUntil, todayIso())}
            message={t.validUntilShort}
          />
        </Field>
      )}

      {sending && (
        <div role="status" className="flex flex-col gap-1.5">
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-active">
            <div
              className="h-full rounded-full bg-accent transition-[width]"
              style={{ width: `${Math.round((upload.progress ?? 0) * 100)}%` }}
            />
          </div>
          <span className="text-2xs text-tertiary">
            {t.sending(Math.round((upload.progress ?? 0) * 100))}
          </span>
        </div>
      )}

      {upload.error && (
        <p id={errorId} role="alert" className="text-xs text-urgent">
          {upload.error}
        </p>
      )}

      {action && <div className="flex justify-end">{action}</div>}
    </div>
  );
}

/** Icône et teinte du statut d'un justificatif. */
const STATUS_STYLES = {
  pending: { icon: Clock, className: "text-progress" },
  accepted: { icon: CheckCircle2, className: "text-done" },
  rejected: { icon: XCircle, className: "text-urgent" },
} as const;

/**
 * Les dépôts du radiologue et la décision prise sur chacun, motif d'un
 * refus compris : c'est là qu'il apprend ce qu'il doit corriger.
 *
 * @param documents Justificatifs, du plus récent au plus ancien.
 */
export function DocumentHistory({
  documents,
}: {
  documents: CredentialDocument[];
}) {
  const t = useMessages().credentials.documents;
  const locale = useLocale();
  if (documents.length === 0) return null;
  return (
    <section aria-labelledby="document-history" className="flex flex-col gap-2">
      <h3 id="document-history" className="text-xs font-medium text-secondary">
        {t.history}
      </h3>
      <ul className="flex flex-col divide-y divide-border-subtle rounded-xl border border-border-subtle">
        {documents.map((document) => {
          const style = STATUS_STYLES[document.status];
          const Icon = style.icon;
          return (
            <li
              key={document.id}
              data-document-status={document.status}
              className="flex flex-col gap-1 px-3 py-2.5"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="min-w-0 truncate text-xs font-medium">
                  {t.kinds[document.kind]} · {document.fileName}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-2xs font-medium",
                    style.className,
                  )}
                >
                  <Icon className="size-3.5" aria-hidden />
                  {t.status[document.status]}
                </span>
              </div>
              <p className="text-2xs text-tertiary">
                {t.uploadedOn(formatDate(document.uploadedAt, locale))}
                {document.validUntil &&
                  ` · ${t.validUntilOn(formatDay(document.validUntil, locale))}`}
              </p>
              {document.status === "rejected" && document.rejectionReason && (
                <p className="rounded-lg bg-urgent-muted px-2.5 py-2 text-2xs leading-relaxed text-urgent">
                  <span className="font-medium">{t.rejectionReason} : </span>
                  {document.rejectionReason}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * Rappel de renouvellement, dans les trente jours qui précèdent la fin
 * d'une attestation acceptée. Rien avant, et rien une fois la nouvelle
 * attestation déposée (`pendingRenewal`).
 *
 * @param validUntil     Fin de l'attestation acceptée, ou `null`.
 * @param pendingRenewal Une nouvelle attestation attend déjà sa décision.
 */
export function RenewalNotice({
  validUntil,
  pendingRenewal,
  className,
}: {
  validUntil: string | null;
  pendingRenewal: boolean;
  className?: string;
}) {
  const t = useMessages().credentials.documents;
  const locale = useLocale();
  const days = daysUntil(validUntil, todayIso());
  if (pendingRenewal || days === null || days > RENEWAL_NOTICE_DAYS || days < 0)
    return null;
  return (
    <p
      role="status"
      data-testid="renewal-notice"
      className={cn(
        "flex items-start gap-2 rounded-lg bg-progress-muted px-3 py-2.5 text-xs leading-relaxed text-progress",
        className,
      )}
    >
      <Clock className="mt-px size-3.5 shrink-0" aria-hidden />
      {t.renewal(days, formatDay(validUntil!, locale))}
    </p>
  );
}
