import type { DemoMembership } from "./fixtures";

/**
 * Données de référence des tests de bout en bout.
 *
 * Les adresses et les textes attendus sont écrits ici en clair plutôt
 * qu'importés de `src/` : un test qui relirait la table de navigation de
 * l'application validerait l'application contre elle-même. Si une adresse
 * change, le test doit le dire.
 */

/** Une page du site public et son équivalent dans l'autre langue. */
export interface PublicPair {
  /** Nom lisible, pour le titre du test. */
  name: string;
  fr: string;
  en: string;
}

/** Pages du site public, par paires de traductions. */
export const PUBLIC_PAIRS: PublicPair[] = [
  { name: "accueil", fr: "/", en: "/en" },
  { name: "sécurité", fr: "/securite", en: "/en/security" },
  { name: "contact", fr: "/contact", en: "/en/contact" },
  { name: "conditions d'utilisation", fr: "/cgu", en: "/en/terms" },
  { name: "confidentialité", fr: "/confidentialite", en: "/en/privacy" },
  { name: "mentions légales", fr: "/mentions-legales", en: "/en/legal-notice" },
];

/**
 * Entrées de la navigation principale de chaque portail, dans l'ordre
 * d'affichage.
 */
export const NAV_BY_MEMBERSHIP: Record<DemoMembership, string[]> = {
  "m-radio": [
    "/worklist",
    "/mes-examens",
    "/comptes-rendus",
    "/modeles",
    "/parametres",
  ],
  "m-clinic": [
    "/tableau-de-bord",
    "/envoyer",
    "/examens",
    "/comptes-rendus",
    "/equipe",
    "/parametres",
  ],
  "m-admin": [
    "/admin",
    "/admin/activite",
    "/admin/flux",
    "/admin/organisations",
    "/admin/utilisateurs",
    "/admin/examens",
    "/admin/demandes",
    "/admin/facturation",
    "/admin/systeme",
    "/admin/audit",
    "/admin/reglages",
    "/parametres",
  ],
};

/**
 * Écrans de chaque portail parcourus en anglais : la navigation, plus les
 * fiches et écrans secondaires qu'elle ne mène pas directement.
 */
export const APP_SCREENS: Record<DemoMembership, string[]> = {
  "m-radio": [
    ...NAV_BY_MEMBERSHIP["m-radio"],
    "/comptes-rendus/r-10",
    "/lecture/1",
    "/lecture/2",
    "/lecture/10",
    "/bienvenue",
  ],
  "m-clinic": [
    ...NAV_BY_MEMBERSHIP["m-clinic"],
    "/examens/1",
    "/examens/4",
    "/comptes-rendus/r-4",
    "/lecture/4",
    "/bienvenue",
  ],
  "m-admin": [...NAV_BY_MEMBERSHIP["m-admin"], "/admin/organisations/org-stj"],
};

/**
 * Mots typiques de l'interface française, qui ne doivent pas apparaître
 * sur un écran en anglais.
 *
 * Les données de démonstration (noms de patients, villes, régions
 * anatomiques comme « Crâne » ou « Thorax », renseignements cliniques,
 * texte des comptes-rendus) sont en français, et c'est voulu : seuls des
 * libellés d'interface figurent dans cette liste.
 *
 * Les bornes de mot sont écrites en Unicode : `\b` ne connaît que l'ASCII,
 * et `\bÉquipe` ne correspondrait jamais.
 */
export const FRENCH_UI_WORDS = new RegExp(
  "(?<![\\p{L}\\p{N}])(" +
    [
      "Enregistrer",
      "Annuler",
      "Paramètres",
      "Rechercher",
      "Mes examens",
      "Comptes-rendus",
      "Tableau de bord",
      "Se déconnecter",
      "Fermer",
      "Réessayer",
      "Télécharger",
      "Aucun résultat",
      "Prendre en charge",
      "Signer le",
      "Envoyer un examen",
      "Équipe",
      "Modèles",
      "Échéance",
      "Reçu le",
      "Urgences",
      "En retard",
      "Mot de passe",
      "Double authentification",
      "Journal d’audit",
      "Facturation",
      "Réglages",
      "Demandes reçues",
      "Activité",
      "Flux d’images",
      "à lire",
      "en cours",
      "dépassé",
      "Durée",
      "Inviter",
      "Clinique émettrice",
      "Compte-rendu signé",
      "Renseignements cliniques",
      "Retour",
    ].join("|") +
    ")(?![\\p{L}\\p{N}])",
  "gu",
);

/**
 * Noms propres français cités tels quels dans les pages anglaises : le nom
 * officiel d'une autorité ne se traduit pas. Retirés du texte avant la
 * recherche de mots français.
 */
export const FRENCH_PROPER_NAMES = [
  "Instance de protection des données à caractère personnel",
  "Commission nationale de l’informatique et des libertés",
];

/**
 * Données de démonstration qui contiennent un mot de `FRENCH_UI_WORDS` :
 * le nom de l'organisation de l'équipe IMAFRIK, affiché dans le sélecteur
 * d'organisation. Retirées du texte avant la recherche.
 */
export const DEMO_DATA_PHRASES = ["Équipe IMAFRIK"];

/**
 * Retire d'un texte les passages qui ont le droit d'être en français.
 *
 * @param text    Texte de la page.
 * @param phrases Passages à retirer.
 */
export function without(text: string, phrases: string[]): string {
  return phrases.reduce((rest, phrase) => rest.split(phrase).join(" "), text);
}

/**
 * Mots français courants, qui ne doivent pas apparaître dans le texte du
 * site public en anglais (en-tête, contenu, pied de page).
 */
export const FRENCH_COMMON_WORDS =
  /(?<![\p{L}\p{N}])(les|des|vos|nous|examens?|établissement|données|à|être|avec|pour)(?![\p{L}\p{N}])/giu;
