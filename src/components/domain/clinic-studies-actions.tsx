"use client";

import { FileArchive } from "lucide-react";
import Link from "next/link";

import { ListToolbar } from "@/components/domain/list-toolbar";
import { useClinicView } from "@/components/providers/clinic-view-provider";
import { Button } from "@/components/ui/button";
import { useMessages } from "@/i18n/client";

/**
 * Actions de l'écran de suivi d'une clinique : recherche, actualisation,
 * et dépôt d'images.
 *
 * Extraites de la page pour que celle-ci reste un composant serveur ;
 * composant client pour lire les textes dans la langue de l'utilisateur.
 *
 * « Déposer des images » mène au dépôt d'une archive ZIP, qui reprend
 * après chaque coupure : le recours d'une clinique dont la connexion
 * manque ou dont la passerelle est en panne. Dans la vue des cliniques,
 * l'équipe IMAFRIK y dépose au nom de la clinique consultée, depuis sa
 * console.
 *
 * @param search Recherche en cours, relue par la page serveur.
 */
export function ClinicStudiesActions({ search }: { search?: string }) {
  const t = useMessages();
  const consultation = useClinicView();
  const href = consultation
    ? `/admin/depots?clinique=${encodeURIComponent(consultation.clinicId)}`
    : "/examens/depots";
  return (
    <>
      <ListToolbar
        scope={consultation ? "vue-clinique-examens" : "examens"}
        search={search}
      />
      <Button size="sm" asChild>
        <Link href={href}>
          <FileArchive />
          {t.deposits.depositAction}
        </Link>
      </Button>
    </>
  );
}
