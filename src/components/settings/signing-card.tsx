"use client";

import {
  Clock3,
  ImageUp,
  KeyRound,
  LockKeyhole,
  PenLine,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Panel } from "@/components/layout/app-shell";
import {
  SignaturePad,
  exportSignature,
  type Stroke,
} from "@/components/settings/signature-pad";
import { SigningPinDialog } from "@/components/settings/signing-pin-dialog";
import { PinEntry, usePinGesture } from "@/components/signing/pin-entry";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocale, useMessages } from "@/i18n/client";
import { uploadSigningAsset } from "@/lib/actions/signing";
import type { SigningSetup, SigningSlot } from "@/lib/data/signing";
import { formatTime } from "@/lib/format";
import {
  drawingProblem,
  SIGNING_ASSET_KINDS,
  SIGNING_IMAGE_MAX_BYTES,
  SIGNING_IMAGE_TYPES,
  type SigningAssetKind,
} from "@/lib/signing";
import { cn } from "@/lib/utils";

/**
 * Lit un fichier et en rend le contenu en base64, sans l'en-tête `data:`.
 *
 * @param file Fichier choisi.
 */
function readBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("lecture"));
    reader.onload = () => {
      const value = typeof reader.result === "string" ? reader.result : "";
      resolve(value.slice(value.indexOf(",") + 1));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Signature, cachet et code personnel, dans les paramètres du radiologue.
 *
 * - **Code personnel** : obligatoire pour signer. Il se crée ici ou dans
 *   la fenêtre de la prochaine signature, se change en présentant
 *   l'actuel ; oublié, l'équipe IMAFRIK l'efface, sans jamais le choisir.
 * - **Signature** (tracée ou importée) et **cachet** (importé),
 *   facultatifs : l'image acceptée s'imprime ; une image nouvelle attend
 *   la vérification de l'équipe IMAFRIK, et l'ancienne reste imprimée
 *   jusque-là ; une image refusée affiche son motif.
 *
 * Ancre `#signature` : la fenêtre de signature y mène.
 *
 * @param setup    État lu par le service.
 * @param previews Aperçus des images, en URI `data:`, par identifiant.
 */
export function SigningCard({
  setup,
  previews,
}: {
  setup: SigningSetup;
  previews: Record<string, string>;
}) {
  const t = useMessages().settings.signing;
  const [submission, setSubmission] = React.useState<Submission | null>(null);

  return (
    <Panel className="overflow-hidden">
      <section
        id="signature"
        aria-labelledby="signature-title"
        className="scroll-mt-4"
      >
        <div className="border-b border-border-subtle px-4 py-3">
          <h2 id="signature-title" className="text-sm font-semibold">
            {t.title}
          </h2>
          <p className="mt-0.5 text-xs text-tertiary">{t.description}</p>
        </div>

        <div className="flex flex-col divide-y divide-border-subtle">
          <PinRow setup={setup} />
          {SIGNING_ASSET_KINDS.map((kind) => (
            <AssetRow
              key={kind}
              kind={kind}
              slot={setup[kind]}
              previews={previews}
              onSubmit={setSubmission}
            />
          ))}
        </div>
      </section>

      <AssetDialog
        submission={submission}
        pinSet={setup.pinSet}
        lockedUntil={setup.pinLockedUntil}
        onClose={() => setSubmission(null)}
      />
    </Panel>
  );
}

/** État du code personnel, et le geste qui le crée ou le change. */
function PinRow({ setup }: { setup: SigningSetup }) {
  const t = useMessages().settings.signing.pin;
  const locale = useLocale();
  const locked = setup.pinLockedUntil;
  const Icon = locked ? LockKeyhole : setup.pinSet ? ShieldCheck : KeyRound;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-4">
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
          locked
            ? "bg-urgent-muted text-urgent ring-urgent/20"
            : setup.pinSet
              ? "bg-done-muted text-done ring-done/20"
              : "bg-progress-muted text-progress ring-progress/20",
        )}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-[1_1_14rem] text-sm">
        <p className="font-medium">
          {t.title} · {setup.pinSet ? t.set : t.notSet}
        </p>
        <p className="mt-0.5 text-xs text-tertiary">
          {locked
            ? t.lockedDetail(formatTime(locked, locale))
            : setup.pinSet
              ? t.setDetail
              : t.notSetDetail}
        </p>
        {setup.pinSet && (
          <p className="mt-1 text-2xs leading-relaxed text-tertiary">
            {t.forgotten}
          </p>
        )}
      </div>
      {!locked && <SigningPinDialog pinSet={setup.pinSet} />}
    </div>
  );
}

