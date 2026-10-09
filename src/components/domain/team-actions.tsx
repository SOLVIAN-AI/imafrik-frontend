"use client";

import { MoreHorizontal } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { InviteDialog } from "@/components/domain/invite-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMessages } from "@/i18n/client";
import { inviteMember, removeMember } from "@/lib/actions/organization";
import { ROLES_BY_KIND } from "@/lib/roles";

/**
 * Bouton d'invitation de l'écran « Équipe ».
 *
 * Une clinique invite son personnel et, si elle en emploie, ses propres
 * radiologues — qui liront ses examens qu'elle les ouvre au pool ou non.
 */
export function InviteMemberButton({
  organizationName,
}: {
  organizationName: string;
}) {
  return (
    <InviteDialog
      organizationName={organizationName}
      roles={ROLES_BY_KIND.clinic}
      onInvite={(input) =>
        inviteMember({
          email: input.email,
          fullName: input.fullName,
          role: input.role === "radiologist" ? "radiologist" : "clinic_staff",
        })
      }
    />
  );
}

/**
 * Actions sur un membre : le retirer de la clinique.
 *
 * Son compte n'est pas supprimé — il garde ses autres appartenances —
 * mais il perd l'accès à cette clinique à sa requête suivante.
 */
export function MemberActions({
  membershipId,
  fullName,
}: {
  membershipId: string;
  fullName: string;
}) {
  const t = useMessages().clinic.team;
  const [pending, startTransition] = React.useTransition();

  const remove = () => {
    if (!window.confirm(t.removeConfirm(fullName))) {
      return;
    }
    startTransition(async () => {
      const result = await removeMember(membershipId);
      if (result.ok) toast.success(t.removed(fullName));
      else toast.error(result.error);
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          loading={pending}
          aria-label={t.actionsFor(fullName)}
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem className="text-urgent" onSelect={remove}>
          {t.remove}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
