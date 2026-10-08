import { admin } from "@/i18n/messages/fr/admin";
import { clinic } from "@/i18n/messages/fr/clinic";
import { common } from "@/i18n/messages/fr/common";
import { nav } from "@/i18n/messages/fr/nav";
import { onboarding } from "@/i18n/messages/fr/onboarding";
import { reading } from "@/i18n/messages/fr/reading";
import { session } from "@/i18n/messages/fr/session";
import { settings } from "@/i18n/messages/fr/settings";
import { worklist } from "@/i18n/messages/fr/worklist";

/**
 * Textes de l'application, en français : la langue de référence.
 *
 * Un espace de noms par zone, un fichier par espace de noms, pour que
 * chaque zone se traduise sans toucher aux autres :
 *
 * - `common` : vocabulaire partagé (actions, rôles, états, unités) ;
 * - `nav` : navigation et cadre ;
 * - `session` : écrans hors portail (double authentification, attente,
 *   erreurs), verrouillage, mot de passe ;
 * - `worklist`, `reading` : portail radiologue, file et écran de lecture ;
 * - `clinic`, `onboarding` : portail clinique, mise en service ;
 * - `settings` : paramètres ;
 * - `admin` : tour de contrôle.
 */
export const fr = {
  common,
  nav,
  session,
  worklist,
  reading,
  clinic,
  onboarding,
  settings,
  admin,
};

/** Forme des textes de l'application : celle du français. */
export type AppMessages = typeof fr;
