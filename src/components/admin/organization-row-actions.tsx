"use client";

import { UserPlus } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { InviteDialog } from "@/components/domain/invite-dialog";
import { Button } from "@/components/ui/button";
import { useMessages } from "@/i18n/client";
import {
  inviteIntoOrganization,
  setOrganizationActive,
} from "@/lib/actions/admin";
import type { AdminOrganization } from "@/lib/data/admin";
import { ROLES_BY_KIND } from "@/lib/roles";

/**
 * Actions du back-office sur une organisation : inviter, suspendre ou
 * réactiver.
 *
 * Suspendre ferme l'accès de **tous** les membres à leur requête suivante
 * — une confirmation s'impose. Les examens et comptes-rendus restent en
 * base ; réactiver rouvre l'accès tel qu'il était.
 */
export function OrganizationRowActions({
  organization,
}: {
  organization: AdminOrganization;
}) {
  const text = useMessages().admin.organisations;
  const [pending, startTransition] = React.useTransition();

  const toggle = () => {
    const suspending = organization.active;
    if (suspending && !window.confirm(text.confirmSuspend(organization.name))) {
      return;
    }
    startTransition(async () => {
      const result = await setOrganizationActive(organization.id, !suspending);
      if (!result.ok) toast.error(result.error);
    });
  };

  // Règle commune à tous les chemins d'ajout, miroir de celle du service.
  const roles = ROLES_BY_KIND[organization.kind];

  return (
    <div className="flex items-center justify-end gap-1">
      <InviteDialog
        organizationName={organization.name}
        roles={roles}
        onInvite={(input) =>
          inviteIntoOrganization({ organizationId: organization.id, ...input })
        }
        trigger={
          <Button
            variant="ghost"
            size="icon"
            aria-label={text.inviteInto(organization.name)}
          >
            <UserPlus />
          </Button>
        }
      />
      <Button variant="ghost" size="sm" loading={pending} onClick={toggle}>
        {organization.active ? text.suspend : text.reactivate}
      </Button>
    </div>
  );
}
