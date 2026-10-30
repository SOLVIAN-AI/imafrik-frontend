import { FileStack } from "lucide-react";
import type { Metadata } from "next";

import { TemplatesBrowser } from "@/components/domain/templates-browser";
import { FilterBar } from "@/components/filters/filter-bar";
import { FilteredEmpty } from "@/components/filters/filtered-empty";
import { PageHeader, Panel } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { listTemplates, type ReportTemplate } from "@/lib/data/templates";
import { type BarDimension, TEMPLATE_ORIGINS } from "@/lib/filters/dimensions";
import { countOptions, filterRows, type RowValues } from "@/lib/filters/facets";
import { LIST_FILTERS } from "@/lib/filters/screens";
import { readFilters } from "@/lib/filters/url";
import { MODALITY_GROUPS, modalityGroupOf } from "@/lib/modalities";
import { requireSession } from "@/lib/session/server";
import { getMessages } from "@/i18n/server";

/** Titre de l'onglet, dans la langue de l'utilisateur. */
export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.nav.items.templates };
}

/**
 * Valeurs d'un modèle : son origine, et le groupe de sa modalité. Un
 * modèle sans modalité n'entre dans aucun groupe.
 */
const TEMPLATE_VALUES: RowValues<ReportTemplate> = {
  origin: (template) => [template.shared ? "imafrik" : "organization"],
  modality: (template) =>
    template.modality ? [modalityGroupOf(template.modality)] : [],
};

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
 *
 * La barre commune filtre par origine et par groupe de modalités, dans
 * l'adresse ; seuls les groupes des modèles présents sont proposés :
 * « Mammographie » ne servirait à rien sans aucun modèle de
 * mammographie. La recherche par nom reste dans la bibliothèque.
 */
export default async function TemplatesPage({
  searchParams,
}: PageProps<"/modeles">) {
  const session = await requireSession(["radiologist", "platform_admin"]);
  const [{ t }, templates, params] = await Promise.all([
    getMessages(),
    listTemplates(),
    searchParams,
  ]);
  const labels = t.reading.templates;
  const filters = readFilters(params, LIST_FILTERS.modeles);
  const shown = filterRows(templates, TEMPLATE_VALUES, filters);
  const groups = new Set(
    templates.flatMap((template) => TEMPLATE_VALUES.modality!(template)),
  );
  const bar: BarDimension[] = [
    {
      key: "origin",
      ...countOptions(
        templates,
        TEMPLATE_VALUES,
        filters,
        "origin",
        TEMPLATE_ORIGINS.map((value) => ({ value })),
      ),
    },
    {
      key: "modality",
      ...countOptions(
        templates,
        TEMPLATE_VALUES,
        filters,
        "modality",
        MODALITY_GROUPS.filter((group) => groups.has(group)).map((value) => ({
          value,
        })),
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t.nav.items.templates}
        description={labels.description}
      />

      {templates.length > 0 && (
        <FilterBar
          dimensions={bar}
          active={filters}
          result={{ count: shown.length, noun: "templates" }}
          className="shrink-0 px-4 pb-3 sm:px-6"
        />
      )}

      {templates.length === 0 ? (
        <div className="px-4 pb-6 sm:px-6">
          <Panel>
            <EmptyState
              icon={FileStack}
              title={labels.emptyTitle}
              detail={labels.emptyDetail}
            />
          </Panel>
        </div>
      ) : shown.length === 0 ? (
        <div className="px-4 pb-6 sm:px-6">
          <Panel>
            <FilteredEmpty dimensions={bar} active={filters} noun="templates" />
          </Panel>
        </div>
      ) : (
        <TemplatesBrowser
          templates={shown}
          // L'administration consulte les modèles de toute la plateforme,
          // sans les supprimer : ils appartiennent aux organisations.
          canDelete={session.active.role === "radiologist"}
        />
      )}
    </>
  );
}
