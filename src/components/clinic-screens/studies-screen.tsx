import Link from "next/link";

import { ClinicStudiesActions } from "@/components/domain/clinic-studies-actions";
import { ListPagination } from "@/components/domain/list-pagination";
import { ModalityTabs } from "@/components/domain/modality-tabs";
import { StudyList } from "@/components/domain/study-list";
import { PageHeader, Panel } from "@/components/layout/app-shell";
import { type ClinicConsultation, clinicHref } from "@/lib/clinic-view";
import {
  getModalityCounts,
  listStudyPageAt,
  STUDY_LIST_PAGE_SIZE,
} from "@/lib/data/studies";
import { MODALITY_PARAM, readModalityGroup } from "@/lib/modalities";
import {
  pageHref,
  readCursor,
  type SearchParamsRecord,
} from "@/lib/pagination";
import { readListSearch } from "@/lib/search/server";
import { requireSession } from "@/lib/session/server";
import { getMessages } from "@/i18n/server";

/** Paramètre d'adresse de la vue « À attribuer ». */
const VIEW_PARAM = "vue";
const TO_ASSIGN = "a-attribuer";

/**
 * Les examens de la clinique.
 *
 * Ses envois, rendus compris, avec qui les lit. La vue « À attribuer »
 * ne garde que ceux qu'aucun radiologue ne voit encore (statut
 * `received`, sans titulaire) : le responsable les attribue d'ici, ou
 * depuis leur fiche. Le radiologue n'a pas cet écran : sa file en tient
 * lieu.
 *
 * Écran de suivi : on y vient pour retrouver un dossier précis, d'où la
 * recherche en tête, faite par le service sur tout le périmètre. L'état du
 * compte-rendu arrive avec chaque examen : l'écran faisait auparavant un
 * appel par ligne, qui, pour un radiologue, créait même un brouillon sur
 * chaque examen listé.
 *
 * Paginé par le service : l'en-tête donne le total exact, le pied de
 * liste mène à la page suivante. La liste s'arrêtait auparavant aux deux
 * cents premiers examens, et l'en-tête annonçait « 200 examens ».
 *
 * Des onglets la classent par groupe de modalités, chacun avec son nombre
 * d'examens, combinables avec la vue et la recherche (`?modalite=`).
 *
 * Dans la vue des cliniques, l'équipe IMAFRIK voit la même liste, lue par
 * la vue de la clinique ; elle attribue par son propre portail.
 *
 * @param consultation Clinique consultée par l'équipe IMAFRIK ; `null`
 *                     pour son responsable.
 * @param params       Paramètres de l'adresse : vue, modalité et curseur.
 */
export async function StudiesScreen({
  consultation,
  params,
}: {
  consultation: ClinicConsultation | null;
  params: SearchParamsRecord;
}) {
  const session = await requireSession();
  const pathname = clinicHref(consultation, "/examens");
  const search = await readListSearch(
    consultation ? "vue-clinique-examens" : "examens",
    session,
  );
  const toAssign = params[VIEW_PARAM] === TO_ASSIGN;
  const modalityGroup = readModalityGroup(params[MODALITY_PARAM]);
  // Les filtres de la liste, groupe de modalités mis à part : ceux des
  // comptes de chaque onglet.
  const filters = {
    search,
    ...(toAssign ? { status: ["received" as const] } : {}),
  };
  const [{ studies, total, nextCursor }, counts] = await Promise.all([
    listStudyPageAt(
      {
        ...filters,
        modalityGroup,
        limit: STUDY_LIST_PAGE_SIZE,
        cursor: readCursor(params),
        ...(toAssign ? { order: "deadline" as const } : {}),
      },
      pageHref(pathname, params, null),
      consultation?.clinicId,
    ),
    getModalityCounts(filters, consultation?.clinicId),
  ]);
  const { t, locale } = await getMessages();
  const views = t.assignment.list;
  // Changer de vue garde le groupe de modalités, et inversement.
  const withoutView = Object.fromEntries(
    Object.entries(params).filter(([key]) => key !== VIEW_PARAM),
  );
  const clinicName = consultation?.name ?? session.active.organizationName;

  return (
    <>
      <PageHeader
        title={t.clinic.studies.title}
        description={`${t.clinic.studies.count(total)} · ${clinicName}`}
        actions={<ClinicStudiesActions search={search} />}
      />

      <nav
        aria-label={views.filterLabel}
        className="flex gap-1 px-4 pb-3 sm:px-6"
      >
        {[
          {
            key: "all",
            label: views.all,
            active: !toAssign,
            href: pageHref(pathname, withoutView, null),
          },
          {
            key: TO_ASSIGN,
            label: views.toAssign,
            active: toAssign,
            href: pageHref(
              pathname,
              { ...withoutView, [VIEW_PARAM]: TO_ASSIGN },
              null,
            ),
          },
        ].map((view) => (
          <Link
            key={view.key}
            href={view.href}
            aria-current={view.active ? "page" : undefined}
            className={
              view.active
                ? "rounded-md bg-accent-muted px-2.5 py-1 text-xs font-medium text-accent"
                : "rounded-md px-2.5 py-1 text-xs text-secondary hover:bg-surface-hover hover:text-primary"
            }
          >
            {view.label}
          </Link>
        ))}
      </nav>

      <ModalityTabs
        counts={counts}
        active={modalityGroup}
        pathname={pathname}
        params={params}
        labels={t.assignment}
        locale={locale}
      />

      <div className="flex min-h-0 flex-1 flex-col px-4 pb-6 sm:px-6">
        <Panel className="flex min-h-0 flex-col overflow-hidden">
          <StudyList
            studies={studies}
            filtered={Boolean(search) || toAssign || Boolean(modalityGroup)}
            assignable
          />
          <ListPagination
            pathname={pathname}
            params={params}
            shown={studies.length}
            total={total}
            nextCursor={nextCursor}
          />
        </Panel>
      </div>
    </>
  );
}
