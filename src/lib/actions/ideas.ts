"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getMessages } from "@/i18n/server";
import type { AppMessages } from "@/i18n";
import { apiSend } from "@/lib/api/client";
import { adminIdeaSchema, ideaSchema } from "@/lib/api/contracts";
import type { components } from "@/lib/api/schema";
import {
  type ActionResult,
  demoUnavailable,
  rejectInvalidIds,
  run,
} from "@/lib/actions/result";
import { isDemoMode } from "@/lib/demo/mode";
import {
  IDEA_BENEFITS,
  IDEA_BODY_MAX,
  IDEA_BODY_MIN,
  IDEA_DEVICES,
  IDEA_RESPONSE_MAX,
  IDEA_STATUSES,
  IDEA_TITLE_MAX,
  IDEA_TITLE_MIN,
  type IdeaFieldError,
  appVersionOf,
  cleanTitle,
  ideaScreenOf,
  proposesIdeas,
  validateIdea,
} from "@/lib/ideas";
import { getSession } from "@/lib/session/server";

/**
 * Gestes de « Vos idées » : proposer une idée, et la suivre (équipe
 * IMAFRIK).
 *
 * Les entrées sont validées ici avec les bornes du service, pour un
 * message clair avant l’aller-retour ; le service revérifie tout, et la
 * base applique RLS, les bornes et le plafond de débit. Le contexte
 * joint à une idée est recomposé ici : la clé de l’écran n’est gardée que
 * si l’aide du rôle la connaît, la version est celle du déploiement (lue
 * sur le serveur, jamais reçue du navigateur), l’appareil est l’un des
 * trois types connus. Jamais l’adresse de la page.
 */

/** Corps de `POST /me/ideas`, tel que le contrat le décrit. */
type IdeaCreateBody = components["schemas"]["IdeaCreate"];

/** Corps de `PATCH /admin/ideas/{id}`. */
type IdeaUpdateBody = components["schemas"]["IdeaUpdate"];

const submissionSchema = z.object({
  title: z.string().max(IDEA_TITLE_MAX * 4),
  body: z.string().max(IDEA_BODY_MAX * 2),
  category: z.string().nullable(),
  benefit: z.enum(IDEA_BENEFITS).nullable(),
  screen: z.string().max(40).nullable(),
  device: z.enum(IDEA_DEVICES).nullable(),
  attachContext: z.boolean(),
});

/** Ce que le formulaire envoie. */
export type IdeaSubmission = z.input<typeof submissionSchema>;

/** Le message d’une erreur de validation, dans la langue de l’utilisateur. */
function message(error: IdeaFieldError, t: AppMessages): string {
  const errors = t.ideas.form.errors;
  if (error.field === "category") return errors.category;
  if (error.field === "title")
    return error.problem === "short"
      ? errors.titleShort(IDEA_TITLE_MIN)
      : errors.titleLong(IDEA_TITLE_MAX);
  return error.problem === "short"
    ? errors.bodyShort(IDEA_BODY_MIN)
    : errors.bodyLong(IDEA_BODY_MAX);
}

/**
 * Propose une idée, au nom de l’utilisateur connecté.
 *
 * @returns L’identifiant de l’idée enregistrée.
 */
export async function submitIdea(
  input: IdeaSubmission,
): Promise<ActionResult<{ id: string }>> {
  const { t } = await getMessages();
  const parsed = submissionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: t.common.errors.unexpected, status: 422 };
  }
  const data = parsed.data;
  const broken = validateIdea(data)[0];
  if (broken) return { ok: false, error: message(broken, t), status: 422 };
  if (isDemoMode()) return await demoUnavailable(t.ideas.demoActions.submit);

  const session = await getSession();
  if (!session || !proposesIdeas(session.active.role)) {
    return { ok: false, error: t.common.errors.unexpected, status: 403 };
  }
  const screen = data.attachContext
    ? (ideaScreenOf(session.active.role, data.screen ?? undefined)?.key ?? null)
    : null;
  const body: IdeaCreateBody = {
    title: cleanTitle(data.title),
    body: data.body.trim(),
    category: data.category as IdeaCreateBody["category"],
    benefit: data.benefit,
    screen,
    app_version: data.attachContext ? appVersionOf(process.env) : null,
    device: data.attachContext ? data.device : null,
  };
  const result = await run(async () => {
    const idea = await apiSend("/me/ideas", "POST", body, ideaSchema);
    return { id: idea.id };
  });
  revalidatePath("/idees");
  return result;
}

const trackingSchema = (t: AppMessages) =>
  z.object({
    ideaId: z.string().min(1),
    status: z.enum(IDEA_STATUSES).optional(),
    response: z
      .string()
      .max(
        IDEA_RESPONSE_MAX,
        t.ideas.form.errors.responseLong(IDEA_RESPONSE_MAX),
      )
      .nullable()
      .optional(),
    duplicateOf: z.string().min(1).nullable().optional(),
  });

/** Ce que l’équipe IMAFRIK change à une idée ; un champ absent reste tel quel. */
export type IdeaTracking = z.input<ReturnType<typeof trackingSchema>>;

/**
 * Change l’état d’une idée, y répond ou la regroupe avec une autre.
 *
 * Le service trace chaque geste et prévient l’auteur par courriel quand
 * l’état change ou qu’on lui répond.
 */
export async function trackIdea(input: IdeaTracking): Promise<ActionResult> {
  const { t } = await getMessages();
  const parsed = trackingSchema(t).safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message, status: 422 };
  }
  if (isDemoMode()) return await demoUnavailable(t.ideas.demoActions.tracking);

  const { ideaId, status, response, duplicateOf } = parsed.data;
  const invalid = await rejectInvalidIds(
    ideaId,
    ...(duplicateOf ? [duplicateOf] : []),
  );
  if (invalid) return invalid;
  const body: IdeaUpdateBody = {};
  if (status !== undefined) body.status = status;
  if (response !== undefined) body.response = response?.trim() || null;
  if (duplicateOf !== undefined) body.duplicate_of = duplicateOf;
  const result = await run(async () => {
    await apiSend(
      `/admin/ideas/${encodeURIComponent(ideaId)}`,
      "PATCH",
      body,
      adminIdeaSchema,
    );
    return undefined;
  });
  revalidatePath("/admin/idees");
  revalidatePath("/admin");
  return result;
}
