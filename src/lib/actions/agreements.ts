"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { apiSend } from "@/lib/api/client";
import {
  type AgreementAcceptanceBody,
  agreementAcceptanceSchema,
  agreementKindSchema,
} from "@/lib/api/contracts";
import { type ActionResult, demoUnavailable, run } from "@/lib/actions/result";
import {
  AGREEMENT_VERSION,
  type AgreementAcceptanceInput,
  SHA256_HEX,
  SIGNATORY_CAPACITY_MAX_LENGTH,
  acceptanceProblem,
} from "@/lib/agreements";
import { isDemoMode } from "@/lib/demo/mode";
import { getMessages } from "@/i18n/server";

/** Ce que le navigateur peut envoyer : rien de plus que l'écran ne saisit. */
const acceptanceInput = z.object({
  kind: agreementKindSchema,
  version: z.string().regex(AGREEMENT_VERSION),
  sha256: z.string().regex(SHA256_HEX),
  signatoryCapacity: z.string().max(SIGNATORY_CAPACITY_MAX_LENGTH).optional(),
  declaresAuthority: z.boolean().optional(),
});

/**
 * Accepte un engagement : le contrat du radiologue, ou la convention de
 * l'établissement.
 *
 * L'écran renvoie la **version et l'empreinte du texte qu'il a affiché**.
 * Si une nouvelle version a été publiée entre l'affichage et le clic, le
 * service refuse (409) : on n'accepte jamais un texte qu'on n'a pas eu
 * sous les yeux. L'écran relit alors le texte en vigueur.
 *
 * Le service horodate l'acceptation, la rattache au compte (et, pour une
 * convention, à l'établissement), et l'inscrit au journal d'audit.
 *
 * @param input Acceptation saisie.
 */
export async function acceptAgreement(
  input: AgreementAcceptanceInput,
): Promise<ActionResult> {
  const { t } = await getMessages();
  const parsed = acceptanceInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: t.common.errors.invalidRequest, status: 422 };
  }
  const problem = acceptanceProblem(parsed.data);
  if (problem) {
    return { ok: false, error: t.agreements.problems[problem], status: 422 };
  }
  if (isDemoMode()) return demoUnavailable(t.agreements.demoAction);

  const body: AgreementAcceptanceBody = {
    kind: parsed.data.kind,
    version: parsed.data.version,
    sha256: parsed.data.sha256,
    ...(parsed.data.kind === "clinic_agreement"
      ? {
          signatory_capacity: parsed.data.signatoryCapacity?.trim(),
          declares_authority: parsed.data.declaresAuthority === true,
        }
      : {}),
  };
  const result = await run(async () => {
    await apiSend("/me/agreements", "POST", body, agreementAcceptanceSchema);
    return undefined;
  });
  // La garde de l'application relit les engagements dus.
  revalidatePath("/", "layout");
  return result;
}
