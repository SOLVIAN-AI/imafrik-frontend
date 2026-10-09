"use client";

import { FileStack, Lock, Search, SearchX } from "lucide-react";
import * as React from "react";

import { DeleteTemplateButton } from "@/components/domain/delete-template-button";
import { ReportDocument } from "@/components/editor/report-document";
import { Panel } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { useMessages } from "@/i18n/client";
import type { ReportTemplate } from "@/lib/data/templates";
import { cn } from "@/lib/utils";

/** Normalise pour une recherche insensible à la casse et aux accents. */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/**
 * Bibliothèque de modèles : liste filtrable à gauche, modèle entier à
 * droite.
 *
 * **Le modèle se lit en entier avant d'être appliqué** — personne ne
 * signe un texte qu'il n'a pas vu. Les empiler tous en pleine page
 * respectait la règle mais rendait la bibliothèque impraticable dès une
 * dizaine de modèles : il fallait faire défiler des pages de texte pour
 * trouver le bon. La liste donne l'accès, l'aperçu donne la lecture.
 *
 * Le filtre par modalité reprend celles des modèles présents : proposer
 * « Mammographie » à une organisation qui n'en a aucun ne servirait à
 * rien.
 *
 * @param templates Modèles de l'organisation et modèles fournis par IMAFRIK.
 */
export function TemplatesBrowser({
  templates,
}: {
  templates: ReportTemplate[];
}) {
  const labels = useMessages().reading.templates;
  // Nom courant d'une modalité, à défaut son code DICOM.
  const modalityName = (code: string) => labels.modalityNames[code] ?? code;
  const [query, setQuery] = React.useState("");
  const [modality, setModality] = React.useState<string | null>(null);
  const [selectedId, setSelectedId] = React.useState(templates[0]?.id);

  const modalities = React.useMemo(
    () =>
      [
        ...new Set(
          templates.flatMap((template) =>
            template.modality ? [template.modality] : [],
          ),
        ),
      ].sort(),
    [templates],
  );

  const visible = React.useMemo(() => {
    const needle = normalize(query.trim());
    return templates.filter(
      (template) =>
        (!modality || template.modality === modality) &&
        (!needle ||
          normalize(
            `${template.name} ${template.bodyPart ?? ""} ${template.modality ?? ""}`,
          ).includes(needle)),
    );
  }, [templates, query, modality]);

  // La sélection suit le filtre : un modèle masqué ne reste pas affiché
  // à droite d'une liste qui ne le contient plus.
  const selected =
    visible.find((template) => template.id === selectedId) ?? visible[0];

  return (
    <div className="grid min-h-0 flex-1 gap-4 px-4 pb-6 sm:px-6 lg:grid-cols-[minmax(16rem,20rem)_1fr]">
      <Panel className="flex min-h-0 flex-col overflow-hidden lg:max-h-full">
        <div className="flex flex-col gap-2.5 border-b border-border-subtle p-3">
          <label className="relative block">
            <span className="sr-only">{labels.search}</span>
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-tertiary"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={labels.searchPlaceholder}
              className={cn(
                "h-8 w-full rounded-md border border-border-default bg-surface-base pr-2.5 pl-8 text-sm",
                "placeholder:text-tertiary focus-visible:border-accent",
              )}
            />
          </label>
          {modalities.length > 1 && (
            <div
              className="flex flex-wrap gap-1"
              role="group"
              aria-label={labels.modality}
            >
              {[null, ...modalities].map((value) => (
                <button
                  key={value ?? "all"}
                  type="button"
                  aria-pressed={modality === value}
                  onClick={() => setModality(value)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-2xs font-medium transition-colors",
                    modality === value
                      ? "bg-accent-muted text-accent"
                      : "text-tertiary hover:bg-surface-hover hover:text-secondary",
                  )}
                >
                  {value ? modalityName(value) : labels.allModalities}
                </button>
              ))}
            </div>
          )}
        </div>

        {visible.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title={labels.emptyTitle}
            detail={labels.noMatch}
            className="py-10"
          />
        ) : (
          <ul className="min-h-0 flex-1 overflow-auto p-1.5">
            {visible.map((template) => {
              const active = template.id === selected?.id;
              return (
                <li key={template.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(template.id)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
                      active
                        ? "bg-surface-active shadow-edge"
                        : "hover:bg-surface-hover",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-md font-mono text-2xs font-semibold",
                        active
                          ? "bg-accent-muted text-accent"
                          : "bg-surface-sunken text-tertiary",
                      )}
                    >
                      {template.modality ?? "—"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {template.name}
                      </span>
                      <span className="block truncate text-2xs text-tertiary">
                        {template.bodyPart ?? labels.allRegions} ·{" "}
                        {template.shared ? "IMAFRIK" : labels.organisation}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {selected ? (
        <Panel className="flex min-h-0 flex-col overflow-hidden">
          <div className="flex items-center gap-3 border-b border-border-subtle px-5 py-3.5">
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base font-semibold">
                {selected.name}
              </h2>
              <p className="mt-0.5 text-2xs text-tertiary">
                {selected.modality
                  ? modalityName(selected.modality)
                  : labels.anyModality}
                {selected.bodyPart && ` · ${selected.bodyPart}`}
              </p>
            </div>
            {selected.shared ? (
              <span className="flex items-center gap-1.5 rounded-full bg-surface-active px-2.5 py-1 text-2xs text-secondary">
                <Lock className="size-3" aria-hidden />
                {labels.providedByImafrik}
              </span>
            ) : (
              <DeleteTemplateButton
                templateId={selected.id}
                name={selected.name}
              />
            )}
          </div>
          {/* Rendu par le même composant que les comptes-rendus signés :
              un modèle se juge dans la forme exacte qu'il aura une fois
              appliqué. La clé recrée l'éditeur en lecture seule, qui ne
              suit pas un changement de contenu. */}
          <div className="min-h-0 flex-1 overflow-auto p-5">
            <ReportDocument key={selected.id} sections={selected.sections} />
          </div>
        </Panel>
      ) : (
        <Panel>
          <EmptyState icon={FileStack} title={labels.noneSelected} />
        </Panel>
      )}
    </div>
  );
}
