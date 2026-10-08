import type { Metadata } from "next";

import {
  Terms,
  TERMS_DESCRIPTION,
  TERMS_TITLE,
} from "@/components/marketing/legal/terms";
import { publicPageMetadata } from "@/lib/i18n/metadata";

export const metadata: Metadata = publicPageMetadata("fr", "/cgu", {
  title: TERMS_TITLE.fr,
  description: TERMS_DESCRIPTION.fr,
});

/** Terms, en français. */
export default function FrenchTermsPage() {
  return <Terms locale="fr" />;
}
