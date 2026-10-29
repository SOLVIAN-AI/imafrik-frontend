import {
  BarChart3,
  ShieldAlert,
  ShieldCheck,
  Siren,
  UserRoundSearch,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AnonymizeDialog } from "@/components/admin/anonymize-dialog";
import { ControlBody, Section } from "@/components/admin/control-ui";
import {
  CredentialReview,
  RevokeCredentials,
} from "@/components/admin/credentials-actions";
import { GrantDialog } from "@/components/admin/grant-dialog";
import { SigningReviewDialog } from "@/components/admin/signing-review-dialog";
import { MfaResetButton } from "@/components/admin/mfa-reset-button";
import { ModalitiesDialog } from "@/components/admin/modalities-dialog";
import { RelativeTime } from "@/components/admin/relative-time";
import { SearchBox } from "@/components/admin/search-box";
import { CredentialChip } from "@/components/domain/credential-chip";
import { DateTime } from "@/components/domain/date-time";
import { FilterBar } from "@/components/filters/filter-bar";
import { FilteredEmpty } from "@/components/filters/filtered-empty";
import { PageHeader } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { needsMembershipRemoval } from "@/lib/account-anonymization";
import type { UserListFilter } from "@/lib/admin-params";
import { listOrganizations } from "@/lib/data/admin";
import { type AdminUser, listUsers } from "@/lib/data/control";
import {
  listTrainingCases,
  listTrainingProgress,
  type TraineeProgress,
} from "@/lib/data/training";
import { formatPersonName } from "@/lib/format";
import { type BarDimension, ROLES } from "@/lib/filters/dimensions";
import { countOptions, filterRows, type RowValues } from "@/lib/filters/facets";
import { LIST_FILTERS } from "@/lib/filters/screens";
import { hasFilters, readFilters } from "@/lib/filters/url";
import { describeModalities, MODALITY_GROUPS } from "@/lib/modalities";
import { readListSearch } from "@/lib/search/server";
import { roleRequiresMfa } from "@/lib/session/mfa";
import { requireSession } from "@/lib/session/server";
import { cn } from "@/lib/utils";
import { getMessages } from "@/i18n/server";
import type { AppMessages } from "@/i18n";
import type { ModalityGroup } from "@/lib/api/contracts";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.nav.items.accounts };
}

/**
 * Tous les comptes de la plateforme.
 *
 * Trois usages. **Rattacher** : un compte inscrit n'est rattaché à rien,
 * donc ne voit rien ; le filtre « En attente » les isole, et un geste les
 * rattache. **Valider** : un radiologue ne voit aucun examen tant que
 * l'équipe IMAFRIK n'a pas examiné son justificatif (diplôme et numéro
 * d'ordre, ou attestation d'inscription) ; le filtre « À valider »
 * (`?validation=attente`, l'adresse de l'alerte du cockpit) les isole, et
 * l'examen se fait depuis la ligne. De même pour une nouvelle signature
 * ou un nouveau cachet (`?signature=attente`) : l'image précédente reste
 * imprimée jusqu'à la décision.
 * **Vérifier** : qui a accès à quoi, qui n'a pas activé la double
 * authentification, qui ne s'est pas connecté depuis des mois.
 * **Effacer** : une personne qui exerce son droit à l'effacement est
 * anonymisée depuis sa ligne, après saisie de son nom.
 */
