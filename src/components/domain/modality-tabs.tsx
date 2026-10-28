import Link from "next/link";

import type { AppMessages } from "@/i18n";
import type { ModalityGroup } from "@/lib/api/contracts";
import type { ModalityCounts } from "@/lib/data/studies";
import { formatCount } from "@/lib/format";
import type { Locale } from "@/lib/i18n/locale";
import {
  MODALITY_GROUPS,
  MODALITY_PARAM,
  MODALITY_SLUGS,
} from "@/lib/modalities";
import { pageHref, type SearchParamsRecord } from "@/lib/pagination";
import { cn } from "@/lib/utils";

/**
 * Onglets des groupes de modalités d'une liste d'examens.
 *
 * On travaille modalité par modalité : les scanners, puis les
 * échographies. Ce n'est pas une restriction d'accès, chacun voit ce qu'il
 * voyait. Chaque onglet porte le nombre d'examens que la liste montrerait,
 * compté par le service avec les mêmes filtres (vue, recherche, urgences) ;
 * un onglet vide reste visible, grisé, pour que la rangée ne bouge pas.
 *
 * Le groupe voyage dans l'adresse (`?modalite=scanner`) : un mot court, qui
 * ne dit rien d'un patient. Changer d'onglet repart de la première page et
 * garde les autres filtres.
 *
 * @param counts   Comptes par groupe, du service.
 * @param active   Groupe affiché ; `undefined` pour toutes les modalités.
 * @param pathname Adresse de la liste.
 * @param params   Paramètres de l'adresse courante.
 * @param labels   Textes de la liste et noms des groupes.
 * @param locale   Langue, pour le format des nombres.
 */
export function ModalityTabs({
  counts,
  active,
  pathname,
  params,
  labels,
  locale,
}: {
  counts: ModalityCounts;
  active: ModalityGroup | undefined;
  pathname: string;
  params: SearchParamsRecord;
  labels: AppMessages["assignment"];
  locale: Locale;
}) {
  const others = Object.fromEntries(
    Object.entries(params).filter(([key]) => key !== MODALITY_PARAM),
  );
  const tabs = [
    {
      key: "all",
      label: labels.list.allModalities,
      count: counts.total,
      href: pageHref(pathname, others, null),
      current: active === undefined,
    },
    ...MODALITY_GROUPS.map((group) => ({
      key: group,
      label: labels.modalities[group],
      count: counts.byGroup[group],
      href: pageHref(
        pathname,
        { ...others, [MODALITY_PARAM]: MODALITY_SLUGS[group] },
        null,
      ),
      current: active === group,
    })),
  ];

  return (
    <nav
      aria-label={labels.list.modalityLabel}
      data-testid="modality-tabs"
      className="flex shrink-0 gap-1 overflow-x-auto px-4 pb-3 sm:px-6"
    >
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          aria-current={tab.current ? "page" : undefined}
          title={labels.list.modalityCount(tab.label, tab.count)}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs whitespace-nowrap transition-colors",
            tab.current
              ? "bg-accent-muted font-medium text-accent"
              : tab.count === 0
                ? "text-tertiary hover:bg-surface-hover"
                : "text-secondary hover:bg-surface-hover hover:text-primary",
          )}
        >
          {tab.label}
          <span
            className={cn(
              "rounded px-1 text-2xs tabular-nums",
              tab.current ? "font-semibold" : "bg-surface-hover",
            )}
          >
            {formatCount(tab.count, locale)}
          </span>
        </Link>
      ))}
    </nav>
  );
}
