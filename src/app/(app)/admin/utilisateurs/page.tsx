import { ShieldAlert, ShieldCheck, UserRoundSearch } from "lucide-react";
import type { Metadata } from "next";

import { AnonymizeDialog } from "@/components/admin/anonymize-dialog";
import { ControlBody, Section, Segmented } from "@/components/admin/control-ui";
import { CredentialsActions } from "@/components/admin/credentials-actions";
import { GrantDialog } from "@/components/admin/grant-dialog";
import { MfaResetButton } from "@/components/admin/mfa-reset-button";
import { RelativeTime } from "@/components/admin/relative-time";
import { SearchBox } from "@/components/admin/search-box";
import { CredentialChip } from "@/components/domain/credential-chip";
import { DateTime } from "@/components/domain/date-time";
import { PageHeader } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { needsMembershipRemoval } from "@/lib/account-anonymization";
import { parseUserFilter, userListHref } from "@/lib/admin-params";
import { credentialStatus } from "@/lib/credentials";
import { listOrganizations } from "@/lib/data/admin";
import { type AdminUser, listUsers } from "@/lib/data/control";
import { formatPersonName } from "@/lib/format";
import { requireSession } from "@/lib/session/server";
import { cn } from "@/lib/utils";
import { getMessages } from "@/i18n/server";
import type { AppMessages } from "@/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.nav.items.accounts };
}

/**
 * Tous les comptes de la plateforme.
 *
 * Trois usages. **Rattacher** : un compte inscrit n'est rattaché à rien,
 * donc ne voit rien ; le filtre « En attente » les isole, et un geste les
 * rattache. **Valider** : un radiologue ne voit aucun examen tant que
 * l'équipe IMAFRIK n'a pas vérifié son numéro d'ordre auprès de l'Ordre ;
 * le filtre « À valider » (`?validation=attente`, l'adresse de l'alerte
 * du cockpit) les isole, et la validation se fait depuis la ligne.
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
  const query = typeof params.q === "string" ? params.q : undefined;
  const filter = parseUserFilter(params);

  const [users, pendingCount, unverifiedCount, organizations] =
    await Promise.all([
      listUsers({
        query,
        pending: filter === "pending",
        unverified: filter === "unverified",
      }),
      listUsers({ pending: true }).then((rows) => rows.length),
      listUsers({ unverified: true }).then((rows) => rows.length),
      listOrganizations(),
    ]);
  const grantable = organizations
    .filter((org) => org.active)
    .map((org) => ({ id: org.id, name: org.name, kind: org.kind }));
  const withoutMfa = users.filter(
    (user) => user.mfaEnabled === false && needsMfa(user),
  ).length;

  const counted = (label: string, count: number) =>
    count ? `${label} · ${count}` : label;
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
            <Segmented
              label={t.admin.shared.filter}
              options={[
                {
                  label: t.admin.shared.all,
                  href: userListHref("all", query),
                  active: filter === "all",
                },
                {
                  label: counted(text.unverifiedFilter, unverifiedCount),
                  href: userListHref("unverified", query),
                  active: filter === "unverified",
                },
                {
                  label: counted(text.pendingFilter, pendingCount),
                  href: userListHref("pending", query),
                  active: filter === "pending",
                },
              ]}
            />
            <SearchBox
              label={text.searchLabel}
              placeholder={text.searchPlaceholder}
            />
          </>
        }
      />
      <ControlBody>
        <Section title={section.title} description={section.description} flush>
          {users.length === 0 ? (
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
 * Rôles pour lesquels la double authentification est exigée : ceux qui
 * lisent des examens de plusieurs établissements ou administrent la
 * plateforme.
 */
function needsMfa(user: AdminUser): boolean {
  return user.memberships.some(
    (membership) =>
      membership.role === "radiologist" || membership.role === "platform_admin",
  );
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
function UserRow({
  user,
  organizations,
  isSelf,
  t,
}: {
  user: AdminUser;
  isSelf: boolean;
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
              className="max-w-full truncate rounded-full border border-border-subtle bg-surface-sunken/60 px-2 py-0.5 text-2xs"
              title={`${membership.organizationName} (${t.common.roles[membership.role]})`}
            >
              <span className="text-secondary">
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

      {radiologist && <CredentialRow user={user} isSelf={isSelf} t={t} />}
    </li>
  );
}

/**
 * Validation du numéro d'ordre : état, numéro déclaré, date de
 * validation, et le geste qui valide ou retire la validation.
 */
function CredentialRow({
  user,
  isSelf,
  t,
}: {
  user: AdminUser;
  isSelf: boolean;
  t: AppMessages;
}) {
  const text = t.admin.credentials;
  const status = credentialStatus({
    hasLicenseNumber: Boolean(user.licenseNumber?.trim()),
    credentialsVerified: user.credentialsVerifiedAt !== null,
  });
  return (
    <div
      // Dernière rangée de la ligne, sous les actions de la double
      // authentification placées en dernière colonne à partir de 768 px.
      className="order-last col-span-2 flex flex-wrap items-center gap-x-3 gap-y-2 md:col-span-4"
      data-credentials-row={status}
    >
      <CredentialChip status={status} label={text.status[status]} />
      {user.licenseNumber && (
        <span className="text-2xs text-secondary">
          {text.licenseLabel}{" "}
          <span className="font-mono text-primary">{user.licenseNumber}</span>
        </span>
      )}
      {status === "verified" && user.credentialsVerifiedAt && (
        <span className="text-2xs text-tertiary">
          {text.verifiedOn}{" "}
          <DateTime date={user.credentialsVerifiedAt} withTime={false} />
        </span>
      )}
      <div className="ml-auto">
        <CredentialsActions
          profileId={user.id}
          fullName={formatPersonName(user.title, user.fullName)}
          licenseNumber={user.licenseNumber}
          verified={status === "verified"}
          isSelf={isSelf}
        />
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
