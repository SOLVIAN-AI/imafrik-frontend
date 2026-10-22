import type { Metadata } from "next";

import { HomePage } from "@/components/marketing/pages/home-page";
import { marketingCopy } from "@/content/marketing";
import { publicPageMetadata } from "@/lib/i18n/metadata";

const t = marketingCopy("fr").meta;

/**
 * Aperçu de la page d'accueil avec le parcours animé.
 *
 * La page d'accueil telle qu'elle sera, à valider avant la mise en ligne :
 * jamais indexée, absente du plan du site.
 */
export const metadata: Metadata = publicPageMetadata("fr", "/apercu/parcours", {
  title: t.homeTitle,
  description: t.homeDescription,
  absoluteTitle: true,
  index: false,
});

/** Aperçu, en français. */
export default function FrenchJourneyPreview() {
  return <HomePage locale="fr" journey />;
}
