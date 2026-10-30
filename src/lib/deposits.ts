/**
 * Dépôt d'une archive ZIP d'images : ce qui se décide sans rendu ni requête.
 *
 * L'envoi suit le protocole tus (`lib/deposit-upload.ts`) : il reprend à
 * l'octet près après une coupure. Ce module tient le reste, éprouvé par
 * `deposits.test.ts` :
 *
 * - l'**état** d'un dépôt tel que les listes le filtrent (en cours, en
 *   contrôle, intégré, refusé, abandonné) ;
 * - la **taille des morceaux** envoyés, réglée sur le débit mesuré : le
 *   relais du serveur coupe toute requête au-delà de 60 secondes, et un
 *   morceau trop petit gaspille un aller-retour sur une liaison lente ;
 * - le **débit** et le **temps restant**, lissés sur les dernières
 *   secondes ;
 * - la **reconnaissance d'un envoi interrompu** : le même fichier
 *   (taille, et empreinte de son premier Mio) reprend son envoi, depuis
 *   ce poste ou un autre.
 */

import type { DepositStatus } from "@/lib/api/contracts";

/** État d'un dépôt, tel que les listes le filtrent. */
export const DEPOSIT_STATES = [
  "uploading",
  "processing",
  "done",
  "refused",
  "abandoned",
] as const;

/** Un état de dépôt. */
export type DepositState = (typeof DEPOSIT_STATES)[number];

/**
 * L'état d'un dépôt, d'après son étape au service : reçue ou en contrôle,
 * l'archive est « en contrôle » ; annulée ou expirée, « abandonnée ».
 *
 * @param status Étape du dépôt.
 */
export function depositStateOf(status: DepositStatus): DepositState {
  switch (status) {
    case "uploading":
      return "uploading";
    case "received":
    case "processing":
      return "processing";
    case "done":
      return "done";
    case "refused":
      return "refused";
    case "cancelled":
    case "expired":
      return "abandoned";
  }
}

/** Kibioctet, mébioctet. */
const KIB = 1024;
const MIB = 1024 * KIB;

/** Premier morceau, avant toute mesure : 16 s à 256 kbit/s. */
export const FIRST_CHUNK_BYTES = 512 * KIB;

/** Plus petit morceau : un aller-retour pour moins serait du gaspillage. */
export const MIN_CHUNK_BYTES = 256 * KIB;

/** Plus gros morceau : au-delà, une coupure fait recommencer plus long. */
export const MAX_CHUNK_BYTES = 16 * MIB;

/**
 * Durée visée d'un morceau, en secondes : loin des 60 secondes au bout
 * desquelles le relais du serveur coupe une requête.
 */
export const CHUNK_TARGET_SECONDS = 15;

/** Granularité des morceaux. */
const CHUNK_STEP_BYTES = 64 * KIB;

/**
 * Taille du prochain morceau, pour qu'il dure une quinzaine de secondes
 * au débit mesuré.
 *
 * @param bytesPerSecond Débit mesuré, ou `null` avant toute mesure.
 * @returns Une taille entre {@link MIN_CHUNK_BYTES} et {@link MAX_CHUNK_BYTES}.
 */
export function nextChunkSize(bytesPerSecond: number | null): number {
  if (!bytesPerSecond || !Number.isFinite(bytesPerSecond)) {
    return FIRST_CHUNK_BYTES;
  }
  const wanted = bytesPerSecond * CHUNK_TARGET_SECONDS;
  const rounded = Math.floor(wanted / CHUNK_STEP_BYTES) * CHUNK_STEP_BYTES;
  return Math.min(MAX_CHUNK_BYTES, Math.max(MIN_CHUNK_BYTES, rounded));
}

/** Fenêtre du débit glissant, en millisecondes. */
export const THROUGHPUT_WINDOW_MS = 20_000;

/** Durée mesurée en deçà de laquelle le débit n'est pas encore annoncé. */
const THROUGHPUT_MIN_SPAN_MS = 2_000;

/**
 * Débit glissant d'un envoi : les octets envoyés pendant les vingt
 * dernières secondes. Une coupure (`reset`) repart de zéro : le débit
 * d'avant n'annonce rien de celui d'après.
 */
export class ThroughputMeter {
  private samples: { at: number; sent: number }[] = [];

  /**
   * Note une progression.
   *
   * @param at   Instant, en millisecondes.
   * @param sent Octets envoyés depuis le début de l'archive.
   */
  add(at: number, sent: number): void {
    this.samples.push({ at, sent });
    const oldest = at - THROUGHPUT_WINDOW_MS;
    while (this.samples.length > 2 && this.samples[1].at <= oldest) {
      this.samples.shift();
    }
  }

  /** Débit en octets par seconde, ou `null` tant qu'il n'est pas mesuré. */
  bytesPerSecond(): number | null {
    const first = this.samples[0];
    const last = this.samples.at(-1);
    if (!first || !last) return null;
    const span = last.at - first.at;
    if (span < THROUGHPUT_MIN_SPAN_MS) return null;
    return Math.max(0, ((last.sent - first.sent) * 1000) / span);
  }

  /** Oublie les mesures : après une coupure, le débit repart de zéro. */
  reset(): void {
    this.samples = [];
  }
}

/**
 * Temps restant, en secondes, au débit mesuré.
 *
 * @param remaining      Octets restant à envoyer.
 * @param bytesPerSecond Débit, ou `null`.
 * @returns Le temps, ou `null` s'il ne se calcule pas encore.
 */