export default async function UsersPage({
  searchParams,
}: PageProps<"/admin/utilisateurs">) {
  const session = await requireSession(["platform_admin"]);
  const { t } = await getMessages();
  const text = t.admin.users;
  const params = await searchParams;
  // La recherche porte un nom ou une adresse : relue d'un cookie lié au
  // compte, jamais de l'adresse (le proxy retire un ancien `?q=`).
  const query = await readListSearch("admin-comptes", session);
  const keys = LIST_FILTERS.comptes;
  // L'état du compte (à valider, signature, en attente) est filtré par le
  // service, à ses adresses de toujours (`?validation=attente`, celle de
  // l'alerte du cockpit) ; le reste sur la page : la liste tient en
  // quelques centaines de comptes.
  const filter = (readFilters(params, keys).account ?? "all") as UserListFilter;

  const [
    accounts,
    pendingCount,
    unverifiedCount,
    signingCount,
    organizations,
    trainingProgress,
    trainingTotal,
  ] = await Promise.all([
    listUsers({
      query,
      pending: filter === "pending",
      unverified: filter === "unverified",
      signing: filter === "signing",
    }),
    listUsers({ pending: true }).then((rows) => rows.length),
    listUsers({ unverified: true }).then((rows) => rows.length),
    listUsers({ signing: true }).then((rows) => rows.length),
    listOrganizations(),
    // L'avancement en formation est un repère pour accompagner un nouveau
    // venu : son absence ne prive pas la page des comptes.
    listTrainingProgress(),
    listTrainingCases()
      .then((cases) => cases.filter((c) => c.published).length)
      .catch(() => 0),
  ]);
  const filters = readFilters(params, keys, {
    organization: organizations.map((org) => org.id),
  });
  const values: RowValues<AdminUser> = {
    organization: (user) =>
      user.memberships.map((membership) => membership.organizationId),
    role: (user) => user.memberships.map((membership) => membership.role),
    modality: readGroups,
    mfa: (user) =>
      user.mfaEnabled === false && needsMfa(user) ? ["missing"] : [],
  };
  const users = filterRows(accounts, values, filters);
  const count = (
    key: "organization" | "role" | "modality" | "mfa",
    candidates: readonly { value: string; label?: string }[],
  ) => countOptions(accounts, values, filters, key, candidates);
  // La barre : chaque option comptée avec les autres filtres.
  const bar: BarDimension[] = [
    {
      key: "organization",
      ...count(
        "organization",
        organizations.map((org) => ({ value: org.id, label: org.name })),
      ),
    },
    {
      key: "role",
      ...count(
        "role",
        ROLES.map((value) => ({ value })),
      ),
    },
    {
      key: "modality",
      ...count(
        "modality",
        MODALITY_GROUPS.map((value) => ({ value })),
      ),
    },
    {
      key: "account",
      // Comptés par le service, sur tous les comptes.
      options: [
        { value: "unverified", count: unverifiedCount },
        { value: "signing", count: signingCount },
        { value: "pending", count: pendingCount },
      ],
    },
    {
      key: "mfa",
      options: count("mfa", [{ value: "missing" }]).options,
    },
  ];
  const grantable = organizations
    .filter((org) => org.active)
    .map((org) => ({ id: org.id, name: org.name, kind: org.kind }));
  const withoutMfa = users.filter(
    (user) => user.mfaEnabled === false && needsMfa(user),
  ).length;

  const section = {
    all: {
      title: text.allTitle,
      description: text.allDescription,
      empty: text.noneFound,
      hint: undefined,
    },
    pending: {
      title: text.pendingTitle,
      description: text.pendingDescription,
      empty: text.noPending,
      hint: text.pendingHint,
    },
    unverified: {
      title: text.unverifiedTitle,
      description: text.unverifiedDescription,
      empty: text.noUnverified,
      hint: text.unverifiedHint,
    },
    signing: {
      title: text.signingTitle,
      description: text.signingDescription,
      empty: text.noSigning,
      hint: text.signingHint,
    },
  }[filter];

  return (
    <>
      <PageHeader
        title={t.nav.items.accounts}
        description={[
          text.accountCount(users.length),
          withoutMfa > 0 && text.withoutMfa(withoutMfa),
        ]
          .filter(Boolean)
          .join(" · ")}
        actions={
          <>
            <SearchBox
              scope="admin-comptes"
              search={query}
              label={text.searchLabel}
              placeholder={text.searchPlaceholder}
            />
          </>
        }
      />
      <FilterBar
        dimensions={bar}
        active={filters}
        result={{ count: users.length, noun: "accounts" }}
        className="shrink-0 px-4 pb-3 sm:px-6"
      />
      <ControlBody>
        <Section title={section.title} description={section.description} flush>
          {users.length === 0 &&
          hasFilters({ ...filters, account: undefined }) ? (
            <FilteredEmpty dimensions={bar} active={filters} noun="accounts" />
          ) : users.length === 0 ? (
            <EmptyState
              icon={UserRoundSearch}
              title={section.empty}
              detail={query ? text.tryAnother : section.hint}
            />
          ) : (
            <ul className="divide-y divide-border-subtle">
              {users.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  organizations={grantable}
                  isSelf={user.id === session.user.id}
                  training={
                    trainingTotal > 0
                      ? {
                          progress: trainingProgress.get(user.id) ?? null,
                          total: trainingTotal,
                        }
                      : null
                  }
                  t={t}
                />
              ))}
            </ul>
          )}
        </Section>
      </ControlBody>
    </>
  );
}

