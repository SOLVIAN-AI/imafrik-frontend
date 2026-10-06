"use client";

import { AlertTriangle, RotateCw } from "lucide-react";
import * as React from "react";

import { Panel } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";

/**
 * Erreur d'un écran des portails, affichée **dans** le châssis.
 *
 * L'erreur racine remplace toute la page ; ici la navigation reste en
 * place. Un service momentanément injoignable ne doit pas faire perdre
 * ses repères à l'utilisateur : il réessaie, ou part vers un autre écran
 * qui, lui, répond peut-être.
 *
 * Le détail technique n'est pas affiché — il ne dirait rien à un
 * radiologue et pourrait révéler la structure du service. Seul le
 * `digest`, qui permet au support de retrouver la trace serveur, l'est.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[imafrik]", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center p-6">
      <Panel className="w-full max-w-md px-8 py-10 text-center">
        <span className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full bg-urgent-muted ring-1 ring-urgent/20 ring-inset">
          <AlertTriangle className="size-5 text-urgent" aria-hidden />
        </span>
        <h1 className="text-xl font-semibold">
          Cet écran n’a pas pu s’afficher
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-secondary">
          Le service n’a pas répondu comme prévu. Ces erreurs sont le plus
          souvent passagères : réessayez dans un instant.
        </p>
        {error.digest && (
          <p className="mt-4 font-mono text-2xs text-tertiary">
            Référence : {error.digest}
          </p>
        )}
        <Button className="mt-6" onClick={reset}>
          <RotateCw />
          Réessayer
        </Button>
      </Panel>
    </div>
  );
}
