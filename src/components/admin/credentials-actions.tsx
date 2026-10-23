"use client";

import { ExternalLink, FileSearch, ShieldOff } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import {
  formatDay,
  ShortValidityWarning,
  todayIso,
} from "@/components/credentials/document-upload";
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
import { Field, Input, Textarea } from "@/components/ui/input";
import { useLocale, useMessages } from "@/i18n/client";
import {
  decideCredentials,
  loadCredentialDocuments,
  viewCredentialDocument,
} from "@/lib/actions/control";
import {
  type PracticeStatus,
  REQUIRED_DOCUMENT,
  shortValidity,
} from "@/lib/credentials";
import type { CredentialDocument } from "@/lib/data/credentials";
import { formatBytes, formatDate } from "@/lib/format";

/**
 * Le justificatif sur lequel porte la décision : le plus récent de la
 * nature qu'exige l'exercice, s'il attend une décision (déposé, ou
 * accepté puis habilitation défaite par un changement d'identité).
 *
 * @param documents Justificatifs, du plus récent au plus ancien.
 * @param practice  Exercice déclaré.
 */
export function documentUnderReview(
  documents: CredentialDocument[],
  practice: PracticeStatus | null,
): CredentialDocument | null {
  if (!practice) return null;
  const latest = documents.find(
    (document) => document.kind === REQUIRED_DOCUMENT[practice],
  );
  return latest && latest.status !== "rejected" ? latest : null;
}

/**
 * Examen du dossier d'un radiologue : consulter le justificatif, puis
 * l'accepter ou le refuser avec un motif.
 *
 * **Accepter**, c'est attester que le justificatif a été vérifié : pour
 * un inscrit, le diplôme et le numéro d'ordre auprès de l'Ordre (le
 * numéro affiché est celui qui sera imprimé sous sa signature) ; pour un
 * résident, l'attestation et sa date de fin, que l'administrateur
 * confirme ou corrige. Le service refuse une décision sur un justificatif
 * remplacé ou un numéro changé depuis l'affichage.
 *
 * **Refuser** exige un motif, que le radiologue lit dans ses paramètres.
 *
 * Le document s'ouvre dans un nouvel onglet, par une adresse de cinq
 * minutes ; chaque ouverture est tracée au journal d'audit.
 */