/**
 * Un compte tenu à la double authentification : il a au moins une
 * appartenance, et tous les rôles l'exigent (`MFA_ROLES`, miroir de
 * `role_requires_mfa` en base). Un compte sans appartenance n'ouvre
 * aucune donnée : son absence de second facteur n'est pas une alerte.
 */
function needsMfa(user: AdminUser): boolean {
  return user.memberships.some((membership) =>
    roleRequiresMfa(membership.role),
  );
}

/**
 * Les groupes de modalités qu'un compte lit : ceux de ses appartenances
 * de radiologue, tous pour une appartenance sans restriction. La même
 * règle que le service (`/admin/users?modality=`).
 */
function readGroups(user: AdminUser): ModalityGroup[] {
  const groups = new Set<ModalityGroup>();
  for (const membership of user.memberships) {
    if (membership.role !== "radiologist") continue;
    for (const group of membership.readModalities ?? MODALITY_GROUPS)
      groups.add(group);
  }
  return [...groups];
}

/**
 * Un compte concerné par la validation du numéro d'ordre : radiologue
 * dans une organisation, ou inscrit qui a déclaré un numéro.
 */
function isRadiologistAccount(user: AdminUser): boolean {
  return (
    user.licenseNumber !== null ||
    user.memberships.some((membership) => membership.role === "radiologist")
  );
}

/** Une ligne de compte. */
/** Avancement d'un radiologue dans l'espace de formation. */
interface TrainingSummary {
  progress: TraineeProgress | null;
  /** Exercices publiés. */
  total: number;
}

