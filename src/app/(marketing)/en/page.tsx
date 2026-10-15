import type { Metadata } from "next";

import { HomePage } from "@/components/marketing/pages/home-page";
import { StructuredData } from "@/components/marketing/structured-data";
import { marketingCopy } from "@/content/marketing";
import { publicPageMetadata } from "@/lib/i18n/metadata";
import { homeStructuredData } from "@/lib/seo/structured-data";

const t = marketingCopy("en").meta;

export const metadata: Metadata = publicPageMetadata("en", "/", {
  title: t.homeTitle,
  description: t.homeDescription,
  absoluteTitle: true,
});

/** Accueil, en anglais. */
export default function EnglishHomePage() {
  return (
    <>
      <StructuredData data={homeStructuredData("en", t.homeDescription)} />
      <HomePage locale="en" />
    </>
  );
}
