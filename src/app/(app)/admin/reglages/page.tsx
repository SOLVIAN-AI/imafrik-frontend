import { Terminal } from "lucide-react";
import type { Metadata } from "next";

import { ControlBody, Section } from "@/components/admin/control-ui";
import { SettingsForm } from "@/components/admin/settings-form";
import { DateTime } from "@/components/domain/date-time";
import { PageHeader } from "@/components/layout/app-shell";
import { getPlatformSettings } from "@/lib/data/control";
import { requireSession } from "@/lib/session/server";
import { getMessages } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.nav.items.controls };
}

/**
 * Gestes d'exploitation qui ne se font **pas** depuis un navigateur, et
 * pourquoi. Les lister ici évite qu'on les cherche — ou qu'on demande un
 * jour de les y ajouter sans en mesurer le risque. Intitulé et raison
 * vivent dans `admin.settings.operatorTasks`, sous la même clé.
 */
const OPERATOR_ONLY = [
  { key: "clinic", command: "make clinic" },
  { key: "revoke", command: "tools/dicom_pki.py revoke" },
  { key: "restore", command: "docs/exploitation.md" },
  { key: "deploy", command: "CI · deploy.yml" },
] as const;

/**
 * Réglages de la plateforme.
 *
 * Ce qui se règle d'ici s'applique immédiatement à tous : délais promis,
 * bandeau de maintenance. Chaque modification est tracée dans le journal
 * d'audit.
 */
export default async function SettingsPage() {
  await requireSession(["platform_admin"]);
  const { t } = await getMessages();
  const text = t.admin.settings;
  const settings = await getPlatformSettings();

  return (
    <>
      <PageHeader title={t.nav.items.controls} description={text.description} />
      <ControlBody>
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-5">
          <Section
            title={text.platform}
            description={
              settings ? (
                <>
                  {text.lastChanged} <DateTime date={settings.updatedAt} />
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
                {text.unreadable}
              </p>
            )}
          </Section>

          <Section
            title={text.operatorOnly}
            description={text.operatorOnlyDescription}
            className="lg:col-span-2"
            flush
          >
            <ul className="divide-y divide-border-subtle">
              {OPERATOR_ONLY.map((item) => (
                <li key={item.key} className="px-4 py-3">
                  <p className="flex flex-wrap items-center justify-between gap-2 text-sm font-medium">
                    {text.operatorTasks[item.key].task}
                    <code className="inline-flex items-center gap-1 rounded bg-surface-sunken px-1.5 py-0.5 font-mono text-2xs font-normal text-secondary">
                      <Terminal className="size-3" aria-hidden />
                      {item.command}
                    </code>
                  </p>
                  <p className="mt-0.5 text-2xs text-tertiary">
                    {text.operatorTasks[item.key].why}
                  </p>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </ControlBody>
    </>
  );
}
