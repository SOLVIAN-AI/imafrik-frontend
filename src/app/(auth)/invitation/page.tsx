import { Building2, Mail } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { NewPasswordForm } from "@/components/auth/new-password-form";
import { Wordmark } from "@/components/brand/brand";
import { DateTime } from "@/components/domain/date-time";
import { LanguageSwitch } from "@/components/marketing/language-switch";
import { messagesFor, type AppMessages } from "@/i18n";
import { type Invitation, getInvitation } from "@/lib/data/invitation";
import { requestLocale } from "@/lib/i18n/server";
import { PUBLISHER } from "@/lib/legal";
import { getAuthState, passwordNeedsSecondFactor } from "@/lib/session/server";
import { cn } from "@/lib/utils";

/** Écran de la double authentification, puis la mise en service. */
const ONBOARDING = "/bienvenue";
const AFTER_MFA = `/double-authentification?suite=${encodeURIComponent(ONBOARDING)}`;

/** Titre de l'onglet, dans la langue de l'écran ; jamais indexé. */
export async function generateMetadata(): Promise<Metadata> {
  const t = messagesFor(await requestLocale());
  return {
    title: t.session.invitation.metaTitle,
    robots: { index: false, follow: false },
  };
}

/**
 * Accueil d'une personne invitée.
 *
 * Le lien du courriel d'invitation passe par `/auth/callback`, qui ouvre
 * la session, puis conduit ici (`suite=/invitation`). L'écran dit d'abord
 * **qui accueille, pour quel rôle, et qui a invité** : l'invité qui
 * attendait le lien se reconnaît, celui qui ne l'attendait pas sait qu'il
 * doit s'arrêter et à qui écrire. Vient ensuite le choix du mot de passe,
 * puis la double authentification quand le rôle l'exige (radiologue,
 * équipe IMAFRIK), et enfin la mise en service (`/bienvenue`).
 *
 * **Accessible avant la double authentification.** Le proxy laisse passer
 * cet écran pour une session `mfa_required` : le choix du mot de passe
 * précède l'enrôlement du second facteur. Le service sert l'invitation
 * (`GET /me/invitation`) dans ce même état, et le jeton n'ouvre toujours
 * aucune donnée médicale.
 *
 * Seule exception : un compte qui a **déjà** un facteur vérifié (invité
 * de nouveau, ou session ouverte par un mot de passe dérobé) passe
 * d'abord par sa vérification ; le changement de mot de passe le refuse
 * aussi de son côté.
 *
 * Si l'invitation ne peut pas être lue, l'écran retombe sur le simple
 * choix du mot de passe : l'accueil est un confort, pas une condition.
 *
 * La langue est celle de l'écran de connexion (cookie de langue), avec le
 * même sélecteur : l'invité choisit la sienne avant de lire.
 */
