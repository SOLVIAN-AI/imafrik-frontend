/**
 * Grille tarifaire publiée sur la vitrine.
 *
 * Montants en francs CFA, hors taxes, identiques dans les deux langues :
 * ils vivent ici une seule fois, et seuls leurs libellés sont traduits
 * (`pricing.plans` et `pricing.exams` des textes du site). Ils reprennent
 * l'annexe A de la convention établissement du dépôt backend
 * (`services/api/app/assets/agreements/clinic_agreement`) : une
 * modification se fait des deux côtés, sinon la vitrine promet un tarif
 * que le contrat ne porte pas.
 *
 * IMAFRIK ne facture que ces deux postes. L'honoraire du radiologue n'y
 * figure pas : il lui revient en totalité, sans transiter par IMAFRIK.
 */

/** Formules d'abonnement, dans l'ordre d'affichage. */
export const PLAN_IDS = ["essential", "pro", "facility"] as const;

/** Identifiant d'une formule d'abonnement. */
export type PlanId = (typeof PLAN_IDS)[number];

/** Types d'examen soumis au forfait technique, dans l'ordre d'affichage. */
export const EXAM_TYPE_IDS = [
  "radiography",
  "complexRadiography",
  "hysterosalpingography",
  "ct",
  "complexCt",
  "mri",
] as const;

/** Identifiant d'un type d'examen de la grille. */
export type ExamTypeId = (typeof EXAM_TYPE_IDS)[number];

/** Abonnement mensuel d'une formule. */
export type Subscription = {
  /** Prix mensuel, en FCFA HT. */
  monthly: number;
  /** Vrai quand le prix est un plancher : la formule se chiffre sur devis. */
  fromPrice: boolean;
};

/** Forfait technique d'un type d'examen, selon le degré d'urgence. */
export type TechnicalFee = {
  /** Examen demandé en délai normal, en FCFA HT. */
  normal: number;
  /** Examen demandé en urgence, en FCFA HT. */
  urgent: number;
};

/** Prix mensuel de chaque formule. */
export const SUBSCRIPTIONS: Record<PlanId, Subscription> = {
  essential: { monthly: 12_500, fromPrice: false },
  pro: { monthly: 25_000, fromPrice: false },
  facility: { monthly: 100_000, fromPrice: true },
};

/** Forfait technique de chaque type d'examen. */
export const TECHNICAL_FEES: Record<ExamTypeId, TechnicalFee> = {
  radiography: { normal: 300, urgent: 600 },
  complexRadiography: { normal: 500, urgent: 700 },
  hysterosalpingography: { normal: 1_000, urgent: 1_500 },
  ct: { normal: 2_500, urgent: 3_000 },
  complexCt: { normal: 3_500, urgent: 4_500 },
  mri: { normal: 4_000, urgent: 5_000 },
};
