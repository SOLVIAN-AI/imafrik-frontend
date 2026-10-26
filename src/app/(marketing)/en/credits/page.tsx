import type { Metadata } from "next";

import { CreditsPage } from "@/components/marketing/pages/credits-page";
import { marketingCopy } from "@/content/marketing";
import { publicPageMetadata } from "@/lib/i18n/metadata";

const t = marketingCopy("en").credits;

export const metadata: Metadata = publicPageMetadata("en", "/credits", {
  title: t.metaTitle,
  description: t.metaDescription,
});

/** Crédits des images, en anglais. */
export default function EnglishCreditsPage() {
  return <CreditsPage locale="en" />;
}
