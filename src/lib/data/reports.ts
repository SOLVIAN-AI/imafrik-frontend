import "server-only";

import {
  DEFAULT_LAYOUT,
  EMPTY_REPORT_SECTIONS,
  type ReportLayout,
  type ReportSections,
} from "@/components/editor/sections";
import { apiGet } from "@/lib/api/client";
import {
  letterheadSchema,
  reportSchema,
  type ApiAddendum,
  type ApiReport,
} from "@/lib/api/contracts";
import { isDemoMode } from "@/lib/demo/mode";
import { demoLayoutPreference } from "@/lib/demo/report-layout";
import { DEMO_REPORTS } from "@/lib/demo/reports";
import {
  DEMO_CLINIC_CITIES,
  DEMO_STUDIES,
  demoDraftSections,
} from "@/lib/demo/studies";
import { clinicViewApi } from "@/lib/clinic-view";

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
  /**
   * Mise en page choisie par le radiologue : découpe proposée ou feuille
   * blanche. Elle décide des sections affichées et de l'allure du PDF.
   */
  layout: ReportLayout;
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
  /** Dernier enregistrement : ce que l'équipe voit d'un brouillon en cours. */
  updatedAt: Date;
}

/** Traduit la forme de l'API vers celle de l'interface. */
export function toReport(row: ApiReport): Report {
  return {
    id: row.id,
    studyId: row.study_id,
    authorId: row.author_id,
    status: row.status,
    layout: row.layout,
    sections: { ...EMPTY_REPORT_SECTIONS, ...pickSections(row.sections) },
    version: row.version,
    signedAt: row.signed_at ? new Date(row.signed_at) : null,
    signedBy: row.signer_name,
    signerTitle: row.signer_title,
    signerLicense: row.signer_license,
    sha256: row.pdf_sha256,
    verifyToken: row.verify_token,
    addenda: row.addenda.map(toAddendum),
    updatedAt: new Date(row.updated_at),
  };
}

/** Ne garde que les sections connues de l'éditeur. */
export function pickSections(
  raw: Record<string, string>,
): Partial<ReportSections> {
  const known = Object.keys(EMPTY_REPORT_SECTIONS) as (keyof ReportSections)[];
  return Object.fromEntries(
    known
      .filter((key) => typeof raw[key] === "string")
      .map((key) => [key, raw[key]]),
  );
}

/**
 * Compte-rendu de démonstration : signé, ou brouillon en cours.
 *
 * @param draftLayout Mise en page d'un brouillon encore vierge : celle des
 *                    paramètres du radiologue, comme dans le service.
 */
function demoReport(
  predicate: (studyId: string, reportId: string) => boolean,
  draftLayout: ReportLayout = DEFAULT_LAYOUT,
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
      layout: signed.layout ?? DEFAULT_LAYOUT,
      sections: signed.sections,
      version: 1,
      signedAt: signed.signedAt,
      signedBy: signed.signedBy,
      signerTitle: signed.signerTitle,
      signerLicense: signed.signerLicense,
      sha256: null,
      verifyToken: signed.verifyToken,
      addenda: [],
      updatedAt: signed.signedAt,
    };
  }
  // Tout examen en cours a son brouillon, comme dans le service : celui de
  // l'utilisateur s'ouvre en rédaction, celui d'un confrère en lecture.
  const draft = DEMO_STUDIES.find(
    (study) =>
      study.assignedTo !== null &&
      study.status === "in_progress" &&
      predicate(study.id, `draft-${study.id}`),
  );
  if (!draft?.assignedTo) return null;
  const written = demoDraftSections(draft.id);
  return {
    id: `draft-${draft.id}`,
    studyId: draft.id,
    authorId: draft.assignedTo,
    status: "draft",
    // Un brouillon déjà commencé l'a été en découpe proposée ; un
    // brouillon vierge naît dans la mise en page des paramètres.
    layout: Object.keys(written).length > 0 ? DEFAULT_LAYOUT : draftLayout,
    sections: { ...EMPTY_REPORT_SECTIONS, ...written },
    version: 1,
    signedAt: null,
    signedBy: null,
    signerTitle: null,
    signerLicense: null,
    sha256: null,
    verifyToken: null,
    addenda: [],
    // Repris il y a douze minutes : un brouillon de démonstration vivant.
    updatedAt: new Date(Date.now() - 12 * 60_000),
  };
}

