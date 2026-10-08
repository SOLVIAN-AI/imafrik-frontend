"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { useMessages } from "@/i18n/client";
import { clearLocalData } from "@/lib/local-data";
import { signOut } from "@/lib/session/actions";

/**
 * Bouton de déconnexion autonome, pour les écrans hors du portail.
 *
 * Même séquence que le menu du portail : brouillons locaux effacés,
 * jetons de visualisation révoqués, session fermée.
 */
export function SignOutButton() {
  const t = useMessages();
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  return (
    <Button
      variant="secondary"
      loading={pending}
      onClick={() =>
        startTransition(async () => {
          clearLocalData();
          await signOut();
          router.push("/connexion");
          router.refresh();
        })
      }
    >
      {t.common.actions.signOut}
    </Button>
  );
}
