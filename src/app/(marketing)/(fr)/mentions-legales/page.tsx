import type { Metadata } from "next";

import {
  LegalNotice,
  LEGAL_NOTICE_DESCRIPTION,
  LEGAL_NOTICE_TITLE,
} from "@/components/marketing/legal/legal-notice";
import { publicPageMetadata } from "@/lib/i18n/metadata";

export const metadata: Metadata = publicPageMetadata(
  "fr",
  "/mentions-legales",
  {
    title: LEGAL_NOTICE_TITLE.fr,
    description: LEGAL_NOTICE_DESCRIPTION.fr,
  },
);

/** LegalNotice, en français. */
export default function FrenchLegalNoticePage() {
  return <LegalNotice locale="fr" />;
}
