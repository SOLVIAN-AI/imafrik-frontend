import { z } from "zod";

/**
 * Ce que le frontend attend réellement de l'API.
 *
 * **Pourquoi des schémas ici alors que les types sont générés.** Les
 * routes `/studies` du service déclarent aujourd'hui un objet libre
 * (`additionalProperties: true`) : la génération produit donc un
 * `Record<string, unknown>`, sans garantie de forme. Tant que le backend
 * ne publie pas de modèles de réponse, ces schémas tiennent le contrat
 * côté client.
 *
 * Même une fois les types publiés, la validation au passage de la
 * frontière garde sa valeur : un type TypeScript est effacé à
 * l'exécution, et une réponse qui change de forme après un déploiement
 * ne provoquerait qu'un `undefined` silencieux au milieu d'un écran —
 * ici, une erreur nette, à l'endroit exact du problème.
 *
 * ⚠️ À faire côté backend : déclarer les modèles de réponse Pydantic de
 * `GET /studies` et `GET /studies/{id}`, puis régénérer le contrat avec
 * `npm run api:types`.
 */

/** Les cinq états d'un examen (`study_status` en base). */
export const studyStatusSchema = z.enum([
  "received",
  "assigned",
  "in_progress",
  "reported",
  "delivered",
]);

/**
 * Un examen tel que la worklist l'affiche.
 *
 * Les dates arrivent en chaîne ISO et sont converties ici : plus loin
 * dans l'application, on ne manipule que des `Date`.
 */
export const studySchema = z.object({
  id: z.string(),
  study_instance_uid: z.string(),
  patient_name: z.string(),
  patient_id: z.string(),
  modality: z.string(),
  body_part: z.string().nullable().default(null),
  description: z.string().nullable().default(null),
  clinic_name: z.string(),
  status: studyStatusSchema,
  urgent: z.boolean().default(false),
  series_count: z.number().int().default(0),
  instance_count: z.number().int().default(0),
  received_at: z.string().transform((value) => new Date(value)),
  assigned_to: z.string().nullable().default(null),
});

export const studyListSchema = z.object({
  items: z.array(studySchema),
  total: z.number().int().optional(),
});

/** Les cinq sections d'un compte-rendu, telles que le schéma les range. */
export const reportSectionsSchema = z.object({
  indication: z.string().default(""),
  technique: z.string().default(""),
  comparatif: z.string().default(""),
  resultats: z.string().default(""),
  conclusion: z.string().default(""),
});

export const reportSchema = z.object({
  id: z.string(),
  study_id: z.string(),
  status: z.enum(["draft", "signed"]),
  sections: reportSectionsSchema,
  signed_at: z
    .string()
    .nullable()
    .default(null)
    .transform((value) => (value ? new Date(value) : null)),
  signed_by: z.string().nullable().default(null),
  signer_title: z.string().nullable().default(null),
  verify_token: z.string().nullable().default(null),
});

/** Jeton de visualisation, à durée de vie courte. */
export const viewerTokenSchema = z.object({
  viewer_url: z.string(),
  expires_in: z.number().int(),
});

export type ApiStudy = z.infer<typeof studySchema>;
export type ApiReport = z.infer<typeof reportSchema>;
