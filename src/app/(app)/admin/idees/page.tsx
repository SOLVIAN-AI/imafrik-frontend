import {
  Building2,
  Hospital,
  Layers,
  Lightbulb,
  MapPin,
  Stethoscope,
  Tag,
  UserRound,
} from "lucide-react";
import type { Metadata } from "next";

import { ControlBody } from "@/components/admin/control-ui";
import { SearchBox } from "@/components/admin/search-box";
import { DateTime } from "@/components/domain/date-time";
import { FilterBar } from "@/components/filters/filter-bar";
import { FilteredEmpty } from "@/components/filters/filtered-empty";
import {
  IdeaContext,
  IdeaResponse,
  IdeaStatusBadge,
  IdeaTag,
} from "@/components/ideas/idea-parts";
import { type GroupChoice, IdeaTracker } from "@/components/ideas/idea-tracker";
import { PageHeader, Panel } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import type { AppMessages } from "@/i18n";
import { getMessages } from "@/i18n/server";
import { listIdeaInbox } from "@/lib/data/ideas";
import { matchChoices } from "@/lib/filters/choice";
import { type BarDimension, PERIODS } from "@/lib/filters/dimensions";
import { countOptions, filterRows, type RowValues } from "@/lib/filters/facets";
import { periodsOf } from "@/lib/filters/periods";
import { LIST_FILTERS } from "@/lib/filters/screens";
import { hasFilters, readFilters } from "@/lib/filters/url";
import {
  IDEA_AUTHOR_ROLES,
  IDEA_CATEGORIES,
  IDEA_STATUSES,
  type InboxIdea,
  screenNameOf,
} from "@/lib/ideas";
import { readListSearch } from "@/lib/search/server";
import { requireSession } from "@/lib/session/server";

/** Titre de l’onglet, dans la langue de l’utilisateur. */
export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.nav.items.ideaInbox };
}

/**
 * Valeurs d’une idée pour la barre de filtres : la clinique de l’auteur
 * (son organisation, quand c’est une clinique), son rôle, la catégorie,
 * l’état et la période de la proposition.
 */
const IDEA_VALUES: RowValues<InboxIdea> = {
  clinic: (idea) =>
    idea.organizationKind === "clinic" && idea.organizationId
      ? [idea.organizationId]
      : [],
  role: (idea) => [idea.authorRole],
  ideaCategory: (idea) => [idea.category],
  ideaState: (idea) => [idea.status],
  period: (idea) => periodsOf(idea.createdAt),
};

/**
 * La boîte des idées de l’équipe IMAFRIK.
 *
 * Les pistes d’amélioration proposées par les radiologues et les
 * responsables de clinique (« Vos idées »). La barre de filtres commune
 * les trie par clinique, rôle, catégorie, état et période, chaque option
 * comptée ; la recherche (titre, texte, auteur, organisation) vit dans un
 * cookie, jamais dans l’adresse. Toutes les idées par défaut ; l’alerte du
 * cockpit ouvre les idées reçues (`?etat=recues`).
 *
 * Chaque carte se suit : état, réponse à l’auteur (qui la reçoit par
 * courriel), regroupement avec une idée principale. Le service trace
 * chaque geste.
 */
