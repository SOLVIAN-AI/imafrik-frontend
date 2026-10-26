import type { Metadata } from "next";

import { CreditsPage } from "@/components/marketing/pages/credits-page";
import { marketingCopy } from "@/content/marketing";
import { publicPageMetadata } from "@/lib/i18n/metadata";

const t = marketingCopy("fr").credits;

export const metadata: Metadata = publicPageMetadata("fr", "/credits", {
  title: t.metaTitle,
  description: t.metaDescription,
});

/** Crédits des images, en français. */
export default function FrenchCreditsPage() {
  return <CreditsPage locale="fr" />;
}
