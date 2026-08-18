"use client";

import { Filter, Search, Upload } from "lucide-react";
import Link from "next/link";

import { StudyList } from "@/components/domain/study-list";
import { PageHeader, Panel } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/demo/session";
import { reportForStudy } from "@/lib/demo/reports";
import { DEMO_STUDIES } from "@/lib/demo/studies";

/**
 * Tous les examens envoyés par la clinique.
 *
 * Écran de suivi : on y vient pour retrouver un dossier précis, pas pour
 * découvrir ce qui est arrivé — c'est le rôle du tableau de bord. D'où la
 * recherche et les filtres en tête, et l'absence de bandeau de mesures.
 */
export default function ClinicStudiesPage() {
  const { active } = useSession();

  const studies = DEMO_STUDIES.filter(
    (study) => study.clinic === active.organizationName,
  ).map((study) => ({ ...study, reportId: reportForStudy(study.id)?.id }));

  return (
    <>
      <PageHeader
        title="Examens"
        description={`${studies.length} examens envoyés · ${active.organizationName}`}
        actions={
          <>
            <Button variant="ghost" size="icon" aria-label="Rechercher">
              <Search />
            </Button>
            <Button variant="ghost" size="sm">
              <Filter />
              Filtrer
            </Button>
            <Button size="sm" asChild>
              <Link href="/envoyer">
                <Upload />
                Envoyer
              </Link>
            </Button>
          </>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col px-6 pb-6">
        <Panel className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <StudyList studies={studies} />
        </Panel>
      </div>
    </>
  );
}
