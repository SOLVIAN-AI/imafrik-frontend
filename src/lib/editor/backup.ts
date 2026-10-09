"use client";

import type { ReportSections } from "@/components/editor/report-editor";

/**
 * Copie de secours locale, chiffrée, d'un brouillon de compte-rendu.
 *
 * **Le problème.** À Lomé, la connexion d'un cabinet tombe. Un brouillon
 * qui ne peut pas partir vers le service ne vit alors que dans la mémoire
 * de l'onglet : un rechargement, une batterie vide, et la dictée est
 * perdue — il faut relire l'examen.
 *
 * **La réponse.** À chaque échec d'enregistrement, et pendant tout un
 * conflit (brouillon modifié ailleurs), le texte est copié dans le
 * stockage du navigateur, avec la version du brouillon sur laquelle il a
 * été écrit. À la réouverture de l'examen, la copie est proposée au
 * radiologue, qui choisit de la reprendre ou de l'écarter. Si le
 * brouillon a avancé ailleurs depuis, la proposition le dit : la copie
 * n'est jamais écartée en silence, car c'est souvent le texte le plus
 * récent (un enregistrement appliqué dont la réponse s'est perdue fait
 * avancer la version sans que le poste le sache).
 *
 * **La précaution.** Ce texte est médical, et le poste souvent partagé.
 * La copie est donc :
 *
 * - **chiffrée** (AES-GCM) avec une clé propre au compte, remise par le
 *   serveur à la seule session de l'auteur (`backup-key.ts`) et gardée en
 *   mémoire — le stockage du navigateur ne contient jamais le texte en
 *   clair. L'identifiant du compte-rendu est lié au chiffré : une copie
 *   ne peut pas être rejouée sur un autre compte-rendu ;
 * - **effacée** dès que le service a reçu le brouillon, et à la
 *   déconnexion volontaire ({@link clearReportBackups}) ;
 * - **gardée, mais illisible**, après un verrouillage pour inactivité ou
 *   une session expirée : la coupure a pu empêcher l'envoi, et seul son
 *   auteur, reconnecté, peut la relire ;
 * - **limitée à 24 heures** : au-delà, elle est écartée sans être lue.
 */

const PREFIX = "imafrik.report-backup:";

/** Version du format stocké. Les copies d'un autre format sont écartées. */
const FORMAT = 2;

/** Durée de vie d'une copie, en millisecondes. */
export const BACKUP_TTL_MS = 24 * 60 * 60 * 1000;

/** Ce qui est conservé pour un compte-rendu. */
export interface ReportBackup {
  sections: ReportSections;
  /** Version du brouillon en base au moment où le texte a été écrit. */
  baseVersion: number;
  savedAt: string;
  /**
   * Écrite pendant un conflit : le service avait une autre version du
   * brouillon que celle sur laquelle le texte a été écrit.
   */
  conflict?: boolean;
}

/**
 * Forme stockée. Seuls la version de base et l'horodatage — ni l'un ni
 * l'autre ne disent rien du patient — restent lisibles, pour écarter une
 * copie périmée sans avoir à la déchiffrer.
 */
interface StoredBackup {
  format: typeof FORMAT;
  baseVersion: number;
  savedAt: string;
  /** Copie écrite pendant un conflit. Facultatif : absent des copies antérieures. */
  conflict?: boolean;
  /** Vecteur d'initialisation, base64. */
  iv: string;
  /** Sections chiffrées, base64. */
  data: string;
}

/** Résultat de la lecture d'une copie. */
export type BackupRead =
  | { status: "none" }
  | { status: "found"; backup: ReportBackup }
  /** Une copie existe, mais cette clé ne l'ouvre pas — celle d'un autre compte. */
  | { status: "locked" };

function toBase64(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const byte of view) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Données associées au chiffré : le compte-rendu auquel il appartient. */
function associatedData(reportId: string): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(PREFIX + reportId);
}

/** Vrai si une valeur relue a la forme stockée attendue. */
function isStoredBackup(value: unknown): value is StoredBackup {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    candidate.format === FORMAT &&
    typeof candidate.baseVersion === "number" &&
    typeof candidate.savedAt === "string" &&
    typeof candidate.iv === "string" &&
    typeof candidate.data === "string" &&
    (candidate.conflict === undefined ||
      typeof candidate.conflict === "boolean")
  );
}

/** Vrai si la copie a dépassé sa durée de vie, ou porte une date illisible. */
function isExpired(savedAt: string, now: number): boolean {
  const time = Date.parse(savedAt);
  return Number.isNaN(time) || now - time > BACKUP_TTL_MS;
}

