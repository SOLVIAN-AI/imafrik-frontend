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
import { grantMembership } from "@/lib/actions/control";
import { ROLE_LABELS, type OrgKind, type UserRole } from "@/lib/session/types";

/** Rôles compatibles avec chaque nature d'organisation — même règle que le service. */
const ROLES_BY_KIND: Record<OrgKind, readonly UserRole[]> = {
  radiology_group: ["radiologist", "platform_admin"],
  clinic: ["clinic_staff"],
};

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
  const roles = ROLES_BY_KIND[kind];

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
      toast.success(
        `${user.fullName} est rattaché(e) à ${organization?.name ?? "l’organisation"}.`,
      );
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
          Rattacher
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Rattacher {user.fullName}</DialogTitle>
            <DialogDescription>
              Le compte accède aux examens de l’organisation dès sa prochaine
              requête. Vérifiez son dossier avant : numéro d’ordre, diplôme,
              identité.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 px-5 pb-5">
            <Field id="grant-organization" label="Organisation">
              <Select
                id="grant-organization"
                value={organizationId}
                onChange={(event) => setOrganizationId(event.target.value)}
                required
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                    {org.kind === "radiology_group" ? " (groupe)" : ""}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="grant-role" label="Rôle">
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
                    {ROLE_LABELS[role]}
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
              Annuler
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={pending}
              disabled={!organizationId}
            >
              Rattacher
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
