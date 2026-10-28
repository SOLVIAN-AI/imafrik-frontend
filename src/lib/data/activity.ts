import "server-only";

import { ApiError, apiGet } from "@/lib/api/client";
import {
  billingMonthSchema,
  clinicMonthActivitySchema,
  clinicPlanSchema,
  clinicStatementSchema,
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
import { isDemoMode } from "@/lib/demo/mode";
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
 * @param month Mois `AAAA-MM`, pas à venir.
 */
export async function getMonthActivity(month: string): Promise<MonthActivity> {
  const row = isDemoMode()
    ? demoMonthActivity(await demoClinicId(), month)
    : await apiGet(
        `/organization/activity${query(month)}`,
        clinicMonthActivitySchema,
      );
  return toMonthActivity(row);
}

/**
 * Le relevé de facturation de la clinique active pour un mois.
 *
 * @param month Mois `AAAA-MM`, pas à venir.
 * @returns Le relevé, ou `null` pour un mois clos avant l'arrivée de la
 *          clinique.
 */
export async function getStatement(month: string): Promise<Statement | null> {
  if (isDemoMode()) {
    return toStatement(demoStatement(await demoClinicId(), month));
  }
  try {
    return toStatement(
      await apiGet(
        `/organization/billing${query(month)}`,
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
