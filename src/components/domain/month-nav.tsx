import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { shiftMonth } from "@/lib/admin-params";
import { formatMonth } from "@/lib/format";
import type { Locale } from "@/lib/i18n/locale";

/**
 * Choix du mois affiché : le mois en toutes lettres, entre deux flèches.
 *
 * Le mois voyage dans l'adresse (`?mois=AAAA-MM`) : un mois se partage et
 * se recharge. On ne va pas au-delà du mois en cours, qui n'a pas de
 * suite.
 *
 * @param month   Mois affiché, `AAAA-MM`.
 * @param current Mois en cours, `AAAA-MM`.
 * @param path    Adresse de l'écran, sans paramètre.
 * @param query   Autres paramètres de l'adresse, gardés d'un mois à l'autre
 *                (la clinique filtrée, la période d'un autre bloc).
 * @param labels  Intitulés du groupe et des deux flèches.
 */
export function MonthNav({
  month,
  current,
  path,
  query = {},
  locale,
  labels,
}: {
  month: string;
  current: string;
  path: string;
  query?: Record<string, string>;
  locale: Locale;
  labels: { month: string; previousMonth: string; nextMonth: string };
}) {
  const href = (offset: number) =>
    `${path}?${new URLSearchParams({ ...query, mois: shiftMonth(month, offset) })}`;
  return (
    <nav
      aria-label={labels.month}
      className="flex items-center gap-1 rounded-lg border border-border-subtle bg-surface-sunken p-0.5"
    >
      <Button asChild variant="ghost" size="icon">
        <Link href={href(-1)} aria-label={labels.previousMonth}>
          <ChevronLeft />
        </Link>
      </Button>
      <span className="min-w-[8.5rem] text-center text-xs font-medium capitalize">
        {formatMonth(month, locale)}
      </span>
      {month < current ? (
        <Button asChild variant="ghost" size="icon">
          <Link href={href(1)} aria-label={labels.nextMonth}>
            <ChevronRight />
          </Link>
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          disabled
          aria-label={labels.nextMonth}
        >
          <ChevronRight />
        </Button>
      )}
    </nav>
  );
}
