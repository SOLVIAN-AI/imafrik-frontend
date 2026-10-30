"use client";

import { AlertTriangle, ClipboardCheck, PenTool } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { reviewReport } from "@/components/editor/review";
import { ReviewList } from "@/components/editor/review-list";
import { AiReviewPanel } from "@/components/editor/ai-review-panel";
import {
  NO_AI_REVIEW,
  type AiReviewController,
} from "@/components/editor/use-ai-review";
import {
  DEFAULT_LAYOUT,
  missingRequiredSections,
  type ReportLayout,
  type ReportSections,
} from "@/components/editor/sections";
import {
  type GestureFailure,
  PinEntry,
  type PinStatus,
  usePinGesture,
} from "@/components/signing/pin-entry";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { messagesFor } from "@/i18n";
import { useMessages } from "@/i18n/client";
import type { AppMessages } from "@/i18n";
import type { Locale } from "@/lib/i18n/locale";
import type { PinProof } from "@/lib/signing";
import { cn } from "@/lib/utils";

/**
 * Échec d'une signature rendu par le service, avec ses précisions : la
 * fenêtre en tire le geste suivant (ressaisir le code, le créer, attendre
 * la fin du verrou) sans lire le message.
 */
export class SignFailure extends Error {
  constructor(readonly failure: GestureFailure) {
    super(failure.error);
    this.name = "SignFailure";
  }
}

/** Code personnel et images apposées, pour un vrai compte-rendu. */
export interface SignPinOptions {
  /** État du code à l'ouverture de l'écran ; `null` s'il n'a pu être lu. */
  status: PinStatus | null;
  /** Images acceptées qui s'imprimeront, en URI `data:`. */
  applied: { signature?: string; stamp?: string } | null;
}

/**
 * Confirmation de signature d'un compte-rendu.
 *
 * **Pourquoi une modale ici, alors qu'on en met rarement.** La signature
 * est le seul geste irréversible du parcours : une fois signé, le
 * compte-rendu est verrouillé en base — un déclencheur PostgreSQL refuse
 * toute modification ultérieure — et il part vers la clinique. Le
 * corriger demandera un addendum, visible de tous. Cela mérite un temps
 * d'arrêt.
 *
 * La modale fait quatre choses, dans cet ordre : elle rappelle **sur
 * qui** porte le compte-rendu, elle énonce **ce qui va se passer**, elle
 * **bloque** si une section obligatoire est vide, et elle **signale** ce
 * que la relecture automatique a relevé — latéralité, champ de modèle
 * oublié, mesure sans unité. Le blocage est expliqué, jamais muet : un
 * bouton grisé sans motif est une impasse. Les signalements, eux, ne
 * bloquent pas : le radiologue reste juge de son texte.
 *
 * @param sections     Contenu courant, contrôlé avant signature.
 * @param layout       Mise en page : en feuille blanche, le texte libre et
 *                     la conclusion sont obligatoires.
 * @param patientLabel Patient concerné, pour éviter de signer le mauvais
 *                     examen après avoir enchaîné plusieurs lectures.
 * @param signerName   Nom sous lequel la signature sera enregistrée.
 * @param language     Langue du compte-rendu : les sections y sont
 *                     nommées comme dans l'éditeur.
 * @param onConfirm    Déclenche la signature, avec le code personnel s'il
 *                     est demandé. Doit rejeter en cas d'échec, par une
 *                     {@link SignFailure} quand le service a répondu.
 * @param pin          Code personnel et images apposées : présent pour un
 *                     vrai compte-rendu, absent pour un exercice.
 */
/** Textes de la fenêtre de signature. */
export type SignDialogLabels = AppMessages["reading"]["sign"];

