import { ClinicStudiesActions } from "@/components/domain/clinic-studies-actions";
import { ListPagination } from "@/components/domain/list-pagination";
import { StudyList } from "@/components/domain/study-list";
import { FilterBar } from "@/components/filters/filter-bar";
import { FilteredEmpty } from "@/components/filters/filtered-empty";
import { PageHeader, Panel } from "@/components/layout/app-shell";
import { type ClinicConsultation, clinicHref } from "@/lib/clinic-view";
import { getEligibility } from "@/lib/data/eligibility";
import { getPlanned } from "@/lib/data/plan";
import { confirmable } from "@/lib/assignment-plan";
import { ConfirmAllPlannedButton } from "@/components/domain/planned-assignee";
import { loadStudyFilters } from "@/lib/data/study-filters";
import { listStudyPageAt, STUDY_LIST_PAGE_SIZE } from "@/lib/data/studies";
import { LIST_FILTERS } from "@/lib/filters/screens";
import { facetDimensions } from "@/lib/filters/studies";
import { hasFilters } from "@/lib/filters/url";
import {
  pageHref,
  readCursor,
  type SearchParamsRecord,
} from "@/lib/pagination";
import { readListSearch } from "@/lib/search/server";
import { requireSession } from "@/lib/session/server";
import { getMessages } from "@/i18n/server";

/**
 * Les examens de la clinique.
 *
 * Ses envois, rendus compris, avec qui les lit. L'état « À attribuer »
 * ne garde que ceux qu'aucun radiologue ne voit encore (statut
 * `received`, sans titulaire), les plus pressés en tête : le responsable
 * les attribue d'ici, ou depuis leur fiche. Le radiologue n'a pas cet
 * écran : sa file en tient lieu.
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
 * La barre de filtres commune la classe par radiologue, groupe de
 * modalités, état (à attribuer, en lecture, prêt, remis), urgence et
 * période de réception, chaque option avec son nombre d'examens, compté
 * par le service en un appel ; tout se combine, recherche comprise.
 * L'ancienne adresse de la vue « À attribuer » (`?vue=a-attribuer`) mène
 * à l'état du même nom.
 *
 * Dans la vue des cliniques, l'équipe IMAFRIK voit la même liste, lue par
 * la vue de la clinique ; elle attribue par son propre portail.
 *
 * @param consultation Clinique consultée par l'équipe IMAFRIK ; `null`
 *                     pour son responsable.
 * @param params       Paramètres de l'adresse : filtres et curseur.
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
  const keys = LIST_FILTERS.examens;
  const { filters, counts, query } = await loadStudyFilters({
    params,
    keys,
    base: { search },
    clinicId: consultation?.clinicId,
  });
  const { studies, total, nextCursor } = await listStudyPageAt(
    {
      ...query,
      limit: STUDY_LIST_PAGE_SIZE,
      cursor: readCursor(params),
      // À attribuer : les plus pressés d'abord.
      ...(filters.state === "to_assign" && { order: "deadline" as const }),
    },
    pageHref(pathname, params, null),
    consultation?.clinicId,
  );
  // L'équipe IMAFRIK voit sur la ligne quand personne ne peut recevoir un
  // examen (un appel pour la page) ; le responsable n'a pas cette lecture,
  // sa fenêtre lui dit quoi vérifier.
  const open = studies
    .filter((study) => study.status === "received" && !study.assignedTo)
    .map((study) => study.id);
  // Le radiologue que le planning prévoit, pour le responsable comme pour
  // l'équipe : chacun par son portail.
  const [eligibility, planned] = await Promise.all([
    consultation ? getEligibility(open) : {},
    getPlanned(consultation ? "team" : "clinic", open),
  ]);
  const toConfirm = confirmable(open, planned);
  const { t } = await getMessages();
  const clinicName = consultation?.name ?? session.active.organizationName;
  const bar = facetDimensions(keys, counts);
  const filteredEmpty = studies.length === 0 && hasFilters(filters);

  return (
    <>
      <PageHeader
        title={t.clinic.studies.title}
        description={`${t.clinic.studies.count(total)} · ${clinicName}`}
        actions={<ClinicStudiesActions search={search} />}
      />

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-4 pb-3 sm:px-6">
        <FilterBar
          dimensions={bar}
          active={filters}
          result={{ count: total, noun: "studies" }}
        />
        <ConfirmAllPlannedButton
          portal={consultation ? "team" : "clinic"}
          items={toConfirm}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-4 pb-6 sm:px-6">
        <Panel className="flex min-h-0 flex-col overflow-hidden">
          {filteredEmpty ? (
            <FilteredEmpty dimensions={bar} active={filters} />
          ) : (
            <StudyList
              studies={studies}
              filtered={Boolean(search) || hasFilters(filters)}
              assignable
              eligibility={eligibility}
              planned={planned}
            />
          )}
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
