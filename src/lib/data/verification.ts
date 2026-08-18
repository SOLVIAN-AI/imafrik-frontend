import { apiFetch, isApiConfigured } from "@/lib/api/client";
import { DEMO_REPORTS } from "@/lib/demo/reports";
import { DEMO_STUDIES } from "@/lib/demo/studies";
import { z } from "zod";

/**
 * Ce qu'atteste la vérification publique.
 *
 * **Volontairement pauvre.** Le code est imprimé sur un document qui
 * circule : il peut être lu par n'importe qui. La page confirme donc
 * qu'un compte-rendu existe, qui l'a signé et quand — jamais l'identité
 * du patient ni le contenu du document.
 */
export interface Verification {
  signedBy: string;
  signerTitle: string;
  signedAt: Date;
  modality: string;
  bodyPart: string | null;
  clinic: string;
  token: string;
}

const verificationSchema = z.object({
  signed_by: z.string(),
  signer_title: z.string(),
  signed_at: z.string().transform((value) => new Date(value)),
  modality: z.string(),
  body_part: z.string().nullable().default(null),
  clinic_name: z.string(),
});

/**
 * Vérifie un code de compte-rendu.
 *
 * La comparaison ignore la casse et les tirets : le code est recopié à
 * la main depuis un papier, souvent mal.
 *
 * @param token Code lu sur le document.
 * @returns L'attestation, ou `null` si le code est inconnu.
 */
export async function verifyReport(
  token: string,
): Promise<Verification | null> {
  const normalized = token.replaceAll("-", "").toUpperCase();

  if (!isApiConfigured()) {
    const report = DEMO_REPORTS.find(
      (candidate) =>
        candidate.verifyToken.replaceAll("-", "").toUpperCase() === normalized,
    );
    const study = report
      ? DEMO_STUDIES.find((candidate) => candidate.id === report.studyId)
      : undefined;
    if (!report || !study) return null;

    return {
      signedBy: report.signedBy,
      signerTitle: report.signerTitle,
      signedAt: report.signedAt,
      modality: study.modality,
      bodyPart: study.bodyPart,
      clinic: study.clinic,
      token: report.verifyToken,
    };
  }

  try {
    const raw = await apiFetch<unknown>(`/verify/${encodeURIComponent(token)}`);
    const parsed = verificationSchema.parse(raw);
    return {
      signedBy: parsed.signed_by,
      signerTitle: parsed.signer_title,
      signedAt: parsed.signed_at,
      modality: parsed.modality,
      bodyPart: parsed.body_part,
      clinic: parsed.clinic_name,
      token,
    };
  } catch {
    return null;
  }
}
