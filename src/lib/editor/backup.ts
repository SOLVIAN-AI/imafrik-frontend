"use client";

import type { ReportSections } from "@/components/editor/report-editor";

/**
 * Copie de secours locale d'un brouillon de compte-rendu.
 *
 * **Le problème.** À Lomé, la connexion d'un cabinet tombe. Un brouillon
 * qui ne peut pas partir vers le service ne vit alors que dans la mémoire
 * de l'onglet : un rechargement, une batterie vide, et la dictée est
 * perdue — il faut relire l'examen.
 *
 * **La réponse.** À chaque échec d'enregistrement, le texte est copié dans
 * le stockage du navigateur, avec la version du brouillon sur laquelle il
 * a été écrit. À la réouverture de l'examen, la copie est reprise si elle
 * part de la version encore en base — sinon le brouillon a avancé ailleurs
 * depuis, et la copie, périmée, est écartée plutôt que d'écraser un texte
 * plus récent.
 *
 * **La précaution.** Ce texte est médical. La copie est effacée dès que
 * le service a reçu le brouillon, et toutes les copies le sont à la
 * déconnexion ({@link clearReportBackups}) : rien ne doit rester sur un
 * poste partagé.
 */

const PREFIX = "imafrik.report-backup:";

/** Ce qui est conservé pour un compte-rendu. */
export interface ReportBackup {
  sections: ReportSections;
  /** Version du brouillon en base au moment où le texte a été écrit. */
  baseVersion: number;
  savedAt: string;
}

/** Écrit la copie de secours d'un brouillon. Silencieux si le stockage est bloqué. */
export function writeReportBackup(
  reportId: string,
  backup: ReportBackup,
): void {
  try {
    window.localStorage.setItem(PREFIX + reportId, JSON.stringify(backup));
  } catch {
    // Navigation privée ou quota atteint : l'indicateur reste « hors
    // ligne » et la fermeture de l'onglet demande confirmation.
  }
}

/** Lit la copie de secours d'un brouillon, si elle existe et se lit. */
export function readReportBackup(reportId: string): ReportBackup | null {
  try {
    const raw = window.localStorage.getItem(PREFIX + reportId);
    return raw ? (JSON.parse(raw) as ReportBackup) : null;
  } catch {
    return null;
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
