"use client";

import { AlertTriangle, PenTool } from "lucide-react";
import * as React from "react";

import {
  missingRequiredSections,
  type ReportSections,
} from "@/components/editor/report-editor";
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
 * La modale fait trois choses, dans cet ordre : elle rappelle **sur qui**
 * porte le compte-rendu, elle énonce **ce qui va se passer**, et elle
 * **bloque** si une section obligatoire est vide. Le blocage est expliqué,
 * jamais muet : un bouton grisé sans motif est une impasse.
 *
 * @param sections     Contenu courant, contrôlé avant signature.
 * @param patientLabel Patient concerné, pour éviter de signer le mauvais
 *                     examen après avoir enchaîné plusieurs lectures.
 * @param signerName   Nom sous lequel la signature sera enregistrée.
 * @param onConfirm    Déclenche la signature. Doit rejeter en cas d'échec.
 */
export function SignReportDialog({
  open,
  onOpenChange,
  sections,
  patientLabel,
  signerName,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: ReportSections;
  patientLabel: string;
  signerName: string;
  onConfirm: () => Promise<void>;
}) {
  const [signing, setSigning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const missing = missingRequiredSections(sections);

  const confirm = async () => {
    setSigning(true);
    setError(null);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      setError(
        "La signature n'a pas abouti. Le compte-rendu reste un brouillon ; " +
          "vos modifications sont conservées.",
      );
    } finally {
      setSigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="sign-consequences">
        <DialogHeader>
          <DialogTitle>Signer le compte-rendu</DialogTitle>
          <DialogDescription id="sign-consequences">
            Le compte-rendu de{" "}
            <strong className="text-primary">{patientLabel}</strong> sera signé
            au nom de {signerName}, puis transmis à la clinique. Il deviendra{" "}
            <strong className="text-primary">non modifiable</strong> : toute
            correction ultérieure prendra la forme d’un addendum, visible par la
            clinique.
          </DialogDescription>
        </DialogHeader>

        {missing.length > 0 && (
          <Notice icon={AlertTriangle}>
            <p className="font-medium">
              {missing.length === 1
                ? "Une section obligatoire est vide"
                : `${missing.length} sections obligatoires sont vides`}
            </p>
            <p className="mt-0.5 text-tertiary">{missing.join(" · ")}</p>
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
              Continuer à rédiger
            </Button>
          </DialogClose>
          <Button
            size="sm"
            loading={signing}
            disabled={missing.length > 0}
            onClick={confirm}
          >
            <PenTool />
            Signer et transmettre
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
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div
      className="mx-5 mb-4 flex gap-2.5 rounded-lg bg-urgent-muted px-3 py-2.5 text-xs"
      role="alert"
    >
      <Icon className="mt-px size-3.5 shrink-0 text-urgent" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
