"use client";

import { Check, Copy } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Paramètres d'envoi DICOM d'un établissement.
 *
 * Ce sont les quatre valeurs à recopier dans la console du PACS de la
 * clinique pour qu'il puisse pousser ses examens vers la plateforme.
 * `calledAet` est l'AET de la plateforme ; `callingAet` celui attribué à
 * l'établissement, qui sert à l'identifier — c'est lui qui décide de
 * l'organisation à laquelle un examen entrant sera rattaché.
 */
export interface DicomSettings {
  callingAet: string;
  calledAet: string;
  host: string;
  port: number;
}

/**
 * Un paramètre, avec son bouton de copie.
 *
 * La copie n'est pas un confort : ces valeurs sont dictées au téléphone à
 * un technicien, et une lettre de travers dans un AET produit un rejet
 * silencieux côté PACS, sans message d'erreur exploitable. Le presse-
 * papiers supprime la faute de frappe.
 */
function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = React.useState(false);

  // Le retour visuel s'efface tout seul : sans cela, le bouton reste
  // marqué « copié » alors que le presse-papiers a pu changer depuis.
  React.useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1_600);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <span className="w-36 shrink-0 text-xs text-tertiary">{label}</span>
      <code className="min-w-0 flex-1 truncate font-mono text-xs text-primary">
        {value}
      </code>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard.writeText(value);
          setCopied(true);
        }}
        aria-label={`Copier ${label}`}
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-md",
          "text-tertiary transition-colors hover:bg-surface-hover hover:text-primary",
        )}
      >
        {copied ? (
          <Check className="size-3.5 text-done" aria-hidden />
        ) : (
          <Copy className="size-3.5" aria-hidden />
        )}
      </button>
      <span aria-live="polite" className="sr-only">
        {copied ? `${label} copié` : ""}
      </span>
    </div>
  );
}

/**
 * Bloc des paramètres d'envoi automatique.
 *
 * Présent à deux endroits — l'écran d'envoi et les paramètres de
 * l'établissement — parce qu'on le cherche dans les deux, à deux moments
 * différents : à la mise en service, puis le jour où le technicien
 * reconfigure le PACS.
 */
export function DicomSettingsCard({ settings }: { settings: DicomSettings }) {
  return (
    <dl className="divide-y divide-border-subtle">
      <CopyField label="AET de destination" value={settings.calledAet} />
      <CopyField label="AET de l'établissement" value={settings.callingAet} />
      <CopyField label="Adresse" value={settings.host} />
      <CopyField label="Port" value={String(settings.port)} />
    </dl>
  );
}
