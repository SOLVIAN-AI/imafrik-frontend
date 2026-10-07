import type { AppMessages } from "@/i18n/messages/fr";
import { admin } from "@/i18n/messages/en/admin";
import { clinic } from "@/i18n/messages/en/clinic";
import { common } from "@/i18n/messages/en/common";
import { nav } from "@/i18n/messages/en/nav";
import { onboarding } from "@/i18n/messages/en/onboarding";
import { reading } from "@/i18n/messages/en/reading";
import { session } from "@/i18n/messages/en/session";
import { settings } from "@/i18n/messages/en/settings";
import { worklist } from "@/i18n/messages/en/worklist";

/**
 * Textes de l'application, en anglais. Même forme que le français, à
 * l'entrée près : le type l'impose.
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
export const en: AppMessages = {
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
