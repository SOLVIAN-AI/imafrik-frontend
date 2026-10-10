import "server-only";

import { createHmac } from "node:crypto";

import { visitorIp } from "@/lib/contact-visitor";
import { hasReportBackupSecret } from "@/lib/deployment";

/**
 * Limitation des essais de connexion, par compte et par visiteur.
 *
 * Toute l'authentification part de ce serveur : pour Supabase, toutes
 * les connexions viennent des mêmes adresses (Vercel), et ses limites par
 * adresse IP s'appliquent à tous les utilisateurs ensemble. Avant chaque
 * essai de mot de passe ou de code TOTP, l'action serveur consulte donc
 * la base (`auth_throttle_attempt`, migration backend
 * `20261010150000_auth_throttle.sql`), qui compte les essais du compte
 * visé et du visiteur, impose une attente croissante puis un blocage
 * temporaire. Les seuils vivent en base, à un seul endroit.
 *
 * **Rien ne révèle un compte.** La clé du compte dérive de ce que la
 * personne a saisi, que le compte existe ou non : même attente, même
 * blocage, même message.
 *
 * **Des clés opaques.** La base reçoit des HMAC-SHA-256 sous un secret du
 * serveur, jamais l'adresse de courriel ni l'adresse IP : un appel direct
 * à PostgREST ne peut viser ni le compte ni le visiteur d'un tiers. Le
 * secret est celui des copies de secours (`REPORT_BACKUP_SECRET`, exigé
 * en production par `lib/deployment.ts`), sous un contexte de dérivation
 * distinct : les deux usages ne se recoupent pas.
 *
 * **Une panne de la base laisse passer.** La limitation est un frein,
 * pas la barrière d'accès : GoTrue garde ses propres limites. Bloquer
 * toutes les connexions quand la base hésite serait pire.
 */

/** Essai à limiter : mot de passe, ou code de l'application TOTP. */
export type AttemptKind = "password" | "totp";

/** Contexte de dérivation des clés : versionné, pour pouvoir en changer. */
const DERIVATION_CONTEXT = "imafrik/auth-throttle/v1/";

/**
 * Secret hors production quand aucun n'est configuré (poste local,
 * aperçu) : la limitation y fonctionne, sans prétendre à l'opacité.
 */
const FALLBACK_SECRET = "imafrik-auth-throttle-hors-production";

/** Visiteur dont l'adresse est illisible : tous partagent cette clé. */
const UNKNOWN_VISITOR = "inconnu";

/** Attente maximale imposée par la base, en millisecondes. */
const MAX_DELAY_MS = 8000;

/** Clés d'un essai, à reprendre pour signaler sa réussite. */
export interface ThrottleKeys {
  account: string;
  visitor: string;
}

/** Verdict sur un essai. */
export type AttemptVerdict =
  | { allowed: true; keys: ThrottleKeys }
  | { allowed: false; retryAfterSeconds: number };

/** Réponse de `auth_throttle_attempt`. */
interface AttemptRow {
  allowed: boolean;
  delay_ms: number;
  retry_after: number;
}

/** Ce dont la limitation a besoin d'un client Supabase. */
export interface RpcClient {
  rpc(
    fn: string,
    args: Record<string, string>,
  ): PromiseLike<{ data: unknown; error: unknown }>;
}

function throttleSecret(): string {
  return hasReportBackupSecret()
    ? (process.env.REPORT_BACKUP_SECRET ?? FALLBACK_SECRET)
    : FALLBACK_SECRET;
}

/**
 * Normalise ce qui désigne le compte : une adresse de courriel ne
 * distingue ni la casse ni les espaces de bord, sans quoi « Alice@… » et
 * « alice@… » auraient chacune leur quota.
 */
export function normalizeAccount(account: string): string {
  return account.trim().toLowerCase();
}

/**
 * Clés opaques d'un essai.
 *
 * @param kind    Mot de passe ou code TOTP : quotas distincts.
 * @param account Adresse saisie (mot de passe) ou identifiant du compte
 *                (code TOTP).
 * @param visitor Adresse IP du visiteur, `null` si illisible.
 * @param secret  Secret de dérivation ; celui du serveur par défaut.
 */
export function throttleKeys(
  kind: AttemptKind,
  account: string,
  visitor: string | null,
  secret: string = throttleSecret(),
): ThrottleKeys {
  const derive = (scope: string, value: string) =>
    createHmac("sha256", secret)
      .update(`${DERIVATION_CONTEXT}${kind}/${scope}/${value}`)
      .digest("hex");
  return {
    account: derive("account", normalizeAccount(account)),
    visitor: derive("visitor", visitor ?? UNKNOWN_VISITOR),
  };
}

function isAttemptRow(value: unknown): value is AttemptRow {
  if (typeof value !== "object" || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.allowed === "boolean" &&
    typeof row.delay_ms === "number" &&
    typeof row.retry_after === "number"
  );
}

/** Attente, remplaçable dans les tests. */
export const pause = {
  wait: (ms: number) => new Promise<void>((done) => setTimeout(done, ms)),
};

/**
 * Compte un essai et observe l'attente imposée.
 *
 * @param client  Client Supabase de la requête.
 * @param kind    Mot de passe ou code TOTP.
 * @param account Adresse saisie, ou identifiant du compte.
 * @param headers En-têtes de la requête reçue (adresse du visiteur).
 * @returns Le verdict : permis (après l'attente), ou bloqué pour tant de
 *          secondes. Une panne de la base laisse passer sans attente.
 */
export async function beginAttempt(
  client: RpcClient,
  kind: AttemptKind,
  account: string,
  headers: Headers,
): Promise<AttemptVerdict> {
  const keys = throttleKeys(kind, account, visitorIp(headers));
  let row: unknown;
  try {
    const { data, error } = await client.rpc("auth_throttle_attempt", {
      p_account: keys.account,
      p_visitor: keys.visitor,
    });
    if (error) throw error;
    row = Array.isArray(data) ? data[0] : data;
  } catch (error) {
    console.error("Limitation des essais indisponible", error);
    return { allowed: true, keys };
  }
  if (!isAttemptRow(row)) {
    console.error("Limitation des essais : réponse inattendue");
    return { allowed: true, keys };
  }
  if (!row.allowed)
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil(row.retry_after)),
    };
  const delay = Math.min(Math.max(0, row.delay_ms), MAX_DELAY_MS);
  if (delay > 0) await pause.wait(delay);
  return { allowed: true, keys };
}

/**
 * Signale un essai réussi : le compteur du compte est effacé.
 *
 * Sans conséquence en cas d'échec : le compteur s'éteindra avec sa
 * fenêtre de quinze minutes.
 *
 * @param client Client Supabase de la requête.
 * @param keys   Clés renvoyées par {@link beginAttempt}.
 */
export async function attemptSucceeded(
  client: RpcClient,
  keys: ThrottleKeys,
): Promise<void> {
  try {
    const { error } = await client.rpc("auth_throttle_succeeded", {
      p_account: keys.account,
      p_visitor: keys.visitor,
    });
    if (error) throw error;
  } catch (error) {
    console.error("Limitation des essais : réussite non enregistrée", error);
  }
}

/** Minutes à annoncer avant de réessayer, arrondies au-dessus. */
export function retryMinutes(seconds: number): number {
  return Math.max(1, Math.ceil(seconds / 60));
}
