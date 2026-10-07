import { headers } from "next/headers";
import Link from "next/link";

import {
  BackHomeButton,
  StatusScreen,
} from "@/components/layout/status-screen";
import { Button } from "@/components/ui/button";
import { LOCALE_HEADER } from "@/lib/i18n/locale";
import { localizePath } from "@/lib/i18n/routes";

/**
 * Page inconnue.
 *
 * Le cas le plus fréquent ici n'est pas une faute de frappe mais un lien
 * ancien : une adresse d'examen envoyée par courriel il y a six mois, un
 * favori vers un compte-rendu depuis archivé. Le message le dit, plutôt
 * que de suggérer une erreur de l'utilisateur.
 *
 * Sous `/en`, la page parle anglais et renvoie vers le site anglais : un
 * visiteur anglophone n'a pas de compte à retrouver.
 */
export default async function NotFound() {
  const locale = (await headers()).get(LOCALE_HEADER);

  if (locale === "en") {
    return (
      <StatusScreen
        code="404"
        locale="en"
        title="This page does not exist"
        detail={
          <>
            The address may be out of date or mistyped. There is no sign that
            the service is down.
          </>
        }
        actions={
          <>
            <Button size="lg" asChild>
              <Link href={localizePath("/contact", "en")}>Request a demo</Link>
            </Button>
            <BackHomeButton label="Back to home" href="/en" />
          </>
        }
      />
    );
  }

  return (
    <StatusScreen
      code="404"
      title="Cette page n’existe pas"
      detail={
        <>
          L’adresse est peut-être ancienne : un examen archivé, ou un lien reçu
          il y a longtemps. Rien n’indique une panne du service.
        </>
      }
      actions={
        <>
          <Button size="lg" asChild>
            <Link href="/worklist">Aller à mes examens</Link>
          </Button>
          <BackHomeButton />
        </>
      }
    />
  );
}
