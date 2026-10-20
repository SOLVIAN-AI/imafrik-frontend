import type { Metadata } from "next";

import { HomePage } from "@/components/marketing/pages/home-page";
import { marketingCopy } from "@/content/marketing";
import { publicPageMetadata } from "@/lib/i18n/metadata";

const t = marketingCopy("en").meta;

/**
 * Aperçu de la page d'accueil avec le parcours animé.
 *
 * La page d'accueil telle qu'elle sera, à valider avant la mise en ligne :
 * jamais indexée, absente du plan du site.
 */
export const metadata: Metadata = publicPageMetadata("en", "/apercu/parcours", {
  title: t.homeTitle,
  description: t.homeDescription,
  absoluteTitle: true,
  index: false,
});

/** Aperçu, en anglais. */
export default function EnglishJourneyPreview() {
  return <HomePage locale="en" journey />;
}
