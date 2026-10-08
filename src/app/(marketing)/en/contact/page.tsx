import type { Metadata } from "next";

import { ContactPage } from "@/components/marketing/pages/contact-page";
import { marketingCopy } from "@/content/marketing";
import { publicPageMetadata } from "@/lib/i18n/metadata";

const t = marketingCopy("en").meta;

export const metadata: Metadata = publicPageMetadata("en", "/contact", {
  title: t.contactTitle,
  description: t.contactDescription,
});

/** Demande de démonstration, en anglais. */
export default function EnglishContactPage() {
  return <ContactPage locale="en" />;
}
