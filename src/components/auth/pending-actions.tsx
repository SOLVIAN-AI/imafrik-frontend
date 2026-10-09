"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";
import { useMessages } from "@/i18n/client";
import { resumeAccess, setActiveMembership } from "@/lib/session/actions";
import type { Membership } from "@/lib/session/types";

/**
 * Sorties de l'écran `/en-attente` : changer d'organisation, se déconnecter.
 *
 * **Toujours affichées, jamais derrière une redirection.** Cet écran est
 * celui où le proxy envoie tout jeton sans rôle ; s'il redirigeait à son
 * tour vers un portail que le jeton n'ouvre pas, le proxy le renverrait
 * ici, et le navigateur tournerait jusqu'à `ERR_TOO_MANY_REDIRECTS`, sans
 * qu'aucun bouton ne s'affiche jamais.
 *
 * Quand la base donne un accès que le jeton n'a pas encore (`resume`),
 * le jeton est renouvelé une seule fois, au montage ; on ne quitte
 * l'écran que si le nouveau jeton ouvre effectivement un portail.
 *
 * @param memberships Organisations actives vers lesquelles basculer.
 * @param resume      Tenter un renouvellement du jeton au montage.
 */
export function PendingActions({
  memberships,
  resume,
}: {
  memberships: readonly Membership[];
  resume: boolean;
}) {
  const t = useMessages();
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [resuming, setResuming] = React.useState(resume);
  const attempted = React.useRef(false);

  React.useEffect(() => {
    if (!resume || attempted.current) return;
    attempted.current = true;
    void resumeAccess()
      .then((destination) => {
        if (destination) router.replace(destination);
        else setResuming(false);
      })
      .catch(() => setResuming(false));
  }, [resume, router]);

  const open = (membership: Membership) =>
    startTransition(async () => {
      const result = await setActiveMembership(membership.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const destination = await resumeAccess();
      if (destination) router.replace(destination);
      else router.refresh();
    });

  return (
    <div className="flex flex-col items-center gap-4">
      {resuming && (
        <p role="status" className="text-xs text-tertiary">
          {t.session.pending.resuming}
        </p>
      )}
      {memberships.length > 0 && (
        <div className="flex flex-col items-center gap-2">
          <p className="max-w-md text-xs leading-relaxed text-secondary">
            {t.session.pending.otherOrganizations}
          </p>
          {memberships.map((membership) => (
            <Button
              key={membership.id}
              loading={pending}
              onClick={() => open(membership)}
            >
              {t.session.pending.openOrganization(membership.organizationName)}
            </Button>
          ))}
        </div>
      )}
      <SignOutButton />
    </div>
  );
}
