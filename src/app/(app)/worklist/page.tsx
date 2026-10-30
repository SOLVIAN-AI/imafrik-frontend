import type { Metadata } from "next";
import { cache } from "react";

import { getMessages } from "@/i18n/server";
import { WorklistView } from "@/components/domain/worklist-view";
import type { StudyStatus } from "@/components/domain/study-status";
import type { ModalityGroup } from "@/lib/api/contracts";
import { getEligibility } from "@/lib/data/eligibility";
import { getPlanned } from "@/lib/data/plan";
import {
  getClinicCounts,
  getModalityCounts,
  listStudyPage,
  STUDY_PAGE_LIMIT,
} from "@/lib/data/studies";
import type { BarDimension } from "@/lib/filters/dimensions";
import { LIST_FILTERS } from "@/lib/filters/screens";
import {
  clinicDimension,
  modalityDimension,
  studyQuery,
} from "@/lib/filters/studies";
import { readFilters } from "@/lib/filters/url";
import type { SearchParamsRecord } from "@/lib/pagination";
import { readListSearch } from "@/lib/search/server";
import { requireSession } from "@/lib/session/server";
import type { Session } from "@/lib/session/types";
import { splitWorklist } from "@/lib/worklist";

/** Ce qui reste à rendre : la file ouverte. */
const OPEN: StudyStatus[] = ["received", "assigned", "in_progress"];

/**
 * File de lecture ouverte, filtrée par le service : ce qui reste à rendre,
 * par échéance.
 *
 * Mise en cache le temps d'une requête (`cache` de React) : la page et ses
 * métadonnées la lisent toutes deux, l'API n'est appelée qu'une fois. Des
 * arguments simples, pour que le cache les reconnaisse.
 *
 * @param search   Recherche en cours, relue du cookie lié au compte.
 * @param clinic   Clinique retenue.
 * @param modality Groupe de modalités retenu.
 * @param urgent   Urgences seulement.
 */
const loadQueue = cache(
  (
    search: string | undefined,
    clinic: string | undefined,
    modality: string | undefined,
    urgent: boolean,
  ) =>
    listStudyPage({
      status: OPEN,
      search,
      order: "deadline",
      limit: STUDY_PAGE_LIMIT,
      ...studyQuery({
        clinic,
        modality,
        urgency: urgent ? "urgent" : undefined,
      }),
    }),
);

/**
 * Les filtres de la file, lus dans l'adresse, et les nombres de la barre.
 *
 * Tout passe par le service : la file comme les nombres de chaque option,
 * comptés sur la file entière avec les autres filtres. Filtrer ici une
 * réponse coupée à {@link STUDY_PAGE_LIMIT} examens rendait, au-delà,
 * liste et nombres faux sans le dire.
 *
 * @param params  Paramètres de l'adresse.
 * @param session Session de l'écran.
 */
const loadFilters = cache(
  async (params: SearchParamsRecord, session: Session) => {
    const keys = LIST_FILTERS.worklist;
    const search = await readListSearch("worklist", session);
    const draft = readFilters(params, keys);
    const base = {
      status: OPEN,
      search,
      ...(draft.urgency && { priority: "urgent" as const }),
    };
    // La clinique se valide parmi celles que compte le service : une
    // clinique inconnue, tapée à la main, revient à toutes.
    const clinicCounts = await getClinicCounts({
      ...base,
      modalityGroup: draft.modality as ModalityGroup | undefined,
    });
    const filters = readFilters(params, keys, {
      clinic: clinicCounts.clinics.map((row) => row.id),
    });
    return { search, base, clinicCounts, filters };
  },
);

/**
 * Titre de l'onglet : « (2) À lire » quand des urgences attendent qu'on
 * les prenne, pour qu'un radiologue les voie arriver depuis un autre
 * onglet ou depuis le viewer.
 *
 * Calculé ici plutôt que dans le navigateur : Next écrit lui-même le titre
 * d'après les métadonnées, après l'hydratation et à chaque actualisation de
 * la file ; un compte posé à la main dans `document.title` disparaissait
 * aussitôt. Même filtre que l'écran : les urgences à prendre visibles.
 */