/** Une image à envoyer : tracée, ou choisie dans un fichier. */
type Submission =
  | { kind: "signature"; mode: "draw" }
  | { kind: SigningAssetKind; mode: "import"; file: File };

/** Signature ou cachet : l'image imprimée, celle qui attend, la refusée. */
function AssetRow({
  kind,
  slot,
  previews,
  onSubmit,
}: {
  kind: SigningAssetKind;
  slot: SigningSlot;
  previews: Record<string, string>;
  onSubmit: (submission: Submission) => void;
}) {
  const t = useMessages().settings.signing;
  const input = React.useRef<HTMLInputElement>(null);
  const accepted = slot.accepted;
  const acceptedSrc = accepted ? previews[accepted.id] : undefined;
  const pendingSrc = slot.pending ? previews[slot.pending.id] : undefined;

  const choose = (file: File) => {
    if (!(SIGNING_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      toast.error(t.errors.badType);
      return;
    }
    if (file.size > SIGNING_IMAGE_MAX_BYTES) {
      toast.error(t.errors.tooLarge);
      return;
    }
    onSubmit({ kind, mode: "import", file });
  };

  return (
    <div className="flex flex-col gap-3 px-4 py-4" data-signing-asset={kind}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-xs font-semibold">{t.kinds[kind]}</h3>
        <span className="text-2xs text-tertiary">{t.optional}</span>
      </div>

      {accepted ? (
        <figure className="flex flex-col gap-1.5">
          {/* Fond blanc : c'est ainsi que l'image se lira sur le papier. */}
          <div className="flex h-24 items-center justify-center rounded-lg border border-border-subtle bg-white p-2">
            {acceptedSrc && (
              // eslint-disable-next-line @next/next/no-img-element -- donnée embarquée, sans optimisation possible
              <img
                src={acceptedSrc}
                alt={t.previewAlt[kind]}
                className="max-h-full w-auto max-w-full object-contain"
              />
            )}
          </div>
          <figcaption className="text-2xs text-tertiary">
            {t.inUse[kind]}
            {accepted.source === "legacy" && ` · ${t.legacy}`}
          </figcaption>
        </figure>
      ) : (
        <p className="text-xs text-secondary">
          {t.none[kind]} <span className="text-tertiary">{t.noneDetail}</span>
        </p>
      )}

      {slot.pending && (
        <div
          role="status"
          className="flex gap-3 rounded-lg bg-progress-muted px-3 py-2.5"
        >
          <Clock3 className="mt-px size-3.5 shrink-0 text-progress" />
          <div className="min-w-0 flex-1 text-xs">
            <p className="font-medium">{t.pending}</p>
            <p className="mt-0.5 text-tertiary">
              {t.pendingDetail(accepted !== null)}
            </p>
          </div>
          {pendingSrc && (
            // eslint-disable-next-line @next/next/no-img-element -- donnée embarquée, sans optimisation possible
            <img
              src={pendingSrc}
              alt={t.pendingAlt[kind]}
              className="h-10 w-auto max-w-28 shrink-0 rounded bg-white object-contain p-0.5"
            />
          )}
        </div>
      )}

      {slot.rejected && !slot.pending && (
        <div className="flex gap-2.5 rounded-lg bg-urgent-muted px-3 py-2.5 text-xs">
          <XCircle className="mt-px size-3.5 shrink-0 text-urgent" />
          <div className="min-w-0">
            <p className="font-medium">{t.rejected}</p>
            {slot.rejected.rejectionReason && (
              <p className="mt-0.5 break-words text-secondary">
                {t.rejectedReason(slot.rejected.rejectionReason)}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={input}
          type="file"
          accept={SIGNING_IMAGE_TYPES.join(",")}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          data-testid={`signing-file-${kind}`}
          onChange={(event) => {
            const file = event.target.files?.[0];
            // Le même fichier doit pouvoir être choisi deux fois de suite.
            event.target.value = "";
            if (file) choose(file);
          }}
        />
        {kind === "signature" && (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => onSubmit({ kind: "signature", mode: "draw" })}
          >
            <PenLine aria-hidden />
            {t.draw}
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => input.current?.click()}
        >
          <ImageUp aria-hidden />
          {t.import}
        </Button>
      </div>
      <p className="text-2xs leading-relaxed text-tertiary">
        {t.formats}
        {kind === "stamp" && ` ${t.stampHint}`}
        {kind === "signature" && ` ${t.pad.alternative}`}
      </p>
    </div>
  );
}

/**
 * Envoi d'une image à la vérification : le tracé, ou l'aperçu du fichier
 * choisi, puis le code personnel s'il est défini.
 */
function AssetDialog({
  submission,
  pinSet,
  lockedUntil,
  onClose,
}: {
  submission: Submission | null;
  pinSet: boolean;
  lockedUntil: Date | null;
  onClose: () => void;
}) {
  const t = useMessages();
  const text = t.settings.signing;
  const router = useRouter();
  const [strokes, setStrokes] = React.useState<Stroke[]>([]);
  const [width, setWidth] = React.useState(0);
  const [askPin, setAskPin] = React.useState(pinSet);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const gesture = usePinGesture({ pinSet: true, lockedUntil });

  const file = submission?.mode === "import" ? submission.file : null;
  // Aperçu du fichier choisi, libéré dès qu'un autre le remplace.
  const preview = React.useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );
  React.useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const close = () => {
    if (pending) return;
    setStrokes([]);
    setError(null);
    gesture.clear();
    onClose();
  };

  const drawing = submission?.mode === "draw" ? drawingProblem(strokes) : null;
  const ready =
    submission !== null &&
    (submission.mode === "import" || drawing === null) &&
    (!askPin || gesture.ready);

  const send = () => {
    if (!submission) return;
    setError(null);
    startTransition(async () => {
      let content: string;
      try {
        content =
          submission.mode === "draw"
            ? exportSignature(strokes, width)
            : await readBase64(submission.file);
      } catch {
        setError(text.errors.unreadable);
        return;
      }
      const result = await uploadSigningAsset(
        submission.kind,
        content,
        submission.mode === "draw" ? "drawn" : "uploaded",
        askPin ? gesture.pin : undefined,
      );
      if (!result.ok) {
        // Code défini depuis un autre onglet : il est désormais demandé.
        if (result.reason?.code === "pin_required") setAskPin(true);
        if (!(await gesture.fail(result))) setError(result.error);
        return;
      }
      toast.success(text.sent[submission.kind]);
      setStrokes([]);
      gesture.clear();
      onClose();
      router.refresh();
    });
  };

  const title = !submission
    ? ""
    : submission.mode === "draw"
      ? text.submit.drawTitle
      : text.submit.importTitle[submission.kind];

  return (
    <Dialog
      open={submission !== null}
      onOpenChange={(next) => !next && close()}
    >
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{text.submit.description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 px-5 pb-5">
          {submission?.mode === "draw" && (
            <div className="flex flex-col gap-1.5">
              <SignaturePad
                strokes={strokes}
                onChange={(next) => {
                  setStrokes(next);
                  setError(null);
                }}
                onWidth={setWidth}
                describedBy={
                  drawing && strokes.length > 0 ? "pad-problem" : undefined
                }
              />
              {drawing && strokes.length > 0 && (
                <p
                  id="pad-problem"
                  role="status"
                  className="text-2xs text-progress"
                >
                  {text.pad.problems[drawing]}
                </p>
              )}
            </div>
          )}
          {submission?.mode === "import" && preview && (
            <figure className="flex flex-col gap-1.5">
              <div className="flex h-36 items-center justify-center rounded-lg border border-border-subtle bg-white p-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- fichier local, avant l'envoi */}
                <img
                  src={preview}
                  alt={text.submit.preview}
                  className="max-h-full w-auto max-w-full object-contain"
                />
              </div>
              <figcaption className="truncate text-2xs text-tertiary">
                {submission.file.name}
              </figcaption>
            </figure>
          )}
          {askPin && (
            <PinEntry gesture={gesture} idPrefix="asset" disabled={pending} />
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
            onClick={close}
          >
            {t.common.actions.cancel}
          </Button>
          <Button
            type="button"
            size="sm"
            loading={pending}
            disabled={!ready}
            onClick={send}
          >
            {text.submit.send}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
