"use client";

import { notFound } from "next/navigation";
import * as React from "react";

import { ReportWorkspace } from "@/components/editor/report-workspace";
import { useSession } from "@/lib/demo/session";
import { reportForStudy } from "@/lib/demo/reports";
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
 * Distinct de `/examens/[id]`, qui reste la fiche de l'examen dans le
 * châssis du portail : ici on **travaille**, là on **consulte**. Deux
 * verbes, deux écrans, deux URL — un même écran qui changerait de forme
 * selon le rôle serait impossible à décrire à un utilisateur au
 * téléphone.
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
}: PageProps<"/lecture/[studyId]">) {
  const { studyId } = React.use(params);
  const { active } = useSession();
  const study = findDemoStudy(studyId);

  if (!study) notFound();

  // Un examen déjà signé s'ouvre sur son compte-rendu définitif ; les
  // autres, sur leur brouillon. À remplacer par `GET /reports?study_id=…`,
  // qui renverra l'un ou l'autre avec son état.
  const signed = reportForStudy(studyId);
  const initial = React.useMemo(
    () => signed?.sections ?? demoReport(studyId),
    [signed, studyId],
  );

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
      initiallySigned={Boolean(signed)}
      // Seul un radiologue rédige et signe. La clinique, elle, consulte
      // — la barrière réelle restant les politiques RLS côté base.
      canEdit={active.role === "radiologist"}
      signerName="Dr Adjo Kponton"
      saveDraft={saveDraft}
      signReport={signReport}
    />
  );
}
