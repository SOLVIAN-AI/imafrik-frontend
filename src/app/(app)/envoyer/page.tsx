import { Router } from "lucide-react";
import type { Metadata } from "next";

import { DateTime } from "@/components/domain/date-time";
import { StudyUploader } from "@/components/domain/study-uploader";
import { PageHeader, Panel } from "@/components/layout/app-shell";
import { listStudies } from "@/lib/data/studies";
import { requireSession } from "@/lib/session/server";

export const metadata: Metadata = { title: "Envoyer un examen" };

/**
 * Envoi d'un examen.
 *
 * **Deux voies, et la seconde n'est pas un repli.** La passerelle de
 * l'établissement relaie ses examens automatiquement — c'est le mode
 * normal, celui qui ne demande aucun geste. Mais une clinique sans
 * passerelle, ou un examen gravé sur CD, doit pouvoir être envoyé sans
 * rien installer : c'est le dépôt depuis le navigateur.
 *
 * Le dépôt vient en premier à l'écran — c'est l'action. La passerelle
 * vient ensuite, avec la date du dernier examen reçu : c'est la question
 * que l'on se pose quand on vient vérifier que « ça marche ».
 */
export default async function SendStudyPage() {
  const session = await requireSession(["clinic_staff"]);
  const [latest] = await listStudies({ limit: 1 });

  return (
    <>
      <PageHeader
        title="Envoyer un examen"
        description={`${session.active.organizationName} · les images sont chiffrées pendant le transfert`}
      />

      <div className="grid min-h-0 flex-1 items-start gap-4 overflow-auto px-6 pb-6 lg:grid-cols-3">
        <Panel className="flex flex-col overflow-hidden lg:col-span-2">
          <h2 className="label-eyebrow flex h-11 shrink-0 items-center border-b border-border-subtle px-4">
            Dépôt depuis ce navigateur
          </h2>
          <StudyUploader />
        </Panel>

        <Panel className="flex flex-col overflow-hidden">
          <h2 className="label-eyebrow flex h-11 shrink-0 items-center gap-2 border-b border-border-subtle px-4">
            <Router className="size-3.5" aria-hidden />
            Passerelle de l’établissement
          </h2>
          <div className="flex flex-col gap-3 p-4 text-xs leading-relaxed text-secondary">
            <p>
              Si votre établissement est équipé de la passerelle IMAFRIK, vos
              consoles n’ont rien à faire de plus : chaque examen part
              automatiquement, chiffré, une minute après la dernière image.
            </p>
            <p>
              <span className="text-tertiary">Dernier examen reçu : </span>
              {latest ? (
                <DateTime
                  date={latest.receivedAt}
                  className="font-medium text-primary"
                />
              ) : (
                <span className="font-medium text-primary">
                  aucun pour l’instant
                </span>
              )}
            </p>
            <p className="text-tertiary">
              Un examen envoyé qui n’apparaît pas ? Lancez{" "}
              <span className="font-mono">verifier.bat</span> sur le poste de la
              passerelle, puis consultez le guide remis à l’installation
              (LISEZ-MOI).
            </p>
          </div>
        </Panel>
      </div>
    </>
  );
}
