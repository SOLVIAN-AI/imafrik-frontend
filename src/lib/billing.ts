import type { AppMessages } from "@/i18n";
import type {
  ApiBillingMonth,
  ApiClinicMonthActivity,
  ApiClinicPlan,
  ApiClinicStatement,
  FeeClass,
  ModalityGroup,
  Plan,
} from "@/lib/api/contracts";
import { formatPersonName } from "@/lib/format";

/**
 * Activité et facturation d'une clinique, dans le vocabulaire de l'interface.
 *
 * Module pur : ni rendu ni requête. Il traduit les réponses du service
 * (`/organization/activity`, `/organization/billing`,
 * `/admin/billing/statements`) et fabrique l'export CSV d'un relevé.
 *
 * **Aucun montant n'est calculé ici.** Le relevé arrive chiffré du
 * service, qui tient la grille de la convention et le seul calcul que
 * lisent la clinique et l'équipe IMAFRIK : l'écran ne fait qu'afficher.
 */

/** Types d'examen de la grille, dans l'ordre de la convention. */
export const FEE_CLASSES: readonly FeeClass[] = [
  "radiography",
  "complex_radiography",
  "hysterosalpingography",
  "ct",
  "complex_ct",
  "mri",
];

/** Formules d'abonnement, dans l'ordre de la grille. */
export const PLANS: readonly Plan[] = ["essential", "pro", "facility"];

/** Examens d'une priorité reçus dans le mois. */
export interface PriorityActivity {
  received: number;
  signed: number;
  medianMinutes: number | null;
  withinSla: number | null;
}

/** L'activité d'une clinique sur un mois : les examens reçus ce mois-là. */
export interface MonthActivity {
  /** Mois `AAAA-MM`. */
  month: string;
  slaRoutineMinutes: number;
  slaUrgentMinutes: number;
  received: number;
  signed: number;
  pending: number;
  /** Délai médian réception → compte-rendu signé, en minutes. */
  medianMinutes: number | null;
  /** Part signée dans le délai promis, de 0 à 1. */
  withinSla: number | null;
  routine: PriorityActivity;
  urgent: PriorityActivity;
  byModality: {
    group: ModalityGroup;
    routine: number;
    urgent: number;
    signed: number;
    medianMinutes: number | null;
    withinSla: number | null;
  }[];
  byRadiologist: {
    id: string;
    /** Titre et nom : « Dr Adjo Kponton ». */
    name: string;
    signed: number;
    urgent: number;
    medianMinutes: number | null;
    medianReadingMinutes: number | null;
    withinSla: number | null;
  }[];
}

/** Forfaits techniques d'un type d'examen. */
export interface StatementLine {
  feeClass: FeeClass;
  routine: number;
  urgent: number;
  routineFee: number;
  urgentFee: number;
  amount: number;
}

/** Le relevé de facturation d'une clinique pour un mois. */
export interface Statement {
  clinicId: string;
  clinic: string;
  /** Mois `AAAA-MM`. */
  month: string;
  /** Clôture du mois ; `null` tant qu'il est ouvert (relevé provisoire). */
  closedAt: Date | null;
  /** Formule ; `null` tant que l'équipe IMAFRIK ne l'a pas renseignée. */
  plan: Plan | null;
  /** Abonnement du mois, FCFA HT ; `null` sans formule. */
  subscription: number | null;
  lines: StatementLine[];
  /** Actes des modalités absentes de la grille : sans forfait. */
  outOfGrid: { group: ModalityGroup; routine: number; urgent: number }[];
  /** Actes facturés : examens reçus dans le mois, compte-rendu signé. */
  acts: number;
  /** Examens reçus sans compte-rendu signé : non facturés. */
  unreported: number;
  /** Actes signés par radiologue : la base de ses honoraires. */
  radiologists: { id: string; name: string; routine: number; urgent: number }[];
  technicalTotal: number;
  /** Abonnement et forfaits, FCFA HT ; `null` sans formule. */
  total: number | null;
}

/** Les relevés d'un mois, toutes cliniques. */
export interface BillingMonth {
  month: string;
  closedAt: Date | null;
  /** Vrai si l'équipe peut clore ce mois maintenant. */
  closable: boolean;
  statements: Statement[];
}

/** La formule d'abonnement d'une clinique. */
export interface ClinicPlan {
  plan: Plan;
  monthlyFee: number;
  setAt: Date;
}

const monthOf = (isoDate: string) => isoDate.slice(0, 7);

/** L'activité du service, dans le vocabulaire de l'interface. */
export function toMonthActivity(api: ApiClinicMonthActivity): MonthActivity {
  const priority = (row: ApiClinicMonthActivity["routine"]) => ({
    received: row.received,
    signed: row.signed,
    medianMinutes: row.median_minutes,
    withinSla: row.within_sla,
  });
  return {
    month: monthOf(api.month),
    slaRoutineMinutes: api.sla_routine_minutes,
    slaUrgentMinutes: api.sla_urgent_minutes,
    received: api.received,
    signed: api.signed,
    pending: api.pending,
    medianMinutes: api.median_minutes,
    withinSla: api.within_sla,
    routine: priority(api.routine),
    urgent: priority(api.urgent),
    byModality: api.by_modality.map((row) => ({
      group: row.modality_group,
      routine: row.routine,
      urgent: row.urgent,
      signed: row.signed,
      medianMinutes: row.median_minutes,
      withinSla: row.within_sla,
    })),
    byRadiologist: api.by_radiologist.map((row) => ({
      id: row.profile_id,
      name: formatPersonName(row.title, row.full_name),
      signed: row.signed,
      urgent: row.urgent,
      medianMinutes: row.median_minutes,
      medianReadingMinutes: row.median_reading_minutes,
      withinSla: row.within_sla,
    })),
  };
}

