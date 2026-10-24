"use client";

import { useRouter } from "next/navigation";

import { AgreementForm } from "@/components/agreements/agreement-review";
import type { AgreementView } from "@/lib/agreements";

/**
 * Les engagements à accepter, l'un après l'autre.
 *
 * Après chaque acceptation, l'écran se relit sur le service : c'est lui
 * qui dit ce qui reste dû, et la page renvoie au portail quand il ne
 * reste rien.
 *
 * @param views Engagements à accepter, avec leur texte.
 */
export function PendingAgreements({ views }: { views: AgreementView[] }) {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-16">
      {views.map((view) => (
        <AgreementForm
          key={`${view.status.kind}-${view.status.version}`}
          view={view}
          onAccepted={() => router.refresh()}
        />
      ))}
    </div>
  );
}
