"use client";

import { KeyRound, PenLine } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

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
import { Field, Textarea } from "@/components/ui/input";
import { useLocale, useMessages } from "@/i18n/client";
import {
  loadUserSigning,
  resetUserSigningPin,
  reviewSigningAsset,
  type UserSigningReview,
} from "@/lib/actions/signing";
import type { SigningAsset } from "@/lib/data/signing";
import { formatDate, formatTime } from "@/lib/format";
import { SIGNING_ASSET_KINDS, type SigningAssetKind } from "@/lib/signing";
import { cn } from "@/lib/utils";

/**
 * Vérification de la signature et du cachet d'un radiologue, et
 * effacement de son code personnel.
 *
 * Sur le modèle de l'examen des justificatifs (`credentials-actions.tsx`) :
 * l'image déposée s'affiche à côté de celle qui s'imprime aujourd'hui ;
 * l'équipe la compare au nom et au justificatif (un cachet doit porter le
 * nom et le numéro d'ordre), puis l'accepte, ou la refuse avec un motif
 * que le radiologue lira. Rien n'est bloqué pendant ce temps : l'image
 * précédente reste imprimée, l'accès aux examens reste ouvert.
 *
 * Les images ne se chargent qu'à l'ouverture de la fenêtre, et chaque
 * chargement est tracé au journal par le service.
 *
 * **Code personnel** : l'équipe peut l'effacer, à la demande du
 * radiologue et après avoir vérifié son identité ; elle ne le choisit
 * jamais. Nul ne décide de ses propres images ni n'efface son propre code.
 */
