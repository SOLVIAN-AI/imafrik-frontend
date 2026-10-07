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
 * public. `missingLegalFacts()` dit ce qui manque — le test de la page
 * le liste, et le déploiement en production doit l'avoir vidé.
 */

/** Date de la dernière mise à jour des pages légales. */
export const LEGAL_UPDATED_AT = "8 octobre 2026";

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
  governingLaw: null as string | null,
} as const;

/** Un sous-traitant ultérieur, et ce qu'il voit des données. */
export interface Subprocessor {
  name: string;
  role: string;
  /** Où les données sont traitées. */
  location: string;
  /** Adresse, quand la loi l'exige (hébergeurs). */
  address?: string;
}

/**
 * Les sous-traitants ultérieurs, tels que le déploiement les utilise
 * réellement — voir `deploy/compose`, `vercel.json` et le contrôle de
 * résidence de `tools/render_config.py`.
 */
export const SUBPROCESSORS: readonly Subprocessor[] = [
  {
    name: "Hetzner Online GmbH",
    role: "Serveurs de la plateforme : service applicatif, PACS central",
    location: "Allemagne",
    address: "Industriestr. 25, 91710 Gunzenhausen, Allemagne",
  },
  {
    name: "Cloudflare, Inc.",
    role: "Stockage chiffré des images, des comptes-rendus et des sauvegardes (R2)",
    location: "Union européenne (juridiction européenne du stockage)",
  },
  {
    name: "Supabase, Inc.",
    role: "Base de données applicative et authentification",
    location: "Union européenne",
  },
  {
    name: "Vercel Inc.",
    role: "Hébergement de l’interface web",
    location: "Paris, France (région d’exécution)",
    address: "440 N Barranca Ave #4133, Covina, CA 91723, États-Unis",
  },
  {
    name: "Functional Software, Inc. (Sentry)",
    role: "Rapports d’erreur techniques, données de santé retirées avant envoi",
    location: "Union européenne (Allemagne)",
  },
  {
    name: "Tailscale Inc.",
    role: "Coordination du réseau privé entre les passerelles et la plateforme : adresses techniques des appareils, aucun contenu d’examen — le trafic est chiffré de bout en bout",
    location:
      "Hors Union européenne possible, sous clauses contractuelles types",
  },
];

/** Durées de conservation — celles que le service applique réellement. */
export const RETENTION = {
  accounts:
    "Pendant la relation contractuelle, puis cinq ans à des fins de preuve.",
  accessLogs:
    "Aussi longtemps que les examens auxquels ils se rapportent : ils en sont la trace.",
  prospects:
    "Trois ans après le dernier échange, puis suppression automatique.",
  technicalLogs:
    "Quelques semaines, avec rotation automatique ; trente jours pour les passages de surveillance.",
  examinations:
    "Fixée par l’établissement au contrat. Les images quittent nos serveurs à son terme ; les sauvegardes chiffrées qui les contenaient expirent au plus tard douze mois après.",
} as const;

/** Autorités de contrôle compétentes. */
export const AUTHORITIES =
  "au Togo, l’Instance de protection des données à caractère personnel (IPDCP) ; en France, la Commission nationale de l’informatique et des libertés (CNIL, cnil.fr) ; ailleurs, l’autorité du pays de résidence de la personne concernée";

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
