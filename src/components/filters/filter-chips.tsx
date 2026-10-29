"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { DIMENSION_ICONS } from "@/components/filters/icons";
import { useLocale } from "@/i18n/client";
import type { ChoiceOption } from "@/lib/filters/choice";
import type { DimensionKey } from "@/lib/filters/dimensions";
import { filterHref } from "@/lib/filters/url";
import { formatCount } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Dessin d'une puce de filtre : retenue, vide (grisée) ou non. Le même que
 * celui du bouton de la liste déroulante en barre (`appearance="pill"`).
 */
function chipClass(current: boolean, empty: boolean): string {
  return cn(
    "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs whitespace-nowrap transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    current
      ? "border-accent bg-accent-muted font-medium text-primary"
      : empty
        ? "border-border-subtle text-tertiary hover:border-border-default"
        : "border-border-subtle text-secondary hover:border-border-default hover:text-primary",
  );
}

/**
 * Nombre de lignes d'une option : en chiffres à l'écran, en toutes
 * lettres pour les lecteurs d'écran (« Scanner, 12 examens »).
 */
function OptionCount({
  count,
  current,
  phrase,
}: {
  count: number;
  current: boolean;
  phrase: (count: number) => string;
}) {
  const locale = useLocale();
  return (
    <span
      className={cn(
        "rounded px-1 text-2xs tabular-nums",
        current ? "font-semibold" : "bg-surface-hover",
      )}
    >
      <span aria-hidden>{formatCount(count, locale)}</span>
      <span className="sr-only">, {phrase(count)}</span>
    </span>
  );
}

/**
 * Puces d'une dimension aux valeurs fixes et peu nombreuses (les
 * modalités) : l'option par défaut, puis chaque valeur, avec son nombre de
 * lignes.
 *
 * Des liens, qui fonctionnent avant même le chargement du script ; la
 * puce retenue est l'élément courant du groupe (`aria-current`). Une
 * valeur sans ligne reste affichée, grisée : la rangée ne bouge pas d'un
 * filtre à l'autre. Les puces passent à la ligne, jamais ne défilent.
 *
 * @param dimension   Dimension filtrée.
 * @param label       Nom du groupe (« Modalité »).
 * @param allLabel    Puce qui retire le filtre (« Toutes les modalités »).
 * @param options     Valeurs, dans l'ordre du registre.
 * @param total       Lignes de toutes les valeurs.
 * @param active      Valeur retenue ; `null` pour toutes.
 * @param countPhrase Nombre de lignes en toutes lettres.
 */
export function FilterChips({
  dimension,
  label,
  allLabel,
  options,
  total,
  active,
  countPhrase,
  className,
}: {
  dimension: DimensionKey;
  label: string;
  allLabel: string;
  options: readonly ChoiceOption[];
  total?: number;
  active: string | null;
  countPhrase: (count: number) => string;
  className?: string;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const chips = [{ id: "", name: allLabel, count: total }, ...options];

  return (
    <div
      role="group"
      aria-label={label}
      data-testid={`filter-${dimension}`}
      className={cn("flex min-w-0 flex-wrap items-center gap-1.5", className)}
    >
      {chips.map((chip) => {
        const current = chip.id === (active ?? "");
        return (
          <Link
            key={chip.id || "all"}
            href={filterHref(pathname, params.toString(), {
              [dimension]: chip.id || null,
            })}
            replace
            scroll={false}
            prefetch={false}
            aria-current={current ? "true" : undefined}
            className={chipClass(current, chip.count === 0)}
          >
            {chip.name}
            {chip.count !== undefined && (
              <OptionCount
                count={chip.count}
                current={current}
                phrase={countPhrase}
              />
            )}
          </Link>
        );
      })}
    </div>
  );
}

/**
 * Filtre à une seule valeur (les urgences) : une puce, qu'on active ou
 * retire d'un geste.
 *
 * @param dimension   Dimension filtrée.
 * @param label       Ce que la puce retient (« Urgences en cours »).
 * @param value       Valeur interne retenue.
 * @param active      Vrai si le filtre est actif.
 * @param count       Lignes retenues, si l'écran les compte.
 * @param countPhrase Nombre de lignes en toutes lettres.
 */
export function FilterToggle({
  dimension,
  label,
  value,
  active,
  count,
  countPhrase,
}: {
  dimension: DimensionKey;
  label: string;
  value: string;
  active: boolean;
  count?: number;
  countPhrase: (count: number) => string;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const Icon = DIMENSION_ICONS[dimension];
  return (
    <Link
      href={filterHref(pathname, params.toString(), {
        [dimension]: active ? null : value,
      })}
      replace
      scroll={false}
      prefetch={false}
      aria-current={active ? "true" : undefined}
      data-testid={`filter-${dimension}`}
      className={chipClass(active, count === 0)}
    >
      <Icon
        className={cn(
          "size-3.5 shrink-0",
          active ? "text-accent" : "text-tertiary",
        )}
        aria-hidden
      />
      {label}
      {count !== undefined && (
        <OptionCount count={count} current={active} phrase={countPhrase} />
      )}
    </Link>
  );
}
