/**
 * Les faits juridiques du service, en un seul endroit.
 *
 * Les pages légales (mentions, protection des données, conditions) les
 * lisent toutes : un sous-traitant ajouté ou une durée modifiée change
 * partout à la fois, au lieu de diverger d'une page à l'autre.
 *
 * **Rien n'est inventé ici.** Une information que l'éditeur n'a pas
 * encore fournie vaut `null` ; les pages l'omettent proprement et le
 * signalent sobrement, plutôt que d'afficher un « [à compléter] » au
 * public. `missingLegalFacts()` dit ce qui manque : le test de la page
 * le liste, et le déploiement en production doit l'avoir vidé.
 *
 * Les textes destinés aux pages existent dans les deux langues du site
 * public (`Localized`) : une durée ou un sous-traitant modifié change
 * dans les deux à la fois.
 */

import { formatDate } from "@/lib/format";
import type { Locale } from "@/lib/i18n/locale";

/** Un texte dans chaque langue du site public. */
export type Localized = Record<Locale, string>;

/** Date de la dernière mise à jour des pages légales (AAAA-MM-JJ). */
export const LEGAL_UPDATED_ON = "2026-10-08";

/**
 * Date de dernière mise à jour, écrite dans une langue.
 *
 * @param locale Langue de la page.
 */
export function legalUpdatedAt(locale: Locale): string {
  return formatDate(new Date(`${LEGAL_UPDATED_ON}T00:00:00Z`), locale);
}

/** L'éditeur du service. */
export const PUBLISHER = {
  name: "SOLVIAN AI LLC",
  /** Forme juridique et État d'immatriculation. */
  legalForm: null as string | null,
  /** Numéro d'immatriculation. */
  registration: null as string | null,
  /** Adresse du siège. */
  address: null as string | null,
  /** Représentant légal, nom et qualité. */
  representative: null as string | null,
  /** Directeur de la publication. */
  publicationDirector: null as string | null,
  contact: "contact@imafrik.tech",
  dataContact: "donnees@imafrik.tech",
  /** Droit applicable et juridiction ; à défaut, renvoi au contrat. */
  governingLaw: null as Localized | null,
} as const;

/** Un sous-traitant ultérieur, et ce qu'il voit des données. */
export interface Subprocessor {
  name: string;
  role: Localized;
  /** Où les données sont traitées. */
  location: Localized;
  /** Adresse, quand la loi l'exige (hébergeurs). */
  address?: Localized;
}

/**
 * Les sous-traitants ultérieurs, tels que le déploiement les utilise
 * réellement : voir `deploy/compose`, `vercel.json` et le contrôle de
 * résidence de `tools/render_config.py`.
 */
export const SUBPROCESSORS: readonly Subprocessor[] = [
  {
    name: "Hetzner Online GmbH",
    role: {
      fr: "Serveurs de la plateforme : service applicatif, PACS central",
      en: "Platform servers: application service, central PACS",
    },
    location: { fr: "Allemagne", en: "Germany" },
    address: {
      fr: "Industriestr. 25, 91710 Gunzenhausen, Allemagne",
      en: "Industriestr. 25, 91710 Gunzenhausen, Germany",
    },
  },
  {
    name: "Cloudflare, Inc.",
    role: {
      fr: "Stockage chiffré des images, des comptes-rendus et des sauvegardes (R2)",
      en: "Encrypted storage of images, reports and backups (R2)",
    },
    location: {
      fr: "Union européenne (juridiction européenne du stockage)",
      en: "European Union (EU storage jurisdiction)",
    },
  },
  {
    name: "Supabase, Inc.",
    role: {
      fr: "Base de données applicative et authentification",
      en: "Application database and authentication",
    },
    location: { fr: "Union européenne", en: "European Union" },
  },
  {
    name: "Vercel Inc.",
    role: {
      fr: "Hébergement de l’interface web",
      en: "Web interface hosting",
    },
    location: {
      fr: "Paris, France (région d’exécution)",
      en: "Paris, France (compute region)",
    },
    address: {
      fr: "440 N Barranca Ave #4133, Covina, CA 91723, États-Unis",
      en: "440 N Barranca Ave #4133, Covina, CA 91723, United States",
    },
  },
  {
    name: "Functional Software, Inc. (Sentry)",
    role: {
      fr: "Rapports d’erreur techniques, données de santé retirées avant envoi",
      en: "Technical error reports, with health data removed before transmission",
    },
    location: {
      fr: "Union européenne (Allemagne)",
      en: "European Union (Germany)",
    },
  },
  {
    name: "Tailscale Inc.",
    role: {
      fr: "Coordination du réseau privé entre les passerelles et la plateforme : adresses techniques des appareils, sans aucun contenu d’examen. Le trafic est chiffré de bout en bout",
      en: "Coordination of the private network between the gateways and the platform: technical addresses of the devices only, never any examination content. Traffic is encrypted end to end",
    },
    location: {
      fr: "Hors Union européenne possible, sous clauses contractuelles types",
      en: "Possibly outside the European Union, under standard contractual clauses",
    },
  },
];