export async function generateMetadata({
  searchParams,
}: PageProps<"/worklist">): Promise<Metadata> {
  const { t } = await getMessages();
  const session = await requireSession(["radiologist", "platform_admin"]);
  const { search, filters } = await loadFilters(await searchParams, session);
  const { studies } = await loadQueue(
    search,
    filters.clinic,
    filters.modality,
    filters.urgency !== undefined,
  );
  const urgent = splitWorklist(studies, session.user.id).open.filter(
    (study) => study.urgent,
  ).length;
  const title = t.nav.items.worklist;
  return { title: urgent > 0 ? `(${urgent}) ${title}` : title };
}

/**
 * File de lecture du radiologue.
 *
 * **Lue côté serveur.** L'appel part avec le jeton de l'utilisateur, et
 * ce sont les politiques RLS qui décident des lignes renvoyées : un
 * radiologue voit les examens des établissements que son groupe sert, ou
 * de la clinique qui l'emploie. L'administration, en consultation, voit
 * la file de toute la plateforme.
 *
 * La file ne contient que ce qui reste à rendre, dans l'ordre des
 * échéances promises (`order=deadline`). La recherche, qui porte un nom de
 * patient, est relue d'un cookie lié au compte, jamais de l'adresse, et
 * transmise au service. Les filtres (clinique, groupe de modalités,
 * urgences), portés par l'adresse, le sont aussi : le service rend la file
 * filtrée et compte chaque option sur la file entière. La barre est la
 * barre commune des listes (`components/filters`).
 *
 * **Pour l'équipe IMAFRIK, c'est le poste de répartition** : chaque ligne
 * porte « Attribuer » (ou « Réattribuer »), toujours. Quand personne ne
 * peut recevoir un examen, la ligne le dit aussi, et la fenêtre explique
 * pourquoi et quoi faire : qui peut recevoir chaque examen est lu ici,
 * pour toute la file affichée en un appel (`/admin/studies/eligibility`).
 */
export default async function WorklistPage({
  searchParams,
}: PageProps<"/worklist">) {
  const session = await requireSession(["radiologist", "platform_admin"]);
  const { search, base, clinicCounts, filters } = await loadFilters(
    await searchParams,
    session,
  );
  const [{ studies, total }, modalityCounts] = await Promise.all([
    loadQueue(
      search,
      filters.clinic,
      filters.modality,
      filters.urgency !== undefined,
    ),
    getModalityCounts({ ...base, clinic: filters.clinic }),
  ]);
  const sections = splitWorklist(studies, session.user.id);
  // Le radiologue n'attribue rien : seule l'équipe a besoin de savoir qui
  // peut recevoir chaque examen à attribuer.
  const supervising = session.active.role === "platform_admin";
  const openIds = sections.open.map((study) => study.id);
  // Et le radiologue que le planning de chaque clinique prévoit, à
  // confirmer d'un geste.
  const [eligibility, planned] = supervising
    ? await Promise.all([
        getEligibility(openIds),
        getPlanned(
          "team",
          sections.open
            .filter((study) => study.status === "received")
            .map((study) => study.id),
        ),
      ])
    : [{}, {}];
  const bar: BarDimension[] = [
    clinicDimension(clinicCounts),
    modalityDimension(modalityCounts),
    { key: "urgency" },
  ];

  return (
    <WorklistView
      sections={sections}
      eligibility={eligibility}
      planned={planned}
      scope={clinicCounts.clinics
        .filter((row) => row.count > 0)
        .map((row) => row.name)}
      bar={bar}
      filters={filters}
      search={search}
      shown={studies.length}
      total={total}
    />
  );
}
