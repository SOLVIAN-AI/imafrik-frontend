/**
 * Les valeurs d'une organisation pour les filtres de leur liste.
 *
 * Module pur, à l'instant près : éprouvé par `organizations.test.ts`.
 */

import type { AdminOrganization } from "@/lib/data/admin";

/** Une clinique se tait au-delà de ce délai sans examen reçu. */
export const SILENT_AFTER_MS = 24 * 60 * 60 * 1000;

/**
 * Le raccordement d'une organisation : une clinique est raccordée ou non ;
 * raccordée, elle est aussi « silencieuse » sans examen reçu depuis
 * 24 heures. Un groupe de radiologie n'envoie rien.
 *
 * @param org Organisation.
 * @param now Instant de référence.
 */
export function linkOf(
  org: Pick<AdminOrganization, "kind" | "connected" | "lastReceivedAt">,
  now: number = Date.now(),
): string[] {
  if (org.kind !== "clinic") return [];
  if (!org.connected) return ["not_connected"];
  const last = org.lastReceivedAt?.getTime() ?? null;
  return last === null || now - last > SILENT_AFTER_MS
    ? ["connected", "silent"]
    : ["connected"];
}
