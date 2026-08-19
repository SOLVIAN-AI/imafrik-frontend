"use client";

import { AlertTriangle } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { DicomSettingsCard } from "@/components/domain/dicom-settings";
import { PageHeader, Panel } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useSession } from "@/components/providers/session-provider";
import { ROLE_LABELS } from "@/lib/session/types";

/**
 * Paramètres.
 *
 * Organisés par **objet** — moi, mon organisation, mes alertes, mon
 * accès — et non par écran d'origine. C'est la seule classification que
 * l'utilisateur puisse deviner : on cherche « où change-t-on l'adresse de
 * la clinique », pas « dans quel menu ce champ avait-il été ajouté ».
 *
 * Le contenu dépend du rôle actif : un membre du personnel d'une clinique
 * n'a pas de bloc de signature, un radiologue n'a pas de paramètres
 * d'envoi DICOM.
 */
export default function SettingsPage() {
  const { user, active } = useSession();
  const isClinic = active.role === "clinic_staff";

  return (
    <>
      <PageHeader
        title="Paramètres"
        description={`${active.organizationName} · ${ROLE_LABELS[active.role]}`}
      />

      <div className="min-h-0 flex-1 overflow-auto px-6 pb-6">
        <div className="flex max-w-2xl flex-col gap-4">
          <Section
            title="Profil"
            description={
              isClinic
                ? "Votre identité au sein de l’établissement. Elle figure dans le journal d’accès aux examens."
                : "Ces informations apparaissent sur les comptes-rendus que vous signez."
            }
          >
            <Field id="name" label="Nom complet">
              <Input id="name" defaultValue={user.fullName} />
            </Field>
            <Field
              id="title"
              label="Titre"
              hint={
                isClinic
                  ? "Fonction dans l’établissement."
                  : "Imprimé sous la signature."
              }
            >
              <Input id="title" defaultValue={user.title} />
            </Field>
            {!isClinic && (
              <Field
                id="license"
                label="Numéro d’ordre"
                hint="Obligatoire pour signer un compte-rendu."
              >
                <Input id="license" defaultValue="TG-1284" />
              </Field>
            )}
          </Section>

          {!isClinic && (
            <Section
              title="Bloc de signature"
              description="Reproduit au bas de chaque compte-rendu signé, sous votre nom."
            >
              <Field id="signature" label="Mentions">
                <Textarea
                  id="signature"
                  rows={3}
                  defaultValue={
                    "Radiologue · Ordre des médecins du Togo n° TG-1284\nCompte-rendu établi à distance à partir des images transmises."
                  }
                />
              </Field>
            </Section>
          )}

          {isClinic && (
            <>
              <Section
                title="Établissement"
                description="Identité de la clinique, telle qu’elle apparaît sur les documents."
              >
                <Field id="org" label="Raison sociale">
                  <Input id="org" defaultValue={active.organizationName} />
                </Field>
                <Field id="city" label="Ville">
                  <Input id="city" defaultValue={active.city} />
                </Field>
              </Section>

              <Panel className="overflow-hidden">
                <SectionHeader
                  title="Passerelle"
                  description="Valeurs à saisir sur vos consoles d’acquisition. Les modifier interrompt les envois jusqu’à mise à jour des consoles."
                />
                <DicomSettingsCard
                  settings={{
                    calledAet: "IMAFRIK_GW",
                    callingAet: "SCANNER_1",
                    host: "192.168.10.20",
                    port: 104,
                  }}
                />
              </Panel>
            </>
          )}

          {isClinic && (
            <Section
              title="Qui lit vos examens"
              description="Vous choisissez. Le réglage s’applique immédiatement aux examens à venir ; ceux déjà pris en charge ne changent pas de main."
            >
              <RadiologistScope />
            </Section>
          )}

          <Section
            title="Notifications"
            description="Ce qui déclenche une alerte, et par quel canal."
          >
            <Toggle
              id="notif-urgent"
              label="Examens urgents"
              hint={
                isClinic
                  ? "Quand un compte-rendu urgent est signé."
                  : "Dès qu’un examen urgent entre dans la file."
              }
              defaultChecked
            />
            <Toggle
              id="notif-daily"
              label="Récapitulatif quotidien"
              hint="Un courriel chaque matin, à 7 h."
              defaultChecked
            />
          </Section>

          <Section
            title="Sécurité"
            description="L’accès aux images est tracé : chaque consultation est enregistrée."
          >
            <Field id="password" label="Mot de passe">
              <Input id="password" type="password" defaultValue="••••••••••" />
            </Field>
            <Toggle
              id="mfa"
              label="Second facteur"
              hint="Code à usage unique demandé à chaque connexion depuis un nouvel appareil."
            />
          </Section>
        </div>
      </div>
    </>
  );
}

