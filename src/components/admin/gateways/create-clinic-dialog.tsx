"use client";

import { Plus, RotateCw, X } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { useLocale, useMessages } from "@/i18n/client";
import { inviteIntoOrganization } from "@/lib/actions/admin";
import {
  type ClinicInvitationOutcome,
  createClinic,
} from "@/lib/actions/gateways";
import {
  type ClinicReaders,
  EMPTY_PERSON,
  MAX_CLINIC_MANAGERS,
  MAX_CLINIC_RADIOLOGISTS,
  type TeamPerson,
  filledPeople,
} from "@/lib/clinic-team";
import { LOCALES, LOCALE_NAMES } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

/** Groupe de radiologie qui peut lire pour le réseau. */
export interface RadiologyGroupOption {
  id: string;
  name: string;
}

/** Clinique créée dont des invitations ne sont pas parties. */
interface PartialCreation {
  id: string;
  name: string;
  failed: ClinicInvitationOutcome[];
}

/**
 * Création d'une clinique et de son équipe, depuis la liste des
 * organisations.
 *
 * Une clinique naît avec au moins un responsable, et ses propres
 * radiologues ou les radiologues du réseau IMAFRIK : ouverte au réseau,
 * elle est liée par contrat de service au groupe qui lit pour lui (choisi
 * d'office s'il n'y en a qu'un). Chacun reçoit son invitation dans la
 * langue de la clinique ; un compte qui existe déjà est rattaché.
 *
 * La clinique existe dès la validation ; sa fiche s'ouvre aussitôt, sur
 * le geste suivant : émettre le code qui raccordera sa passerelle. Si une
 * invitation n'est pas partie (service d'authentification injoignable,
 * adresse refusée), la fenêtre le dit et permet de la refaire avant
 * d'ouvrir la fiche. Aucun AE Title n'est saisi : chaque passerelle reçoit
 * le sien à son enrôlement, et il ne s'affiche nulle part.
 *
 * @param groups Groupes de radiologie actifs.
 */
