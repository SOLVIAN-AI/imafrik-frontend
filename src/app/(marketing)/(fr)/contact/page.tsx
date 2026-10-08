import type { Metadata } from "next";

import { ContactPage } from "@/components/marketing/pages/contact-page";
import { marketingCopy } from "@/content/marketing";
import { publicPageMetadata } from "@/lib/i18n/metadata";

const t = marketingCopy("fr").meta;

export const metadata: Metadata = publicPageMetadata("fr", "/contact", {
  title: t.contactTitle,
  description: t.contactDescription,
});

/** Demande de démonstration, en français. */
export default function FrenchContactPage() {
  return <ContactPage locale="fr" />;
}
