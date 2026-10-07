import type { Metadata } from "next";

import { HomePage } from "@/components/marketing/pages/home-page";
import { marketingCopy } from "@/content/marketing";
import { publicPageMetadata } from "@/lib/i18n/metadata";

const t = marketingCopy("en").meta;

export const metadata: Metadata = publicPageMetadata("en", "/", {
  title: t.homeTitle,
  description: t.homeDescription,
  absoluteTitle: true,
});

/** Accueil, en anglais. */
export default function EnglishHomePage() {
  return <HomePage locale="en" />;
}