/** Durées de conservation : celles que le service applique réellement. */
export const RETENTION: Record<
  "accounts" | "accessLogs" | "prospects" | "technicalLogs" | "examinations",
  Localized
> = {
  // Appliqué par la tâche de conservation du service (anonymisation des
  // comptes, `app.services.anonymization`) : la relation prend fin avec la
  // dernière appartenance à une organisation active.
  accounts: {
    fr: "Compte de connexion (adresse électronique, accès) : pendant la relation contractuelle, puis cinq ans à des fins de preuve, puis supprimé. L’identité des signataires et des auteurs d’accès reste attachée aux comptes-rendus signés et au journal d’audit aussi longtemps qu’eux.",
    en: "Login account (email address, access): for the duration of the contractual relationship, then five years for evidential purposes, after which it is deleted. The identity of signatories and of those who accessed data remains attached to signed reports and to the audit log for as long as these are kept.",
  },
  accessLogs: {
    fr: "Aussi longtemps que les examens auxquels ils se rapportent : ils en sont la trace.",
    en: "For as long as the examinations to which they relate, as they constitute the audit trail of those examinations.",
  },
  prospects: {
    fr: "Trois ans après le dernier échange, puis supprimées automatiquement.",
    en: "Three years after the last contact, then deleted automatically.",
  },
  technicalLogs: {
    fr: "Quelques semaines, avec rotation automatique ; trente jours pour les passages de surveillance.",
    en: "A few weeks, with automatic rotation; thirty days for monitoring checks.",
  },
  examinations: {
    fr: "Images : durée fixée par l’établissement au contrat, à son terme elles quittent nos serveurs ; sans durée fixée, rien n’est supprimé automatiquement. Comptes-rendus signés : vingt ans, dans un stockage verrouillé où personne ne peut les modifier ni les supprimer. Sauvegardes chiffrées : douze mois au plus après leur création.",
    en: "Images: the period set by the facility in the contract, after which they are removed from our servers; without a set period, nothing is deleted automatically. Signed reports: twenty years, in locked storage where no one can alter or delete them. Encrypted backups: no more than twelve months after they are made.",
  },
};

/** Autorités de contrôle compétentes. */
export const AUTHORITIES: Localized = {
  fr: "au Togo, l’Instance de protection des données à caractère personnel (IPDCP) ; en France, la Commission nationale de l’informatique et des libertés (CNIL, cnil.fr) ; ailleurs, l’autorité du pays de résidence de la personne concernée",
  en: "in Togo, the Personal Data Protection Authority (Instance de protection des données à caractère personnel, IPDCP); in France, the Commission nationale de l’informatique et des libertés (CNIL, cnil.fr); elsewhere, the authority of the data subject’s country of residence",
};

/**
 * Met en minuscule la première lettre d'un texte, pour l'insérer dans une
 * phrase. Seule la première lettre change : un sigle (« PACS ») reste
 * intact.
 */
export function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/**
 * Faits de l'éditeur encore manquants.
 *
 * @returns Les intitulés des informations à fournir ; vide quand les
 *          mentions légales sont complètes.
 */
export function missingLegalFacts(): string[] {
  const labels: Record<string, string> = {
    legalForm: "forme juridique et État d’immatriculation",
    registration: "numéro d’immatriculation",
    address: "adresse du siège",
    representative: "représentant légal",
    publicationDirector: "directeur de la publication",
    governingLaw: "droit applicable et juridiction",
  };
  return Object.entries(labels)
    .filter(([key]) => PUBLISHER[key as keyof typeof PUBLISHER] === null)
    .map(([, label]) => label);
}
