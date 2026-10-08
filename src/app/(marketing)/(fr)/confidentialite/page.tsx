import type { Metadata } from "next";

import {
  Privacy,
  PRIVACY_DESCRIPTION,
  PRIVACY_TITLE,
} from "@/components/marketing/legal/privacy";
import { publicPageMetadata } from "@/lib/i18n/metadata";

export const metadata: Metadata = publicPageMetadata("fr", "/confidentialite", {
  title: PRIVACY_TITLE.fr,
  description: PRIVACY_DESCRIPTION.fr,
});

/** Privacy, en français. */
export default function FrenchPrivacyPage() {
  return <Privacy locale="fr" />;
}
