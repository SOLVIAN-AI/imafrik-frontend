"use client";

import { Upload } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { CredentialChip } from "@/components/domain/credential-chip";
import {
  DocumentHistory,
  DocumentPicker,
  RenewalNotice,
  formatDay,
  useDocumentUpload,
} from "@/components/credentials/document-upload";
import { PracticeChoice } from "@/components/credentials/practice-choice";
import { Panel } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { useLocale, useMessages } from "@/i18n/client";
import { declarePractice } from "@/lib/actions/credentials";
import { REQUIRED_DOCUMENT, type PracticeStatus } from "@/lib/credentials";
import type { CredentialDocument } from "@/lib/data/credentials";
import type { Profile } from "@/lib/data/profile";

/**
 * Exercice et justificatifs, dans les paramètres d'un radiologue.
 *
 * Le même dossier que le parcours d'accueil, à tout moment : l'état de
 * l'habilitation, l'exercice déclaré, le dépôt d'un justificatif (premier
 * dépôt, remplacement après un refus, renouvellement d'une attestation)
 * et l'historique des décisions, motif d'un refus compris.
 *
 * Ancre `#justificatifs` : les bandeaux et la dernière étape du parcours y
 * renvoient.
 *
 * @param profile   Profil, avec l'état d'habilitation calculé par la base.
 * @param documents Justificatifs, du plus récent au plus ancien.
 */
export function CredentialFileCard({
  profile,
  documents,
}: {
  profile: Profile;
  documents: CredentialDocument[];
}) {
  const t = useMessages().credentials;
  const locale = useLocale();
  const [practice, setPractice] = React.useState<PracticeStatus | null>(
    profile.practiceStatus,
  );
  const [saving, startSaving] = React.useTransition();
  const [sending, startSending] = React.useTransition();
  const declared = profile.practiceStatus;
  const kind = REQUIRED_DOCUMENT[declared ?? "registered"];
  const upload = useDocumentUpload(kind);
  const practiceChanged = practice !== null && practice !== declared;
  // Un inscrit habilité n'a rien à redéposer ; un résident, si : il
  // renouvelle son attestation avant son échéance.
  const uploadOpen =
    profile.credentialState !== "verified" || declared === "resident";
  const pendingRenewal = documents.some(
    (document) => document.kind === kind && document.status === "pending",
  );

  return (
    <Panel className="overflow-hidden">
      <section id="justificatifs" aria-labelledby="justificatifs-title">
        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border-subtle px-4 py-3">
          <div className="min-w-0">
            <h2 id="justificatifs-title" className="text-sm font-semibold">
              {t.settings.title}
            </h2>
            <p className="mt-0.5 text-xs text-tertiary">
              {t.settings.description}
            </p>
          </div>
          <CredentialChip
            state={profile.credentialState}
            label={t.chip[profile.credentialState]}
          />
        </div>

        <div className="flex flex-col gap-5 px-4 py-4">
          {profile.credentialState === "verified" &&
            profile.credentialsValidUntil && (
              <p className="text-xs text-secondary">
                {t.settings.validUntil(
                  formatDay(profile.credentialsValidUntil, locale),
                )}
              </p>
            )}
          <RenewalNotice
            validUntil={profile.credentialsValidUntil}
            pendingRenewal={pendingRenewal}
          />

          <div className="flex flex-col gap-3">
            <PracticeChoice value={practice} onChange={setPractice} />
            {practiceChanged && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p role="status" className="text-xs text-progress">
                  {declared ? t.practice.changeWarning : null}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  loading={saving}
                  onClick={() =>
                    startSaving(async () => {
                      const result = await declarePractice(practice);
                      if (result.ok) toast.success(t.practice.saved);
                      else toast.error(result.error);
                    })
                  }
                >
                  {t.practice.save}
                </Button>
              </div>
            )}
          </div>

          {declared && !practiceChanged && uploadOpen && (
            <DocumentPicker
              upload={upload}
              action={
                <Button
                  type="button"
                  size="sm"
                  loading={sending || upload.progress !== null}
                  disabled={!upload.file}
                  onClick={() =>
                    startSending(async () => {
                      if (await upload.send()) toast.success(t.documents.sent);
                    })
                  }
                >
                  <Upload aria-hidden />
                  {t.documents.send}
                </Button>
              }
            />
          )}

          <DocumentHistory documents={documents} />
        </div>
      </section>
    </Panel>
  );
}