export default async function InvitationPage() {
  const state = await getAuthState();
  if (state === "anonymous") redirect("/connexion");
  if (state === "no-membership") redirect("/en-attente");
  // Un compte déjà doté d'un second facteur le vérifie avant de toucher
  // au mot de passe : cet écran ne doit pas le contourner.
  if (await passwordNeedsSecondFactor()) redirect("/double-authentification");

  const locale = await requestLocale();
  const t = messagesFor(locale);
  const text = t.session.invitation;
  const invitation = await getInvitation();
  const needsMfa = state === "mfa-required";
  const next = needsMfa ? AFTER_MFA : ONBOARDING;

  return (
    <div className="w-full max-w-md animate-[rise-in_400ms_var(--ease-out-quart)]">
      {/* La marque n'apparaît ici que sur les écrans étroits, où le
          panneau de gauche est masqué. */}
      <div className="mb-8 flex items-center justify-between gap-2.5">
        <Wordmark className="h-5 lg:invisible" />
        <LanguageSwitch locale={locale} />
      </div>

      {invitation ? (
        <>
          <p className="label-eyebrow">{text.eyebrow}</p>
          <h2 className="mt-1.5 text-2xl font-semibold text-balance">
            {text.welcome(invitation.organizationName)}
          </h2>
          <p className="mt-1.5 text-sm text-tertiary">{text.intro}</p>
          <InvitationDetails invitation={invitation} t={t} />
          <p className="mt-4 flex gap-2 text-xs leading-relaxed text-secondary">
            <Mail
              className="mt-0.5 size-3.5 shrink-0 text-tertiary"
              aria-hidden
            />
            <span>
              {text.notExpectedBefore}
              <a
                href={`mailto:${PUBLISHER.contact}`}
                className="text-accent underline-offset-2 hover:underline"
              >
                {PUBLISHER.contact}
              </a>
              {text.notExpectedAfter}
            </span>
          </p>

          <Steps needsMfa={needsMfa} t={t} />

          <h3 className="mt-6 text-base font-semibold">{text.passwordTitle}</h3>
          <p className="mt-1 text-xs text-tertiary">
            {needsMfa ? text.nextMfa : text.nextOnboarding}
          </p>
          <div className="mt-5">
            <NewPasswordForm
              next={next}
              submitLabel={text.submit}
              autoFocus={false}
            />
          </div>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-semibold">
            {t.session.newPassword.title}
          </h2>
          <p className="mt-1.5 text-sm text-tertiary">
            {needsMfa ? text.nextMfa : text.nextOnboarding}
          </p>
          <div className="mt-8">
            <NewPasswordForm next={next} submitLabel={text.submit} />
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Carte de l'invitation : organisation, rôle en clair, ville, et qui a
 * invité, quand le service le sait.
 */
function InvitationDetails({
  invitation,
  t,
}: {
  invitation: Invitation;
  t: AppMessages;
}) {
  const text = t.session.invitation;
  return (
    <section
      aria-label={text.detailsLabel}
      className="mt-6 rounded-xl border border-border-subtle bg-surface-raised p-4 shadow-raised"
    >
      <div className="flex items-start gap-3">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-muted ring-1 ring-accent/25 ring-inset"
          aria-hidden
        >
          <Building2 className="size-4 text-accent" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium">{invitation.organizationName}</p>
          <p className="text-2xs text-tertiary">
            {text.organizationKinds[invitation.organizationKind]}
          </p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-xs">
        <dt className="text-tertiary">{text.role}</dt>
        <dd>
          <span className="font-medium">{text.roleNames[invitation.role]}</span>
          <span className="mt-0.5 block text-secondary">
            {text.roleDetails[invitation.role]}
          </span>
        </dd>
        {invitation.city && (
          <>
            <dt className="text-tertiary">{text.city}</dt>
            <dd>{invitation.city}</dd>
          </>
        )}
        {invitation.invitedByName && (
          <>
            <dt className="text-tertiary">{text.invitedBy}</dt>
            <dd>{invitation.invitedByName}</dd>
          </>
        )}
        <dt className="text-tertiary">{text.sentOn}</dt>
        <dd>
          <DateTime date={invitation.invitedAt} withTime={false} />
        </dd>
      </dl>
    </section>
  );
}

/**
 * Les étapes de l'arrivée, la première en cours. La double
 * authentification n'apparaît que lorsque le rôle l'exige.
 */
function Steps({ needsMfa, t }: { needsMfa: boolean; t: AppMessages }) {
  const text = t.session.invitation;
  const steps = [
    text.steps.password,
    ...(needsMfa ? [text.steps.mfa] : []),
    text.steps.onboarding,
  ];
  return (
    <ol
      aria-label={text.stepsLabel}
      className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-2xs"
    >
      {steps.map((step, index) => (
        <li key={step} className="flex items-center gap-2">
          {index > 0 && (
            <span className="h-px w-3 bg-border-default" aria-hidden />
          )}
          <span
            className={cn(
              "flex items-center gap-1.5",
              index === 0 ? "font-medium text-primary" : "text-tertiary",
            )}
            aria-current={index === 0 ? "step" : undefined}
          >
            <span
              className={cn(
                "flex size-4 items-center justify-center rounded-full text-[0.625rem] tabular-nums",
                index === 0
                  ? "bg-accent text-inverted"
                  : "border border-border-default",
              )}
              aria-hidden
            >
              {index + 1}
            </span>
            {step}
          </span>
        </li>
      ))}
    </ol>
  );
}
