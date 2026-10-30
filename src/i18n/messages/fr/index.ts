import { admin } from "@/i18n/messages/fr/admin";
import { agreements } from "@/i18n/messages/fr/agreements";
import { assignment } from "@/i18n/messages/fr/assignment";
import { clinic } from "@/i18n/messages/fr/clinic";
import { clinicView } from "@/i18n/messages/fr/clinic-view";
import { common } from "@/i18n/messages/fr/common";
import { credentials } from "@/i18n/messages/fr/credentials";
import { deposits } from "@/i18n/messages/fr/deposits";
import { filters } from "@/i18n/messages/fr/filters";
import { gateways } from "@/i18n/messages/fr/gateways";
import { help } from "@/i18n/messages/fr/help";
import { ideas } from "@/i18n/messages/fr/ideas";
import { nav } from "@/i18n/messages/fr/nav";
import { onboarding } from "@/i18n/messages/fr/onboarding";
import { reading } from "@/i18n/messages/fr/reading";
import { session } from "@/i18n/messages/fr/session";
import { settings } from "@/i18n/messages/fr/settings";
import { tour } from "@/i18n/messages/fr/tour";
import { training } from "@/i18n/messages/fr/training";
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
 * - `clinicView` : vue des cliniques, les écrans du responsable ouverts
 *   en consultation par l'équipe IMAFRIK ;
 * - `assignment` : attribution des examens, antériorités, modalités et
 *   liste d'urgence, pour la clinique et l'équipe IMAFRIK ;
 * - `filters` : barre de filtres des listes, ses dimensions et ses
 *   nombres ;
 * - `credentials` : habilitation des radiologues, partout où elle se dit ;
 * - `agreements` : contrat du radiologue, convention de l'établissement ;
 * - `settings` : paramètres ;
 * - `training` : espace de formation ;
 * - `tour` : visites guidées, la prise en main écran par écran ;
 * - `admin` : tour de contrôle ;
 * - `gateways` : passerelles des cliniques, dans la tour de contrôle ;
 * - `ideas` : « Vos idées », les pistes d’amélioration des utilisateurs,
 *   et la boîte où l’équipe IMAFRIK les suit ;
 * - `deposits` : dépôt d'une archive ZIP d'images, et son compte rendu ;
 * - `help` : aide contextuelle de chaque écran et glossaire.
 */
export const fr = {
  common,
  nav,
  session,
  worklist,
  reading,
  clinic,
  clinicView,
  assignment,
  filters,
  onboarding,
  credentials,
  agreements,
  settings,
  training,
  tour,
  admin,
  gateways,
  deposits,
  help,
  ideas,
};

/** Forme des textes de l'application : celle du français. */
export type AppMessages = typeof fr;
