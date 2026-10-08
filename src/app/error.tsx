"use client";

import { usePathname } from "next/navigation";
import * as React from "react";

import {
  BackHomeButton,
  StatusScreen,
} from "@/components/layout/status-screen";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/locale";
import { localeOfPath } from "@/lib/i18n/routes";

/** Textes de l'écran, dans chaque langue. */
const COPY: Record<
  Locale,
  {
    title: string;
    detail: string;
    retry: string;
    home: string;
    homeHref: string;
  }
> = {
  fr: {
    title: "Quelque chose s’est mal passé",
    detail:
      "L’écran n’a pas pu être affiché. Réessayez : ces erreurs sont le plus souvent passagères. Si elle se répète, communiquez au support le code ci-dessus.",
    retry: "Réessayer",
    home: "Retour à l’accueil",
    homeHref: "/",
  },
  en: {
    title: "Something went wrong",
    detail:
      "This page could not be displayed. Please try again: these errors are usually temporary. If it happens again, please give our support team the code above.",
    retry: "Try again",
    home: "Back to home",
    homeHref: "/en",
  },
};

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
 *
 * La langue est celle de l'adresse : identique au rendu serveur et dans le
 * navigateur, elle ne crée aucune divergence d'hydratation.
 */
export default function ErrorScreen({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = localeOfPath(usePathname());
  const t = COPY[locale];

  React.useEffect(() => {
    // Le `digest` est la seule information à communiquer au support :
    // il permet de retrouver la trace serveur sans exposer son contenu.
    console.error("[imafrik]", error.digest ?? error.message);
  }, [error]);

  return (
    <StatusScreen
      code={error.digest ?? "500"}
      locale={locale}
      tone="urgent"
      title={t.title}
      detail={t.detail}
      actions={
        <>
          <Button size="lg" onClick={reset}>
            {t.retry}
          </Button>
          <BackHomeButton label={t.home} href={t.homeHref} />
        </>
      }
    />
  );
}
