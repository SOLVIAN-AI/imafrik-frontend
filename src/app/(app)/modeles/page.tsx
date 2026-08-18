import { FileStack, Lock, Plus } from "lucide-react";
import type { Metadata } from "next";

import { ReportDocument } from "@/components/editor/report-document";
import { PageHeader, Panel } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { listTemplates } from "@/lib/data/templates";

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
 */
export default async function TemplatesPage() {
  const templates = await listTemplates();

  return (
    <>
      <PageHeader
        title="Modèles"
        description="Squelettes de comptes-rendus, à corriger là où l’examen s’écarte de la normale"
        actions={
          <Button size="sm">
            <Plus />
            Nouveau modèle
          </Button>
        }
      />

      <div className="min-h-0 flex-1 overflow-auto px-6 pb-6">
        {templates.length === 0 ? (
          <Panel className="flex flex-col items-center justify-center gap-2 py-20">
            <FileStack className="size-5 text-tertiary" aria-hidden />
            <p className="text-sm font-medium">Aucun modèle</p>
            <p className="text-xs text-tertiary">
              Créez-en un depuis un compte-rendu que vous venez de signer.
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
                      {template.modality}
                      {template.bodyPart && ` · ${template.bodyPart}`}
                    </p>
                  </div>

                  {template.shared && (
                    <span className="flex items-center gap-1.5 rounded-full bg-surface-active px-2 py-0.5 text-2xs text-tertiary">
                      <Lock className="size-3" aria-hidden />
                      Fourni par IMAFRIK
                    </span>
                  )}

                  <Button variant="secondary" size="sm">
                    Utiliser
                  </Button>
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
