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
  // « À lire » : la file d'un radiologue, ou toute la plateforme pour
  // l'équipe IMAFRIK ; la clinique ne s'affiche que s'il y en a plusieurs.
  worklist: [...NETWORK, "modality", "urgency"],
  "mes-examens": ["clinic", "modality", "urgency"],
} as const satisfies Record<string, readonly DimensionKey[]>;

/** Une liste filtrable. */
export type ListScreen = keyof typeof LIST_FILTERS;
