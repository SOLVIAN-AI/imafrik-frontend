"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { InfoTip } from "@/components/ui/info-tip";
import { Input, Select, Textarea } from "@/components/ui/input";
import { useLocale, useMessages } from "@/i18n/client";
import { trackIdea } from "@/lib/actions/ideas";
import { matchChoices, SEARCH_FROM, sortChoices } from "@/lib/filters/choice";
import { IDEA_RESPONSE_MAX, IDEA_STATUSES, type IdeaStatus } from "@/lib/ideas";

/** Une idée principale qu’on peut choisir pour un regroupement. */
export interface GroupChoice {
  id: string;
  name: string;
}

/**
 * Suivi d’une idée par l’équipe IMAFRIK : état, réponse à l’auteur, et
 * regroupement avec une idée principale (« même idée que… »).
 *
 * Le bouton n’apparaît qu’en cas de modification, comme pour les demandes
 * reçues. Une idée regroupée suit l’état de sa principale : son état ne se
 * choisit pas ici, le service le refuserait. La liste des idées
 * principales est triée par ordre alphabétique, avec une recherche dès
 * huit idées.
 *
 * @param choices Idées principales, sans celle-ci.
 */
export function IdeaTracker({
  ideaId,
  status,
  response,
  duplicateOf,
  choices,
}: {
  ideaId: string;
  status: IdeaStatus;
  response: string | null;
  duplicateOf: string | null;
  choices: readonly GroupChoice[];
}) {
  const t = useMessages();
  const locale = useLocale();
  const text = t.ideas.inbox;
  const [draftStatus, setDraftStatus] = React.useState(status);
  const [draftResponse, setDraftResponse] = React.useState(response ?? "");
  const [draftGroup, setDraftGroup] = React.useState(duplicateOf ?? "");
  const [query, setQuery] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  const grouped = draftGroup !== "";
  const statusChanged = !grouped && draftStatus !== status;
  const responseChanged = draftResponse.trim() !== (response ?? "");
  const groupChanged = draftGroup !== (duplicateOf ?? "");
  const dirty = statusChanged || responseChanged || groupChanged;

  const sorted = React.useMemo(
    () => sortChoices(choices, locale),
    [choices, locale],
  );
  const shown = React.useMemo(() => {
    const found = matchChoices(sorted, query);
    // Le choix en cours reste proposé, même hors de la recherche.
    const current = sorted.find((choice) => choice.id === draftGroup);
    return current && !found.includes(current) ? [current, ...found] : found;
  }, [sorted, query, draftGroup]);

  const save = () => {
    startTransition(async () => {
      const result = await trackIdea({
        ideaId,
        ...(statusChanged ? { status: draftStatus } : {}),
        ...(responseChanged ? { response: draftResponse.trim() || null } : {}),
        ...(groupChanged ? { duplicateOf: draftGroup || null } : {}),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const notified =
        statusChanged || (responseChanged && draftResponse.trim() !== "");
      toast.success(notified ? text.savedNotified : text.saved);
    });
  };

  const groupId = `idee-groupe-${ideaId}`;
  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex min-w-0 flex-col gap-1.5">
          <span className="text-xs font-medium text-secondary">
            {t.ideas.statusLabel}
          </span>
          {grouped ? (
            <span className="flex min-h-8 items-center text-xs text-tertiary">
              {text.followsMain}
            </span>
          ) : (
            <Select
              value={draftStatus}
              onChange={(event) =>
                setDraftStatus(event.target.value as IdeaStatus)
              }
            >
              {IDEA_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {t.ideas.status[value]}
                </option>
              ))}
            </Select>
          )}
        </label>

        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="inline-flex items-center text-xs font-medium text-secondary">
            <label htmlFor={groupId}>{text.groupLabel}</label>
            <InfoTip
              label={text.groupLabel}
              text={text.groupInfo}
              term="regroupement"
            />
          </span>
          {choices.length >= SEARCH_FROM && (
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={text.groupSearch}
              aria-label={text.groupSearch}
              aria-controls={groupId}
            />
          )}
          <Select
            id={groupId}
            value={draftGroup}
            onChange={(event) => setDraftGroup(event.target.value)}
          >
            <option value="">{text.groupNone}</option>
            {shown.map((choice) => (
              <option key={choice.id} value={choice.id}>
                {choice.name}
              </option>
            ))}
          </Select>
          {query && shown.length === 0 && (
            <p role="status" className="text-2xs text-tertiary">
              {text.groupNoMatch}
            </p>
          )}
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-secondary">
          {text.responseLabel}
        </span>
        <Textarea
          value={draftResponse}
          onChange={(event) => setDraftResponse(event.target.value)}
          maxLength={IDEA_RESPONSE_MAX}
          rows={2}
          placeholder={text.responsePlaceholder}
          className="min-h-16 resize-y text-xs"
        />
      </label>

      {dirty && (
        <div className="flex justify-end">
          <Button size="sm" onClick={save} loading={pending}>
            {t.common.actions.save}
          </Button>
        </div>
      )}
    </div>
  );
}
