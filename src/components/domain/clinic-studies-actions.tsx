"use client";

import { Upload } from "lucide-react";
import Link from "next/link";

import { ListToolbar } from "@/components/domain/list-toolbar";
import { Button } from "@/components/ui/button";
import { useMessages } from "@/i18n/client";

/**
 * Actions de l'écran de suivi d'une clinique : recherche, actualisation,
 * et accès à la page de raccordement.
 *
 * Extraites de la page pour que celle-ci reste un composant serveur ;
 * composant client pour lire les textes dans la langue de l'utilisateur.
 *
 * @param search Recherche en cours, relue par la page serveur.
 */
export function ClinicStudiesActions({ search }: { search?: string }) {
  const t = useMessages();
  return (
    <>
      <ListToolbar scope="examens" search={search} />
      <Button size="sm" asChild>
        <Link href="/envoyer">
          <Upload />
          {t.clinic.studies.send}
        </Link>
      </Button>
    </>
  );
}
