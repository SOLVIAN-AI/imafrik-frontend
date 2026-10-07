import { ShieldAlert, ShieldCheck, UserRoundSearch } from "lucide-react";
import type { Metadata } from "next";

import { ControlBody, Section, Segmented } from "@/components/admin/control-ui";
import { GrantDialog } from "@/components/admin/grant-dialog";
import { MfaResetButton } from "@/components/admin/mfa-reset-button";
import { RelativeTime } from "@/components/admin/relative-time";
import { SearchBox } from "@/components/admin/search-box";
import { DateTime } from "@/components/domain/date-time";
import { PageHeader } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { listOrganizations } from "@/lib/data/admin";
import { type AdminUser, listUsers } from "@/lib/data/control";
import { formatPersonName } from "@/lib/format";
import { requireSession } from "@/lib/session/server";
import { ROLE_LABELS } from "@/lib/session/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Comptes" };

/**
 * Tous les comptes de la plateforme.
 *
 * Deux usages. **Valider** : un radiologue inscrit n'est rattaché à
 * rien, donc ne voit rien, tant que son dossier n'est pas vérifié — le
 * filtre « En attente » les isole, et un geste les rattache. **Vérifier**
 * : qui a accès à quoi, qui n'a pas activé la double authentification,
 * qui ne s'est pas connecté depuis des mois.
 */
export default async function UsersPage({
  searchParams,
}: PageProps<"/admin/utilisateurs">) {
  await requireSession(["platform_admin"]);
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : undefined;
  const pending = params.attente === "1";

  const [users, pendingCount, organizations] = await Promise.all([
    listUsers({ query, pending }),
    listUsers({ pending: true }).then((rows) => rows.length),
    listOrganizations(),
  ]);
  const grantable = organizations
    .filter((org) => org.active)
    .map((org) => ({ id: org.id, name: org.name, kind: org.kind }));
  const withoutMfa = users.filter(
    (user) => user.mfaEnabled === false && needsMfa(user),
  ).length;

  const href = (nextPending: boolean) => {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (nextPending) next.set("attente", "1");
    const search = next.toString();
    return search ? `/admin/utilisateurs?${search}` : "/admin/utilisateurs";
  };

  return (
    <>
      <PageHeader
        title="Comptes"
        description={[
          `${users.length} compte${users.length > 1 ? "s" : ""}`,
          withoutMfa > 0 &&
            `${withoutMfa} sans double authentification parmi les rôles sensibles`,
        ]
          .filter(Boolean)
          .join(" · ")}
        actions={
          <>
            <Segmented
              label="Filtre"
              options={[
                { label: "Tous", href: href(false), active: !pending },
                {
                  label: `En attente${pendingCount ? ` · ${pendingCount}` : ""}`,
                  href: href(true),
                  active: pending,
                },
              ]}
            />
            <SearchBox
              label="Rechercher un compte"
              placeholder="Nom ou adresse…"
            />
          </>
        }
      />
      <ControlBody>
        <Section
          title={pending ? "En attente de rattachement" : "Comptes"}
          description={
            pending
              ? "Inscrits, rattachés à aucune organisation : ils ne voient aucun examen."
              : "Appartenances, double authentification, dernière connexion"
          }
          flush
        >
          {users.length === 0 ? (
            <EmptyState
              icon={UserRoundSearch}
              title={
                pending ? "Aucun compte en attente" : "Aucun compte trouvé"
              }
              detail={
                query
                  ? "Essayez un autre nom ou une autre adresse."
                  : pending
                    ? "Les radiologues qui s’inscrivent apparaissent ici jusqu’à leur rattachement."
                    : undefined
              }
            />
          ) : (
            <ul className="divide-y divide-border-subtle">
              {users.map((user) => (
                <UserRow key={user.id} user={user} organizations={grantable} />
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

/** Une ligne de compte. */
function UserRow({
  user,
  organizations,
}: {
  user: AdminUser;
  organizations: {
    id: string;
    name: string;
    kind: "clinic" | "radiology_group";
  }[];
}) {
  const unattached = user.memberships.length === 0;
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 px-4 py-3 md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)_9rem_auto] md:items-center">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {formatPersonName(user.title, user.fullName)}
        </p>
        <p className="truncate text-2xs text-tertiary">
          {user.email ?? "adresse inconnue"}
          {user.licenseNumber && ` · ${user.licenseNumber}`}
        </p>
      </div>

      <div className="flex items-center justify-end md:order-last">
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
            <MfaState user={user} />
            {user.mfaEnabled && (
              <MfaResetButton profileId={user.id} fullName={user.fullName} />
            )}
          </div>
        )}
      </div>

      <ul className="col-span-2 flex min-w-0 flex-wrap gap-1.5 md:col-span-1">
        {unattached ? (
          <li className="rounded-full bg-progress-muted px-2 py-0.5 text-2xs text-progress">
            Rattaché à aucune organisation
          </li>
        ) : (
          user.memberships.map((membership) => (
            <li
              key={membership.membershipId}
              className="max-w-full truncate rounded-full border border-border-subtle bg-surface-sunken/60 px-2 py-0.5 text-2xs"
              title={`${membership.organizationName} — ${ROLE_LABELS[membership.role]}`}
            >
              <span className="text-secondary">
                {membership.organizationName}
              </span>
              <span className="text-tertiary">
                {" · "}
                {ROLE_LABELS[membership.role]}
              </span>
            </li>
          ))
        )}
      </ul>

      <p className="col-span-2 text-2xs text-tertiary md:col-span-1">
        {user.lastSignInAt ? (
          <>
            Connecté{" "}
            <RelativeTime date={user.lastSignInAt} staleAfterHours={24 * 60} />
          </>
        ) : (
          <>
            Jamais connecté · créé le{" "}
            <DateTime date={user.createdAt} withTime={false} />
          </>
        )}
      </p>
    </li>
  );
}

/** État de la double authentification. */
function MfaState({ user }: { user: AdminUser }) {
  if (user.mfaEnabled === null)
    return <span className="text-2xs text-tertiary">MFA inconnue</span>;
  if (user.mfaEnabled)
    return (
      <span className="inline-flex items-center gap-1 text-2xs text-done">
        <ShieldCheck className="size-3.5" aria-hidden />
        MFA active
      </span>
    );
  const required = needsMfa(user);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-2xs",
        required ? "text-urgent" : "text-tertiary",
      )}
      title={
        required
          ? "Exigée pour les radiologues et les administrateurs"
          : undefined
      }
    >
      <ShieldAlert className="size-3.5" aria-hidden />
      {required ? "MFA manquante" : "Sans MFA"}
    </span>
  );
}
