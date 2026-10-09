import { ChevronRight, ChevronsLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getMessages } from "@/i18n/server";
import {
  pageHref,
  readCursor,
  type SearchParamsRecord,
} from "@/lib/pagination";

/**
 * Pied d'une liste paginée par le service : ce qui est affiché sur le
 * total, et la suite.
 *
 * Composant serveur, sans état : deux liens. « Page suivante » porte le
 * curseur renvoyé par le service ; « Revenir au début » le retire. La
 * page précédente est celle de l'historique du navigateur. Rien ne
 * s'affiche quand la liste tient en une page et qu'on est au début : le
 * total est alors dans l'en-tête, il n'y a rien à ajouter.
 *
 * @param pathname   Chemin de l'écran.
 * @param params     Paramètres actuels de l'adresse.
 * @param shown      Examens affichés sur cette page.
 * @param total      Total exact, compté par le service.
 * @param nextCursor Curseur de la page suivante, `null` sur la dernière.
 */
export async function ListPagination({
  pathname,
  params,
  shown,
  total,
  nextCursor,
}: {
  pathname: string;
  params: SearchParamsRecord;
  shown: number;
  total: number;
  nextCursor: string | null;
}) {
  const onFirstPage = readCursor(params) === undefined;
  if (onFirstPage && !nextCursor) return null;
  const text = (await getMessages()).t.common.pagination;

  return (
    <nav
      aria-label={text.label}
      className="flex shrink-0 items-center justify-between gap-3 border-t border-border-subtle px-4 py-2.5"
    >
      <span className="text-2xs text-tertiary tabular-nums">
        {text.shown(shown, total)}
      </span>
      <div className="flex items-center gap-1">
        {!onFirstPage && (
          <Button asChild variant="ghost" size="sm">
            <Link href={pageHref(pathname, params, null)}>
              <ChevronsLeft aria-hidden />
              {text.first}
            </Link>
          </Button>
        )}
        {nextCursor && (
          <Button asChild variant="secondary" size="sm">
            <Link href={pageHref(pathname, params, nextCursor)} rel="next">
              {text.next}
              <ChevronRight aria-hidden />
            </Link>
          </Button>
        )}
      </div>
    </nav>
  );
}
