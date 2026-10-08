import type { Metadata } from "next";

import {
  Privacy,
  PRIVACY_DESCRIPTION,
  PRIVACY_TITLE,
} from "@/components/marketing/legal/privacy";
import { publicPageMetadata } from "@/lib/i18n/metadata";

export const metadata: Metadata = publicPageMetadata("en", "/confidentialite", {
  title: PRIVACY_TITLE.en,
  description: PRIVACY_DESCRIPTION.en,
});

/** Privacy, en anglais. */
export default function EnglishPrivacyPage() {
  return <Privacy locale="en" />;
}
