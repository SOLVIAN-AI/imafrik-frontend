"use client";

import { Link2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, Select } from "@/components/ui/input";
import { useMessages } from "@/i18n/client";
import { grantMembership } from "@/lib/actions/control";
import { ROLES_BY_KIND } from "@/lib/roles";
import type { OrgKind, UserRole } from "@/lib/session/types";

/**
 * Rattachement d'un compte existant à une organisation.
 *
 * Le cas d'usage : un radiologue s'inscrit, son dossier (numéro d'ordre,
 * diplôme) est vérifié hors ligne, puis on le rattache au groupe qui lit
 * pour le pool. Tant qu'il n'est rattaché nulle part, il ne voit aucun
 * examen — c'est la base qui l'impose, pas cet écran.
 *
 * @param user          Compte à rattacher.
 * @param organizations Organisations proposées.
 */
export function GrantDialog({
  user,
  organizations,
}: {
  user: { id: string; fullName: string; isRadiologist: boolean };
  organizations: { id: string; name: string; kind: OrgKind }[];
}) {
  const t = useMessages();
  const text = t.admin.grant;
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  // Un radiologue rejoint d'ordinaire un groupe de radiologie.
  const preferred =
    organizations.find(
      (org) => org.kind === (user.isRadiologist ? "radiology_group" : "clinic"),
    ) ?? organizations[0];
  const [organizationId, setOrganizationId] = React.useState(
    preferred?.id ?? "",
  );
  const kind =
    organizations.find((org) => org.id === organizationId)?.kind ?? "clinic";
  // Règle commune à l'invitation et au rattachement (lib/roles.ts).
  const roles: readonly UserRole[] = ROLES_BY_KIND[kind];

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const role = String(form.get("role") ?? roles[0]) as UserRole;
    const organization = organizations.find((org) => org.id === organizationId);
    setError(null);
    startTransition(async () => {
      const result = await grantMembership({
        profileId: user.id,
        organizationId,
        role,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(text.done(user.fullName, organization?.name ?? null));
      setOpen(false);
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          <Link2 />
          {text.trigger}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{text.title(user.fullName)}</DialogTitle>
            <DialogDescription>{text.description}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 px-5 pb-5">
            <Field id="grant-organization" label={text.organisation}>
              <Select
                id="grant-organization"
                value={organizationId}
                onChange={(event) => setOrganizationId(event.target.value)}
                required
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                    {org.kind === "radiology_group" ? text.groupSuffix : ""}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="grant-role" label={text.role}>
              {/* La clé force une liste neuve quand la nature change : le
                  rôle par défaut suit l'organisation choisie. */}
              <Select
                key={kind}
                id="grant-role"
                name="role"
                defaultValue={roles[0]}
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {t.common.roles[role]}
                  </option>
                ))}
              </Select>
            </Field>
            {error && (
              <p role="alert" className="text-xs text-urgent">
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              {t.common.actions.cancel}
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={pending}
              disabled={!organizationId}
            >
              {text.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
