import type { Metadata } from "next";

import { SecurityPage } from "@/components/marketing/pages/security-page";
import { marketingCopy } from "@/content/marketing";
import { publicPageMetadata } from "@/lib/i18n/metadata";

const t = marketingCopy("fr").meta;

export const metadata: Metadata = publicPageMetadata("fr", "/securite", {
  title: t.securityTitle,
  description: t.securityDescription,
});

/** Sécurité et conformité, en français. */
export default function FrenchSecurityPage() {
  return <SecurityPage locale="fr" />;
}
