import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DepositReportView } from "@/components/deposits/deposit-report";
import { PageHeader } from "@/components/layout/app-shell";
import { clinicHref } from "@/lib/clinic-view";
import { getTeamDeposit } from "@/lib/data/deposits";
import { requireSession } from "@/lib/session/server";
import { getMessages } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.deposits.metaTitle };
}

/**
 * Compte rendu d'un dépôt, pour l'équipe IMAFRIK : le même que celui de
 * la clinique, avec le nom de qui a déposé. Un examen créé s'ouvre dans la
 * vue des cliniques, comme son responsable le voit.
 */
export default async function TeamDepositReportPage({
  params,
}: PageProps<"/admin/depots/[depositId]">) {
  await requireSession(["platform_admin"]);
  const { depositId } = await params;
  const report = await getTeamDeposit(depositId);
  if (!report) notFound();
  const { t, locale } = await getMessages();
  return (
    <>
      <PageHeader title={t.deposits.report.title(report.fileName)} />
      <DepositReportView
        report={report}
        t={t}
        locale={locale}
        backHref={`/admin/depots?clinique=${encodeURIComponent(report.clinicId)}`}
        studyHref={(studyId) =>
          clinicHref(
            { clinicId: report.clinicId },
            `/examens/${encodeURIComponent(studyId)}`,
          )
        }
        team
      />
    </>
  );
}
