import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ClinicStudiesActions } from "@/components/domain/clinic-studies-actions";
import { ListPagination } from "@/components/domain/list-pagination";
import { ListToolbar } from "@/components/domain/list-toolbar";
import { StudyList } from "@/components/domain/study-list";
import { PageHeader, Panel } from "@/components/layout/app-shell";
import { listStudyPageAt, STUDY_LIST_PAGE_SIZE } from "@/lib/data/studies";
import { pageHref, readCursor } from "@/lib/pagination";
import { readListSearch } from "@/lib/search/server";
import { requireSession } from "@/lib/session/server";
import { getMessages } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.clinic.studies.title };
}

/** Paramètre d'adresse de la vue « À attribuer ». */
const VIEW_PARAM = "vue";
const TO_ASSIGN = "a-attribuer";

/**
 * Les examens de la clinique.
 *
 * Ses envois, rendus compris, avec qui les lit. La vue « À attribuer »
 * ne garde que ceux qu'aucun radiologue ne voit encore (statut
 * `received`, sans titulaire) : le responsable les attribue d'ici, ou
 * depuis leur fiche. Le radiologue n'a pas cet écran : sa file en tient
 * lieu.
 *
 * Écran de suivi : on y vient pour retrouver un dossier précis, d'où la
 * recherche en tête, faite par le service sur tout le périmètre. L'état du
 * compte-rendu arrive avec chaque examen : l'écran faisait auparavant un
 * appel par ligne, qui, pour un radiologue, créait même un brouillon sur
 * chaque examen listé.
 *
 * Paginé par le service : l'en-tête donne le total exact, le pied de
 * liste mène à la page suivante. La liste s'arrêtait auparavant aux deux
 * cents premiers examens, et l'en-tête annonçait « 200 examens ».
 */
export default async function StudiesPage({
  searchParams,
}: PageProps<"/examens">) {
  const session = await requireSession([
    "clinic_staff",
    "radiologist",
    "platform_admin",
  ]);
  // L'équipe IMAFRIK a sa liste, toutes cliniques confondues.
  if (session.active.role === "platform_admin") redirect("/admin/examens");
  // Un radiologue ne voit que ce qu'on lui confie : sa file en tient lieu.
  if (session.active.role === "radiologist") redirect("/worklist");
  const search = await readListSearch("examens", session);
  const params = await searchParams;
  const toAssign = params[VIEW_PARAM] === TO_ASSIGN;
  const { studies, total, nextCursor } = await listStudyPageAt(
    {
      search,
      limit: STUDY_LIST_PAGE_SIZE,
      cursor: readCursor(params),
      ...(toAssign ? { status: ["received"], order: "deadline" } : {}),
    },
    pageHref("/examens", params, null),
  );
  const isClinic = session.active.role === "clinic_staff";
  const { t } = await getMessages();
  const views = t.assignment.list;

  return (
    <>
      <PageHeader
        title={t.clinic.studies.title}
        description={`${t.clinic.studies.count(total)} · ${session.active.organizationName}`}
        actions={
          isClinic ? (
            <ClinicStudiesActions search={search} />
          ) : (
            <ListToolbar scope="examens" search={search} />
          )
        }
      />

      <nav
        aria-label={views.filterLabel}
        className="flex gap-1 px-4 pb-3 sm:px-6"
      >
        {[
          { key: "all", label: views.all, active: !toAssign, href: "/examens" },
          {
            key: TO_ASSIGN,
            label: views.toAssign,
            active: toAssign,
            href: pageHref("/examens", { [VIEW_PARAM]: TO_ASSIGN }, null),
          },
        ].map((view) => (
          <Link
            key={view.key}
            href={view.href}
            aria-current={view.active ? "page" : undefined}
            className={
              view.active
                ? "rounded-md bg-accent-muted px-2.5 py-1 text-xs font-medium text-accent"
                : "rounded-md px-2.5 py-1 text-xs text-secondary hover:bg-surface-hover hover:text-primary"
            }
          >
            {view.label}
          </Link>
        ))}
      </nav>

      <div className="flex min-h-0 flex-1 flex-col px-4 pb-6 sm:px-6">
        <Panel className="flex min-h-0 flex-col overflow-hidden">
          <StudyList
            studies={studies}
            filtered={Boolean(search) || toAssign}
            assignable={isClinic}
          />
          <ListPagination
            pathname="/examens"
            params={params}
            shown={studies.length}
            total={total}
            nextCursor={nextCursor}
          />
        </Panel>
      </div>
    </>
  );
}
