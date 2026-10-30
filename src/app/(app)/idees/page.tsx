import { Layers, Lightbulb, Tag } from "lucide-react";
import type { Metadata } from "next";

import { FilterBar } from "@/components/filters/filter-bar";
import { FilteredEmpty } from "@/components/filters/filtered-empty";
import { IdeaForm } from "@/components/ideas/idea-form";
import {
  IdeaContext,
  IdeaResponse,
  IdeaStatusBadge,
  IdeaTag,
} from "@/components/ideas/idea-parts";
import { DateTime } from "@/components/domain/date-time";
import { PageHeader, Panel } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { InfoTip } from "@/components/ui/info-tip";
import type { AppMessages } from "@/i18n";
import { getMessages } from "@/i18n/server";
import { listMyIdeas } from "@/lib/data/ideas";
import type { BarDimension } from "@/lib/filters/dimensions";
import { countOptions, filterRows, type RowValues } from "@/lib/filters/facets";
import { LIST_FILTERS } from "@/lib/filters/screens";
import { readFilters } from "@/lib/filters/url";
import {
  IDEA_CATEGORIES,
  IDEA_STATUSES,
  type Idea,
  SCREEN_PARAM,
  appVersionOf,
  ideaScreenOf,
  screenNameOf,
} from "@/lib/ideas";
import { requireSession } from "@/lib/session/server";
import type { UserRole } from "@/lib/session/types";

/** Titre de l’onglet, dans la langue de l’utilisateur. */
export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.ideas.title };
}

/** Valeurs d’une idée pour la barre de filtres : sa catégorie, son état. */
const IDEA_VALUES: RowValues<Idea> = {
  ideaCategory: (idea) => [idea.category],
  ideaState: (idea) => [idea.status],
};

/**
 * « Vos idées » : proposer une amélioration d’IMAFRIK, et suivre ses idées.
 *
 * Ouvert aux radiologues et aux responsables de clinique, dès le premier
 * jour : le formulaire d’un côté, « Mes idées » de l’autre, chacune avec
 * son état et la réponse de l’équipe IMAFRIK. Chacun ne voit que les
 * siennes (RLS côté service).
 *
 * `?ecran=` porte l’écran d’où l’on vient (le raccourci de la barre du
 * haut et de l’aide) : une clé de l’aide, jamais une adresse. Une clé
 * inconnue est ignorée.
 */
export default async function IdeasPage({ searchParams }: PageProps<"/idees">) {
  const session = await requireSession(["radiologist", "clinic_staff"]);
  const role = session.active.role as "radiologist" | "clinic_staff";
  const [{ t }, params, ideas] = await Promise.all([
    getMessages(),
    searchParams,
    listMyIdeas(role),
  ]);
  const text = t.ideas;
  const from = ideaScreenOf(role, params[SCREEN_PARAM]);
  const screen = from
    ? { key: from.key, name: screenNameOf(t, role, from.key) ?? from.key }
    : null;
  const filters = readFilters(params, LIST_FILTERS["mes-idees"]);
  const shown = filterRows(ideas, IDEA_VALUES, filters);
  const bar: BarDimension[] = [
    {
      key: "ideaCategory",
      ...countOptions(
        ideas,
        IDEA_VALUES,
        filters,
        "ideaCategory",
        IDEA_CATEGORIES.map((value) => ({ value })),
      ),
    },
    {
      key: "ideaState",
      ...countOptions(
        ideas,
        IDEA_VALUES,
        filters,
        "ideaState",
        IDEA_STATUSES.map((value) => ({ value })),
      ),
    },
  ];

  return (
    <>
      <PageHeader title={text.title} description={text.description} />
      <div className="min-h-0 flex-1 overflow-auto px-4 pb-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-start">
          <IdeaForm screen={screen} version={appVersionOf(process.env)} />

          <section
            aria-labelledby="mes-idees"
            className="flex min-w-0 flex-col gap-3"
          >
            <h2
              id="mes-idees"
              className="inline-flex items-center text-sm font-semibold"
            >
              {text.mine.title}
              <InfoTip
                label={text.statusLabel}
                title={text.statusLabel}
                text={text.statusInfo}
                term="etatIdee"
              />
            </h2>
            {ideas.length === 0 ? (
              <Panel>
                <EmptyState
                  icon={Lightbulb}
                  title={text.mine.empty}
                  detail={text.mine.emptyDetail}
                />
              </Panel>
            ) : (
              <FilterBar
                dimensions={bar}
                active={filters}
                result={{ count: shown.length, noun: "ideas" }}
              />
            )}
            {ideas.length > 0 && shown.length === 0 && (
              <Panel>
                <FilteredEmpty dimensions={bar} active={filters} noun="ideas" />
              </Panel>
            )}
            {shown.length > 0 && (
              <ul className="flex flex-col gap-3">
                {shown.map((idea) => (
                  <li key={idea.id}>
                    <MyIdea idea={idea} role={role} t={t} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

/** Une idée de l’auteur : ce qu’il a écrit, où elle en est, la réponse. */
function MyIdea({
  idea,
  role,
  t,
}: {
  idea: Idea;
  role: UserRole;
  t: AppMessages;
}) {
  const text = t.ideas;
  return (
    <Panel className="px-4 py-3.5">
      <article aria-labelledby={`idee-${idea.id}`}>
        <div className="flex flex-wrap items-start gap-x-3 gap-y-1.5">
          <h3
            id={`idee-${idea.id}`}
            className="min-w-0 flex-1 basis-48 text-sm font-medium break-words"
          >
            {idea.title}
          </h3>
          <IdeaStatusBadge
            status={idea.status}
            label={text.status[idea.status]}
          />
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <IdeaTag icon={Tag}>{text.categories[idea.category]}</IdeaTag>
          {idea.benefit && <IdeaTag>{text.benefitTags[idea.benefit]}</IdeaTag>}
          <span className="text-2xs text-tertiary">
            {text.mine.proposedOn}{" "}
            <DateTime date={idea.createdAt} withTime={false} />
          </span>
        </div>
        <p className="mt-2 text-xs break-words whitespace-pre-wrap text-secondary">
          {idea.body}
        </p>
        {(idea.screen || idea.appVersion || idea.device) && (
          <p className="mt-2 text-2xs text-tertiary">
            <IdeaContext
              screenName={screenNameOf(t, role, idea.screen)}
              version={idea.appVersion}
              device={idea.device}
              t={t}
            />
          </p>
        )}
        {idea.grouped && (
          <p className="mt-2 flex items-start gap-1.5 text-2xs text-secondary">
            <Layers
              className="mt-px size-3 shrink-0 text-tertiary"
              aria-hidden
            />
            {text.mine.grouped}
          </p>
        )}
        {idea.response && (
          <IdeaResponse
            title={text.mine.response}
            response={idea.response}
            footer={
              idea.respondedAt ? (
                <DateTime date={idea.respondedAt} withTime={false} />
              ) : undefined
            }
          />
        )}
      </article>
    </Panel>
  );
}
