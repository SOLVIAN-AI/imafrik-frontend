/**
 * Idées de démonstration (« Vos idées »).
 *
 * Quelques pistes d’amélioration, proposées par la radiologue et la
 * responsable de démonstration (le même compte, `DEMO_USER_ID`, dans deux
 * portails : le rôle de l’auteur les sépare) et par d’autres membres du
 * réseau, pour que la boîte de l’équipe IMAFRIK se filtre sur chaque
 * dimension. Les états couvrent tout le suivi, avec un regroupement.
 *
 * Des données, comme les autres jeux de démonstration : en français, et
 * sans aucun nom de patient.
 */

import { DEMO_GROUP, DEMO_NETWORK } from "@/lib/demo/control";
import { DEMO_RADIOLOGISTS, DEMO_USER_ID } from "@/lib/demo/studies";
import type { IdeaAuthorRole, IdeaInbox, InboxIdea } from "@/lib/ideas";

const DAY = 86_400_000;
const HOUR = 3_600_000;

/** Organisation d’une idée de démonstration, par son identifiant. */
function organization(
  id: string,
): Pick<InboxIdea, "organizationId" | "organizationName" | "organizationKind"> {
  if (id === DEMO_GROUP.id)
    return {
      organizationId: id,
      organizationName: DEMO_GROUP.name,
      organizationKind: "radiology_group",
    };
  const clinic = DEMO_NETWORK.find((candidate) => candidate.id === id);
  return {
    organizationId: id,
    organizationName: clinic?.name ?? null,
    organizationKind: "clinic",
  };
}

/** Une idée, ses dates données en âge depuis maintenant. */
function idea(
  fields: Omit<
    InboxIdea,
    | "createdAt"
    | "updatedAt"
    | "statusChangedAt"
    | "respondedAt"
    | "grouped"
    | "duplicates"
    | "duplicateOfTitle"
    | "organizationId"
    | "organizationName"
    | "organizationKind"
  > & {
    ageMs: number;
    organization: string;
    answeredAgoMs?: number;
  },
  now: number,
): InboxIdea {
  const { ageMs, organization: orgId, answeredAgoMs, ...rest } = fields;
  const createdAt = new Date(now - ageMs);
  const changed =
    rest.status === "received"
      ? null
      : new Date(now - (answeredAgoMs ?? ageMs / 2));
  return {
    ...rest,
    ...organization(orgId),
    createdAt,
    updatedAt: changed ?? createdAt,
    statusChangedAt: changed,
    respondedAt: rest.response ? changed : null,
    grouped: rest.duplicateOf !== null,
    duplicates: 0,
    duplicateOfTitle: null,
  };
}

const RADIOLOGIST_NAME = `Dr ${DEMO_RADIOLOGISTS.me.name}`;
const MANAGER_NAME = "Akouvi Mensah";
const TEAM_NAME = "Edem Agbodjan";

/**
 * Toutes les idées de démonstration, les plus récentes d’abord.
 *
 * @param now Instant de référence.
 */
