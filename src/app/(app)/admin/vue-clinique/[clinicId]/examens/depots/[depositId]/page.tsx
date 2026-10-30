import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DepositReportView } from "@/components/deposits/deposit-report";
import { PageHeader } from "@/components/layout/app-shell";
import { clinicHref } from "@/lib/clinic-view";
import { requireConsultation } from "@/lib/data/clinic-view";
import { getTeamDeposit } from "@/lib/data/deposits";
import { getMessages } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.deposits.metaTitle };
}

/**
 * Compte rendu d'un dépôt, dans la vue d'une clinique : celui de la
 * console, avec le nom de qui a déposé, sans quitter la clinique. Un
 * dépôt d'une autre clinique n'y existe pas.
 */
export default async function ClinicViewDepositReportPage({
  params,
}: PageProps<"/admin/vue-clinique/[clinicId]/examens/depots/[depositId]">) {
  const { clinicId, depositId } = await params;
  const consultation = await requireConsultation(clinicId);
  const report = await getTeamDeposit(depositId);
  if (!report || report.clinicId !== consultation.clinicId) notFound();
  const { t, locale } = await getMessages();
  return (
    <>
      <PageHeader title={t.deposits.report.title(report.fileName)} />
      <DepositReportView
        report={report}
        t={t}
        locale={locale}
        backHref={clinicHref(consultation, "/examens/depots")}
        studyHref={(studyId) =>
          clinicHref(consultation, `/examens/${encodeURIComponent(studyId)}`)
        }
        team
      />
    </>
  );
}
