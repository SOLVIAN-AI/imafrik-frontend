"use client";

import { Save } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Panel } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/input";
import { useMessages } from "@/i18n/client";
import { updateStudyClinicalInfo } from "@/lib/actions/studies";
import { CLINICAL_INFO_MAX_LENGTH } from "@/lib/clinical-info";

/**
 * Urgence et renseignement clinique d'un examen, complétés par la clinique.
 *
 * La clinique est la seule à savoir qu'un scanner cérébral est une
 * suspicion d'AVC. Ce volet le lui fait dire : l'urgence place l'examen en
 * tête de la file de lecture avec le délai promis pour les urgences, et
 * le renseignement s'affiche au radiologue dans son écran de lecture.
 *
 * La fiche ne l'affiche qu'au personnel de la clinique, et seulement tant
 * que le compte-rendu n'est pas signé ; le service applique les deux
 * règles de son côté.
 *
 * @param studyId      Examen concerné.
 * @param urgent       Priorité enregistrée.
 * @param clinicalInfo Renseignement enregistré.
 */
export function ClinicalInfoForm({
  studyId,
  urgent,
  clinicalInfo,
}: {
  studyId: string;
  urgent: boolean;
  clinicalInfo: string | null;
}) {
  const text = useMessages().clinic.study.clinical;
  const [isUrgent, setUrgent] = React.useState(urgent);
  const [info, setInfo] = React.useState(clinicalInfo ?? "");
  // Dernier état enregistré : le bouton ne s'active que sur un changement.
  const [saved, setSaved] = React.useState({
    urgent,
    clinicalInfo: clinicalInfo ?? "",
  });
  const [pending, startTransition] = React.useTransition();

  const dirty =
    isUrgent !== saved.urgent || info.trim() !== saved.clinicalInfo.trim();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await updateStudyClinicalInfo(studyId, {
        urgent: isUrgent,
        clinicalInfo: info,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const next = {
        urgent: result.data.urgent,
        clinicalInfo: result.data.clinicalInfo ?? "",
      };
      setSaved(next);
      setUrgent(next.urgent);
      setInfo(next.clinicalInfo);
      toast.success(text.saved);
    });
  };

  return (
    <Panel className="flex flex-col overflow-hidden">
      <h2
        id="study-clinical-title"
        className="label-eyebrow flex h-11 shrink-0 items-center gap-2 border-b border-border-subtle px-4"
      >
        {text.title}
      </h2>
      <form
        onSubmit={submit}
        aria-labelledby="study-clinical-title"
        className="flex flex-col gap-4 p-4"
      >
        <label className="flex cursor-pointer items-start gap-2.5 text-xs">
          <input
            type="checkbox"
            name="urgent"
            checked={isUrgent}
            onChange={(event) => setUrgent(event.target.checked)}
            aria-describedby="study-urgent-detail"
            className="mt-0.5 size-4 shrink-0 accent-urgent"
          />
          <span>
            <span className="block font-medium text-primary">
              {text.urgentLabel}
            </span>
            <span
              id="study-urgent-detail"
              className="mt-0.5 block text-secondary"
            >
              {text.urgentDetail}
            </span>
          </span>
        </label>

        <Field
          id="study-clinical-info"
          label={text.infoLabel}
          hint={text.infoHint}
        >
          <Textarea
            id="study-clinical-info"
            name="clinicalInfo"
            value={info}
            onChange={(event) => setInfo(event.target.value)}
            rows={4}
            maxLength={CLINICAL_INFO_MAX_LENGTH}
            placeholder={text.infoPlaceholder}
            aria-describedby="study-clinical-info-description"
          />
        </Field>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-2xs text-tertiary">{text.lockedNote}</p>
          <Button type="submit" size="sm" loading={pending} disabled={!dirty}>
            <Save />
            {text.save}
          </Button>
        </div>
      </form>
    </Panel>
  );
}
