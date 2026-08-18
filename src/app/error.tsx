"use client";

import * as React from "react";

import {
  BackHomeButton,
  StatusScreen,
} from "@/components/layout/status-screen";
import { Button } from "@/components/ui/button";

/**
 * Erreur inattendue.
 *
 * **Le bouton « Réessayer » n'est pas décoratif.** La plupart de ces
 * erreurs sont passagères — une requête qui n'aboutit pas, un jeton
 * expiré à la seconde près — et `reset()` relance le rendu du segment
 * fautif sans recharger toute l'application, donc sans perdre ce qui est
 * en cours ailleurs.
 *
 * Le détail technique n'est pas affiché : il ne dirait rien à un
 * radiologue et pourrait révéler la structure du service. Il part vers
 * la console et, en production, vers la supervision.
 */
export default function ErrorScreen({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Le `digest` est la seule information à communiquer au support :
    // il permet de retrouver la trace serveur sans exposer son contenu.
    console.error("[imafrik]", error.digest ?? error.message);
  }, [error]);

  return (
    <StatusScreen
      code={error.digest ?? "500"}
      tone="urgent"
      title="Quelque chose s’est mal passé"
      detail={
        <>
          L’écran n’a pas pu être affiché. Réessayez : ces erreurs sont le
          plus souvent passagères. Si elle se répète, communiquez au support
          le code ci-dessus.
        </>
      }
      actions={
        <>
          <Button size="lg" onClick={reset}>
            Réessayer
          </Button>
          <BackHomeButton />
        </>
      }
    />
  );
}
