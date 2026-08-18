import { redirect } from "next/navigation";

import { OnboardingChrome } from "@/components/onboarding/chrome";
import { SessionProvider } from "@/components/providers/session-provider";
import { getSession } from "@/lib/session/server";

/**
 * Disposition du parcours de mise en service.
 *
 * Elle résout la session avant tout rendu, comme les portails : on ne
 * met pas un service en place sous un compte inconnu. Le châssis visuel
 * vit à part, côté client, parce qu'il suit l'adresse courante pour
 * situer l'étape.
 */
export default async function OnboardingLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();
  if (!session) redirect("/connexion");

  return (
    <SessionProvider session={session}>
      <OnboardingChrome>{children}</OnboardingChrome>
    </SessionProvider>
  );
}
