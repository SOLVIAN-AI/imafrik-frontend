/**
 * Suivi des erreurs de l'application, sans donnée de santé.
 *
 * **Pourquoi.** Une erreur en production ne se voit, sans outil, que
 * lorsqu'un radiologue s'en plaint. Le suivi d'erreurs (Sentry) la
 * signale à l'équipe à la première occurrence, avec sa pile d'appels.
 * L'API en a déjà un (`services/api/app/observability.py`) ; celui-ci
 * couvre les écrans, côté serveur comme dans le navigateur.
 *
 * **La contrainte.** Un rapport d'erreur peut transporter à peu près
 * tout : l'adresse de la page et sa recherche (un nom de patient tapé
 * dans la file), les en-têtes (le cookie de session), le fil des
 * dernières actions, les valeurs citées par un message d'erreur. Rien de
 * cela ne doit quitter l'application. D'où les mêmes règles que l'API :
 *
 * - au démarrage : pas de données personnelles par défaut, aucun fil
 *   d'Ariane, aucune mesure de performance, aucun enregistrement de
 *   session (il filmerait les écrans, noms de patients compris) ;
 * - avant chaque envoi ({@link scrubEvent}) : de la requête, on ne garde
 *   que la méthode, le chemin et les en-têtes sans contenu personnel ;
 *   les jetons de vérification du chemin sont masqués, ainsi que les
 *   adresses électroniques et les valeurs entre parenthèses des messages.
 *
 * **La région.** Le suivi reste éteint tant que `NEXT_PUBLIC_SENTRY_DSN`
 * est vide, et refuse une organisation hébergée hors de l'Union
 * européenne (`*.de.sentry.io`), comme le déploiement de l'API. Le DSN
 * n'est pas un secret : il part dans le navigateur, et ne permet que
 * d'envoyer des rapports.
 *
 * Le module ne dépend pas du SDK : il en produit les options, que
 * `instrumentation.ts` et `instrumentation-client.ts` lui passent.
 */

import type { ErrorEvent, Event, EventHint } from "@sentry/browser";

/** Suffixe d'hôte de la région européenne de Sentry. */
export const SENTRY_EU_SUFFIX = ".de.sentry.io";

/** En-têtes sans contenu personnel, conservés pour le diagnostic. */
const SAFE_HEADERS = new Set([
  "user-agent",
  "content-type",
  "content-length",
  "accept",
]);

/** Valeurs citées par PostgreSQL dans ses messages : « Key (col)=(valeur) ». */
const QUOTED_VALUE = /=\([^)]*\)/g;
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
/**
 * Jeton d'une page de vérification publique (`/verifier/…`,
 * `/en/verify/…`) : il ouvre la fiche d'un compte-rendu signé.
 */