/** Le relevé du service, dans le vocabulaire de l'interface. */
export function toStatement(api: ApiClinicStatement): Statement {
  return {
    clinicId: api.clinic_id,
    clinic: api.clinic,
    month: monthOf(api.month),
    closedAt: api.closed_at ? new Date(api.closed_at) : null,
    plan: api.plan,
    subscription: api.subscription,
    lines: api.lines.map((line) => ({
      feeClass: line.fee_class,
      routine: line.routine,
      urgent: line.urgent,
      routineFee: line.routine_fee,
      urgentFee: line.urgent_fee,
      amount: line.amount,
    })),
    outOfGrid: api.out_of_grid.map((row) => ({
      group: row.modality_group,
      routine: row.routine,
      urgent: row.urgent,
    })),
    acts: api.acts,
    unreported: api.unreported,
    radiologists: api.radiologists.map((row) => ({
      id: row.profile_id,
      name: formatPersonName(row.title, row.full_name),
      routine: row.routine,
      urgent: row.urgent,
    })),
    technicalTotal: api.technical_total,
    total: api.total,
  };
}

/** Les relevés d'un mois, dans le vocabulaire de l'interface. */
export function toBillingMonth(api: ApiBillingMonth): BillingMonth {
  return {
    month: monthOf(api.month),
    closedAt: api.closed_at ? new Date(api.closed_at) : null,
    closable: api.closable,
    statements: api.statements.map(toStatement),
  };
}

/** La formule du service, dans le vocabulaire de l'interface. */
export function toClinicPlan(api: ApiClinicPlan): ClinicPlan {
  return {
    plan: api.plan,
    monthlyFee: api.monthly_fee,
    setAt: new Date(api.set_at),
  };
}

type BillingText = AppMessages["clinic"]["activity"]["billing"];
type ModalityLabels = AppMessages["assignment"]["modalities"];

/** Une ligne de l'export CSV d'un relevé. */
export type StatementCsvRow = (string | number | null)[];

/**
 * Lignes de l'export CSV d'un relevé : abonnement, forfaits par type
 * d'examen, hors grille, non facturés, actes par radiologue et total.
 *
 * Les montants restent des nombres bruts, sans séparateur de milliers :
 * le fichier se relit dans un tableur. Aucune donnée du patient.
 *
 * @param statement Relevé.
 * @param text      Textes de la facturation (`clinic.activity.billing`).
 * @param groups    Noms des groupes de modalités.
 * @param withClinic Préfixer chaque ligne du nom de la clinique (export
 *                   de l'équipe IMAFRIK, toutes cliniques).
 */
export function statementCsvRows(
  statement: Statement,
  text: BillingText,
  groups: ModalityLabels,
  withClinic = false,
): StatementCsvRow[] {
  const csv = text.csv;
  const rows: StatementCsvRow[] = [
    [
      csv.subscription,
      statement.plan ? text.plans[statement.plan] : text.noPlan,
      null,
      null,
      null,
      null,
      statement.subscription,
    ],
    ...statement.lines.map((line) => [
      csv.technicalFee,
      text.feeClasses[line.feeClass],
      line.routine + line.urgent,
      line.urgent,
      line.routineFee,
      line.urgentFee,
      line.amount,
    ]),
    ...statement.outOfGrid.map((row) => [
      csv.outOfGrid,
      groups[row.group],
      row.routine + row.urgent,
      row.urgent,
      null,
      null,
      null,
    ]),
    ...(statement.unreported > 0
      ? [
          [
            csv.unreported,
            csv.unreportedDetail,
            statement.unreported,
            null,
            null,
            null,
            null,
          ],
        ]
      : []),
    ...statement.radiologists.map((row) => [
      csv.fees,
      row.name,
      row.routine + row.urgent,
      row.urgent,
      null,
      null,
      null,
    ]),
    [csv.total, null, statement.acts, null, null, null, statement.total],
  ];
  return rows.map((row) =>
    withClinic
      ? [statement.month, statement.clinic, ...row]
      : [statement.month, ...row],
  );
}

/**
 * Somme des relevés d'un mois, pour l'équipe IMAFRIK.
 *
 * `total` ne compte que les cliniques dont la formule est renseignée ;
 * `missingPlans` dit combien en manquent.
 */
export function sumStatements(statements: readonly Statement[]) {
  return statements.reduce(
    (sum, statement) => ({
      acts: sum.acts + statement.acts,
      unreported: sum.unreported + statement.unreported,
      technical: sum.technical + statement.technicalTotal,
      total: sum.total + (statement.total ?? 0),
      missingPlans: sum.missingPlans + (statement.plan === null ? 1 : 0),
    }),
    { acts: 0, unreported: 0, technical: 0, total: 0, missingPlans: 0 },
  );
}
