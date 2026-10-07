import type { Metadata } from "next";

import {
  Terms,
  TERMS_DESCRIPTION,
  TERMS_TITLE,
} from "@/components/marketing/legal/terms";
import { publicPageMetadata } from "@/lib/i18n/metadata";

export const metadata: Metadata = publicPageMetadata("en", "/cgu", {
  title: TERMS_TITLE.en,
  description: TERMS_DESCRIPTION.en,
});

/** Terms, en anglais. */
export default function EnglishTermsPage() {
  return <Terms locale="en" />;
}
