import "server-only";

import {
  EMPTY_REPORT_SECTIONS,
  type ReportSections,
} from "@/components/editor/sections";
import { apiGet } from "@/lib/api/client";
import {
  reportSchema,
  type ApiAddendum,
  type ApiReport,
} from "@/lib/api/contracts";
import { isDemoMode } from "@/lib/demo/mode";
import { DEMO_REPORTS } from "@/lib/demo/reports";
import {
  DEMO_STUDIES,
  DEMO_USER_ID,
  demoDraftSections,
} from "@/lib/demo/studies";

/**
 * Correction apportée à un compte-rendu signé.
 *
 * Le compte-rendu lui-même ne change jamais : l'addendum s'y ajoute, daté
 * et signé, avec l'identité de son auteur figée à l'écriture.
 */
export interface Addendum {
  id: string;
  body: string;
  authorName: string;
  authorTitle: string | null;
  authorLicense: string | null;
  createdAt: Date;
}

/** Traduit un addendum depuis la forme de l'API. */
export function toAddendum(row: ApiAddendum): Addendum {
  return {
    id: row.id,
    body: row.body,
    authorName: row.author_name,
    authorTitle: row.author_title,
    authorLicense: row.author_license,
    createdAt: new Date(row.created_at),
  };
}

/** Un compte-rendu, tel que l'interface le manipule. */
export interface Report {
  id: string;
  studyId: string;
  authorId: string;
  status: "draft" | "signed";
  sections: ReportSections;
  /**
   * Version du texte. Renvoyée à chaque enregistrement : le service
   * refuse une écriture faite sur une version périmée, ce qui protège un
   * brouillon ouvert dans deux onglets.
   */
  version: number;
  signedAt: Date | null;
  /** Nom du signataire, figé à la signature. */
  signedBy: string | null;
  signerTitle: string | null;
  signerLicense: string | null;
  /** Empreinte du PDF signé, celle que la page de vérification affiche. */
  sha256: string | null;
  /** Code de vérification publique, celui du QR code du PDF. */
  verifyToken: string | null;
  /** Corrections apportées depuis la signature, de la plus ancienne à la plus récente. */
  addenda: Addendum[];
}

/** Traduit la forme de l'API vers celle de l'interface. */
export function toReport(row: ApiReport): Report {
  return {
    id: row.id,
    studyId: row.study_id,
    authorId: row.author_id,
    status: row.status,
    sections: { ...EMPTY_REPORT_SECTIONS, ...pickSections(row.sections) },
    version: row.version,
    signedAt: row.signed_at ? new Date(row.signed_at) : null,
    signedBy: row.signer_name,
    signerTitle: row.signer_title,
    signerLicense: row.signer_license,
    sha256: row.pdf_sha256,
    verifyToken: row.verify_token,
    addenda: row.addenda.map(toAddendum),
  };
}

/** Ne garde que les sections connues de l'éditeur. */
function pickSections(raw: Record<string, string>): Partial<ReportSections> {
  const known = Object.keys(EMPTY_REPORT_SECTIONS) as (keyof ReportSections)[];
  return Object.fromEntries(
    known
      .filter((key) => typeof raw[key] === "string")
      .map((key) => [key, raw[key]]),
  );
}

/** Compte-rendu de démonstration : signé, ou brouillon en cours. */
function demoReport(
  predicate: (studyId: string, reportId: string) => boolean,
): Report | null {
  const signed = DEMO_REPORTS.find((report) =>
    predicate(report.studyId, report.id),
  );
  if (signed) {
    return {
      id: signed.id,
      studyId: signed.studyId,
      authorId: signed.authorId,
      status: "signed",
      sections: signed.sections,
      version: 1,
      signedAt: signed.signedAt,
      signedBy: signed.signedBy,
      signerTitle: signed.signerTitle,
      signerLicense: signed.signerLicense,
      sha256: null,
      verifyToken: signed.verifyToken,
      addenda: [],
    };
  }
  const draft = DEMO_STUDIES.find(
    (study) =>
      study.assignedTo === DEMO_USER_ID &&
      study.status === "in_progress" &&
      predicate(study.id, `draft-${study.id}`),
  );
  if (!draft) return null;
  return {
    id: `draft-${draft.id}`,
    studyId: draft.id,
    authorId: DEMO_USER_ID,
    status: "draft",
    sections: { ...EMPTY_REPORT_SECTIONS, ...demoDraftSections(draft.id) },
    version: 1,
    signedAt: null,
    signedBy: null,
    signerTitle: null,
    signerLicense: null,
    sha256: null,
    verifyToken: null,
    addenda: [],
  };
}

/**
 * Le compte-rendu d'un examen, brouillon ou signé.
 *
 * N'en crée jamais : une lecture n'écrit rien. Le brouillon s'ouvre par
 * `openDraft`, après prise en charge.
 *
 * @returns Le compte-rendu visible, ou `null` — pas encore rédigé, ou
 *          pas encore signé pour une clinique.
 */
export async function getReportForStudy(
  studyId: string,
): Promise<Report | null> {
  if (isDemoMode()) return demoReport((sid) => sid === studyId);
  const row = await apiGet(
    `/studies/${encodeURIComponent(studyId)}/report`,
    reportSchema,
    {
      notFoundAsNull: true,
    },
  );
  return row ? toReport(row) : null;
}

/** Un compte-rendu par son identifiant. */
export async function getReport(id: string): Promise<Report | null> {
  if (isDemoMode()) return demoReport((_, rid) => rid === id);
  const row = await apiGet(`/reports/${encodeURIComponent(id)}`, reportSchema, {
    notFoundAsNull: true,
  });
  return row ? toReport(row) : null;
}
