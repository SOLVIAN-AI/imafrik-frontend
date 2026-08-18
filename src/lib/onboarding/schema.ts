import { z } from "zod";

/**
 * Schémas de validation, une section à la fois.
 *
 * **Pourquoi par section et non pour le formulaire entier.** La mise en
 * service se déroule en plusieurs étapes, parfois sur plusieurs jours et
 * à plusieurs personnes — le directeur remplit l'identité, le technicien
 * branche le PACS. Valider l'ensemble d'un coup empêcherait d'avancer
 * tant qu'une information manque, alors que chaque étape est utile
 * séparément.
 *
 * Les messages sont rédigés à l'impératif et disent quoi faire, jamais
 * « champ invalide » : à ce stade, l'utilisateur découvre le service et
 * chaque impasse est une occasion d'abandonner.
 */

/** Un AET DICOM : 16 caractères ASCII au plus, sans espace ni accent. */
const AET = z
  .string()
  .min(2, "Indiquez l’AET configuré sur votre PACS.")
  .max(16, "Un AET ne peut pas dépasser 16 caractères.")
  .regex(
    /^[A-Za-z0-9_-]+$/,
    "Lettres, chiffres, tiret et tiret bas uniquement — la norme DICOM n’accepte rien d’autre.",
  );

// ─── Clinique ──────────────────────────────────────────────────────

export const facilitySchema = z.object({
  name: z.string().min(2, "Indiquez le nom de l’établissement."),
  city: z.string().min(2, "Indiquez la ville."),
  address: z.string().min(5, "Indiquez l’adresse postale."),
  contactName: z.string().min(3, "Indiquez le responsable médical à contacter."),
  contactPhone: z
    .string()
    .min(8, "Un numéro joignable est indispensable pour les urgences."),
});

export const pacsSchema = z.object({
  callingAet: AET,
  vendor: z.string().optional(),
  technicianEmail: z
    .string()
    .email("Adresse invalide.")
    .optional()
    .or(z.literal("")),
});

export const teamSchema = z.object({
  invites: z.string().optional(),
});

// ─── Radiologue ────────────────────────────────────────────────────

export const profileSchema = z.object({
  fullName: z.string().min(3, "Indiquez votre nom complet."),
  title: z.string().min(2, "Indiquez votre titre — il figurera sur vos comptes-rendus."),
  specialties: z
    .array(z.string())
    .min(1, "Choisissez au moins une modalité que vous lisez."),
});

export const qualificationsSchema = z.object({
  licenseNumber: z
    .string()
    .min(3, "Le numéro d’ordre est obligatoire pour signer un compte-rendu."),
  licenseCountry: z.string().min(2, "Indiquez le pays d’inscription."),
  insurer: z.string().optional(),
});

export const signatureSchema = z.object({
  signatureBlock: z
    .string()
    .min(10, "Ce bloc apparaît sous votre nom : rédigez-le entièrement."),
});

export const preferencesSchema = z.object({
  availability: z.string().min(1, "Choisissez une disponibilité."),
  urgentAlerts: z.boolean(),
});

/** Brouillon complet, toutes étapes confondues. */
export type OnboardingDraft = Partial<
  z.infer<typeof facilitySchema> &
    z.infer<typeof pacsSchema> &
    z.infer<typeof teamSchema> &
    z.infer<typeof profileSchema> &
    z.infer<typeof qualificationsSchema> &
    z.infer<typeof signatureSchema> &
    z.infer<typeof preferencesSchema>
>;
