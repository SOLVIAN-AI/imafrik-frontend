import Link from "next/link";

import { StatusScreen } from "@/components/layout/status-screen";
import { Button } from "@/components/ui/button";

/**
 * Accès refusé.
 *
 * **Le cas le plus fréquent n'est pas une tentative d'intrusion**, mais
 * un utilisateur qui appartient à plusieurs organisations et regarde
 * sous la mauvaise casquette : le lien d'un examen de la clinique
 * ouvert alors que l'organisation active est le cabinet de radiologie.
 *
 * Le message le dit et propose le geste qui débloque — changer
 * d'organisation — au lieu de laisser croire à une panne.
 */
export default function Forbidden() {
  return (
    <StatusScreen
      code="403"
      tone="urgent"
      title="Cet examen ne vous est pas accessible"
      detail={
        <>
          Il appartient à une organisation dont vous n’êtes pas membre — ou
          vous êtes connecté sous une autre casquette. Vérifiez
          l’organisation active en haut de la navigation avant d’ouvrir à
          nouveau le lien.
        </>
      }
      actions={
        <Button size="lg" asChild>
          <Link href="/worklist">Retour à ma file de travail</Link>
        </Button>
      }
    />
  );
}
