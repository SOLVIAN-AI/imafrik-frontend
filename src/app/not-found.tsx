import Link from "next/link";

import {
  BackHomeButton,
  StatusScreen,
} from "@/components/layout/status-screen";
import { Button } from "@/components/ui/button";

/**
 * Page inconnue.
 *
 * Le cas le plus fréquent ici n'est pas une faute de frappe mais un lien
 * ancien : une adresse d'examen envoyée par courriel il y a six mois, un
 * favori vers un compte-rendu depuis archivé. Le message le dit, plutôt
 * que de suggérer une erreur de l'utilisateur.
 */
export default function NotFound() {
  return (
    <StatusScreen
      code="404"
      title="Cette page n’existe pas"
      detail={
        <>
          L’adresse est peut-être ancienne : un examen archivé, ou un lien
          reçu il y a longtemps. Rien n’indique une panne du service.
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