/**
 * Choix du mode d’attribution.
 *
 * **Deux modes, pas trois, et aucune bascule automatique.** Une règle
 * qui s’explique en une phrase à un directeur d’établissement est une
 * règle qu’il pourra défendre auprès de ses radiologues ; un mécanisme
 * de débordement au bout de vingt minutes ne s’explique pas et se
 * conteste au premier examen manqué.
 *
 * L’ouverture au pool est présentée en premier parce qu’elle reste le
 * cas le plus fréquent, et le défaut en base.
 *
 * Un seul booléen le porte — `organizations.open_to_pool` — et il pilote
 * à la fois la visibilité des examens et le droit de les prendre en
 * charge. Les deux contrôles sont écrits séparément : la prise en charge
 * passe par une fonction qui échappe aux politiques RLS et doit donc
 * répéter la règle.
 */
function RadiologistScope() {
  const [openToPool, setOpenToPool] = React.useState(true);

  const options = [
    {
      value: true,
      title: "Tous les radiologues de la plateforme",
      detail:
        "Vos examens entrent dans la file commune. Le premier radiologue disponible les prend en charge.",
    },
    {
      value: false,
      title: "Nos radiologues uniquement",
      detail:
        "Seuls les radiologues que vous avez invités voient vos examens. Personne d’autre, à aucun moment.",
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      {options.map((option) => {
        const selected = openToPool === option.value;
        return (
          <label
            key={option.title}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-xl border p-4",
              "transition-colors duration-100",
              selected
                ? "border-accent/40 bg-accent-muted"
                : "border-border-subtle hover:border-border-default hover:bg-surface-hover",
            )}
          >
            <input
              type="radio"
              name="radiologist-scope"
              checked={selected}
              onChange={() => setOpenToPool(option.value)}
              className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]"
            />
            <span className="min-w-0">
              <span className="block text-xs font-medium">{option.title}</span>
              <span className="mt-1 block text-2xs leading-relaxed text-tertiary">
                {option.detail}
              </span>
            </span>
          </label>
        );
      })}

      {!openToPool && (
        <p className="mt-2 flex items-start gap-2 rounded-lg bg-progress-muted px-3 py-2.5 text-2xs leading-relaxed text-progress">
          <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden />
          Aucun radiologue de la plateforme ne pourra lire vos examens, y
          compris la nuit et le week-end. Assurez-vous que vos propres
          radiologues couvrent ces périodes.
        </p>
      )}
    </div>
  );
}

/** Bandeau de titre d'un bloc de paramètres. */
function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: React.ReactNode;
}) {
  return (
    <div className="border-b border-border-subtle px-4 py-3">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-0.5 text-xs text-tertiary">{description}</p>
    </div>
  );
}

/**
 * Un bloc de paramètres, avec son enregistrement.
 *
 * Un bouton par bloc plutôt qu'un seul en bas de page : on vient changer
 * une chose, pas tout. Un enregistrement global obligerait à relire toute
 * la page avant de cliquer, de peur d'écraser autre chose.
 *
 * Le jeu de démonstration ne persiste rien — la notification confirme
 * l'intention, l'écriture arrivera avec le branchement de l'API.
 */
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Panel className="overflow-hidden">
      <SectionHeader title={title} description={description} />
      <div className="flex flex-col gap-4 px-4 py-4">{children}</div>
      <div className="flex justify-end border-t border-border-subtle px-4 py-2.5">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => toast.success("Modifications enregistrées")}
        >
          Enregistrer
        </Button>
      </div>
    </Panel>
  );
}

/**
 * Interrupteur.
 *
 * L'intitulé et l'aide sont cliquables avec l'interrupteur : la cible
 * utile devient toute la ligne plutôt qu'un rectangle de trente pixels.
 */
function Toggle({
  id,
  label,
  hint,
  defaultChecked = false,
}: {
  id: string;
  label: string;
  hint: string;
  defaultChecked?: boolean;
}) {
  const [checked, setChecked] = React.useState(defaultChecked);

  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start justify-between gap-4"
    >
      <span className="min-w-0">
        <span className="block text-xs font-medium text-secondary">
          {label}
        </span>
        <span className="mt-0.5 block text-2xs text-tertiary">{hint}</span>
      </span>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => setChecked((value) => !value)}
        className={`relative h-4.5 w-8 shrink-0 rounded-full transition-colors duration-100 ${
          checked ? "bg-accent" : "bg-surface-active"
        }`}
      >
        <span
          className={`absolute top-0.5 size-3.5 rounded-full bg-white transition-all duration-100 ease-(--ease-out-quart) ${
            checked ? "left-4" : "left-0.5"
          }`}
          aria-hidden
        />
      </button>
    </label>
  );
}
