import type { DimensionKey } from "@/lib/filters/dimensions";

/**
 * Le réseau : les dimensions de tout écran de l'équipe IMAFRIK qui couvre
 * plusieurs cliniques. Le pays s'y ajoutera, et tous ces écrans le
 * recevront d'un coup.
 */
export const NETWORK = ["clinic"] as const satisfies readonly DimensionKey[];

/**
 * Les dimensions de chaque liste, dans l'ordre de la barre.
 *
 * Une dimension qui n'aurait qu'une valeur à proposer (une seule clinique,
 * un seul pays) ne s'affiche pas : un écran peut donc déclarer celles du
 * réseau sans savoir qui le regarde.
 */
export const LIST_FILTERS = {
  "admin-examens": [
    ...NETWORK,
    "radiologist",
    "modality",
    "state",
    "urgency",
    "period",
  ],
  // « Examens » du responsable, et de la vue des cliniques : sa clinique
  // est celle de l'écran.
  examens: ["radiologist", "modality", "state", "urgency", "period"],
  // « Comptes-rendus » : le responsable (et la vue des cliniques) filtre
  // par signataire et par « À télécharger » ; le radiologue, ses propres
  // comptes-rendus, par clinique ; l'équipe, tout.
  "comptes-rendus-clinique": [
    "radiologist",
    "modality",
    "state",
    "urgency",
    "period",
  ],
  "comptes-rendus-radiologue": ["clinic", "modality", "urgency", "period"],
  // « Comptes » : l'état du compte est filtré par le service, le reste sur
  // la page (`lib/filters/facets.ts`).
  comptes: ["organization", "role", "modality", "account", "mfa"],
  // « Organisations » : filtrées et comptées sur la page.
  organisations: ["kind", "standing", "link"],
  // Pilotage de l'équipe : flux d'images (filtré par le service avant sa
  // limite), relevés du mois et passerelles (filtrés sur la page).
  flux: [...NETWORK, "modality", "state", "urgency"],
  // Activité : filtrée par le service ; la modalité ne vaut pas pour les
  // performances par radiologue, qui n'en ont pas.
  activite: [...NETWORK, "modality"],
  facturation: [...NETWORK, "noPlan"],
  passerelles: [...NETWORK, "gatewayStatus", "mute"],
  // Journal d'audit : filtré par le service ; demandes reçues : sur la page.
  journal: ["organization", "author", "family", "action", "period"],
  demandes: ["requester", "requestState", "period"],
  // « Vos idées » : la boîte de l’équipe IMAFRIK (rôle et clinique de
  // l’auteur), et « Mes idées » de l’auteur ; filtrées sur la page.
  idees: [...NETWORK, "role", "ideaCategory", "ideaState", "period"],
  "mes-idees": ["ideaCategory", "ideaState"],
  // Équipe d'une clinique (et vue des cliniques), modèles, formation,
  // historique des tâches : des listes bornées, filtrées sur la page.
  equipe: ["role", "urgentReader"],
  // Planning d'attribution d'une clinique : ses lignes de la semaine,
  // filtrées sur la page.
  planning: ["radiologist", "modality"],
  modeles: ["origin", "modality"],
  formation: ["modality", "trainingState"],
  systeme: ["task", "failed"],
  "comptes-rendus-equipe": [
    ...NETWORK,
    "radiologist",
    "modality",
    "state",
    "urgency",
    "period",
  ],
  // « À lire » : la file d'un radiologue, ou toute la plateforme pour
  // l'équipe IMAFRIK ; la clinique ne s'affiche que s'il y en a plusieurs.
  // Dépôts d'archives ZIP : ceux de la clinique, pour son responsable ;
  // ceux du réseau, pour l'équipe. Des listes bornées, filtrées sur la page.
  depots: ["depositState", "period"],
  "depots-equipe": [...NETWORK, "depositState", "period"],
  worklist: [...NETWORK, "modality", "urgency"],
  "mes-examens": ["clinic", "modality", "urgency"],
} as const satisfies Record<string, readonly DimensionKey[]>;

/** Une liste filtrable. */
export type ListScreen = keyof typeof LIST_FILTERS;
