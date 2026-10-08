import type { Metadata } from "next";

import { HomePage } from "@/components/marketing/pages/home-page";
import { marketingCopy } from "@/content/marketing";
import { publicPageMetadata } from "@/lib/i18n/metadata";

const t = marketingCopy("fr").meta;

/**
 * Référencement de la page d'accueil.
 *
 * La vitrine et les pages légales sont les seuls écrans indexés : tout le
 * reste est derrière authentification et manipule des données de santé.
 * La consigne globale de la disposition racine interdit l'indexation ;
 * elle est levée page par page.
 */
export const metadata: Metadata = publicPageMetadata("fr", "/", {
  title: t.homeTitle,
  description: t.homeDescription,
  absoluteTitle: true,
});

/** Accueil, en français. */
export default function FrenchHomePage() {
  return <HomePage locale="fr" />;
}
