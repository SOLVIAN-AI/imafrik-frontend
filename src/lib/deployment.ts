import { isApiConfigured } from "@/lib/api/config";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Indique si l'on tourne sur un déploiement de production.
 *
 * **Le contrôle ne porte pas sur `NODE_ENV`.** Toute compilation Vercel —
 * y compris celle d'un aperçu — s'exécute avec `NODE_ENV=production` :
 * s'y fier ferait échouer les aperçus, qui sont précisément faits pour
 * tourner sur le jeu de démonstration. Deux signaux explicites :
 *
 * - `VERCEL_ENV=production`, posé par Vercel sur une mise en production ;
 * - `IMAFRIK_ENV=production`, à poser soi-même sur tout autre hébergement
 *   (`next start` sur un serveur, conteneur). Sans lui, un tel déploiement
 *   privé de ses variables servirait le jeu de démonstration au lieu de
 *   refuser.
 *
 * Sans l'un ni l'autre, un `next start` local reste utilisable sans
 * configuration.
 */
export function isProductionDeployment(): boolean {
  return (
    process.env.VERCEL_ENV === "production" ||
    process.env.IMAFRIK_ENV === "production"
  );
}

/** Longueur minimale du secret des copies de secours. */
export const REPORT_BACKUP_SECRET_MIN_LENGTH = 32;

/**
 * Vrai si le secret de chiffrement des copies de secours est utilisable.
 *
 * En deçà de 32 caractères, c'est une valeur d'exemple oubliée, pas un
 * secret — `openssl rand -base64 48` en produit un.
 */
export function hasReportBackupSecret(): boolean {
  return (
    (process.env.REPORT_BACKUP_SECRET?.length ?? 0) >=
    REPORT_BACKUP_SECRET_MIN_LENGTH
  );
}

/** Vrai si la valeur est une adresse absolue exploitable. */
function isAbsoluteUrl(value: string | undefined): boolean {
  return originOf(value) !== null;
}

/** Origine d'une adresse absolue, `null` si elle n'en est pas une. */
function originOf(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const origin = new URL(value).origin;
    return origin === "null" ? null : origin;
  } catch {
    return null;
  }
}

/**
 * Vrai sauf si le viewer et le site partagent la même origine.
 *
 * Le viewer reçoit dans son adresse un jeton de visualisation, et
 * exécute un code tiers (OHIF). Servi depuis l'origine du site, il en
 * partagerait les cookies de session et le stockage : une faille du
 * viewer deviendrait une faille de l'application. Les deux doivent vivre
 * sur des origines distinctes — `viewer.imafrik.tech` et `imafrik.tech`.
 * Une adresse absente ou invalide est signalée par sa propre entrée.
 */
function viewerIsolated(): boolean {
  const viewer = originOf(process.env.NEXT_PUBLIC_VIEWER_URL);
  const site = originOf(process.env.NEXT_PUBLIC_SITE_URL);
  return viewer === null || site === null || viewer !== site;
}

/**
 * Vrai si l'adresse du site est une adresse durable : en https, et pas
 * une adresse de prévisualisation (`*.vercel.app`).
 *
 * Elle sert de base aux liens de vérification des comptes-rendus et des
 * courriels : un lien vers un aperçu cesserait de fonctionner au
 * déploiement suivant, sur des documents déjà remis. Une adresse absente
 * ou invalide est signalée par sa propre entrée.
 */
function siteUrlDurable(): boolean {
  const value = process.env.NEXT_PUBLIC_SITE_URL;
  if (!isAbsoluteUrl(value)) return true;
  const url = new URL(value as string);
  return url.protocol === "https:" && !url.hostname.endsWith(".vercel.app");
}

/**
 * Variables indispensables à un déploiement de production.
 *
 * **Toutes, pas seulement les clés Supabase.** Un déploiement muni des
 * seules clés Supabase authentifierait de vrais utilisateurs pour leur
 * présenter ensuite des patients inventés — le pire des deux mondes, et
 * une configuration à moitié faite qui passerait inaperçue jusqu'à ce que
 * quelqu'un cherche un examen qui n'existe pas. Les suivantes échouent
 * plus discrètement encore : sans l'adresse du viewer, la politique de
 * sécurité du contenu interdit de l'encadrer, et l'écran de lecture reste
 * vide ; sans l'adresse du site, les liens des courriels de
 * réinitialisation pointent nulle part ; sans le secret des copies de
 * secours, un brouillon interrompu par une coupure n'est pas sauvegardé.
 */
const REQUIRED_IN_PRODUCTION = [
  {
    name: "NEXT_PUBLIC_SUPABASE_URL",
    purpose: "supabase",
    present: () => isSupabaseConfigured(),
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    purpose: "supabase",
    present: () => isSupabaseConfigured(),
  },
  {
    name: "NEXT_PUBLIC_API_URL",
    purpose: "api",
    present: () => isApiConfigured(),
  },
  {
    name: "NEXT_PUBLIC_VIEWER_URL",
    purpose: "viewer",
    present: () => isAbsoluteUrl(process.env.NEXT_PUBLIC_VIEWER_URL),
  },
  {
    name: "NEXT_PUBLIC_VIEWER_URL",
    purpose: "viewerIsolation",
    present: viewerIsolated,
  },
  {
    name: "NEXT_PUBLIC_SITE_URL",
    purpose: "siteUrl",
    present: () => isAbsoluteUrl(process.env.NEXT_PUBLIC_SITE_URL),
  },
  {
    name: "NEXT_PUBLIC_SITE_URL",
    purpose: "siteUrlDurable",
    present: siteUrlDurable,
  },
  {
    name: "REPORT_BACKUP_SECRET",
    purpose: "backupSecret",
    present: hasReportBackupSecret,
  },
] as const;

/**
 * Rôle d'une variable, sous forme de clé : le texte, dans la langue du
 * visiteur, est dans `session.configuration.purposes`. Ce module reste
 * ainsi sans dépendance aux textes, et utilisable depuis le proxy.
 */
export type DeploymentPurpose =
  (typeof REQUIRED_IN_PRODUCTION)[number]["purpose"];

/** Une variable manquante, et ce qu'elle sert. */
export interface MissingVariable {
  name: string;
  /** Clé du rôle de la variable (voir {@link DeploymentPurpose}). */
  purpose: DeploymentPurpose;
}

/**
 * Variables manquantes pour servir un déploiement de production.
 *
 * @returns La liste, vide si tout est en place. Le rôle de chaque
 *          variable est une clé, à traduire par l'écran qui l'affiche.
 */
export function missingProductionConfig(): MissingVariable[] {
  return REQUIRED_IN_PRODUCTION.filter((entry) => !entry.present()).map(
    ({ name, purpose }) => ({ name, purpose }),
  );
}

/**
 * Indique si le déploiement doit refuser de servir.
 *
 * Vrai uniquement sur une production incomplète : un aperçu ou un poste
 * de développement tournent sur le jeu de démonstration, ce qui est leur
 * raison d'être.
 */
export function mustRefuseToServe(): boolean {
  return isProductionDeployment() && missingProductionConfig().length > 0;
}