export default async function IdeaInboxPage({
  searchParams,
}: PageProps<"/admin/idees">) {
  const session = await requireSession(["platform_admin"]);
  const [{ t }, params, inbox, search] = await Promise.all([
    getMessages(),
    searchParams,
    listIdeaInbox(),
    readListSearch("admin-idees", session),
  ]);
  const text = t.ideas.inbox;
  const all = inbox.items;
  const keys = LIST_FILTERS.idees;
  const clinics = new Map<string, string>();
  for (const idea of all) {
    if (idea.organizationKind === "clinic" && idea.organizationId)
      clinics.set(idea.organizationId, idea.organizationName ?? "");
  }
  const filters = readFilters(params, keys, {
    clinic: [...clinics.keys()],
    role: IDEA_AUTHOR_ROLES,
  });
  // La recherche d’abord : le titre, le texte, l’auteur, l’organisation.
  const found = search
    ? matchChoices(
        all.map((idea) => ({
          id: idea.id,
          name: [idea.title, idea.body, idea.authorName, idea.organizationName]
            .filter(Boolean)
            .join(" "),
        })),
        search,
      ).map((match) => all.find((idea) => idea.id === match.id)!)
    : all;
  const shown = filterRows(found, IDEA_VALUES, filters);
  const fresh = all.filter((idea) => idea.status === "received").length;
  const bar: BarDimension[] = [
    {
      key: "clinic",
      ...countOptions(
        found,
        IDEA_VALUES,
        filters,
        "clinic",
        [...clinics].map(([value, label]) => ({ value, label })),
      ),
    },
    {
      key: "role",
      ...countOptions(
        found,
        IDEA_VALUES,
        filters,
        "role",
        IDEA_AUTHOR_ROLES.map((value) => ({ value })),
      ),
    },
    {
      key: "ideaCategory",
      ...countOptions(
        found,
        IDEA_VALUES,
        filters,
        "ideaCategory",
        IDEA_CATEGORIES.map((value) => ({ value })),
      ),
    },
    {
      key: "ideaState",
      ...countOptions(
        found,
        IDEA_VALUES,
        filters,
        "ideaState",
        IDEA_STATUSES.map((value) => ({ value })),
      ),
    },
    {
      key: "period",
      ...countOptions(
        found,
        IDEA_VALUES,
        filters,
        "period",
        PERIODS.map((value) => ({ value })),
      ),
    },
  ];
  // Les idées principales, pour « Même idée que… » : celles qui ne sont
  // pas elles-mêmes regroupées.
  const mains: GroupChoice[] = all
    .filter((idea) => idea.duplicateOf === null)
    .map((idea) => ({ id: idea.id, name: idea.title }));

  return (
    <>
      <PageHeader
        title={t.nav.items.ideaInbox}
        description={text.description(inbox.total, fresh)}
        actions={
          <SearchBox
            scope="admin-idees"
            search={search}
            label={text.searchLabel}
            placeholder={text.searchPlaceholder}
          />
        }
      />
      <FilterBar
        dimensions={bar}
        active={filters}
        result={{ count: shown.length, noun: "ideas" }}
        className="shrink-0 px-4 pb-3 sm:px-6"
      />
      <ControlBody>
        {inbox.total > all.length && (
          <p className="text-2xs text-tertiary">
            {text.truncated(all.length, inbox.total)}
          </p>
        )}
        {shown.length === 0 && (search || hasFilters(filters)) ? (
          <Panel>
            <FilteredEmpty dimensions={bar} active={filters} noun="ideas" />
          </Panel>
        ) : shown.length === 0 ? (
          <Panel>
            <EmptyState
              icon={Lightbulb}
              title={text.empty}
              detail={text.emptyDetail}
            />
          </Panel>
        ) : (
          <ul className="flex flex-col gap-3">
            {shown.map((idea) => (
              <li key={idea.id}>
                <InboxCard
                  idea={idea}
                  t={t}
                  choices={mains.filter((choice) => choice.id !== idea.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </ControlBody>
    </>
  );
}

/** Une idée de la boîte : qui, quoi, d’où, et son suivi. */
function InboxCard({
  idea,
  t,
  choices,
}: {
  idea: InboxIdea;
  t: AppMessages;
  choices: GroupChoice[];
}) {
  const text = t.ideas;
  const RoleIcon = idea.authorRole === "radiologist" ? Stethoscope : UserRound;
  const OrgIcon = idea.organizationKind === "clinic" ? Hospital : Building2;
  return (
    <Panel className="px-4 py-3.5">
      <article aria-labelledby={`idee-${idea.id}`}>
        <div className="flex flex-wrap items-start gap-x-3 gap-y-1.5">
          <h2
            id={`idee-${idea.id}`}
            className="min-w-0 flex-1 basis-56 text-sm font-medium break-words"
          >
            {idea.title}
          </h2>
          <IdeaStatusBadge
            status={idea.status}
            label={text.status[idea.status]}
          />
          <DateTime
            date={idea.createdAt}
            className="text-2xs whitespace-nowrap text-tertiary"
          />
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <IdeaTag icon={RoleIcon}>
            {idea.authorName ?? text.inbox.unknownAuthor} ·{" "}
            {t.common.roles[idea.authorRole]}
          </IdeaTag>
          <IdeaTag icon={OrgIcon}>
            {idea.organizationName ?? text.inbox.noOrganization}
          </IdeaTag>
          <IdeaTag icon={Tag}>{text.categories[idea.category]}</IdeaTag>
          {idea.benefit && <IdeaTag>{text.benefitTags[idea.benefit]}</IdeaTag>}
        </div>

        <p className="mt-2 text-xs break-words whitespace-pre-wrap text-secondary">
          {idea.body}
        </p>

        <p className="mt-2 flex items-start gap-1.5 text-2xs text-tertiary">
          <MapPin className="mt-px size-3 shrink-0" aria-hidden />
          <span>
            <span className="sr-only">{text.inbox.context} : </span>
            <IdeaContext
              screenName={screenNameOf(t, idea.authorRole, idea.screen)}
              version={idea.appVersion}
              device={idea.device}
              t={t}
            />
          </span>
        </p>

        {(idea.duplicateOfTitle || idea.duplicates > 0) && (
          <p className="mt-2 flex items-start gap-1.5 text-2xs text-secondary">
            <Layers
              className="mt-px size-3 shrink-0 text-tertiary"
              aria-hidden
            />
            <span>
              {idea.duplicateOfTitle
                ? text.inbox.groupedUnder(idea.duplicateOfTitle)
                : text.inbox.duplicates(idea.duplicates)}
            </span>
          </p>
        )}

        {idea.response && (
          <IdeaResponse
            title={text.mine.response}
            response={idea.response}
            footer={
              idea.respondedByName
                ? text.inbox.respondedBy(idea.respondedByName)
                : undefined
            }
          />
        )}

        <div className="mt-3 border-t border-border-subtle pt-3">
          <IdeaTracker
            ideaId={idea.id}
            status={idea.status}
            response={idea.response}
            duplicateOf={idea.duplicateOf}
            choices={choices}
          />
        </div>
      </article>
    </Panel>
  );
}
