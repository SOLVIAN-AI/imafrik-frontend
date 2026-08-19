import { isApiConfigured } from "@/lib/api/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Indique si l'on tourne sur un déploiement de production.
 *
 * **Le contrôle porte sur `VERCEL_ENV`, pas sur `NODE_ENV`.** Toute
 * compilation Vercel — y compris celle d'un aperçu — s'exécute avec
 * `NODE_ENV=production` : s'y fier ferait échouer les aperçus, qui sont
 * précisément faits pour tourner sur le jeu de démonstration. Seul
 * `VERCEL_ENV` distingue une vraie mise en production.
 *
 * Hors Vercel, la variable est absente : un `next start` local reste
 * donc utilisable sans configuration.
 */
export function isProductionDeployment(): boolean {
  return process.env.VERCEL_ENV === "production";
}

/**
 * Variables indispensables à un déploiement de production.
 *
 * **Les trois, pas seulement les deux premières.** Un déploiement muni
 * des seules clés Supabase authentifierait de vrais utilisateurs pour
 * leur présenter ensuite des patients inventés — le pire des deux
 * mondes, et une configuration à moitié faite qui passerait inaperçue
 * jusqu'à ce que quelqu'un cherche un examen qui n'existe pas.
 */
const REQUIRED_IN_PRODUCTION = [
  {
    name: "NEXT_PUBLIC_SUPABASE_URL",
    purpose: "authentification et lecture des appartenances",
    present: () => isSupabaseConfigured(),
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    purpose: "authentification et lecture des appartenances",
    present: () => isSupabaseConfigured(),
  },
  {
    name: "NEXT_PUBLIC_API_URL",
    purpose: "examens, comptes-rendus et jetons de visualisation",
    present: () => isApiConfigured(),
  },
] as const;

/** Une variable manquante, et ce qu'elle sert. */
export interface MissingVariable {
  name: string;
  purpose: string;
}

/**
 * Variables manquantes pour servir un déploiement de production.
 *
 * @returns La liste, vide si tout est en place.
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
