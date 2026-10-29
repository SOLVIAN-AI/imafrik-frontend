"use client";

import { Building2, Eye, Search } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { useLocale, useMessages } from "@/i18n/client";
import { clinicViewPath } from "@/lib/clinic-view";
import { matchChoices, SEARCH_FROM, sortChoices } from "@/lib/filters/choice";

/**
 * Les cliniques à consulter, par ordre alphabétique de la langue, chacune
 * menant à sa vue. Dès huit cliniques, une recherche les filtre à mesure
 * de la saisie, accents et majuscules ignorés, sur le nom comme sur la
 * ville ; rien ne part dans l'adresse, rien ne part au service.
 *
 * @param clinics Cliniques à consulter.
 */
export function ClinicChooser({
  clinics,
}: {
  clinics: readonly { id: string; name: string; city: string | null }[];
}) {
  const t = useMessages();
  const locale = useLocale();
  const [query, setQuery] = React.useState("");
  const listId = React.useId();
  const searchable = clinics.length >= SEARCH_FROM;
  const sorted = React.useMemo(
    () => sortChoices(clinics, locale),
    [clinics, locale],
  );
  const shown = searchable
    ? matchChoices(
        sorted.map((clinic) => ({
          ...clinic,
          name: `${clinic.name} ${clinic.city ?? ""}`,
          label: clinic.name,
        })),
        query,
      ).map(({ label, ...clinic }) => ({ ...clinic, name: label }))
    : sorted;

  return (
    <>
      {searchable && (
        <label className="relative m-3 flex items-center">
          <span className="sr-only">{t.filters.clinicSearch}</span>
          <Search
            className="pointer-events-none absolute left-2.5 size-3.5 text-tertiary"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-controls={listId}
            autoComplete="off"
            placeholder={t.filters.clinicSearch}
            className="h-9 w-full rounded-lg border border-border-subtle bg-surface-base/60 pr-2.5 pl-8 text-xs placeholder:text-tertiary focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-accent/25 focus-visible:outline-none"
          />
        </label>
      )}
      {searchable && (
        <p className="sr-only" aria-live="polite">
          {query.trim() ? t.filters.clinicMatches(shown.length) : ""}
        </p>
      )}
      {shown.length === 0 ? (
        <p className="px-4 py-3 text-xs text-tertiary">
          {t.filters.clinicNoMatch}
        </p>
      ) : (
        <ul id={listId} className="divide-y divide-border-subtle overflow-auto">
          {shown.map((clinic) => (
            <li key={clinic.id}>
              <Link
                href={clinicViewPath(clinic.id)}
                prefetch={false}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
              >
                <Building2
                  className="size-4 shrink-0 text-tertiary"
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {clinic.name}
                  </span>
                  {clinic.city && (
                    <span className="block truncate text-2xs text-tertiary">
                      {clinic.city}
                    </span>
                  )}
                </span>
                <Eye className="size-4 shrink-0 text-accent" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
