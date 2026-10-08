import type { Metadata } from "next";

import { SecurityPage } from "@/components/marketing/pages/security-page";
import { marketingCopy } from "@/content/marketing";
import { publicPageMetadata } from "@/lib/i18n/metadata";

const t = marketingCopy("en").meta;

export const metadata: Metadata = publicPageMetadata("en", "/securite", {
  title: t.securityTitle,
  description: t.securityDescription,
});

/** Sécurité et conformité, en anglais. */
export default function EnglishSecurityPage() {
  return <SecurityPage locale="en" />;
}
