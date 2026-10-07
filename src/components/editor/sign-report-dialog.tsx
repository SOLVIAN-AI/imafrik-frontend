"use client";

import { AlertTriangle, ClipboardCheck, PenTool } from "lucide-react";
import * as React from "react";

import { reviewReport } from "@/components/editor/review";
import { ReviewList } from "@/components/editor/review-list";
import {
  missingRequiredSections,
  type ReportSections,
} from "@/components/editor/sections";
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
import type { Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

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
 * @param patientLabel Patient concerné, pour éviter de signer le mauvais
 *                     examen après avoir enchaîné plusieurs lectures.
 * @param signerName   Nom sous lequel la signature sera enregistrée.
 * @param language     Langue du compte-rendu : les sections y sont
 *                     nommées comme dans l'éditeur.
 * @param onConfirm    Déclenche la signature. Doit rejeter en cas d'échec.
 */
export function SignReportDialog({
  open,
  onOpenChange,
  sections,
  patientLabel,
  signerName,
  language,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: ReportSections;
  patientLabel: string;
  signerName: string;
  language: Locale;
  onConfirm: () => Promise<void>;
}) {
  const t = useMessages();
  const labels = t.reading.sign;
  const sectionTitles = messagesFor(language).reading.sections.titles;
  const [signing, setSigning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const missing = missingRequiredSections(sections);
  const findings = React.useMemo(() => reviewReport(sections), [sections]);

  const confirm = async () => {
    setSigning(true);
    setError(null);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (failure) {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            disabled={missing.length > 0}
            onClick={confirm}
          >
            <PenTool />
            {findings.length > 0 && missing.length === 0
              ? labels.confirmAnyway
              : labels.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
