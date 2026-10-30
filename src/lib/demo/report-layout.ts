import "server-only";

import { cookies } from "next/headers";

import {
  DEFAULT_LAYOUT,
  isReportLayout,
  type ReportLayout,
} from "@/components/editor/sections";

/**
 * Mise en page de départ du radiologue de démonstration.
 *
 * La démonstration n'a pas de profil en base : le réglage des paramètres
 * est gardé dans un cookie, comme la langue, et décide de la mise en page
 * du brouillon vierge de démonstration. Un an, comme le cookie de langue.
 */
export const DEMO_LAYOUT_COOKIE = "imafrik-demo-mise-en-page";

/** La préférence de démonstration ; la découpe proposée à défaut. */
export async function demoLayoutPreference(): Promise<ReportLayout> {
  const value = (await cookies()).get(DEMO_LAYOUT_COOKIE)?.value;
  return isReportLayout(value) ? value : DEFAULT_LAYOUT;
}

/** Retient la préférence de démonstration, depuis une action serveur. */
export async function writeDemoLayoutPreference(
  layout: ReportLayout,
): Promise<void> {
  (await cookies()).set(DEMO_LAYOUT_COOKIE, layout, {
    path: "/",
    maxAge: 365 * 24 * 60 * 60,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
}
