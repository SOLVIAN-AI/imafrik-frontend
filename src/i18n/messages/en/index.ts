import type { AppMessages } from "@/i18n/messages/fr";
import { admin } from "@/i18n/messages/en/admin";
import { agreements } from "@/i18n/messages/en/agreements";
import { clinic } from "@/i18n/messages/en/clinic";
import { common } from "@/i18n/messages/en/common";
import { credentials } from "@/i18n/messages/en/credentials";
import { gateways } from "@/i18n/messages/en/gateways";
import { nav } from "@/i18n/messages/en/nav";
import { onboarding } from "@/i18n/messages/en/onboarding";
import { reading } from "@/i18n/messages/en/reading";
import { session } from "@/i18n/messages/en/session";
import { settings } from "@/i18n/messages/en/settings";
import { tour } from "@/i18n/messages/en/tour";
import { training } from "@/i18n/messages/en/training";
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
 * - `credentials` : habilitation des radiologues, partout où elle se dit ;
 * - `agreements` : contrat du radiologue, convention de l'établissement ;
 * - `settings` : paramètres ;
 * - `training` : espace de formation ;
 * - `tour` : visites guidées, la prise en main écran par écran ;
 * - `admin` : tour de contrôle ;
 * - `gateways` : passerelles des cliniques, dans la tour de contrôle.
 */
export const en: AppMessages = {
  common,
  nav,
  session,
  worklist,
  reading,
  clinic,
  onboarding,
  credentials,
  agreements,
  settings,
  training,
  tour,
  admin,
  gateways,
};
