import type { Metadata } from "next";

import { MyStudiesView } from "@/components/domain/my-studies-view";
import { listStudies } from "@/lib/data/studies";
import { requireSession } from "@/lib/session/server";

export const metadata: Metadata = { title: "Mes examens" };

/**
 * Les examens pris en charge par le radiologue.
 *
 * Distinct de la file commune : ici il n'y a rien à choisir, seulement à
 * finir. Ce sont les examens sur lesquels le radiologue s'est engagé en
 * les prenant en charge, et qui restent réservés tant qu'ils ne sont ni
 * signés ni rendus au pool. Un examen pris puis oublié dans un onglet
 * fermé serait invisible partout ailleurs : les deux états d'un examen
 * pris (attribué, en cours de rédaction) sont donc listés, dans l'ordre
 * des échéances.
 *
 * Le filtre « les miens » est appliqué par le service (`?mine=true`), sur
 * l'identifiant du radiologue. L'écran comparait auparavant des noms, et
 * affichait **tous** les examens du pool quand la comparaison échouait.
 */
export default async function MyStudiesPage() {
  await requireSession(["radiologist"]);
  const studies = await listStudies({
    status: ["assigned", "in_progress"],
    mine: true,
    order: "deadline",
  });
  return <MyStudiesView studies={studies} />;
}
