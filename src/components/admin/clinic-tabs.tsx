import Link from "next/link";

import { ClinicSelect } from "@/components/admin/clinic-select";
import { CLINIC_PARAM } from "@/lib/admin-params";
import type { ClinicCounts } from "@/lib/data/studies";
import { formatCount } from "@/lib/format";
import type { Locale } from "@/lib/i18n/locale";
import { pageHref, type SearchParamsRecord } from "@/lib/pagination";
import { cn } from "@/lib/utils";

/** Au-delà, des pastilles ne tiennent plus sur une ligne : une liste. */
const MAX_PILLS = 6;

/**
 * Choix de la clinique dans la liste des examens de l'équipe IMAFRIK.
 *
 * Chaque clinique porte le nombre d'examens que la liste montrerait,
 * compté par le service avec les mêmes filtres (modalité, urgences,
 * recherche) ; une clinique à zéro reste proposée, grisée. Des pastilles
 * tant qu'elles tiennent, une liste au-delà. La clinique voyage dans
 * l'adresse (`?clinique=`) par son identifiant, jamais par une donnée
 * patient ; changer de clinique repart de la première page et garde les
 * autres filtres.
 *
 * @param counts   Comptes par clinique, du service.
 * @param active   Clinique affichée ; `null` pour toutes.
 * @param pathname Adresse de la liste.
 * @param params   Paramètres de l'adresse courante.
 * @param labels   Nom du choix et de l'option « toutes ».
 * @param locale   Langue, pour le format des nombres.
 */
export function ClinicTabs({
  counts,
  active,
  pathname,
  params,
  labels,
  locale,
}: {
  counts: ClinicCounts;
  active: string | null;
  pathname: string;
  params: SearchParamsRecord;
  labels: { label: string; all: string };
  locale: Locale;
}) {
  const others = Object.fromEntries(
    Object.entries(params).filter(([key]) => key !== CLINIC_PARAM),
  );
  const options = [
    { id: null, name: labels.all, count: counts.total },
    ...counts.clinics,
  ];

  if (counts.clinics.length > MAX_PILLS) {
    return (
      <div className="flex shrink-0 px-4 pb-3 sm:px-6">
        <ClinicSelect
          label={labels.label}
          active={active}
          options={options.map((option) => ({
            id: option.id,
            label: `${option.name} (${formatCount(option.count, locale)})`,
          }))}
        />
      </div>
    );
  }

  return (
    <nav
      aria-label={labels.label}
      data-testid="clinic-tabs"
      className="flex shrink-0 gap-1 overflow-x-auto px-4 pb-3 sm:px-6"
    >
      {options.map((option) => {
        const current = option.id === active;
        return (
          <Link
            key={option.id ?? "all"}
            href={pageHref(
              pathname,
              option.id ? { ...others, [CLINIC_PARAM]: option.id } : others,
              null,
            )}
            aria-current={current ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs whitespace-nowrap transition-colors",
              current
                ? "bg-accent-muted font-medium text-accent"
                : option.count === 0
                  ? "text-tertiary hover:bg-surface-hover"
                  : "text-secondary hover:bg-surface-hover hover:text-primary",
            )}
          >
            {option.name}
            <span
              className={cn(
                "rounded px-1 text-2xs tabular-nums",
                current ? "font-semibold" : "bg-surface-hover",
              )}
            >
              {formatCount(option.count, locale)}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
