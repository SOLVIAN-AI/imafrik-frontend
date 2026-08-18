import type { Metadata } from "next";

import { MyStudiesView } from "@/components/domain/my-studies-view";
import { listStudies } from "@/lib/data/studies";
import { getSession } from "@/lib/session/server";

export const metadata: Metadata = { title: "Mes examens" };

/**
 * Les examens pris en charge par le radiologue.
 *
 * Distinct de la file commune : ici il n'y a rien à choisir, seulement à
 * finir. Ce sont les examens sur lesquels le radiologue s'est engagé en
 * les réclamant — `claim_study()` en base — et qui bloquent le reste du
 * pool tant qu'ils ne sont ni rendus ni relâchés.
 *
 * C'est pourquoi cet écran existe séparément : un examen réclamé puis
 * oublié dans un onglet fermé serait invisible partout ailleurs.
 */
export default async function MyStudiesPage() {
  const [studies, session] = await Promise.all([
    listStudies({ status: ["assigned", "in_progress"] }),
    getSession(),
  ]);

  // Le filtrage par praticien reviendra à l'API le jour où elle exposera
  // un paramètre `assigned_to=me` ; en attendant, la comparaison se fait
  // ici, sur une liste déjà restreinte par les politiques RLS.
  const mine = studies.filter(
    (study) =>
      study.assignedTo !== null &&
      session !== null &&
      session.user.fullName.includes(study.assignedTo.replace(/^Dr\s+/, "")),
  );

  return <MyStudiesView studies={mine.length > 0 ? mine : studies} />;
}
