import type { ReportSections } from "@/components/editor/report-editor";
import { apiFetch, isApiConfigured } from "@/lib/api/client";
import { reportSchema, type ApiReport } from "@/lib/api/contracts";
import { DEMO_REPORTS } from "@/lib/demo/reports";

/** Un compte-rendu, tel que l'interface le manipule. */
export interface Report {
  id: string;
  studyId: string;
  status: "draft" | "signed";
  sections: ReportSections;
  signedAt: Date | null;
  signedBy: string | null;
  signerTitle: string | null;
  verifyToken: string | null;
}

function toReport(row: ApiReport): Report {
  return {
    id: row.id,
    studyId: row.study_id,
    status: row.status,
    sections: row.sections,
    signedAt: row.signed_at,
    signedBy: row.signed_by,
    signerTitle: row.signer_title,
    verifyToken: row.verify_token,
  };
}

/**
 * Le compte-rendu d'un examen, brouillon ou signé.
 *
 * Il n'y en a qu'un par examen : les corrections après signature
 * prennent la forme d'un addendum, jamais d'une seconde version — un
 * document signé est verrouillé en base par un déclencheur.
 */
export async function getReportForStudy(
  studyId: string,
): Promise<Report | null> {
  if (!isApiConfigured()) {
    const found = DEMO_REPORTS.find((report) => report.studyId === studyId);
    return found
      ? {
          id: found.id,
          studyId: found.studyId,
          status: "signed",
          sections: found.sections,
          signedAt: found.signedAt,
          signedBy: found.signedBy,
          signerTitle: found.signerTitle,
          verifyToken: found.verifyToken,
        }
      : null;
  }

  try {
    const raw = await apiFetch<unknown>(`/studies/${studyId}/report`);
    return toReport(reportSchema.parse(raw));
  } catch {
    return null;
  }
}

/** Un compte-rendu par son identifiant. */
export async function getReport(id: string): Promise<Report | null> {
  if (!isApiConfigured()) {
    const found = DEMO_REPORTS.find((report) => report.id === id);
    return found
      ? {
          id: found.id,
          studyId: found.studyId,
          status: "signed",
          sections: found.sections,
          signedAt: found.signedAt,
          signedBy: found.signedBy,
          signerTitle: found.signerTitle,
          verifyToken: found.verifyToken,
        }
      : null;
  }

  try {
    const raw = await apiFetch<unknown>(`/reports/${id}`);
    return toReport(reportSchema.parse(raw));
  } catch {
    return null;
  }
}