export function SignReportDialog({
  open,
  onOpenChange,
  sections,
  layout = DEFAULT_LAYOUT,
  patientLabel,
  signerName,
  language,
  onConfirm,
  aiReview = NO_AI_REVIEW,
  labels: overrides,
  pin,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: ReportSections;
  layout?: ReportLayout;
  patientLabel: string;
  signerName: string;
  language: Locale;
  onConfirm: (proof?: PinProof) => Promise<void>;
  /** Relecture par IA, lancée à l'ouverture ; elle ne bloque jamais. */
  aiReview?: AiReviewController;
  /**
   * Textes propres à un autre usage que la signature d'un vrai
   * compte-rendu : un exercice de formation n'est transmis à personne.
   */
  labels?: SignDialogLabels;
  pin?: SignPinOptions;
}) {
  const t = useMessages();
  const labels = overrides ?? t.reading.sign;
  const gesture = usePinGesture(pin?.status ?? null);
  const sectionTitles = messagesFor(language).reading.sections.titles;
  const [signing, setSigning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const missing = missingRequiredSections(sections, layout);
  const findings = React.useMemo(
    () => reviewReport(sections, layout),
    [sections, layout],
  );

  const changeOpen = (next: boolean) => {
    // Le code ne survit pas à la fenêtre.
    if (!next) {
      gesture.clear();
      setError(null);
    }
    onOpenChange(next);
  };

  const confirm = async () => {
    setSigning(true);
    setError(null);
    try {
      await onConfirm(pin ? gesture.proof() : undefined);
      gesture.succeed();
      changeOpen(false);
    } catch (failure) {
      // Refus portant sur le code : la fenêtre reste ouverte, le champ dit
      // quoi faire (ressaisir, créer, attendre).
      if (
        pin &&
        failure instanceof SignFailure &&
        (await gesture.fail(failure.failure))
      ) {
        return;
      }
      // Le message vient du service ou de l'écran de lecture, écrit pour
      // l'utilisateur : il dit *pourquoi* — texte modifié ailleurs,
      // connexion coupée, examen repris — et donc quoi faire.
      setError(
        failure instanceof Error && failure.message
          ? `${failure.message} ${labels.stillDraft}`
          : labels.failed,
      );
    } finally {
      setSigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent aria-describedby="sign-consequences">
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription id="sign-consequences">
            {labels.description.before}{" "}
            <strong className="text-primary">{patientLabel}</strong>{" "}
            {labels.description.middle(signerName)}{" "}
            <strong className="text-primary">
              {labels.description.locked}
            </strong>
            {labels.description.after}
          </DialogDescription>
        </DialogHeader>

        {missing.length > 0 && (
          <Notice icon={AlertTriangle}>
            <p className="font-medium">{labels.missing(missing.length)}</p>
            <p className="mt-0.5 text-tertiary">
              {missing.map((key) => sectionTitles[key]).join(" · ")}
            </p>
          </Notice>
        )}

        {missing.length === 0 && findings.length > 0 && (
          <Notice icon={ClipboardCheck} tone="warning">
            <p className="font-medium">{labels.review(findings.length)}</p>
            <ReviewList
              findings={findings}
              sectionTitles={sectionTitles}
              className="-mx-2.5 mt-1 max-h-48 overflow-auto"
            />
            <p className="mt-1 text-tertiary">{labels.signAnyway}</p>
          </Notice>
        )}

        {missing.length === 0 && (
          <AiReviewPanel
            review={aiReview}
            sectionTitles={sectionTitles}
            layout={layout}
            className="max-h-56 overflow-auto rounded-lg border border-border-subtle px-3 py-2.5"
          />
        )}

        {pin && missing.length === 0 && (
          <div className="mx-5 mb-4 flex flex-col gap-3">
            <AppliedAssets applied={pin.applied} />
            <PinEntry gesture={gesture} idPrefix="sign" autoFocus />
          </div>
        )}

        {error && (
          <Notice icon={AlertTriangle}>
            <p>{error}</p>
          </Notice>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" size="sm" disabled={signing}>
              {labels.keepWriting}
            </Button>
          </DialogClose>
          <Button
            size="sm"
            loading={signing}
            disabled={
              missing.length > 0 || (pin !== undefined && !gesture.ready)
            }
            onClick={confirm}
          >
            <PenTool />
            {findings.length + aiReview.findings.length > 0 &&
            missing.length === 0
              ? labels.confirmAnyway
              : labels.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Signature et cachet qui s'imprimeront : le radiologue voit ce qu'il
 * appose avant de saisir son code. Sans image acceptée, la fenêtre le dit
 * et mène aux paramètres.
 */
function AppliedAssets({ applied }: { applied: SignPinOptions["applied"] }) {
  const text = useMessages().reading.signPin;
  if (applied === null) return null;
  const images = [
    applied.signature && { src: applied.signature, alt: text.signatureAlt },
    applied.stamp && { src: applied.stamp, alt: text.stampAlt },
  ].filter((image): image is { src: string; alt: string } => !!image);
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-2xs font-medium text-secondary">{text.applied}</p>
      {images.length > 0 ? (
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border-subtle bg-white px-3 py-2">
          {images.map((image) => (
            // eslint-disable-next-line @next/next/no-img-element -- donnée embarquée, sans optimisation possible
            <img
              key={image.alt}
              src={image.src}
              alt={image.alt}
              className="h-12 w-auto max-w-40 object-contain"
            />
          ))}
        </div>
      ) : (
        <p className="text-2xs leading-relaxed text-tertiary">
          {text.appliedNone}{" "}
          <Link
            href="/parametres#signature"
            className="text-accent hover:underline"
          >
            {text.settings}
          </Link>
        </p>
      )}
    </div>
  );
}

/**
 * Encart d'avertissement dans une modale.
 *
 * Local à ce fichier tant qu'il n'a qu'un usage : l'extraire dans `ui/`
 * avant qu'un deuxième écran en ait besoin reviendrait à figer une forme
 * sur un seul exemple.
 */
function Notice({
  icon: Icon,
  tone = "urgent",
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  /** `urgent` bloque ou signale un échec ; `warning` invite à vérifier. */
  tone?: "urgent" | "warning";
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "mx-5 mb-4 flex gap-2.5 rounded-lg px-3 py-2.5 text-xs",
        tone === "urgent" ? "bg-urgent-muted" : "bg-progress-muted",
      )}
      role={tone === "urgent" ? "alert" : "status"}
    >
      <Icon
        className={cn(
          "mt-px size-3.5 shrink-0",
          tone === "urgent" ? "text-urgent" : "text-progress",
        )}
      />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