export function remainingSeconds(
  remaining: number,
  bytesPerSecond: number | null,
): number | null {
  if (!bytesPerSecond || bytesPerSecond <= 0) return null;
  return Math.ceil(Math.max(0, remaining) / bytesPerSecond);
}

/** Octets lus pour l'empreinte d'une archive : son premier Mio. */
export const HEAD_BYTES = MIB;

/** Débuts possibles d'une archive ZIP : un fichier, ou une archive vide. */
const ZIP_SIGNATURES = [
  [0x50, 0x4b, 0x03, 0x04],
  [0x50, 0x4b, 0x05, 0x06],
] as const;

/**
 * Vrai si les premiers octets sont ceux d'une archive ZIP.
 *
 * @param head Premiers octets du fichier.
 */
export function looksLikeZip(head: Uint8Array): boolean {
  return ZIP_SIGNATURES.some((signature) =>
    signature.every((byte, index) => head[index] === byte),
  );
}

/** Pourquoi un fichier n'est pas envoyé, avant même de partir. */
export type LocalRefusal = "not_zip" | "too_large" | "empty";

/**
 * Contrôle d'un fichier choisi, avant l'envoi : le service contrôle
 * tout de nouveau, mais un refus immédiat évite d'envoyer pour rien.
 *
 * @param file Taille du fichier et ses premiers octets.
 * @param max  Taille maximale d'une archive.
 */
export function localRefusal(
  file: { size: number; head: Uint8Array },
  max: number,
): LocalRefusal | null {
  if (file.size === 0) return "empty";
  if (file.size > max) return "too_large";
  if (!looksLikeZip(file.head)) return "not_zip";
  return null;
}

/** Un envoi interrompu, tel que la liste des dépôts le connaît. */
export interface InterruptedDeposit {
  id: string;
  fileName: string;
  sizeBytes: number;
  receivedBytes: number;
  headSha256: string | null;
}

/**
 * L'envoi interrompu que reprend ce fichier, s'il y en a un : même
 * taille et même empreinte de son premier Mio. Un autre fichier de même
 * nom et de même taille ne reprend jamais l'envoi d'un autre : ses
 * octets se mêleraient à ceux du premier.
 *
 * @param file        Taille et empreinte du fichier choisi.
 * @param interrupted Envois interrompus de la clinique.
 */
export function matchInterrupted(
  file: { size: number; headSha256: string },
  interrupted: readonly InterruptedDeposit[],
): InterruptedDeposit | null {
  return (
    interrupted.find(
      (deposit) =>
        deposit.sizeBytes === file.size &&
        deposit.headSha256 === file.headSha256,
    ) ?? null
  );
}

/**
 * Empreinte hexadécimale d'octets (SHA-256).
 *
 * @param bytes Octets à empreindre.
 */
export async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Empreinte d'une archive : celle de son premier Mio, de quoi la
 * reconnaître sans la relire en entier.
 *
 * @param file Archive choisie.
 */
export async function headDigest(file: Blob): Promise<string> {
  return sha256Hex(await file.slice(0, HEAD_BYTES).arrayBuffer());
}

/** Les raisons d'un fichier ignoré, dans l'ordre du compte rendu. */
export const IGNORED_REASONS = [
  "other_clinic",
  "not_dicom",
  "invalid_dicom",
  "corrupt",
  "encrypted",
  "pacs_refused",
  "too_large",
  "suspicious_compression",
  "unsupported_compression",
  "nested_archive",
  "dicomdir",
  "system_file",
] as const;

/**
 * Les fichiers ignorés, regroupés par raison, dans l'ordre du compte rendu.
 *
 * @param ignored Fichiers ignorés et leur raison.
 */
export function groupIgnored<Reason extends string>(
  ignored: readonly { name: string; reason: Reason }[],
): { reason: Reason; names: string[] }[] {
  const groups = new Map<Reason, string[]>();
  for (const item of ignored) {
    const names = groups.get(item.reason) ?? [];
    names.push(item.name);
    groups.set(item.reason, names);
  }
  const rank = (reason: string) => {
    const index = (IGNORED_REASONS as readonly string[]).indexOf(reason);
    return index < 0 ? IGNORED_REASONS.length : index;
  };
  return [...groups.entries()]
    .sort(([a], [b]) => rank(a) - rank(b))
    .map(([reason, names]) => ({ reason, names }));
}

/** Un examen se crée une minute après sa dernière image : au-delà, on n'attend plus. */
export const INTEGRATION_WAIT_MS = 15 * 60_000;

/**
 * Vrai si le compte rendu attend encore un examen : contrôlé il y a peu,
 * un examen transmis n'est pas encore créé (l'ingestion attend la
 * stabilité de l'étude, une minute après sa dernière image).
 *
 * @param report Étape, fin du contrôle et examens du dépôt.
 * @param now    Instant de référence.
 */
export function awaitsIntegration(
  report: {
    status: DepositStatus;
    processedAt: Date | null;
    studies: readonly { accepted: boolean; studyId: string | null }[];
  },
  now: number = Date.now(),
): boolean {
  return (
    report.status === "done" &&
    report.processedAt !== null &&
    now - report.processedAt.getTime() < INTEGRATION_WAIT_MS &&
    report.studies.some((study) => study.accepted && !study.studyId)
  );
}