function UserRow({
  user,
  organizations,
  isSelf,
  training,
  t,
}: {
  user: AdminUser;
  isSelf: boolean;
  training: TrainingSummary | null;
  organizations: {
    id: string;
    name: string;
    kind: "clinic" | "radiology_group";
  }[];
  t: AppMessages;
}) {
  const text = t.admin.users;
  const unattached = user.memberships.length === 0;
  const radiologist = isRadiologistAccount(user);
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 px-4 py-3 md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)_9rem_auto] md:items-center">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {formatPersonName(user.title, user.fullName)}
        </p>
        <p className="truncate text-2xs text-tertiary">
          {user.email ?? text.unknownEmail}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-1 md:order-last">
        {unattached ? (
          <GrantDialog
            user={{
              id: user.id,
              fullName: user.fullName,
              isRadiologist: user.licenseNumber !== null,
            }}
            organizations={organizations}
          />
        ) : (
          <div className="flex items-center gap-1">
            <MfaState user={user} text={text} />
            {user.mfaEnabled && (
              <MfaResetButton profileId={user.id} fullName={user.fullName} />
            )}
          </div>
        )}
        {/* Droit à l'effacement : nul n'anonymise son propre compte. */}
        {!isSelf && (
          <AnonymizeDialog
            profileId={user.id}
            fullName={user.fullName}
            displayName={formatPersonName(user.title, user.fullName)}
            activeMember={!unattached && needsMembershipRemoval(user)}
          />
        )}
      </div>

      <ul className="col-span-2 flex min-w-0 flex-wrap gap-1.5 md:col-span-1">
        {unattached ? (
          <li className="rounded-full bg-progress-muted px-2 py-0.5 text-2xs text-progress">
            {text.unattached}
          </li>
        ) : (
          user.memberships.map((membership) => (
            <li
              key={membership.membershipId}
              className="flex max-w-full items-center gap-1 truncate rounded-full border border-border-subtle bg-surface-sunken/60 px-2 py-0.5 text-2xs"
              title={[
                `${membership.organizationName} (${t.common.roles[membership.role]})`,
                membership.role === "radiologist"
                  ? describeModalities(
                      membership.readModalities,
                      t.assignment.modalities,
                    )
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            >
              <span className="truncate text-secondary">
                {membership.organizationName}
              </span>
              <span className="text-tertiary">
                {" · "}
                {t.common.roles[membership.role]}
              </span>
            </li>
          ))
        )}
      </ul>

      <p className="col-span-2 text-2xs text-tertiary md:col-span-1">
        {user.lastSignInAt ? (
          <>
            {text.signedIn}{" "}
            <RelativeTime date={user.lastSignInAt} staleAfterHours={24 * 60} />
          </>
        ) : (
          <>
            {text.neverSignedIn}{" "}
            <DateTime date={user.createdAt} withTime={false} />
          </>
        )}
      </p>

      {radiologist && (
        <CredentialRow user={user} isSelf={isSelf} training={training} t={t} />
      )}
      {user.memberships.some((m) => m.role === "radiologist") && (
        <ReadingRow user={user} t={t} />
      )}
    </li>
  );
}

/**
 * Ce que lit un radiologue, en clair sur sa ligne : ses modalités pour
 * chaque organisation, avec le bouton « Modalités » qui les règle, les
 * listes d'urgence où il figure, et ses performances, à un clic.
 */
function ReadingRow({ user, t }: { user: AdminUser; t: AppMessages }) {
  const text = t.admin.users.reading;
  const name = formatPersonName(user.title, user.fullName);
  return (
    <div
      className="order-last col-span-2 flex flex-wrap items-center gap-x-4 gap-y-2 md:col-span-4"
      data-testid="reading-row"
    >
      {user.memberships
        .filter((membership) => membership.role === "radiologist")
        .map((membership) => (
          <span
            key={membership.membershipId}
            className="flex flex-wrap items-center gap-2 text-2xs"
          >
            <span className="text-tertiary">
              {membership.organizationName} :
            </span>
            <span className="font-medium text-primary">
              {describeModalities(
                membership.readModalities,
                t.assignment.modalities,
              )}
            </span>
            <ModalitiesDialog
              membershipId={membership.membershipId}
              name={name}
              organization={membership.organizationName}
              readModalities={membership.readModalities}
            />
          </span>
        ))}
      <span
        className={cn(
          "inline-flex items-center gap-1 text-2xs",
          user.urgentLists.length > 0 ? "text-urgent" : "text-tertiary",
        )}
      >
        <Siren className="size-3" aria-hidden />
        {user.urgentLists.length > 0
          ? text.urgentLists(
              user.urgentLists.map((entry) => entry.clinicName).join(", "),
            )
          : text.noUrgentList}
      </span>
      <Link
        href={`/admin/activite?onglet=radiologues&radiologue=${encodeURIComponent(user.id)}`}
        className="ml-auto inline-flex min-h-6 items-center gap-1 text-2xs text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
      >
        <BarChart3 className="size-3" aria-hidden />
        {text.performance}
      </Link>
    </div>
  );
}

/**
 * Habilitation du radiologue : état calculé par la base, exercice, numéro
 * déclaré, date d'habilitation ou de fin d'attestation, et les gestes :
 * examiner le dossier, retirer l'habilitation.
 */