const VERIFY_TOKEN = /(\/(?:verifier|verify))\/[^/?#\s]+/g;
/** Recherche et fragment d'une adresse : filtres, jetons de connexion. */
const QUERY_OR_FRAGMENT = /[?#]\S*/g;

let warnedAboutRegion = false;

/** Vrai si le DSN vise, en HTTPS, la région européenne de Sentry. */
function isEuropeanDsn(dsn: string): boolean {
  try {
    const url = new URL(dsn);
    return url.protocol === "https:" && url.hostname.endsWith(SENTRY_EU_SUFFIX);
  } catch {
    return false;
  }
}

/**
 * DSN du projet Sentry, s'il est configuré et hébergé dans l'Union
 * européenne.
 *
 * L'accès à `process.env.NEXT_PUBLIC_SENTRY_DSN` reste littéral : Next ne
 * reporte dans le code du navigateur que les variables ainsi nommées.
 *
 * @returns Le DSN, ou `null` : suivi éteint.
 */
export function sentryDsn(): string | null {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
  if (!dsn) return null;
  if (isEuropeanDsn(dsn)) return dsn;
  if (!warnedAboutRegion) {
    warnedAboutRegion = true;
    console.error(
      `[imafrik] NEXT_PUBLIC_SENTRY_DSN ignoré : il doit viser la région ` +
        `européenne de Sentry (https://…${SENTRY_EU_SUFFIX}).`,
    );
  }
  return null;
}

/**
 * Origine à laquelle le navigateur envoie ses rapports, pour la
 * politique de sécurité du contenu.
 *
 * @returns L'origine, ou `null` si le suivi est éteint.
 */
export function sentryOrigin(): string | null {
  const dsn = sentryDsn();
  return dsn ? new URL(dsn).origin : null;
}

/**
 * Masque, dans un texte libre, ce qui pourrait identifier quelqu'un.
 *
 * @param text Message d'erreur ou d'exception.
 */
export function maskText(text: string): string {
  return text.replace(QUOTED_VALUE, "=(…)").replace(EMAIL, "<adresse>");
}

/**
 * Réduit une adresse à son chemin, jetons de vérification masqués.
 *
 * Les identifiants d'examen ou de compte-rendu restent : opaques, ils
 * permettent de retrouver l'écran fautif sans rien dire du patient.
 *
 * @param value Adresse absolue, chemin ou nom de transaction (« GET /… »).
 */
export function sanitizeUrl(value: string): string {
  return value
    .replace(QUERY_OR_FRAGMENT, "")
    .replace(VERIFY_TOKEN, "$1/[token]");
}

/**
 * Retire d'un rapport tout ce qui pourrait identifier un patient ou un
 * utilisateur.
 *
 * Le `digest` d'une erreur serveur, seul code que l'écran d'erreur
 * montre à l'utilisateur, devient une étiquette : le support retrouve
 * le rapport en cherchant `digest:<code>` dans Sentry.
 *
 * @param event Rapport, tel que le SDK s'apprête à l'envoyer.
 * @param hint  Contexte du SDK, qui porte l'erreur d'origine.
 * @returns Le même rapport, réduit.
 */
export function scrubEvent<E extends Event>(event: E, hint?: EventHint): E {
  const request = event.request;
  if (request) {
    const headers = Object.fromEntries(
      Object.entries(request.headers ?? {}).filter(([name]) =>
        SAFE_HEADERS.has(name.toLowerCase()),
      ),
    );
    event.request = {
      method: request.method,
      url: request.url ? sanitizeUrl(request.url) : undefined,
      headers,
    };
  }
  delete event.user;
  delete event.breadcrumbs;
  delete event.extra;

  if (event.transaction) event.transaction = sanitizeUrl(event.transaction);
  const nextjs = event.contexts?.nextjs;
  if (nextjs && typeof nextjs.request_path === "string") {
    nextjs.request_path = sanitizeUrl(nextjs.request_path);
  }
  if (event.tags?.url && typeof event.tags.url === "string") {
    event.tags.url = sanitizeUrl(event.tags.url);
  }

  for (const exception of event.exception?.values ?? []) {
    if (exception.value) exception.value = maskText(exception.value);
    for (const frame of exception.stacktrace?.frames ?? []) {
      delete frame.vars;
      if (frame.abs_path) frame.abs_path = sanitizeUrl(frame.abs_path);
    }
  }
  if (event.message) event.message = maskText(event.message);
  if (event.logentry) {
    delete event.logentry.params;
    if (event.logentry.message) {
      event.logentry.message = maskText(event.logentry.message);
    }
  }

  const digest = (hint?.originalException as { digest?: unknown } | undefined)
    ?.digest;
  if (typeof digest === "string" && digest) {
    event.tags = { ...event.tags, digest };
  }
  return event;
}

/** Environnement du rapport : celui de Vercel, sinon le développement. */
function environment(): string {
  return (
    process.env.NEXT_PUBLIC_VERCEL_ENV ??
    process.env.VERCEL_ENV ??
    process.env.IMAFRIK_ENV ??
    "development"
  );
}

/**
 * Options d'initialisation du SDK, communes au serveur et au navigateur.
 *
 * @returns Les options, ou `null` si le suivi est éteint.
 */
export function errorTrackingOptions() {
  const dsn = sentryDsn();
  if (!dsn) return null;
  return {
    dsn,
    environment: environment(),
    release:
      process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ??
      process.env.VERCEL_GIT_COMMIT_SHA ??
      undefined,
    sendDefaultPii: false,
    // Ni fil d'Ariane, ni mesure de performance : le premier porterait
    // les dernières adresses et actions, la seconde n'est pas utile tant
    // que le volume reste celui d'un pilote.
    maxBreadcrumbs: 0,
    tracesSampleRate: 0,
    includeLocalVariables: false,
    beforeSend: (event: ErrorEvent, hint: EventHint) => scrubEvent(event, hint),
    beforeSendTransaction: () => null,
  };
}