export function CreateClinicDialog({
  groups,
}: {
  groups: RadiologyGroupOption[];
}) {
  const t = useMessages();
  const text = t.gateways.createClinic;
  const locale = useLocale();
  const router = useRouter();
  const defaultReaders: ClinicReaders = groups.length > 0 ? "network" : "own";
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [city, setCity] = React.useState("");
  const [language, setLanguage] = React.useState<string>(locale);
  const [managers, setManagers] = React.useState<TeamPerson[]>([EMPTY_PERSON]);
  const [readers, setReaders] = React.useState<ClinicReaders>(defaultReaders);
  const [radiologists, setRadiologists] = React.useState<TeamPerson[]>([
    EMPTY_PERSON,
  ]);
  const [groupId, setGroupId] = React.useState(groups[0]?.id ?? "");
  const [error, setError] = React.useState<string | null>(null);
  const [partial, setPartial] = React.useState<PartialCreation | null>(null);
  const [pending, startTransition] = React.useTransition();

  const reset = () => {
    setName("");
    setCity("");
    setLanguage(locale);
    setManagers([EMPTY_PERSON]);
    setReaders(defaultReaders);
    setRadiologists([EMPTY_PERSON]);
    setGroupId(groups[0]?.id ?? "");
    setError(null);
    setPartial(null);
  };

  const close = () => {
    setOpen(false);
    reset();
  };

  const openClinic = (id: string) => {
    close();
    router.push(`/admin/organisations/${id}`);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const clinicName = name.trim();
    startTransition(async () => {
      const result = await createClinic({
        name,
        city,
        reportLanguage: language,
        managers: filledPeople(managers),
        readers,
        radiologists: readers === "own" ? filledPeople(radiologists) : [],
        radiologyGroupId: readers === "network" ? groupId || null : null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const failed = result.data.invitations.filter(
        (invitation) => invitation.status === "failed",
      );
      if (failed.length > 0) {
        setPartial({ id: result.data.id, name: clinicName, failed });
        return;
      }
      toast.success(text.done(clinicName, result.data.invitations.length));
      openClinic(result.data.id);
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus aria-hidden />
          {text.open}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        {partial ? (
          <PartialInvitations
            creation={partial}
            onRetried={(email) => {
              const failed = partial.failed.filter(
                (invitation) => invitation.email !== email,
              );
              // Toutes reparties : la fiche s'ouvre, comme après une
              // création sans échec.
              if (failed.length === 0) openClinic(partial.id);
              else setPartial({ ...partial, failed });
            }}
            onOpenClinic={() => openClinic(partial.id)}
          />
        ) : (
          // Bornes vérifiées par l'action, avec ses messages : pas de
          // bulle native du navigateur, dans une autre langue.
          <form onSubmit={submit} noValidate>
            <DialogHeader>
              <DialogTitle>{text.title}</DialogTitle>
              <DialogDescription>{text.description}</DialogDescription>
            </DialogHeader>

            <div className="flex max-h-[65dvh] flex-col gap-5 overflow-y-auto px-5 pb-5">
              <Field id="clinic-name" label={text.name} hint={text.nameHint}>
                <Input
                  id="clinic-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={200}
                  required
                  autoComplete="organization"
                  autoFocus
                  className="h-9"
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field id="clinic-city" label={text.city}>
                  <Input
                    id="clinic-city"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    maxLength={100}
                    autoComplete="address-level2"
                    className="h-9"
                  />
                </Field>
                <Field
                  id="clinic-language"
                  label={text.language}
                  hint={text.languageHint}
                >
                  <Select
                    id="clinic-language"
                    value={language}
                    onChange={(event) => setLanguage(event.target.value)}
                    className="h-9"
                  >
                    {LOCALES.map((option) => (
                      <option key={option} value={option}>
                        {LOCALE_NAMES[option]}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <TeamFieldset
                id="clinic-managers"
                legend={text.managers}
                hint={text.managersHint}
                people={managers}
                onChange={setManagers}
                max={MAX_CLINIC_MANAGERS}
                addLabel={text.addManager}
              />

              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 text-xs font-medium text-secondary">
                  {text.readers}
                </legend>
                <ReadersOption
                  value="own"
                  checked={readers === "own"}
                  onSelect={setReaders}
                  title={text.ownRadiologists}
                  hint={text.ownRadiologistsHint}
                />
                <ReadersOption
                  value="network"
                  checked={readers === "network"}
                  onSelect={setReaders}
                  disabled={groups.length === 0}
                  title={text.network}
                  hint={groups.length === 0 ? text.noGroup : text.networkHint}
                />
              </fieldset>

              {readers === "own" && (
                <TeamFieldset
                  id="clinic-radiologists"
                  legend={text.radiologists}
                  people={radiologists}
                  onChange={setRadiologists}
                  max={MAX_CLINIC_RADIOLOGISTS}
                  addLabel={text.addRadiologist}
                />
              )}

              {readers === "network" && groups.length > 1 && (
                <Field
                  id="clinic-group"
                  label={text.group}
                  hint={text.groupHint}
                >
                  <Select
                    id="clinic-group"
                    value={groupId}
                    onChange={(event) => setGroupId(event.target.value)}
                    className="h-9"
                  >
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}

              {error && (
                <p role="alert" className="text-xs text-urgent">
                  {error}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={close}
              >
                {t.common.actions.cancel}
              </Button>
              <Button type="submit" size="sm" loading={pending}>
                {text.submit}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Une liste de personnes à inviter : nom et adresse, une ligne chacune.
 *
 * La première ligne ne se retire pas : une liste vide se dit par une
 * ligne vide, que la création ignore.
 */
function TeamFieldset({
  id,
  legend,
  hint,
  people,
  onChange,
  max,
  addLabel,
}: {
  id: string;
  legend: string;
  hint?: string;
  people: TeamPerson[];
  onChange: (people: TeamPerson[]) => void;
  max: number;
  addLabel: string;
}) {
  const text = useMessages().gateways.createClinic;
  // La ligne qu'on vient d'ajouter prend le focus : on y tape aussitôt.
  const [added, setAdded] = React.useState<number | null>(null);

  const update = (index: number, change: Partial<TeamPerson>) =>
    onChange(
      people.map((person, position) =>
        position === index ? { ...person, ...change } : person,
      ),
    );

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1.5 text-xs font-medium text-secondary">
        {legend}
      </legend>
      {hint && <p className="text-2xs text-tertiary">{hint}</p>}
      {people.map((person, index) => (
        <div
          key={index}
          className="grid grid-cols-[1fr_auto] items-end gap-2 sm:grid-cols-[1fr_1fr_auto]"
        >
          <Field
            id={`${id}-${index}-name`}
            label={text.personName}
            className="col-start-1"
          >
            <Input
              id={`${id}-${index}-name`}
              value={person.fullName}
              onChange={(event) =>
                update(index, { fullName: event.target.value })
              }
              maxLength={200}
              autoComplete="off"
              autoFocus={added === index}
              className="h-9"
            />
          </Field>
          <Field
            id={`${id}-${index}-email`}
            label={text.personEmail}
            className="col-start-1 sm:col-start-2"
          >
            <Input
              id={`${id}-${index}-email`}
              type="email"
              value={person.email}
              onChange={(event) => update(index, { email: event.target.value })}
              autoComplete="off"
              className="h-9"
            />
          </Field>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={text.removePerson(index + 1)}
            disabled={index === 0}
            onClick={() =>
              onChange(people.filter((_, position) => position !== index))
            }
            className={cn(
              "col-start-2 row-span-2 row-start-1 self-center sm:col-start-3 sm:row-span-1 sm:self-end",
              index === 0 && "invisible",
            )}
          >
            <X />
          </Button>
        </div>
      ))}
      {people.length < max && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="self-start"
          onClick={() => {
            setAdded(people.length);
            onChange([...people, EMPTY_PERSON]);
          }}
        >
          <Plus aria-hidden />
          {addLabel}
        </Button>
      )}
    </fieldset>
  );
}

/** Un choix de lecture : ses propres radiologues, ou le réseau IMAFRIK. */
function ReadersOption({
  value,
  checked,
  onSelect,
  disabled = false,
  title,
  hint,
}: {
  value: ClinicReaders;
  checked: boolean;
  onSelect: (value: ClinicReaders) => void;
  disabled?: boolean;
  title: string;
  hint: string;
}) {
  return (
    <label
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-xs transition-colors",
        checked
          ? "border-accent ring-1 ring-accent"
          : "border-border-default hover:border-border-strong",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
      )}
    >
      <input
        type="radio"
        name="clinic-readers"
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onSelect(value)}
        className="mt-0.5 size-4 shrink-0 accent-accent"
      />
      <span>
        <span className="block font-medium">{title}</span>
        <span className="mt-0.5 block text-tertiary">{hint}</span>
      </span>
    </label>
  );
}

/**
 * La clinique est créée, mais des invitations ne sont pas parties : la
 * raison de chacune, et de quoi la refaire.
 */
function PartialInvitations({
  creation,
  onRetried,
  onOpenClinic,
}: {
  creation: PartialCreation;
  onRetried: (email: string) => void;
  onOpenClinic: () => void;
}) {
  const t = useMessages();
  const text = t.gateways.createClinic;

  return (
    <>
      <DialogHeader>
        <DialogTitle>{text.partialTitle}</DialogTitle>
        <DialogDescription>
          {text.partialDescription(creation.name, creation.failed.length)}
        </DialogDescription>
      </DialogHeader>
      <ul className="flex flex-col gap-2 px-5 pb-5">
        {creation.failed.map((invitation) => (
          <FailedInvitation
            key={invitation.email}
            organizationId={creation.id}
            invitation={invitation}
            onRetried={() => onRetried(invitation.email)}
          />
        ))}
      </ul>
      <DialogFooter>
        <Button type="button" size="sm" onClick={onOpenClinic}>
          {text.openClinic}
        </Button>
      </DialogFooter>
    </>
  );
}

/** Une invitation en échec : qui, pourquoi, et l'essai suivant. */
function FailedInvitation({
  organizationId,
  invitation,
  onRetried,
}: {
  organizationId: string;
  invitation: ClinicInvitationOutcome;
  onRetried: () => void;
}) {
  const t = useMessages();
  const text = t.gateways.createClinic;
  const [error, setError] = React.useState(invitation.error);
  const [pending, startTransition] = React.useTransition();

  const retry = () =>
    startTransition(async () => {
      const result = await inviteIntoOrganization({
        organizationId,
        email: invitation.email,
        fullName: invitation.fullName,
        role: invitation.role,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(text.retried(invitation.fullName));
      onRetried();
    });

  return (
    <li className="flex items-start justify-between gap-3 rounded-lg border border-border-default px-3 py-2.5">
      <div className="min-w-0 text-xs">
        <p className="font-medium">
          {invitation.fullName}
          <span className="font-normal text-tertiary">
            {" · "}
            {t.common.roles[invitation.role]}
          </span>
        </p>
        <p className="truncate text-tertiary">{invitation.email}</p>
        {error && (
          <p role="alert" className="mt-1 text-urgent">
            {error}
          </p>
        )}
      </div>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        loading={pending}
        aria-label={text.retryFor(invitation.fullName)}
        onClick={retry}
      >
        <RotateCw aria-hidden />
        {text.retry}
      </Button>
    </li>
  );
}
