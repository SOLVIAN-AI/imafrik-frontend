"use client";

import { notFound } from "next/navigation";
import * as React from "react";

import { ReportWorkspace } from "@/components/editor/report-workspace";
import { demoReport, findDemoStudy } from "@/lib/demo/studies";

/**
 * Simule la latence d'un aller-retour réseau.
 *
 * Sans elle, l'enregistrement paraîtrait instantané et l'on ne verrait
 * jamais les états intermédiaires qu'on a pris soin de dessiner. La
 * suppression de cette fonction fera partie du branchement de l'API.
 */
const roundTrip = (ms = 400) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Écran de lecture d'un examen.
 *
 * Composant client parce que tout y est interactif — frappe, sélection,
 * redimensionnement — et que les fonctions d'enregistrement passées à
 * l'espace de travail ne traversent pas la frontière serveur/client.
 *
 * Les données sont pour l'instant celles du jeu de démonstration. Le
 * branchement se fera en trois points seulement, tous marqués ici :
 * l'examen, le contenu initial, et les deux fonctions d'écriture.
 */
export default function ReadingPage({
  params,
}: PageProps<"/examens/[studyId]">) {
  const { studyId } = React.use(params);
  const study = findDemoStudy(studyId);

  if (!study) notFound();

  // À remplacer par `GET /reports?study_id=…`.
  const initial = React.useMemo(() => demoReport(studyId), [studyId]);

  // À remplacer par `PATCH /reports/{id}`.
  const saveDraft = React.useCallback(async () => {
    await roundTrip();
  }, []);

  // À remplacer par `POST /reports/{id}/sign`.
  const signReport = React.useCallback(async () => {
    await roundTrip(900);
  }, []);

  return (
    <ReportWorkspace
      study={study}
      // Le jeton de visualisation vient de `POST /viewer-tokens`, encore
      // à brancher : le volet image affiche donc son état indisponible.
      viewerUrl={null}
      initial={initial}
      signerName="Dr Adjo Kponton"
      saveDraft={saveDraft}
      signReport={signReport}
    />
  );
}