export function demoIdeas(now: number = Date.now()): InboxIdea[] {
  const ideas: InboxIdea[] = [
    idea(
      {
        id: "idee-fenetrage",
        title: "Fenêtrage au clavier",
        body: "Passer d’une fenêtre usuelle à l’autre (poumon, médiastin, os) avec une touche, sans ouvrir le menu du visualiseur.",
        category: "reading",
        benefit: "time",
        screen: "reading",
        appVersion: "4f2c9a1",
        device: "desktop",
        status: "planned",
        response:
          "Bonne idée, et demandée par plusieurs radiologues : les touches 1 à 5 pour les fenêtres usuelles arrivent dans la prochaine version.",
        authorId: DEMO_USER_ID,
        authorName: RADIOLOGIST_NAME,
        authorRole: "radiologist",
        organization: DEMO_GROUP.id,
        duplicateOf: null,
        respondedByName: TEAM_NAME,
        ageMs: 12 * DAY,
        answeredAgoMs: 9 * DAY,
      },
      now,
    ),
    idea(
      {
        id: "idee-raccourcis",
        title: "Raccourcis pour les fenêtres",
        body: "Des raccourcis clavier pour le fenêtrage : je change de fenêtre des dizaines de fois par scanner.",
        category: "reading",
        benefit: "time",
        screen: "reading",
        appVersion: "4f2c9a1",
        device: "desktop",
        status: "planned",
        response: null,
        authorId: DEMO_RADIOLOGISTS.bakari.id,
        authorName: `Dr ${DEMO_RADIOLOGISTS.bakari.name}`,
        authorRole: "radiologist",
        organization: DEMO_GROUP.id,
        duplicateOf: "idee-fenetrage",
        respondedByName: null,
        ageMs: 10 * DAY,
        answeredAgoMs: 9 * DAY,
      },
      now,
    ),
    idea(
      {
        id: "idee-ponctuation",
        title: "Ponctuation à la voix pendant la dictée",
        body: "Pouvoir dire « point », « virgule » et « à la ligne » pendant la dictée, comme sur les logiciels de bureau.",
        category: "reporting",
        benefit: "time",
        screen: "reading",
        appVersion: "4f2c9a1",
        device: "desktop",
        status: "under_review",
        response: null,
        authorId: DEMO_USER_ID,
        authorName: RADIOLOGIST_NAME,
        authorRole: "radiologist",
        organization: DEMO_GROUP.id,
        duplicateOf: null,
        respondedByName: null,
        ageMs: 5 * DAY,
        answeredAgoMs: 3 * DAY,
      },
      now,
    ),
    idea(
      {
        id: "idee-anteriorite",
        title: "Comparer avec l’antériorité côte à côte",
        body: "Ouvrir l’examen précédent du patient à côté de l’actuel, synchronisé au défilement, pour comparer une lésion.",
        category: "reading",
        benefit: "safety",
        screen: "worklist",
        appVersion: "7b31e0c",
        device: "desktop",
        status: "received",
        response: null,
        authorId: DEMO_USER_ID,
        authorName: RADIOLOGIST_NAME,
        authorRole: "radiologist",
        organization: DEMO_GROUP.id,
        duplicateOf: null,
        respondedByName: null,
        ageMs: 20 * HOUR,
      },
      now,
    ),
    idea(
      {
        id: "idee-pret",
        title: "Prévenir quand un compte-rendu est prêt",
        body: "Recevoir un courriel dès qu’un compte-rendu est signé, pour le remettre au patient sans guetter l’écran.",
        category: "studies",
        benefit: "time",
        screen: "dashboard",
        appVersion: "2d8e4f7",
        device: "desktop",
        status: "shipped",
        response:
          "C’est fait : un courriel part dès la signature du compte-rendu. Merci pour l’idée !",
        authorId: DEMO_USER_ID,
        authorName: MANAGER_NAME,
        authorRole: "clinic_staff",
        organization: "org-stj",
        duplicateOf: null,
        respondedByName: TEAM_NAME,
        ageMs: 30 * DAY,
        answeredAgoMs: 4 * DAY,
      },
      now,
    ),
    idea(
      {
        id: "idee-releve",
        title: "Relevé mensuel en PDF",
        body: "Un relevé du mois en PDF, aux couleurs de la clinique, pour le transmettre à la comptabilité sans recopier les chiffres.",
        category: "billing",
        benefit: "clarity",
        screen: "activity",
        appVersion: "7b31e0c",
        device: "desktop",
        status: "received",
        response: null,
        authorId: DEMO_USER_ID,
        authorName: MANAGER_NAME,
        authorRole: "clinic_staff",
        organization: "org-stj",
        duplicateOf: null,
        respondedByName: null,
        ageMs: 2 * DAY,
      },
      now,
    ),
    idea(
      {
        id: "idee-lot",
        title: "Envoyer plusieurs examens d’un coup",
        body: "Glisser un dossier entier pour envoyer tous les examens de la journée en une seule fois.",
        category: "studies",
        benefit: "time",
        screen: "send",
        appVersion: "2d8e4f7",
        device: "desktop",
        status: "declined",
        response:
          "Pas pour le moment : la passerelle envoie déjà chaque examen dès sa sortie de l’appareil, sans geste de la clinique.",
        authorId: DEMO_USER_ID,
        authorName: MANAGER_NAME,
        authorRole: "clinic_staff",
        organization: "org-stj",
        duplicateOf: null,
        respondedByName: TEAM_NAME,
        ageMs: 21 * DAY,
        answeredAgoMs: 18 * DAY,
      },
      now,
    ),
    idea(
      {
        id: "idee-gardes",
        title: "Le planning des gardes sur téléphone",
        body: "Consulter les gardes de la semaine depuis un téléphone, quand on n’est pas devant l’ordinateur de l’accueil.",
        category: "assignment",
        benefit: "safety",
        screen: "teamRules",
        appVersion: "7b31e0c",
        device: "phone",
        status: "under_review",
        response: null,
        authorId: "demo-tchala",
        authorName: "Esso Tchala",
        authorRole: "clinic_staff",
        organization: "org-lum",
        duplicateOf: null,
        respondedByName: null,
        ageMs: 6 * DAY,
        answeredAgoMs: 2 * DAY,
      },
      now,
    ),
    idea(
      {
        id: "idee-lecteur",
        title: "Voir quel radiologue lit l’examen",
        body: "Afficher le nom du radiologue sur la fiche dès qu’il a pris l’examen, pour savoir qui appeler.",
        category: "assignment",
        benefit: "clarity",
        screen: "study",
        appVersion: "7b31e0c",
        device: "tablet",
        status: "received",
        response: null,
        authorId: "demo-adjovi",
        authorName: "Komi Adjovi",
        authorRole: "clinic_staff",
        organization: "org-pka",
        duplicateOf: null,
        respondedByName: null,
        ageMs: 3 * DAY,
      },
      now,
    ),
    idea(
      {
        id: "idee-region",
        title: "Un modèle par défaut selon la région",
        body: "Proposer d’office le modèle de compte rendu qui correspond à la région de l’examen (thorax, abdomen, crâne).",
        category: "reporting",
        benefit: "time",
        screen: "templates",
        appVersion: "7b31e0c",
        device: "phone",
        status: "received",
        response: null,
        authorId: "demo-agbeko",
        authorName: "Pr Mawuli Agbeko",
        authorRole: "radiologist",
        organization: DEMO_GROUP.id,
        duplicateOf: null,
        respondedByName: null,
        ageMs: 9 * HOUR,
      },
      now,
    ),
    idea(
      {
        id: "idee-signal",
        title: "Un signal sonore pour une urgence",
        body: "Un son discret quand une urgence arrive dans ma liste, même si l’onglet n’est pas au premier plan.",
        category: "other",
        benefit: "safety",
        screen: null,
        appVersion: null,
        device: null,
        status: "received",
        response: null,
        authorId: "demo-diallo",
        authorName: "Dr Fatou Diallo",
        authorRole: "radiologist",
        organization: DEMO_GROUP.id,
        duplicateOf: null,
        respondedByName: null,
        ageMs: 4 * HOUR,
      },
      now,
    ),
  ];
  // Le regroupement, vu des deux côtés : la principale compte ses
  // regroupées, chacune nomme sa principale.
  const byId = new Map(ideas.map((item) => [item.id, item]));
  for (const item of ideas) {
    const main = item.duplicateOf ? byId.get(item.duplicateOf) : undefined;
    if (!main) continue;
    item.duplicateOfTitle = main.title;
    main.duplicates += 1;
  }
  return ideas.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/** La boîte de l’équipe IMAFRIK, en démonstration. */
export function demoIdeaInbox(now: number = Date.now()): IdeaInbox {
  const items = demoIdeas(now);
  return { items, total: items.length };
}

/**
 * Les idées du compte de démonstration dans un portail : celles de la
 * radiologue, ou celles de la responsable.
 *
 * @param role Rôle de l’appartenance active.
 */
export function demoMyIdeas(
  role: IdeaAuthorRole,
  now: number = Date.now(),
): InboxIdea[] {
  return demoIdeas(now).filter(
    (item) => item.authorId === DEMO_USER_ID && item.authorRole === role,
  );
}