export function CredentialReview({
  profileId,
  fullName,
  licenseNumber,
  practiceStatus,
  isSelf = false,
}: {
  profileId: string;
  fullName: string;
  licenseNumber: string | null;
  practiceStatus: PracticeStatus | null;
  /** Vrai sur son propre compte : nul ne décide de sa propre habilitation. */
  isSelf?: boolean;
}) {
  const t = useMessages();
  const text = t.admin.credentials;
  const docs = t.credentials.documents;
  const locale = useLocale();
  const [open, setOpen] = React.useState(false);
  const [documents, setDocuments] = React.useState<CredentialDocument[] | null>(
    null,
  );
  const [validUntil, setValidUntil] = React.useState("");
  // Fin à moins d'un mois : l'habilitation attend que la date soit
  // confirmée, relue sur le document (le 17 octobre 2026, « jusqu'au
  // lendemain » avait été accepté tel quel).
  const [shortConfirmed, setShortConfirmed] = React.useState(false);
  const short =
    practiceStatus === "resident"
      ? shortValidity(validUntil, todayIso())
      : null;
  const [rejecting, setRejecting] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const [viewing, startViewing] = React.useTransition();

  const document = documents
    ? documentUnderReview(documents, practiceStatus)
    : null;
  const number = licenseNumber?.trim() ?? "";

  const load = () => {
    setDocuments(null);
    setError(null);
    startTransition(async () => {
      const result = await loadCredentialDocuments(profileId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDocuments(result.data);
      const current = documentUnderReview(result.data, practiceStatus);
      setValidUntil(current?.validUntil ?? "");
      setShortConfirmed(false);
    });
  };

  const view = (id: string) => {
    // Ouvert pendant le clic : un onglet ouvert après une attente serait
    // bloqué par le navigateur comme une fenêtre surgissante.
    const tab = window.open("about:blank", "_blank");
    startViewing(async () => {
      const result = await viewCredentialDocument(id);
      if (!result.ok || !tab) {
        tab?.close();
        setError(result.ok ? text.review.viewFailed : result.error);
        return;
      }
      tab.opener = null;
      tab.location.href = result.data;
    });
  };

  const decide = (kind: "verify" | "reject") => {
    if (!document) return;
    setError(null);
    startTransition(async () => {
      const result = await decideCredentials(
        profileId,
        kind === "verify"
          ? {
              kind: "verify",
              documentId: document.id,
              ...(practiceStatus === "resident"
                ? { validUntil }
                : { licenseNumber: number }),
            }
          : { kind: "reject", documentId: document.id, reason },
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(
        kind === "verify"
          ? text.review.accepted(fullName)
          : text.review.rejected(fullName),
      );
      setOpen(false);
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
        if (next) load();
        else {
          setRejecting(false);
          setReason("");
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          <FileSearch aria-hidden />
          {text.review.trigger}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{text.review.title(fullName)}</DialogTitle>
          <DialogDescription>{text.review.description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-5 pb-5">
          {practiceStatus && (
            <p className="text-xs text-secondary">
              {text.practice[practiceStatus]}
            </p>
          )}

          {documents === null && !error && (
            <p role="status" className="text-xs text-tertiary">
              {text.review.loading}
            </p>
          )}
          {documents !== null && !document && (
            <p className="text-xs text-secondary">{text.review.noDocument}</p>
          )}

          {document && (
            <div
              className="flex flex-col gap-2 rounded-lg border border-border-subtle bg-surface-sunken/60 px-3 py-2.5"
              data-testid="document-under-review"
            >
              <p className="text-xs font-medium">
                {docs.kinds[document.kind]} · {document.fileName}
              </p>
              <p className="text-2xs text-tertiary">
                {docs.uploadedOn(formatDate(document.uploadedAt, locale))} ·{" "}
                {formatBytes(document.sizeBytes, locale)} ·{" "}
                {docs.status[document.status]}
              </p>
              <div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  loading={viewing}
                  onClick={() => view(document.id)}
                >
                  <ExternalLink aria-hidden />
                  {text.review.view}
                </Button>
              </div>
            </div>
          )}

          {document && practiceStatus === "registered" && (
            <div className="rounded-lg border border-border-subtle px-3 py-2.5">
              <p className="text-2xs text-tertiary">{text.licenseLabel}</p>
              <p
                className="mt-1 font-mono text-base font-semibold tracking-wide break-all"
                data-testid="license-to-verify"
              >
                {number || "—"}
              </p>
              <p className="mt-1 text-2xs leading-relaxed text-tertiary">
                {text.review.licenseHint}
              </p>
            </div>
          )}

          {document && practiceStatus === "resident" && !rejecting && (
            <Field
              id={`valid-until-${profileId}`}
              label={text.review.validUntil}
              hint={text.review.validUntilHint}
            >
              <Input
                id={`valid-until-${profileId}`}
                type="date"
                className="sm:max-w-56"
                value={validUntil}
                min={todayIso()}
                onChange={(event) => {
                  setValidUntil(event.target.value);
                  setShortConfirmed(false);
                }}
                suppressHydrationWarning
              />
              <ShortValidityWarning
                days={short}
                message={text.review.validUntilShort}
              />
              {short !== null && (
                <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={shortConfirmed}
                    onChange={(event) =>
                      setShortConfirmed(event.target.checked)
                    }
                    className="size-3.5 accent-[var(--accent)]"
                  />
                  {text.review.validUntilShortConfirm}
                </label>
              )}
            </Field>
          )}
          {practiceStatus === "resident" && document?.validUntil && (
            <p className="text-2xs text-tertiary">
              {docs.validUntilOn(formatDay(document.validUntil, locale))}
            </p>
          )}

          {rejecting && (
            <Field
              id={`reason-${profileId}`}
              label={text.review.reason}
              hint={text.review.reasonHint}
            >
              <Textarea
                id={`reason-${profileId}`}
                rows={3}
                maxLength={500}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                autoFocus
              />
            </Field>
          )}

          {isSelf && (
            <p className="text-xs text-secondary">{text.review.self}</p>
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
            disabled={pending}
            onClick={() => (rejecting ? setRejecting(false) : setOpen(false))}
          >
            {t.common.actions.cancel}
          </Button>
          {document && !isSelf && !rejecting && (
            <>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={pending}
                onClick={() => setRejecting(true)}
              >
                {text.review.reject}
              </Button>
              <Button
                type="button"
                size="sm"
                loading={pending}
                disabled={
                  (practiceStatus === "registered" && !number) ||
                  (practiceStatus === "resident" && !validUntil) ||
                  (short !== null && !shortConfirmed)
                }
                onClick={() => decide("verify")}
              >
                {text.review.accept}
              </Button>
            </>
          )}
          {document && !isSelf && rejecting && (
            <Button
              type="button"
              size="sm"
              variant="danger"
              loading={pending}
              disabled={!reason.trim()}
              onClick={() => decide("reject")}
            >
              {text.review.rejectSubmit}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Retrait de l'habilitation : coupe l'accès aux examens et rend au pool
 * ceux que le radiologue avait pris en charge. La confirmation le dit
 * avant.
 */
export function RevokeCredentials({
  profileId,
  fullName,
}: {
  profileId: string;
  fullName: string;
}) {
  const t = useMessages();
  const text = t.admin.credentials.revoke;
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const confirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await decideCredentials(profileId, { kind: "revoke" });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(text.done(fullName, result.data));
      setOpen(false);
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          <ShieldOff aria-hidden />
          {text.trigger}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{text.title(fullName)}</DialogTitle>
          <DialogDescription>{text.description}</DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" className="px-5 pb-5 text-xs text-urgent">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => setOpen(false)}
          >
            {t.common.actions.cancel}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="danger"
            loading={pending}
            onClick={confirm}
          >
            {text.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
