import { Router } from "lucide-react";
import type { Metadata } from "next";

import { DateTime } from "@/components/domain/date-time";
import { StudyUploader } from "@/components/domain/study-uploader";
import { PageHeader, Panel } from "@/components/layout/app-shell";
import { listStudies } from "@/lib/data/studies";
import { requireSession } from "@/lib/session/server";
import { getMessages } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.clinic.send.title };
}

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
  const { t } = await getMessages();
  const messages = t.clinic.send;

  return (
    <>
      <PageHeader
        title={messages.title}
        description={messages.description(session.active.organizationName)}
      />

      <div className="grid min-h-0 flex-1 items-start gap-4 overflow-auto px-4 pb-6 sm:px-6 lg:grid-cols-3">
        <Panel className="flex flex-col overflow-hidden lg:col-span-2">
          <h2 className="label-eyebrow flex h-11 shrink-0 items-center border-b border-border-subtle px-4">
            {messages.browserUpload}
          </h2>
          <StudyUploader />
        </Panel>

        <Panel className="flex flex-col overflow-hidden">
          <h2 className="label-eyebrow flex h-11 shrink-0 items-center gap-2 border-b border-border-subtle px-4">
            <Router className="size-3.5" aria-hidden />
            {messages.gateway}
          </h2>
          <div className="flex flex-col gap-3 p-4 text-xs leading-relaxed text-secondary">
            <p>{messages.gatewayText}</p>
            <p>
              <span className="text-tertiary">{messages.lastReceived}</span>
              {latest ? (
                <DateTime
                  date={latest.receivedAt}
                  className="font-medium text-primary"
                />
              ) : (
                <span className="font-medium text-primary">
                  {messages.noneYet}
                </span>
              )}
            </p>
            <p className="text-tertiary">
              {messages.troubleshootBefore}{" "}
              <span className="font-mono">verifier.bat</span>{" "}
              {messages.troubleshootAfter}
            </p>
          </div>
        </Panel>
      </div>
    </>
  );
}
