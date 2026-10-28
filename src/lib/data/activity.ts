import "server-only";

import { ApiError, apiGet } from "@/lib/api/client";
import {
  billingMonthSchema,
  clinicMonthActivitySchema,
  clinicPlanSchema,
  clinicStatementSchema,
  performanceMonthSchema,
} from "@/lib/api/contracts";
import {
  type BillingMonth,
  type ClinicPlan,
  type MonthActivity,
  type Statement,
  toBillingMonth,
  toClinicPlan,
  toMonthActivity,
  toStatement,
} from "@/lib/billing";
import {
  demoBillingMonth,
  demoClinicPlan,
  demoMonthActivity,
  demoStatement,
} from "@/lib/demo/billing";
import { clinicViewApi } from "@/lib/clinic-view";
import { isDemoMode } from "@/lib/demo/mode";
import { demoPerformance } from "@/lib/demo/performance";
import { type PerformanceMonth, toPerformanceMonth } from "@/lib/performance";
import { getSession } from "@/lib/session/server";

/**
 * Activité et facturation d'une clinique.
 *
 * Le responsable lit celles de sa clinique active (le service les borne à
 * elle) ; l'équipe IMAFRIK lit les relevés de toutes les cliniques et la
 * formule de chacune. En démonstration, les réponses synthétiques de
 * `lib/demo/billing.ts` passent par la même traduction que les vraies.
 */

const query = (month: string) => `?month=${encodeURIComponent(month)}`;

/** Clinique active de la démonstration. */
async function demoClinicId(): Promise<string> {
  const session = await getSession();
  return session!.active.organizationId;
}

/**
 * L'activité de la clinique active sur un mois.
 *
 * @param month    Mois `AAAA-MM`, pas à venir.
 * @param clinicId Clinique consultée par l'équipe IMAFRIK (vue des
 *                 cliniques) : la même activité que lit son responsable.
 */
export async function getMonthActivity(
  month: string,
  clinicId?: string,
): Promise<MonthActivity> {
  const row = isDemoMode()
    ? demoMonthActivity(clinicId ?? (await demoClinicId()), month)
    : await apiGet(
        clinicId
          ? `${clinicViewApi(clinicId)}/activity${query(month)}`
          : `/organization/activity${query(month)}`,
        clinicMonthActivitySchema,
      );
  return toMonthActivity(row);
}

/**
 * Les performances des radiologues de la clinique active sur un mois.
 *
 * Réservées à ses responsables : le service refuse un radiologue.
 *
 * @param month Mois `AAAA-MM`, pas à venir.
 */
export async function getPerformance(month: string): Promise<PerformanceMonth> {
  const row = isDemoMode()
    ? demoPerformance(month, await demoClinicId())
    : await apiGet(
        `/organization/performance${query(month)}`,
        performanceMonthSchema,
      );
  return toPerformanceMonth(row);
}

/**
 * Les performances des radiologues, pour une clinique ou tout le réseau
 * (équipe IMAFRIK).
 *
 * @param month    Mois `AAAA-MM`, pas à venir.
 * @param clinicId Clinique, ou `null` pour tout le réseau.
 */
export async function getNetworkPerformance(
  month: string,
  clinicId: string | null,
): Promise<PerformanceMonth> {
  const clinic = clinicId ? `&clinic_id=${encodeURIComponent(clinicId)}` : "";
  const row = isDemoMode()
    ? demoPerformance(month, clinicId)
    : await apiGet(
        `/admin/performance${query(month)}${clinic}`,
        performanceMonthSchema,
      );
  return toPerformanceMonth(row);
}

/**
 * Le relevé de facturation de la clinique active pour un mois.
 *
 * @param month    Mois `AAAA-MM`, pas à venir.
 * @param clinicId Clinique consultée par l'équipe IMAFRIK (vue des
 *                 cliniques) : le même relevé que lit son responsable.
 * @returns Le relevé, ou `null` pour un mois clos avant l'arrivée de la
 *          clinique.
 */
export async function getStatement(
  month: string,
  clinicId?: string,
): Promise<Statement | null> {
  if (isDemoMode()) {
    return toStatement(
      demoStatement(clinicId ?? (await demoClinicId()), month),
    );
  }
  try {
    return toStatement(
      await apiGet(
        clinicId
          ? `${clinicViewApi(clinicId)}/billing${query(month)}`
          : `/organization/billing${query(month)}`,
        clinicStatementSchema,
      ),
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/**
 * Les relevés d'un mois pour toutes les cliniques (équipe IMAFRIK).
 *
 * @param month Mois `AAAA-MM`, pas à venir.
 */
export async function getBillingMonth(month: string): Promise<BillingMonth> {
  const row = isDemoMode()
    ? demoBillingMonth(month)
    : await apiGet(
        `/admin/billing/statements${query(month)}`,
        billingMonthSchema,
      );
  return toBillingMonth(row);
}

/**
 * La formule d'abonnement d'une clinique (équipe IMAFRIK).
 *
 * @returns La formule, ou `null` tant qu'elle n'est pas renseignée.
 */
export async function getClinicPlan(
  clinicId: string,
): Promise<ClinicPlan | null> {
  const row = isDemoMode()
    ? demoClinicPlan(clinicId)
    : await apiGet(
        `/admin/clinics/${encodeURIComponent(clinicId)}/plan`,
        clinicPlanSchema.nullable(),
      );
  return row ? toClinicPlan(row) : null;
}