/**
 * Prépare la clé remise par le serveur.
 *
 * La clé importée n'est pas extractible : un script de la page peut s'en
 * servir, pas la recopier.
 *
 * @param raw Clé en base64 (32 octets).
 * @returns La clé, ou `null` si le navigateur ne sait pas l'importer.
 */
export async function importBackupKey(raw: string): Promise<CryptoKey | null> {
  try {
    return await crypto.subtle.importKey(
      "raw",
      fromBase64(raw),
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"],
    );
  } catch {
    return null;
  }
}

/**
 * Écrit la copie de secours chiffrée d'un brouillon.
 *
 * Silencieux si le stockage est bloqué : l'indicateur reste « hors
 * ligne » et la fermeture de l'onglet demande confirmation.
 *
 * @returns `true` si la copie est écrite.
 */
export async function writeReportBackup(
  key: CryptoKey,
  reportId: string,
  backup: ReportBackup,
): Promise<boolean> {
  try {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv, additionalData: associatedData(reportId) },
      key,
      new TextEncoder().encode(JSON.stringify(backup.sections)),
    );
    const stored: StoredBackup = {
      format: FORMAT,
      baseVersion: backup.baseVersion,
      savedAt: backup.savedAt,
      ...(backup.conflict ? { conflict: true } : {}),
      iv: toBase64(iv),
      data: toBase64(data),
    };
    window.localStorage.setItem(PREFIX + reportId, JSON.stringify(stored));
    return true;
  } catch {
    // Navigation privée, quota atteint, chiffrement indisponible.
    return false;
  }
}

/**
 * Lit la copie de secours d'un brouillon.
 *
 * Une copie expirée, d'un ancien format — en clair — ou illisible est
 * effacée. Une copie que cette clé n'ouvre pas est laissée en place :
 * elle appartient à un autre compte, qui la retrouvera en se reconnectant,
 * ou expirera.
 *
 * @param key      Clé du compte de la session.
 * @param reportId Compte-rendu concerné.
 * @param now      Instant de référence, pour les tests.
 */
export async function readReportBackup(
  key: CryptoKey,
  reportId: string,
  now: number = Date.now(),
): Promise<BackupRead> {
  let stored: unknown;
  try {
    const raw = window.localStorage.getItem(PREFIX + reportId);
    if (!raw) return { status: "none" };
    stored = JSON.parse(raw);
  } catch {
    clearReportBackup(reportId);
    return { status: "none" };
  }
  if (!isStoredBackup(stored) || isExpired(stored.savedAt, now)) {
    clearReportBackup(reportId);
    return { status: "none" };
  }
  try {
    const plain = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: fromBase64(stored.iv),
        additionalData: associatedData(reportId),
      },
      key,
      fromBase64(stored.data),
    );
    return {
      status: "found",
      backup: {
        sections: JSON.parse(new TextDecoder().decode(plain)),
        baseVersion: stored.baseVersion,
        savedAt: stored.savedAt,
        ...(stored.conflict ? { conflict: true } : {}),
      },
    };
  } catch {
    return { status: "locked" };
  }
}

/** Efface la copie de secours d'un brouillon. */
export function clearReportBackup(reportId: string): void {
  try {
    window.localStorage.removeItem(PREFIX + reportId);
  } catch {
    // Rien à faire : il n'y a rien à effacer si le stockage est bloqué.
  }
}

/**
 * Efface les copies expirées ou d'un ancien format — à l'ouverture de
 * l'écran de rédaction, pour qu'un poste ne les accumule pas.
 *
 * @param now Instant de référence, pour les tests.
 */
export function purgeStaleBackups(now: number = Date.now()): void {
  try {
    for (const key of Object.keys(window.localStorage)) {
      if (!key.startsWith(PREFIX)) continue;
      let stale = true;
      try {
        const stored: unknown = JSON.parse(
          window.localStorage.getItem(key) ?? "",
        );
        stale = !isStoredBackup(stored) || isExpired(stored.savedAt, now);
      } catch {
        // Illisible : écartée.
      }
      if (stale) window.localStorage.removeItem(key);
    }
  } catch {
    // Stockage bloqué : rien n'y a été écrit.
  }
}

/** Efface toutes les copies de secours de ce navigateur — à la déconnexion. */
export function clearReportBackups(): void {
  try {
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith(PREFIX)) window.localStorage.removeItem(key);
    }
  } catch {
    // Idem.
  }
}
