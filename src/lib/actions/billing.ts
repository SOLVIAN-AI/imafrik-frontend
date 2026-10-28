"use server";

import { revalidatePath } from "next/cache";

import {
  type ActionResult,
  demoUnavailable,
  rejectInvalidIds,
  run,
} from "@/lib/actions/result";
import { apiSend } from "@/lib/api/client";
import {
  billingMonthSchema,
  clinicPlanSchema,
  planSchema,
  type Plan,
} from "@/lib/api/contracts";
import { isDemoMode } from "@/lib/demo/mode";
import { getMessages } from "@/i18n/server";

/**
 * Facturation, gestes de l'équipe IMAFRIK : renseigner la formule d'une
 * clinique, clore un mois fini.
 *
 * Le service vérifie le rôle d'administrateur en base, la grille des
 * formules et qu'un mois est fini ; chaque geste est tracé. Les
 * arguments viennent du navigateur, quel que soit leur type : ils sont
 * revérifiés ici avant l'appel.
 */

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * Pose la formule d'abonnement d'une clinique.
 *
 * @param clinicId   Clinique.
 * @param plan       Formule.
 * @param monthlyFee Prix mensuel de la formule Établissement, sur devis ;
 *                   ignoré pour les autres.
 */
export async function saveClinicPlan(
  clinicId: string,
  plan: Plan,
  monthlyFee: number | null,
): Promise<ActionResult> {
  const { t } = await getMessages();
  if (
    !planSchema.safeParse(plan).success ||
    (monthlyFee !== null && !Number.isSafeInteger(monthlyFee))
  ) {
    return { ok: false, error: t.common.errors.unexpected, status: 422 };
  }
  if (isDemoMode()) return await demoUnavailable(t.admin.demoActions.plan);
  const invalid = await rejectInvalidIds(clinicId);
  if (invalid) return invalid;
  const result = await run(async () => {
    await apiSend(
      `/admin/clinics/${encodeURIComponent(clinicId)}/plan`,
      "PUT",
      { plan, monthly_fee: plan === "facility" ? monthlyFee : null },
      clinicPlanSchema,
    );
    return undefined;
  });
  if (result.ok) {
    revalidatePath(`/admin/organisations/${clinicId}`);
    revalidatePath("/admin/facturation");
  }
  return result;
}

/**
 * Clôt un mois fini : le relevé de chaque clinique est figé. Définitif.
 *
 * @param month Mois `AAAA-MM`.
 */
export async function closeBillingMonth(month: string): Promise<ActionResult> {
  const { t } = await getMessages();
  if (!MONTH.test(month)) {
    return { ok: false, error: t.common.errors.unexpected, status: 422 };
  }
  if (isDemoMode())
    return await demoUnavailable(t.admin.demoActions.closeMonth);
  const result = await run(async () => {
    await apiSend(
      "/admin/billing/closures",
      "POST",
      { month },
      billingMonthSchema,
    );
    return undefined;
  });
  revalidatePath("/admin/facturation");
  return result;
}
