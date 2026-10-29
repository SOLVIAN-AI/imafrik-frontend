/**
 * Passerelles des cliniques : règles partagées par les écrans et les
 * actions serveur de la tour de contrôle.
 *
 * Module pur : ni rendu ni requête, pour être testé seul. Les règles qui
 * font foi sont celles du service (`docs/plan/enrolement-passerelle.md`) ;
 * celles d'ici n'en sont que le reflet, pour proposer à l'écran les seuls
 * gestes que le service acceptera, et refuser avant l'aller-retour une
 * saisie qu'il refuserait.
 */

/** Statuts d'une passerelle, dans l'ordre de leur cycle de vie. */
export const GATEWAY_STATUSES = [
  "awaiting_approval",
  "pending",
  "active",
  "suspended",
  "rejected",
  "revoked",
] as const;

/** Statut d'une passerelle, tel que le service le nomme. */
export type GatewayStatus = (typeof GATEWAY_STATUSES)[number];

/** Gestes possibles sur une passerelle. */
export type GatewayAction =
  "approve" | "reject" | "suspend" | "resume" | "revoke" | "renew";

/**
 * Le texte reçu (paramètre d'adresse) est-il un statut connu ?
 *
 * @param value Valeur reçue.
 */
export function isGatewayStatus(value: unknown): value is GatewayStatus {
  return (
    typeof value === "string" &&
    (GATEWAY_STATUSES as readonly string[]).includes(value)
  );
}

/**
 * Gestes que le service accepte sur une passerelle dans cet état.
 *
 * Même tableau de transitions que la base (déclencheur
 * `guard_gateway_device`) : une passerelle pas encore active se rejette,
 * une active se suspend, une suspendue se reprend ; toute passerelle
 * vivante se révoque ; seule une passerelle en service renouvelle son
 * certificat. Rejetée ou révoquée, plus rien.
 *
 * @param status Statut de la passerelle.
 * @returns Les gestes, dans l'ordre où l'écran les propose.
 */
export function availableActions(status: GatewayStatus): GatewayAction[] {
  switch (status) {
    case "awaiting_approval":
      return ["approve", "reject"];
    case "pending":
      return ["reject", "revoke"];
    case "active":
      return ["renew", "suspend", "revoke"];
    case "suspended":
      return ["resume", "renew", "revoke"];
    case "rejected":
    case "revoked":
      return [];
  }
}

/** Gestes qui exigent un motif, conservé au journal d'audit. */
export const ACTIONS_WITH_REASON: ReadonlySet<GatewayAction> = new Set([
  "reject",
  "suspend",
  "revoke",
]);

/** Bornes d'un motif : celles du service (`GatewayReason`). */
export const REASON_MIN = 3;
export const REASON_MAX = 500;

/**
 * Motif d'un geste : valide, ou la raison du refus.
 *
 * Mêmes bornes que le service, espaces de bord retirés : un motif fait
 * d'espaces est un motif absent.
 *
 * @param reason Motif saisi.
 * @returns `"short"`, `"long"`, ou `null` s'il est valide.
 */
export function reasonProblem(reason: string): "short" | "long" | null {
  const trimmed = reason.trim();
  if (trimmed.length < REASON_MIN) return "short";
  if (trimmed.length > REASON_MAX) return "long";
  return null;
}

/** Couleur d'état d'une passerelle, dans le vocabulaire de l'interface. */
export type StatusTone = "done" | "progress" | "urgent" | "neutral";

/**
 * Couleur d'un statut : vert pour ce qui envoie, orange pour ce qui
 * attend un geste ou un délai, rouge pour ce qui est refusé, neutre pour
 * ce qui est clos.
 *
 * @param status Statut de la passerelle.
 */
export function statusTone(status: GatewayStatus): StatusTone {
  switch (status) {
    case "active":
      return "done";
    case "awaiting_approval":
    case "pending":
      return "progress";
    case "suspended":
      return "urgent";
    case "rejected":
    case "revoked":
      return "neutral";
  }
}

/**
 * Empreinte lisible à voix haute : groupes de quatre signes.
 *
 * Une empreinte se compare au téléphone avec l'installateur ; découpée,
 * elle se lit sans perdre sa place.
 *
 * @param fingerprint Empreinte SHA-256, 64 signes hexadécimaux.
 */
export function groupFingerprint(fingerprint: string): string {
  return fingerprint.match(/.{1,4}/g)?.join(" ") ?? fingerprint;
}

/**
 * Empreinte abrégée pour une liste : ses douze premiers signes, groupés.
 *
 * Douze signes (48 bits) distinguent sans ambiguïté les certificats d'une
 * plateforme ; l'empreinte entière reste sur la fiche de la passerelle.
 *
 * @param fingerprint Empreinte SHA-256.
 */
export function shortFingerprint(fingerprint: string): string {
  return `${groupFingerprint(fingerprint.slice(0, 12))}…`;
}