function CredentialRow({
  user,
  isSelf,
  training,
  t,
}: {
  user: AdminUser;
  isSelf: boolean;
  training: TrainingSummary | null;
  t: AppMessages;
}) {
  const text = t.admin.credentials;
  const state = user.credentialState;
  const name = formatPersonName(user.title, user.fullName);
  return (
    <div
      // Dernière rangée de la ligne, sous les actions de la double
      // authentification placées en dernière colonne à partir de 768 px.
      className="order-last col-span-2 flex flex-wrap items-center gap-x-3 gap-y-2 md:col-span-4"
      data-credentials-row={state}
    >
      <CredentialChip state={state} label={text.status[state]} />
      {user.practiceStatus && (
        <span className="text-2xs text-secondary">
          {text.practice[user.practiceStatus]}
        </span>
      )}
      {user.licenseNumber && (
        <span className="text-2xs text-secondary">
          {text.licenseLabel}{" "}
          <span className="font-mono text-primary">{user.licenseNumber}</span>
        </span>
      )}
      {state === "verified" && user.credentialsVerifiedAt && (
        <span className="text-2xs text-tertiary">
          {text.verifiedOn}{" "}
          <DateTime date={user.credentialsVerifiedAt} withTime={false} />
        </span>
      )}
      {training && <TrainingProgressNote summary={training} t={t} />}
      {user.credentialsValidUntil && (
        <span className="text-2xs text-tertiary">
          {text.validUntil}{" "}
          <DateTime
            date={new Date(`${user.credentialsValidUntil}T00:00:00Z`)}
            withTime={false}
          />
        </span>
      )}
      <div className="ml-auto flex flex-wrap gap-2">
        {/* Rien à examiner pour un inscrit habilité ; un résident habilité
            peut avoir déposé le renouvellement de son attestation. */}
        {user.practiceStatus &&
          (state !== "verified" || user.practiceStatus === "resident") && (
            <CredentialReview
              profileId={user.id}
              fullName={name}
              licenseNumber={user.licenseNumber}
              practiceStatus={user.practiceStatus}
              isSelf={isSelf}
            />
          )}
        {/* Signature, cachet et code personnel : à vérifier ou à
            effacer, depuis la même ligne que l'habilitation. */}
        <SigningReviewDialog
          profileId={user.id}
          fullName={name}
          due={user.signingReviewDue}
          isSelf={isSelf}
        />
        {user.credentialsVerifiedAt && (
          <RevokeCredentials profileId={user.id} fullName={name} />
        )}
      </div>
    </div>
  );
}

/** État de la double authentification. */
function MfaState({
  user,
  text,
}: {
  user: AdminUser;
  text: AppMessages["admin"]["users"];
}) {
  if (user.mfaEnabled === null)
    return <span className="text-2xs text-tertiary">{text.mfaUnknown}</span>;
  if (user.mfaEnabled)
    return (
      <span className="inline-flex items-center gap-1 text-2xs text-done">
        <ShieldCheck className="size-3.5" aria-hidden />
        {text.mfaActive}
      </span>
    );
  const required = needsMfa(user);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-2xs",
        required ? "text-urgent" : "text-tertiary",
      )}
      title={required ? text.mfaRequired : undefined}
    >
      <ShieldAlert className="size-3.5" aria-hidden />
      {required ? text.mfaMissing : text.mfaNone}
    </span>
  );
}

/**
 * Avancement en formation : combien d'exercices signés, et en cours.
 *
 * Jamais leur contenu : il n'appartient qu'à leur auteur.
 */
function TrainingProgressNote({
  summary,
  t,
}: {
  summary: TrainingSummary;
  t: AppMessages;
}) {
  const text = t.training.admin;
  const done = summary.progress?.submitted.length ?? 0;
  const ongoing = summary.progress?.inProgress.length ?? 0;
  return (
    <span className="text-2xs text-tertiary" data-training-progress={done}>
      {text.label}{" "}
      <span className="text-secondary">
        {done || ongoing
          ? [
              text.progress(done, summary.total),
              ongoing > 0 && text.inProgress(ongoing),
            ]
              .filter(Boolean)
              .join(" · ")
          : text.none}
      </span>
    </span>
  );
}
