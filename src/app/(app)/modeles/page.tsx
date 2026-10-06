import { FileStack } from "lucide-react";
import type { Metadata } from "next";

import { TemplatesBrowser } from "@/components/domain/templates-browser";
import { PageHeader, Panel } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
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
 * Le contenu est montré **en entier**, pas résumé — voir
 * {@link TemplatesBrowser}. Un modèle qu'on ne peut pas relire avant de
 * l'appliquer ne sera pas utilisé : personne ne signe un texte qu'il n'a
 * pas vu.
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

      {templates.length === 0 ? (
        <div className="px-4 pb-6 sm:px-6">
          <Panel>
            <EmptyState
              icon={FileStack}
              title="Aucun modèle"
              detail="Dans l’écran de lecture, « Enregistrer comme modèle » transforme le texte en cours en modèle pour toute l’organisation."
            />
          </Panel>
        </div>
      ) : (
        <TemplatesBrowser templates={templates} />
      )}
    </>
  );
}
