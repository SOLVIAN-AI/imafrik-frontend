"use client";

import { UserPlus } from "lucide-react";
import { toast } from "sonner";

import { InviteDialog } from "@/components/domain/invite-dialog";
import { Button } from "@/components/ui/button";
import { useMessages } from "@/i18n/client";
import { inviteIntoOrganization } from "@/lib/actions/admin";
import { trackContactRequest } from "@/lib/actions/control";

/**
 * Accepter une demande de radiologue : l'inviter, puis la clore.
 *
 * L'invitation part vers l'équipe de la plateforme, au rôle de
 * radiologue seulement : une demande reçue par le site ne peut pas créer
 * un administrateur. Le nom et l'adresse de la demande sont proposés,
 * modifiables. Une fois l'invitation envoyée, la demande passe à
 * « Convertie », ses notes conservées.
 *
 * Remplace un parcours en quatre écrans (la demande, les organisations,
 * l'invitation, retour à la demande), signalé le 15 octobre 2026.
 */
export function InviteRequesterButton({
  requestId,
  notes,
  fullName,
  email,
  organizationId,
  organizationName,
}: {
  requestId: string;
  notes: string | null;
  fullName: string;
  email: string;
  /** Équipe de la plateforme, qui accueille les radiologues du pool. */
  organizationId: string;
  organizationName: string;
}) {
  const text = useMessages().admin.requests;

  return (
    <InviteDialog
      organizationName={organizationName}
      roles={["radiologist"]}
      defaults={{ fullName: withoutTitle(fullName), email }}
      onInvite={async (input) => {
        const invited = await inviteIntoOrganization({
          organizationId,
          ...input,
        });
        if (!invited.ok) return invited;
        const tracked = await trackContactRequest({
          requestId,
          status: "converted",
          notes: notes ?? "",
        });
        // L'invitation est partie : un suivi non mis à jour n'est qu'un
        // oubli à rattraper à la main, pas un échec de l'invitation.
        if (!tracked.ok) toast.error(text.inviteTrackingFailed);
        return invited;
      }}
      trigger={
        <Button size="sm" variant="secondary">
          <UserPlus aria-hidden />
          {text.inviteRadiologist}
        </Button>
      }
    />
  );
}

/**
 * Nom sans titre de civilité. Le formulaire de contact laisse écrire
 * « Dr Sena Akakpo » ; IMAFRIK ajoute lui-même le titre au nom, qui
 * deviendrait sinon « Dr Dr Sena Akakpo » sur les comptes-rendus.
 *
 * @param name Nom saisi dans la demande.
 */
export function withoutTitle(name: string): string {
  return name.replace(/^\s*(?:dr|docteur|pr|professeur)\.?\s+/i, "").trim();
}
