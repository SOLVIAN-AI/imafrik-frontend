import { Filter, Search, Upload } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Actions de l'écran de suivi d'une clinique.
 *
 * Extraites de la page pour que celle-ci reste un composant serveur : un
 * en-tête n'a pas besoin d'être rendu côté client, seules ses commandes
 * le sont.
 */
export function ClinicStudiesActions() {
  return (
    <>
      <Button variant="ghost" size="icon" aria-label="Rechercher">
        <Search />
      </Button>
      <Button variant="ghost" size="sm">
        <Filter />
        Filtrer
      </Button>
      <Button size="sm" asChild>
        <Link href="/envoyer">
          <Upload />
          Envoyer
        </Link>
      </Button>
    </>
  );
}
