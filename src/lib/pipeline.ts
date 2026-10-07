/**
 * Lecture du parcours d'un examen, pour l'écran « Flux d'images ».
 *
 * Fonctions pures, séparées de l'écran pour être testées : ce sont elles
 * qui décident de ce qu'on affiche comme lent, et une erreur ici ferait
 * accuser la mauvaise liaison ou le mauvais radiologue.
 */

/** Instants du parcours d'un examen ; `null` pour une étape non atteinte. */
export interface FlowInstants {
  acquiredAt: Date | null;
  firstInstanceAt: Date | null;
  lastInstanceAt: Date | null;
  receivedAt: Date;
  claimedAt: Date | null;
  signedAt: Date | null;
  deliveredAt: Date | null;
  transferBytes: number | null;
}

/** Étapes affichées, dans l'ordre. */
export type SegmentKey = "arrival" | "queue" | "reading" | "delivery";

/**
 * Teintes des étapes, partagées par la frise et sa légende. Leurs libellés
 * sont dans les dictionnaires (`admin.stages.labels`).
 *
 * Ici plutôt que dans le composant de la frise : celui-ci s'exécute dans
 * le navigateur, et un objet exporté d'un module client n'est, côté
 * serveur, qu'une référence opaque — la légende, rendue au serveur, ne
 * pourrait pas le lire.
 */
export const SEGMENT_STYLES: Record<SegmentKey, { bar: string }> = {
  arrival: { bar: "bg-tertiary/60" },
  queue: { bar: "bg-progress" },
  reading: { bar: "bg-accent" },
  delivery: { bar: "bg-done" },
};

/** Une étape du parcours et sa durée. */
export interface Segment {
  key: SegmentKey;
  minutes: number;
  /** Étape en cours : sa durée court jusqu'à maintenant. */
  ongoing: boolean;
}

const minutes = (from: Date, to: Date) =>
  Math.max(0, (to.getTime() - from.getTime()) / 60_000);

/**
 * Découpe le parcours en étapes successives.
 *
 * Une étape commencée mais pas terminée est comptée jusqu'à `now` et
 * marquée « en cours » : c'est précisément celle qu'on cherche des yeux.
 * Une étape dont le début est inconnu — un examen sans date
 * d'acquisition, par exemple — est omise plutôt qu'inventée.
 *
 * @param flow Instants de l'examen.
 * @param now  Instant de référence.
 */
export function segments(flow: FlowInstants, now: Date): Segment[] {
  const result: Segment[] = [];
  if (flow.acquiredAt && flow.lastInstanceAt) {
    result.push({
      key: "arrival",
      minutes: minutes(flow.acquiredAt, flow.lastInstanceAt),
      ongoing: false,
    });
  }
  result.push({
    key: "queue",
    minutes: minutes(flow.receivedAt, flow.claimedAt ?? now),
    ongoing: flow.claimedAt === null,
  });
  if (flow.claimedAt) {
    result.push({
      key: "reading",
      minutes: minutes(flow.claimedAt, flow.signedAt ?? now),
      ongoing: flow.signedAt === null,
    });
  }
  if (flow.signedAt) {
    result.push({
      key: "delivery",
      minutes: minutes(flow.signedAt, flow.deliveredAt ?? now),
      ongoing: flow.deliveredAt === null,
    });
  }
  return result;
}

/**
 * Débit de réception d'un examen, en Mo/s.
 *
 * Mesuré entre la première et la dernière image reçues par le PACS
 * central. `null` quand la fenêtre est trop courte pour être
 * significative — une image unique arrive « instantanément », et un
 * débit infini n'apprend rien.
 *
 * @param flow Instants et volume de l'examen.
 */
export function throughput(flow: FlowInstants): number | null {
  if (!flow.firstInstanceAt || !flow.lastInstanceAt || !flow.transferBytes)
    return null;
  const seconds =
    (flow.lastInstanceAt.getTime() - flow.firstInstanceAt.getTime()) / 1000;
  if (seconds < 1) return null;
  return flow.transferBytes / 1_048_576 / seconds;
}
