import type { Metadata } from "next";

import {
  LegalNotice,
  LEGAL_NOTICE_DESCRIPTION,
  LEGAL_NOTICE_TITLE,
} from "@/components/marketing/legal/legal-notice";
import { publicPageMetadata } from "@/lib/i18n/metadata";

export const metadata: Metadata = publicPageMetadata(
  "en",
  "/mentions-legales",
  {
    title: LEGAL_NOTICE_TITLE.en,
    description: LEGAL_NOTICE_DESCRIPTION.en,
  },
);

/** LegalNotice, en anglais. */
export default function EnglishLegalNoticePage() {
  return <LegalNotice locale="en" />;
}