export function SigningReviewDialog({
  profileId,
  fullName,
  due,
  isSelf = false,
}: {
  profileId: string;
  fullName: string;
  /** Images en attente, d'après la liste des comptes. */
  due: number;
  isSelf?: boolean;
}) {
  const t = useMessages();
  const text = t.admin.signing;
  const [open, setOpen] = React.useState(false);
  const [review, setReview] = React.useState<UserSigningReview | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, startLoading] = React.useTransition();

  const load = () => {
    setReview(null);
    setError(null);
    startLoading(async () => {
      const result = await loadUserSigning(profileId);
      if (result.ok) setReview(result.data);
      else setError(result.error);
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) load();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant={due > 0 ? "secondary" : "ghost"}>
          <PenLine aria-hidden />
          {due > 0 ? text.due : text.trigger}
          {due > 0 && (
            <span className="rounded-full bg-progress-muted px-1.5 text-2xs font-semibold text-progress tabular-nums">
              {due}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{text.title(fullName)}</DialogTitle>
          <DialogDescription>{text.description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-5 pb-5">
          {loading && !review && (
            <p role="status" className="text-xs text-tertiary">
              {text.loading}
            </p>
          )}
          {error && (
            <p role="alert" className="text-xs text-urgent">
              {error}
            </p>
          )}
          {review &&
            SIGNING_ASSET_KINDS.map((kind) => (
              <KindReview
                key={kind}
                kind={kind}
                profileId={profileId}
                review={review}
                isSelf={isSelf}
                onDecided={load}
              />
            ))}
          {review && (
            <PinReset
              profileId={profileId}
              fullName={fullName}
              review={review}
              isSelf={isSelf}
              onReset={load}
            />
          )}
          {isSelf && <p className="text-xs text-secondary">{text.self}</p>}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
          >
            {t.common.actions.close}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Image affichée sur fond blanc, comme sur le papier. */
function AssetImage({
  src,
  alt,
  className,
}: {
  src: string | undefined;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-28 items-center justify-center rounded-lg border border-border-subtle bg-white p-2",
        className,
      )}
    >
      {src && (
        // eslint-disable-next-line @next/next/no-img-element -- donnée embarquée, sans optimisation possible
        <img
          src={src}
          alt={alt}
          className="max-h-full w-auto max-w-full object-contain"
        />
      )}
    </div>
  );
}

/** Une nature : l'image imprimée, l'image déposée, et la décision. */
function KindReview({
  kind,
  profileId,
  review,
  isSelf,
  onDecided,
}: {
  kind: SigningAssetKind;
  profileId: string;
  review: UserSigningReview;
  isSelf: boolean;
  onDecided: () => void;
}) {
  const t = useMessages();
  const text = t.admin.signing;
  const locale = useLocale();
  const slot = review.setup[kind];
  const [rejecting, setRejecting] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const decide = (asset: SigningAsset, decision: "accept" | "reject") => {
    setError(null);
    startTransition(async () => {
      const result = await reviewSigningAsset(
        profileId,
        asset.id,
        decision,
        decision === "reject" ? reason : undefined,
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(
        decision === "accept" ? text.accepted[kind] : text.rejected,
      );
      setRejecting(false);
      setReason("");
      onDecided();
    });
  };

  return (
    <section
      className="flex flex-col gap-3 rounded-lg border border-border-subtle px-3 py-3"
      data-signing-review={kind}
    >
      <h3 className="text-xs font-semibold">{text.kinds[kind]}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <figure className="flex flex-col gap-1.5">
          <figcaption className="text-2xs text-tertiary">
            {text.current[kind]}
          </figcaption>
          {slot.accepted ? (
            <AssetImage
              src={review.images[slot.accepted.id]}
              alt={text.imageAlt.current[kind]}
            />
          ) : (
            <p className="text-xs text-secondary">{text.noneCurrent}</p>
          )}
        </figure>
        <figure className="flex flex-col gap-1.5">
          <figcaption className="text-2xs text-tertiary">
            {slot.pending
              ? text.submitted[kind](formatDate(slot.pending.createdAt, locale))
              : text.nothingPending}
          </figcaption>
          {slot.pending && (
            <AssetImage
              src={review.images[slot.pending.id]}
              alt={text.imageAlt.pending[kind]}
              className="ring-2 ring-progress/40"
            />
          )}
        </figure>
      </div>

      {slot.pending && !isSelf && rejecting && (
        <Field
          id={`signing-reason-${kind}`}
          label={text.reason}
          hint={text.reasonHint}
        >
          <Textarea
            id={`signing-reason-${kind}`}
            rows={3}
            maxLength={500}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            autoFocus
          />
        </Field>
      )}
      {error && (
        <p role="alert" className="text-xs text-urgent">
          {error}
        </p>
      )}
      {slot.pending && !isSelf && (
        <div className="flex flex-wrap justify-end gap-2">
          {rejecting ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() => setRejecting(false)}
              >
                {t.common.actions.cancel}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="danger"
                loading={pending}
                disabled={!reason.trim()}
                onClick={() => slot.pending && decide(slot.pending, "reject")}
              >
                {text.rejectSubmit}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={() => setRejecting(true)}
              >
                {text.reject}
              </Button>
              <Button
                type="button"
                size="sm"
                loading={pending}
                onClick={() => slot.pending && decide(slot.pending, "accept")}
              >
                {text.accept}
              </Button>
            </>
          )}
        </div>
      )}
    </section>
  );
}

/** État du code personnel, et son effacement en deux temps. */
function PinReset({
  profileId,
  fullName,
  review,
  isSelf,
  onReset,
}: {
  profileId: string;
  fullName: string;
  review: UserSigningReview;
  isSelf: boolean;
  onReset: () => void;
}) {
  const t = useMessages();
  const text = t.admin.signing.pin;
  const locale = useLocale();
  const { pinSet, pinLockedUntil } = review.setup;
  const [confirming, setConfirming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const reset = () => {
    setError(null);
    startTransition(async () => {
      const result = await resetUserSigningPin(profileId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(text.resetDone);
      setConfirming(false);
      onReset();
    });
  };

  return (
    <section className="flex flex-col gap-2 rounded-lg border border-border-subtle px-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-xs">
          <KeyRound className="size-3.5 text-tertiary" aria-hidden />
          <span className="font-semibold">{text.title}</span>
          <span className="text-secondary">
            {pinLockedUntil
              ? text.locked(formatTime(pinLockedUntil, locale))
              : pinSet
                ? text.set
                : text.notSet}
          </span>
        </p>
        {pinSet && !isSelf && !confirming && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setConfirming(true)}
          >
            {text.reset}
          </Button>
        )}
      </div>
      {confirming && (
        <div className="flex flex-col gap-2 rounded-md bg-urgent-muted px-3 py-2.5">
          <p className="text-xs leading-relaxed">
            {text.resetConfirm(fullName)}
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => setConfirming(false)}
            >
              {t.common.actions.cancel}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="danger"
              loading={pending}
              onClick={reset}
            >
              {text.resetSubmit}
            </Button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="text-xs text-urgent">
          {error}
        </p>
      )}
    </section>
  );
}
