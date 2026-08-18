import { DEMO_STUDIES } from "@/lib/demo/studies";

/**
 * Une organisation, vue du back-office.
 *
 * ⚠️ **Aucune route d'administration n'existe encore côté service.** Ces
 * données viennent du jeu de démonstration, et cette couche existe pour
 * que la bascule ne touche qu'un fichier le jour où l'API les publiera.
 * Tant qu'elles manquent, ces opérations se font en SQL — tenable pour
 * une clinique, intenable pour dix.
 */
export interface AdminOrganization {
  id: string;
  name: string;
  kind: "clinic" | "radiology_group";
  city: string;
  active: boolean;
  /** Examens envoyés ou lus, tous statuts confondus. */
  studyCount: number;
  memberCount: number;
  dicomAet: string | null;
}

const DEMO_ORGANIZATIONS: AdminOrganization[] = [
  {
    id: "org-stj",
    name: "Clinique Saint-Joseph",
    kind: "clinic",
    city: "Lomé",
    active: true,
    studyCount: 4,
    memberCount: 3,
    dicomAet: "STJOSEPH_LOME",
  },
  {
    id: "org-pka",
    name: "Polyclinique de Kara",
    kind: "clinic",
    city: "Kara",
    active: true,
    studyCount: 3,
    memberCount: 2,
    dicomAet: "POLYKARA",
  },
  {
    id: "org-radio",
    name: "IMAFRIK Radiologie",
    kind: "radiology_group",
    city: "Lomé",
    active: true,
    studyCount: 7,
    memberCount: 4,
    dicomAet: null,
  },
];

/** Toutes les organisations de la plateforme. */
export async function listOrganizations(): Promise<AdminOrganization[]> {
  return DEMO_ORGANIZATIONS;
}

/**
 * Tous les examens, sans restriction d'organisation.
 *
 * **La seule vue du produit qui ignore le cloisonnement**, et elle est
 * réservée à l'équipe IMAFRIK. En base, elle suppose un rôle
 * `platform_admin` et une politique dédiée : l'accès y est donc tracé
 * comme le reste, et c'est précisément ce qu'un audit vérifiera.
 */
export async function listAllStudies() {
  return DEMO_STUDIES;
}
