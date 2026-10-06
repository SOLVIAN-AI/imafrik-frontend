import "server-only";

import { apiGet } from "@/lib/api/client";
import { verificationSchema } from "@/lib/api/contracts";
import { isDemoMode } from "@/lib/demo/mode";
import { DEMO_REPORTS } from "@/lib/demo/reports";
import { DEMO_STUDIES } from "@/lib/demo/studies";

/**
 * Ce qu'atteste la vérification publique.
 *
 * **Volontairement pauvre.** Le code est imprimé sur un document qui
 * circule : il peut être lu par n'importe qui. La page confirme donc
 * qu'un compte-rendu existe, qui l'a signé et quand — jamais l'identité
 * du patient ni le contenu du document. L'initiale du nom suffit à
 * recouper avec l'exemplaire en main.
 */
export interface Verification {
  /** Titre et nom du signataire, figés à la signature. */
  radiologist: string;
  licenseNumber: string | null;
  signedAt: Date;
  modality: string | null;
  studyDate: Date | null;
  clinic: string;
  patientInitial: string | null;
  /**
   * Empreinte SHA-256 du PDF. Le porteur du document la compare à celle
   * de son exemplaire : c'est ce qui prouve qu'il n'a pas été modifié.
   */
  sha256: string | null;
  /**
   * Corrections apportées depuis la signature. Le document imprimé reste
   * authentique ; la page dit seulement qu'il a été complété — le contenu
   * des addenda, médical, n'est pas public.
   */
  addendaCount: number;
  token: string;
}

/**
 * Vérifie un code de compte-rendu.
 *
 * Le code est transmis tel quel : c'est un jeton aléatoire, sensible à la
 * casse, lu dans le QR code — pas recopié à la main.
 *
 * @param token Code lu sur le document.
 * @returns L'attestation, ou `null` si le code ne correspond à aucun
 *          compte-rendu signé.
 * @throws ApiError si le service est en panne : « introuvable » et
 *         « indisponible » ne doivent pas se confondre sur une page qui
 *         dit à un tiers si un document est authentique.
 */
export async function verifyReport(
  token: string,
): Promise<Verification | null> {
  if (isDemoMode()) {
    const report = DEMO_REPORTS.find(
      (candidate) => candidate.verifyToken === token,
    );
    const study = report
      ? DEMO_STUDIES.find((candidate) => candidate.id === report.studyId)
      : undefined;
    if (!report || !study) return null;
    return {
      radiologist: report.signedBy,
      licenseNumber: null,
      signedAt: report.signedAt,
      modality: study.modality,
      studyDate: study.receivedAt,
      clinic: study.clinic,
      patientInitial: study.patientName ? `${study.patientName[0]}.` : null,
      sha256: null,
      addendaCount: 0,
      token,
    };
  }

  const result = await apiGet(
    `/verify/${encodeURIComponent(token)}`,
    verificationSchema,
    {
      notFoundAsNull: true,
    },
  );
  if (!result || !result.valid) return null;
  return {
    radiologist: result.radiologist,
    licenseNumber: result.license_number,
    signedAt: new Date(result.signed_at),
    modality: result.modality,
    studyDate: result.study_date ? new Date(result.study_date) : null,
    clinic: result.clinic,
    patientInitial: result.patient_initial,
    sha256: result.sha256,
    addendaCount: result.addenda_count,
    token,
  };
}
