import type { Metadata } from "next";

import { getMessages } from "@/i18n/server";
import { ListPagination } from "@/components/domain/list-pagination";
import { MyStudiesView } from "@/components/domain/my-studies-view";
import { listStudyPageAt, STUDY_LIST_PAGE_SIZE } from "@/lib/data/studies";
import { pageHref, readCursor } from "@/lib/pagination";
import { requireSession } from "@/lib/session/server";

/** Titre de l'onglet, dans la langue de l'utilisateur. */
export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.nav.items.myStudies };
}

/**
 * Les examens pris en charge par le radiologue.
 *
 * Distinct de la file commune : ici il n'y a rien à choisir, seulement à
 * finir. Ce sont les examens sur lesquels le radiologue s'est engagé en
 * les prenant en charge, et qui restent réservés tant qu'ils ne sont ni
 * signés ni rendus au pool. Un examen pris puis oublié dans un onglet
 * fermé serait invisible partout ailleurs : ils sont donc tous listés,
 * dans l'ordre des échéances, page par page. La prise en charge les fait
 * passer à « en cours » ; « attribué » est demandé aussi, par prudence,
 * bien qu'aucun chemin ne pose plus cet état.
 *
 * Le filtre « les miens » est appliqué par le service (`?mine=true`), sur
 * l'identifiant du radiologue. L'écran comparait auparavant des noms, et
 * affichait **tous** les examens du pool quand la comparaison échouait.
 */
export default async function MyStudiesPage({
  searchParams,
}: PageProps<"/mes-examens">) {
  await requireSession(["radiologist"]);
  const params = await searchParams;
  const { studies, total, nextCursor } = await listStudyPageAt(
    {
      status: ["assigned", "in_progress"],
      mine: true,
      order: "deadline",
      limit: STUDY_LIST_PAGE_SIZE,
      cursor: readCursor(params),
    },
    pageHref("/mes-examens", params, null),
  );
  return (
    <MyStudiesView
      studies={studies}
      footer={
        <ListPagination
          pathname="/mes-examens"
          params={params}
          shown={studies.length}
          total={total}
          nextCursor={nextCursor}
        />
      }
    />
  );
}