/**
 * Le compte-rendu d'un examen, brouillon ou signé.
 *
 * N'en crée jamais : une lecture n'écrit rien. Le brouillon s'ouvre par
 * `openDraft`, après prise en charge.
 *
 * @param studyId  Examen.
 * @param clinicId Clinique consultée par l'équipe IMAFRIK : le compte-rendu
 *                 tel que le voit son responsable, signé seulement.
 * @returns Le compte-rendu visible, ou `null` — pas encore rédigé, ou
 *          pas encore signé pour une clinique.
 */
export async function getReportForStudy(
  studyId: string,
  clinicId?: string,
): Promise<Report | null> {
  if (isDemoMode()) {
    return demoReportOf(
      demoReport((sid) => sid === studyId, await demoLayoutPreference()),
      clinicId,
    );
  }
  const path = clinicId
    ? `${clinicViewApi(clinicId)}/studies/${encodeURIComponent(studyId)}/report`
    : `/studies/${encodeURIComponent(studyId)}/report`;
  const row = await apiGet(path, reportSchema, { notFoundAsNull: true });
  return row ? toReport(row) : null;
}

/**
 * Un compte-rendu par son identifiant.
 *
 * @param id       Compte-rendu.
 * @param clinicId Clinique consultée par l'équipe IMAFRIK : signé, et
 *                 d'un examen de cette clinique seulement.
 */
export async function getReport(
  id: string,
  clinicId?: string,
): Promise<Report | null> {
  if (isDemoMode()) {
    return demoReportOf(
      demoReport((_, rid) => rid === id, await demoLayoutPreference()),
      clinicId,
    );
  }
  const path = clinicId
    ? `${clinicViewApi(clinicId)}/reports/${encodeURIComponent(id)}`
    : `/reports/${encodeURIComponent(id)}`;
  const row = await apiGet(path, reportSchema, { notFoundAsNull: true });
  return row ? toReport(row) : null;
}

/**
 * Ce que le responsable d'une clinique de démonstration voit d'un
 * compte-rendu : signé, et de l'un de ses examens. Sans clinique, le
 * compte-rendu tel quel.
 */
function demoReportOf(
  report: Report | null,
  clinicId: string | undefined,
): Report | null {
  if (!report || !clinicId) return report;
  const study = DEMO_STUDIES.find((s) => s.id === report.studyId);
  return report.status === "signed" && study?.clinicId === clinicId
    ? report
    : null;
}

/**
 * En-tête que portera le compte-rendu : clinique, ville, logo.
 *
 * L'éditeur le montre verrouillé en tête de la feuille, dans les deux
 * mises en page. Facultatif : un échec laisse l'éditeur sans en-tête,
 * jamais sans texte.
 */
export interface Letterhead {
  organizationName: string;
  city: string | null;
  /** La clinique a son propre en-tête, imprimé à la place de son nom. */
  customHeader: boolean;
  /** Vignette du logo, en URI `data:` ; `null` sans logo. */
  logo: string | null;
  /** Date de l'examen, imprimée avec l'identité du patient (`AAAA-MM-JJ`). */
  studyDate: string | null;
}

/**
 * En-tête d'un compte-rendu, ou `null` s'il n'a pu être lu.
 *
 * @param reportId Compte-rendu concerné.
 */
export async function getLetterhead(
  reportId: string,
): Promise<Letterhead | null> {
  if (isDemoMode()) {
    const report = demoReport((_, rid) => rid === reportId);
    const study = DEMO_STUDIES.find((s) => s.id === report?.studyId);
    if (!study) return null;
    return {
      organizationName: study.clinic,
      city: DEMO_CLINIC_CITIES[study.clinic] ?? null,
      customHeader: false,
      // Les cliniques de démonstration n'ont pas déposé de logo.
      logo: null,
      studyDate: study.receivedAt.toISOString().slice(0, 10),
    };
  }
  try {
    const row = await apiGet(
      `/reports/${encodeURIComponent(reportId)}/letterhead`,
      letterheadSchema,
      { notFoundAsNull: true },
    );
    return row
      ? {
          organizationName: row.organization_name,
          city: row.city,
          customHeader: row.custom_header,
          logo: row.logo,
          studyDate: row.study_date,
        }
      : null;
  } catch {
    return null;
  }
}
