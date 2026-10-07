import { Upload } from "lucide-react";
import Link from "next/link";

import { ListToolbar } from "@/components/domain/list-toolbar";
import { Button } from "@/components/ui/button";

/**
 * Actions de l'écran de suivi d'une clinique : recherche, actualisation,
 * et accès à la page de raccordement.
 *
 * Extraites de la page pour que celle-ci reste un composant serveur.
 *
 * @param search Recherche en cours, relue par la page serveur.
 */
export function ClinicStudiesActions({ search }: { search?: string }) {
  return (
    <>
      <ListToolbar scope="examens" search={search} />
      <Button size="sm" asChild>
        <Link href="/envoyer">
          <Upload />
          Envoyer
        </Link>
      </Button>
    </>
  );
}
