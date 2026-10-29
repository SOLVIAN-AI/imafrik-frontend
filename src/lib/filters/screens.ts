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
  "admin-examens": [...NETWORK, "modality", "urgency"],
} as const satisfies Record<string, readonly DimensionKey[]>;

/** Une liste filtrable. */
export type ListScreen = keyof typeof LIST_FILTERS;
