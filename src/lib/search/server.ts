import "server-only";

import { cookies } from "next/headers";

import {
  decodeListSearch,
  type ListSearchScope,
  listSearchCookie,
} from "@/lib/search/list-search";
import type { Session } from "@/lib/session/types";

/**
 * Recherche en cours sur une liste d'examens, pour la session courante.
 *
 * @param scope   Liste concernée.
 * @param session Session déjà résolue par l'écran.
 * @returns La recherche, ou `undefined`.
 */
export async function readListSearch(
  scope: ListSearchScope,
  session: Session,
): Promise<string | undefined> {
  const store = await cookies();
  return decodeListSearch(store.get(listSearchCookie(scope))?.value, {
    userId: session.user.id,
    membershipId: session.active.id,
  });
}
