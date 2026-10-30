import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { DepositReportView } from "@/components/deposits/deposit-report";
import { PageHeader } from "@/components/layout/app-shell";
import { getDeposit } from "@/lib/data/deposits";
import { requireSession } from "@/lib/session/server";
import { getMessages } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.deposits.metaTitle };
}

/**
 * Compte rendu d'un dépôt de la clinique : ce que l'archive a donné, les
 * examens créés (un lien vers chacun) et les fichiers ignorés, avec leur
 * raison.
 */
export default async function DepositReportPage({
  params,
}: PageProps<"/examens/depots/[depositId]">) {
  const session = await requireSession([
    "clinic_staff",
    "radiologist",
    "platform_admin",
  ]);
  const { depositId } = await params;
  if (session.active.role === "platform_admin") {
    redirect(`/admin/depots/${encodeURIComponent(depositId)}`);
  }
  if (session.active.role === "radiologist") redirect("/worklist");
  const report = await getDeposit(depositId);
  if (!report) notFound();
  const { t, locale } = await getMessages();
  return (
    <>
      <PageHeader title={t.deposits.report.title(report.fileName)} />
      <DepositReportView
        report={report}
        t={t}
        locale={locale}
        backHref="/examens/depots"
        studyHref={(studyId) => `/examens/${encodeURIComponent(studyId)}`}
        team={false}
      />
    </>
  );
}
