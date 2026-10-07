"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ReportSections } from "@/components/editor/report-editor";
import { apiSend } from "@/lib/api/client";
import { templateSchema } from "@/lib/api/contracts";
import {
  type ActionResult,
  demoUnavailable,
  run,
  rejectInvalidIds,
} from "@/lib/actions/result";
import { isDemoMode } from "@/lib/demo/mode";

/**
 * Modèles de comptes-rendus de l'organisation.
 *
 * Un radiologue crée un modèle à partir d'un compte-rendu qu'il rédige —
 * c'est là que se trouve un texte « normal » qu'il voudra réutiliser — et
 * supprime ceux de son organisation. Les modèles fournis par IMAFRIK ne
 * se suppriment pas ; le service s'en assure.
 */

const createSchema = z.object({
  name: z.string().trim().min(1, "Donnez un nom au modèle").max(200),
  modality: z.string().trim().max(16),
  bodyPart: z.string().trim().max(100),
});

/** Champs saisis à la création d'un modèle. */
export type TemplateInput = z.input<typeof createSchema>;

/**
 * Crée un modèle à partir des sections fournies.
 *
 * @param input    Nom, modalité et région.
 * @param sections Texte des cinq sections.
 */
export async function createTemplate(
  input: TemplateInput,
  sections: ReportSections,
): Promise<ActionResult> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message, status: 422 };
  if (isDemoMode()) return demoUnavailable("La création d’un modèle");

  const result = await run(async () => {
    await apiSend(
      "/templates",
      "POST",
      {
        name: parsed.data.name,
        modality: parsed.data.modality || null,
        body_part: parsed.data.bodyPart || null,
        sections,
      },
      templateSchema,
    );
    return undefined;
  });
  revalidatePath("/modeles");
  return result;
}

/** Supprime un modèle de l'organisation. */
export async function deleteTemplate(
  templateId: string,
): Promise<ActionResult> {
  if (isDemoMode()) return demoUnavailable("La suppression d’un modèle");
  const invalid = await rejectInvalidIds(templateId);
  if (invalid) return invalid;
  const result = await run(async () => {
    await apiSend(`/templates/${encodeURIComponent(templateId)}`, "DELETE");
    return undefined;
  });
  revalidatePath("/modeles");
  return result;
}
