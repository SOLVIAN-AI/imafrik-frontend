import { FileStack, Lock } from "lucide-react";
import type { Metadata } from "next";

import { DeleteTemplateButton } from "@/components/domain/delete-template-button";
import { ReportDocument } from "@/components/editor/report-document";
import { PageHeader, Panel } from "@/components/layout/app-shell";
import { listTemplates } from "@/lib/data/templates";
import { requireSession } from "@/lib/session/server";

export const metadata: Metadata = { title: "Modèles" };

/**
 * Modèles de comptes-rendus.
 *
 * **Ce sont eux qui font le gain de temps réel.** L'essentiel du volume
 * d'un service est constitué d'examens sans anomalie : disposer d'un
 * texte normal complet, à corriger là où l'examen s'en écarte, épargne
 * la rédaction répétée des mêmes phrases.
 *
 * Le contenu est montré **en entier**, pas résumé. Un modèle qu'on ne
 * peut pas relire avant de l'appliquer ne sera pas utilisé : personne ne
 * signe un texte qu'il n'a pas vu.
 *
 * Les modèles s'appliquent et se créent là où se trouve le texte : dans
 * l'écran de lecture (« Modèle », « Enregistrer comme modèle »). Cette
 * page sert à les relire, et à supprimer ceux de l'organisation.
 */
export default async function TemplatesPage() {
  await requireSession(["radiologist"]);
  const templates = await listTemplates();

  return (
    <>
      <PageHeader
        title="Modèles"
        description="À appliquer depuis l’écran de lecture ; à créer depuis un compte-rendu en cours"
      />

      <div className="min-h-0 flex-1 overflow-auto px-6 pb-6">
        {templates.length === 0 ? (
          <Panel className="flex flex-col items-center justify-center gap-2 py-20">
            <FileStack className="size-5 text-tertiary" aria-hidden />
            <p className="text-sm font-medium">Aucun modèle</p>
            <p className="text-xs text-tertiary">
              Dans l’écran de lecture, « Enregistrer comme modèle » transforme
              le texte en cours en modèle pour toute l’organisation.
            </p>
          </Panel>
        ) : (
          <div className="flex flex-col gap-4">
            {templates.map((template) => (
              <Panel key={template.id} className="overflow-hidden">
                <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-sm font-medium">
                      {template.name}
                    </h2>
                    <p className="mt-0.5 text-2xs text-tertiary">
                      {template.modality ?? "Toutes modalités"}
                      {template.bodyPart && ` · ${template.bodyPart}`}
                    </p>
                  </div>

                  {template.shared ? (
                    <span className="flex items-center gap-1.5 rounded-full bg-surface-active px-2 py-0.5 text-2xs text-tertiary">
                      <Lock className="size-3" aria-hidden />
                      Fourni par IMAFRIK
                    </span>
                  ) : (
                    <DeleteTemplateButton
                      templateId={template.id}
                      name={template.name}
                    />
                  )}
                </div>

                {/* Le modèle est rendu par le même composant que les
                    comptes-rendus signés : il doit se juger dans la forme
                    exacte qu'il aura une fois appliqué. */}
                <div className="p-4">
                  <ReportDocument sections={template.sections} />
                </div>
              </Panel>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
