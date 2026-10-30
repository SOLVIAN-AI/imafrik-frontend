/**
 * « Vos idées » : vocabulaire, bornes et contexte d’une idée.
 *
 * Module pur, partagé par les pages (rendues au serveur), le formulaire
 * (exécuté dans le navigateur) et l’action serveur : les mêmes bornes que
 * le service (`app/routers/ideas.py`) et que la base (migration
 * `20261030090000_idees`), pour un message clair avant l’aller-retour.
 * Le service revérifie tout.
 *
 * **Aucune donnée de patient.** Le contexte joint à une idée se limite à
 * la clé de l’écran (celle de l’aide, `worklist`), jamais l’adresse de la
 * page, qui peut porter un identifiant ou une recherche ; à la version de
 * l’application ; au type d’appareil. Pas de capture d’écran.
 */

import type { AppMessages } from "@/i18n";
import { type HelpScreen, helpRoleOf, helpScreensOf } from "@/lib/help";
import type { UserRole } from "@/lib/session/types";

/** Catégories, dans l’ordre du formulaire (`IdeaCategory` du service). */
export const IDEA_CATEGORIES = [
  "reading",
  "reporting",
  "assignment",
  "studies",
  "billing",
  "other",
] as const;

/** Une catégorie. */
export type IdeaCategory = (typeof IDEA_CATEGORIES)[number];

/** États, dans l’ordre du suivi (`IdeaStatus` du service). */
export const IDEA_STATUSES = [
  "received",
  "under_review",
  "planned",
  "shipped",
  "declined",
] as const;

/** Un état. */
export type IdeaStatus = (typeof IDEA_STATUSES)[number];

/** Ce qu’une idée ferait gagner (`IdeaBenefit` du service). */
export const IDEA_BENEFITS = ["time", "clarity", "safety"] as const;

/** Un gain. */
export type IdeaBenefit = (typeof IDEA_BENEFITS)[number];

/** Types d’appareil (`IdeaDevice` du service). */
export const IDEA_DEVICES = ["desktop", "tablet", "phone"] as const;

/** Un type d’appareil. */
export type IdeaDevice = (typeof IDEA_DEVICES)[number];

/** Rôles qui proposent des idées : radiologue et responsable de clinique. */
export const IDEA_AUTHOR_ROLES = ["radiologist", "clinic_staff"] as const;

/** Un rôle d’auteur. */
export type IdeaAuthorRole = (typeof IDEA_AUTHOR_ROLES)[number];

/** Bornes du texte, les mêmes que le service et la base. */
export const IDEA_TITLE_MIN = 3;
export const IDEA_TITLE_MAX = 120;
export const IDEA_BODY_MIN = 10;
export const IDEA_BODY_MAX = 2000;
export const IDEA_RESPONSE_MAX = 2000;

/** Clé d’un écran de l’aide, telle que le service l’accepte. */
const SCREEN_KEY = /^[A-Za-z][A-Za-z0-9]{0,39}$/;

/** Version de l’application, telle que le service l’accepte. */
const VERSION = /^[A-Za-z0-9][A-Za-z0-9._+-]{0,39}$/;

/** Paramètre d’adresse qui porte l’écran d’où l’on vient (`/idees?ecran=`). */
export const SCREEN_PARAM = "ecran";

/** Adresse de « Vos idées ». */
export const IDEAS_HREF = "/idees";

/**
 * Vrai si un rôle propose des idées.
 *
 * @param role Rôle de l’appartenance active.
 */
export function proposesIdeas(role: UserRole): role is IdeaAuthorRole {
  return (IDEA_AUTHOR_ROLES as readonly string[]).includes(role);
}

/**
 * L’écran d’une clé reçue de l’adresse, s’il en est un pour ce rôle.
 *
 * La clé vient du navigateur : seule une clé connue de l’aide du rôle est
 * retenue, et « Vos idées » elle-même n’est pas un contexte.
 *
 * @param role Rôle de l’appartenance active.
 * @param raw  Valeur du paramètre `ecran`.
 */
export function ideaScreenOf(
  role: UserRole,
  raw: string | string[] | undefined,
): HelpScreen | null {
  if (typeof raw !== "string" || !SCREEN_KEY.test(raw) || raw === "ideas") {
    return null;
  }
  return helpScreensOf(role).find((screen) => screen.key === raw) ?? null;
}

