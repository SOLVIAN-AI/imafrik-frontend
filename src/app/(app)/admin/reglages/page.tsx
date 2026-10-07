import { Terminal } from "lucide-react";
import type { Metadata } from "next";

import { ControlBody, Section } from "@/components/admin/control-ui";
import { SettingsForm } from "@/components/admin/settings-form";
import { DateTime } from "@/components/domain/date-time";
import { PageHeader } from "@/components/layout/app-shell";
import { getPlatformSettings } from "@/lib/data/control";
import { requireSession } from "@/lib/session/server";

export const metadata: Metadata = { title: "Réglages" };

/**
 * Gestes d'exploitation qui ne se font **pas** depuis un navigateur, et
 * pourquoi. Les lister ici évite qu'on les cherche — ou qu'on demande un
 * jour de les y ajouter sans en mesurer le risque.
 */
const OPERATOR_ONLY = [
  {
    task: "Raccorder une clinique",
    command: "make clinic",
    why: "Génère le certificat DICOM TLS et la clé Tailscale à usage unique : des secrets qui ne transitent pas par le web.",
  },
  {
    task: "Révoquer une passerelle",
    command: "tools/dicom_pki.py revoke",
    why: "La révocation touche l’autorité de certification, gardée hors ligne.",
  },
  {
    task: "Restaurer une sauvegarde",
    command: "docs/exploitation.md",
    why: "Le déchiffrement exige la clé privée age, conservée hors du web et jamais saisie dans un formulaire.",
  },
  {
    task: "Déployer une version",
    command: "CI · deploy.yml",
    why: "Chaque déploiement passe par la CI, ses tests et son approbation.",
  },
];

/**
 * Réglages de la plateforme.
 *
 * Ce qui se règle d'ici s'applique immédiatement à tous : délais promis,
 * bandeau de maintenance. Chaque modification est tracée dans le journal
 * d'audit.
 */
export default async function SettingsPage() {
  await requireSession(["platform_admin"]);
  const settings = await getPlatformSettings();

  return (
    <>
      <PageHeader
        title="Réglages"
        description="S’appliquent à toute la plateforme dès le prochain affichage et sont tracés dans le journal d’audit"
      />
      <ControlBody>
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-5">
          <Section
            title="Plateforme"
            description={
              settings ? (
                <>
                  Dernière modification le{" "}
                  <DateTime date={settings.updatedAt} />
                </>
              ) : undefined
            }
            className="lg:col-span-3"
          >
            {settings ? (
              <SettingsForm
                urgent={settings.targets.urgent}
                routine={settings.targets.routine}
                maintenanceMessage={settings.maintenanceMessage}
              />
            ) : (
              <p role="alert" className="text-sm text-urgent">
                Les réglages sont momentanément illisibles : le service ne
                répond pas. Réessayez dans un instant.
              </p>
            )}
          </Section>

          <Section
            title="Depuis le poste d’exploitation"
            description="Volontairement absents de cet écran"
            className="lg:col-span-2"
            flush
          >
            <ul className="divide-y divide-border-subtle">
              {OPERATOR_ONLY.map((item) => (
                <li key={item.task} className="px-4 py-3">
                  <p className="flex flex-wrap items-center justify-between gap-2 text-sm font-medium">
                    {item.task}
                    <code className="inline-flex items-center gap-1 rounded bg-surface-sunken px-1.5 py-0.5 font-mono text-2xs font-normal text-secondary">
                      <Terminal className="size-3" aria-hidden />
                      {item.command}
                    </code>
                  </p>
                  <p className="mt-0.5 text-2xs text-tertiary">{item.why}</p>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </ControlBody>
    </>
  );
}