/**
 * Secondes restantes avant une échéance, jamais négatives.
 *
 * @param expiresAt Échéance.
 * @param now       Instant présent, en millisecondes.
 */
export function secondsLeft(expiresAt: Date, now: number): number {
  return Math.max(0, Math.ceil((expiresAt.getTime() - now) / 1000));
}

/**
 * Compte à rebours `mm:ss`, identique dans toutes les langues.
 *
 * @param seconds Secondes restantes.
 */
export function formatCountdown(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

/** Silence au-delà duquel une passerelle active est signalée : celui du service. */
export const SILENCE_MINUTES = 30;

/**
 * Fraîcheur du signal de vie d'une passerelle.
 *
 * @param lastHeartbeat Dernier signe de vie, ou `null`.
 * @param now           Instant présent, en millisecondes.
 * @returns `"never"` sans signal, `"stale"` au-delà de trente minutes,
 *          `"fresh"` sinon.
 */
export function heartbeatFreshness(
  lastHeartbeat: Date | null,
  now: number,
): "never" | "stale" | "fresh" {
  if (!lastHeartbeat) return "never";
  return now - lastHeartbeat.getTime() > SILENCE_MINUTES * 60_000
    ? "stale"
    : "fresh";
}

/**
 * Une passerelle active qui se tait : aucun signe de vie depuis trente
 * minutes, ou jamais. Le filtre « Muettes » de la liste ; une passerelle
 * qui n'est pas active n'a rien à dire.
 *
 * @param gateway Passerelle.
 * @param now     Instant présent, en millisecondes.
 */
export function isMute(
  gateway: { status: GatewayStatus; lastHeartbeatAt: Date | null },
  now: number = Date.now(),
): boolean {
  return (
    gateway.status === "active" &&
    heartbeatFreshness(gateway.lastHeartbeatAt, now) !== "fresh"
  );
}

/** État d'un certificat épinglé, pour la fiche d'une passerelle. */
export type CertificateState = "inForce" | "waiting" | "overlap" | "retired";

/**
 * État d'un certificat : retiré, en chevauchement après un
 * renouvellement, en vigueur au PACS, ou en attente d'application.
 *
 * @param certificate Dates du certificat, telles que le service les donne.
 */
export function certificateState(certificate: {
  appliedAt: Date | null;
  retireAfter: Date | null;
  retiredAt: Date | null;
}): CertificateState {
  if (certificate.retiredAt) return "retired";
  if (certificate.retireAfter) return "overlap";
  return certificate.appliedAt ? "inForce" : "waiting";
}

/** Ce qui distingue un cycle de la tâche d'hôte d'un autre, hors sa date. */
interface AgentCycle {
  reportedAt: Date;
  outcome: "applied" | "deferred" | "refused" | "failed";
  restarted: boolean;
  added: number;
  removed: number;
  error: string | null;
}

/**
 * Réunit en une ligne les cycles consécutifs identiques de la tâche d'hôte.
 *
 * Elle repasse toutes les 15 secondes : un refus qui dure remplissait la
 * liste de la même ligne, et repoussait hors de vue les cycles qui
 * comptent. Seuls se réunissent les cycles qui n'ont rien appliqué (refus,
 * échec, report) et en tout point semblables ; un cycle appliqué reste
 * seul, puisque chacun a changé la confiance du PACS.
 *
 * @param cycles Cycles du plus récent au plus ancien, tels que le service
 *               les donne.
 * @returns Les séries dans le même ordre ; chacune porte la date de son
 *          cycle le plus récent (`reportedAt`), celle du plus ancien
 *          (`firstAt`) et leur nombre.
 */
export function groupCycles<C extends AgentCycle>(
  cycles: readonly C[],
): (C & { count: number; firstAt: Date })[] {
  const groups: (C & { count: number; firstAt: Date })[] = [];
  for (const cycle of cycles) {
    const last = groups.at(-1);
    if (
      last &&
      cycle.outcome !== "applied" &&
      last.outcome === cycle.outcome &&
      last.restarted === cycle.restarted &&
      last.added === cycle.added &&
      last.removed === cycle.removed &&
      last.error === cycle.error
    ) {
      last.count += 1;
      last.firstAt = cycle.reportedAt;
    } else {
      groups.push({ ...cycle, count: 1, firstAt: cycle.reportedAt });
    }
  }
  return groups;
}

/**
 * Code de démonstration, au format exact d'un vrai code.
 *
 * Il ne raccorde rien : le jeu de démonstration n'a pas de serveur
 * derrière lui. Tiré au hasard pour que deux démonstrations ne montrent
 * pas le même.
 *
 * @param random Source d'aléa, injectable pour les tests.
 */
export function demoEnrollmentCode(random: () => number = Math.random): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const group = () =>
    Array.from(
      { length: 4 },
      () => alphabet[Math.floor(random() * alphabet.length)],
    ).join("");
  return ["IMF", group(), group(), group(), group()].join("-");
}