/**
 * Adresse de « Vos idées », avec l’écran d’où l’on vient.
 *
 * @param screenKey Clé de l’écran courant, s’il est reconnu.
 */
export function ideasHref(screenKey?: string | null): string {
  return screenKey && screenKey !== "ideas" && SCREEN_KEY.test(screenKey)
    ? `${IDEAS_HREF}?${SCREEN_PARAM}=${encodeURIComponent(screenKey)}`
    : IDEAS_HREF;
}

/**
 * Type d’appareil, d’après la largeur de la fenêtre et le pointeur.
 *
 * @param width  Largeur de la fenêtre, en pixels CSS.
 * @param coarse Vrai si le pointeur principal est un doigt.
 */
export function deviceOf(width: number, coarse: boolean): IdeaDevice {
  if (width < 640) return "phone";
  if (coarse && width < 1280) return "tablet";
  return "desktop";
}

/**
 * Version de l’application : le commit déployé, en sept caractères.
 *
 * Lue côté serveur, au moment de l’envoi : celle que le navigateur
 * dirait ne compte pas. `dev` hors d’un déploiement.
 *
 * @param env Variables d’environnement.
 */
export function appVersionOf(env: Record<string, string | undefined>): string {
  const sha =
    env.VERCEL_GIT_COMMIT_SHA || env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || "";
  const short = sha.slice(0, 7);
  return VERSION.test(short) ? short : "dev";
}

/** Champ d’une idée refusé par la validation. */
export type IdeaField = "title" | "body" | "category";

/** Une erreur de validation : le champ, et ce qui ne va pas. */
export interface IdeaFieldError {
  field: IdeaField;
  problem: "short" | "long" | "missing";
}

/** Une ligne du titre : espaces resserrés, comme le service. */
export function cleanTitle(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/**
 * Les erreurs d’une idée, dans l’ordre du formulaire.
 *
 * @param input Titre, description et catégorie saisis.
 */
export function validateIdea(input: {
  title: string;
  body: string;
  category: string | null | undefined;
}): IdeaFieldError[] {
  const errors: IdeaFieldError[] = [];
  const title = cleanTitle(input.title);
  const body = input.body.trim();
  if (title.length < IDEA_TITLE_MIN)
    errors.push({ field: "title", problem: "short" });
  else if (title.length > IDEA_TITLE_MAX)
    errors.push({ field: "title", problem: "long" });
  if (body.length < IDEA_BODY_MIN)
    errors.push({ field: "body", problem: "short" });
  else if (body.length > IDEA_BODY_MAX)
    errors.push({ field: "body", problem: "long" });
  if (!(IDEA_CATEGORIES as readonly unknown[]).includes(input.category))
    errors.push({ field: "category", problem: "missing" });
  return errors;
}

/** Une idée, telle que son auteur la suit. */
export interface Idea {
  id: string;
  title: string;
  body: string;
  category: IdeaCategory;
  benefit: IdeaBenefit | null;
  screen: string | null;
  appVersion: string | null;
  device: IdeaDevice | null;
  status: IdeaStatus;
  statusChangedAt: Date | null;
  response: string | null;
  respondedAt: Date | null;
  /** Regroupée avec une idée semblable, dont elle suit l’état. */
  grouped: boolean;
  createdAt: Date;
}

/** Une idée, telle que l’équipe IMAFRIK la suit. */
export interface InboxIdea extends Idea {
  authorId: string | null;
  authorName: string | null;
  authorRole: IdeaAuthorRole;
  organizationId: string | null;
  organizationName: string | null;
  organizationKind: "clinic" | "radiology_group" | null;
  duplicateOf: string | null;
  duplicateOfTitle: string | null;
  duplicates: number;
  respondedByName: string | null;
  updatedAt: Date;
}

/** La boîte des idées : les plus récentes, et combien en tout. */
export interface IdeaInbox {
  items: InboxIdea[];
  total: number;
}

/**
 * Le nom d’un écran, tel que l’aide du rôle le donne (« À lire »).
 *
 * @param t    Textes de l’application.
 * @param role Rôle de l’auteur de l’idée.
 * @param key  Clé de l’écran.
 */
export function screenNameOf(
  t: AppMessages,
  role: UserRole,
  key: string | null,
): string | null {
  if (!key) return null;
  const pages = t.help.pages[helpRoleOf(role)] as Record<
    string,
    { title: string } | undefined
  >;
  return Object.hasOwn(pages, key) ? (pages[key]?.title ?? null) : null;
}
