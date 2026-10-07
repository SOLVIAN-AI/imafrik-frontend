import type { ReportSections } from "@/components/editor/report-editor";
import type { Study } from "@/lib/data/studies";

/**
 * Jeu de démonstration, servi quand l'un des services n'est pas configuré
 * (voir `lib/demo/mode.ts`) — aperçus et postes de développement.
 *
 * **Aucune donnée réelle.** Les noms, les identifiants et les UID sont
 * fabriqués : la règle du dépôt interdit toute donnée patient hors
 * production, et un jeu de test issu d'un vrai service la violerait même
 * anonymisé — un identifiant de clinique suffit souvent à réidentifier.
 *
 * Il porte exactement la forme de l'interface (`Study`) : la couche de
 * données le sert tel quel, sans traduction.
 */
export type DemoStudy = Study;

/** Identifiant de l'utilisateur de démonstration — voir `lib/session/demo.ts`. */
export const DEMO_USER_ID = "demo-user";

/** Organisations de démonstration, par nom. */
export const DEMO_CLINIC_IDS: Record<string, string> = {
  "Clinique Saint-Joseph": "org-stj",
  "Polyclinique de Kara": "org-pka",
};

const MINUTE = 60_000;
const now = Date.now();

/**
 * Délais promis de démonstration, en minutes : les valeurs par défaut des
 * réglages de la plateforme (`platform_settings`).
 */
export const DEMO_SLA_MINUTES = { routine: 120, urgent: 30 } as const;

/** Fabrique un UID d'étude plausible sous une racine d'exemple. */
const uid = (suffix: string) => `1.2.826.0.1.3680043.8.498.${suffix}`;

/**
 * Radiologues de démonstration : l'utilisateur, et un confrère du groupe.
 *
 * Le nom ne porte pas le titre, comme en base : « Dr » est un champ à
 * part du profil (`title`), que le PDF et la fiche du compte-rendu
 * placent devant le nom.
 */
export const DEMO_RADIOLOGISTS = {
  me: { id: DEMO_USER_ID, name: "Adjo Kponton" },
  bakari: { id: "demo-bakari", name: "Ibrahim Bakari" },
} as const;

type Reader = keyof typeof DEMO_RADIOLOGISTS;

/**
 * Fabrique un examen de démonstration.
 *
 * Les dates se donnent en minutes avant maintenant, et le lecteur par son
 * surnom : le jeu reste lisible d'un coup d'œil, et les champs dérivés —
 * identifiant de clinique, nom du lecteur, signataire — ne peuvent pas
 * se contredire d'un examen à l'autre.
 */
function study(
  fields: Pick<
    Study,
    | "id"
    | "patientName"
    | "patientId"
    | "patientSex"
    | "patientBirthDate"
    | "modality"
    | "bodyPart"
    | "clinic"
    | "status"
    | "clinicalInfo"
    | "seriesCount"
    | "instanceCount"
  > & {
    urgent?: boolean;
    receivedMinutesAgo: number;
    reader?: Reader;
    /** Délai de signature après réception, pour un examen rendu. */
    turnaroundMinutes?: number;
  },
): DemoStudy {
  const reader = fields.reader ? DEMO_RADIOLOGISTS[fields.reader] : null;
  const signed = fields.status === "reported" || fields.status === "delivered";
  const receivedAt = new Date(now - fields.receivedMinutesAgo * MINUTE);
  return {
    id: fields.id,
    studyInstanceUid: uid(`1${fields.id.padStart(4, "0")}`),
    patientName: fields.patientName,
    patientId: fields.patientId,
    patientSex: fields.patientSex,
    patientBirthDate: fields.patientBirthDate,
    modality: fields.modality,
    bodyPart: fields.bodyPart,
    clinicalInfo: fields.clinicalInfo,
    clinic: fields.clinic,
    clinicId: DEMO_CLINIC_IDS[fields.clinic],
    status: fields.status,
    urgent: fields.urgent ?? false,
    seriesCount: fields.seriesCount,
    instanceCount: fields.instanceCount,
    receivedAt,
    assignedTo: reader?.id ?? null,
    assignedToName: reader?.name ?? null,
    reportId: signed ? `r-${fields.id}` : null,
    reportedAt: signed
      ? new Date(
          receivedAt.getTime() + (fields.turnaroundMinutes ?? 60) * MINUTE,
        )
      : null,
    reportedBy: signed ? (reader?.name ?? null) : null,
    dueAt: new Date(
      receivedAt.getTime() +
        DEMO_SLA_MINUTES[fields.urgent ? "urgent" : "routine"] * MINUTE,
    ),
    reportLanguage: "fr",
  };
}

const STJ = "Clinique Saint-Joseph";
const PKA = "Polyclinique de Kara";

/**
 * Quinze examens sur trois jours, deux établissements, tous les statuts.
 *
 * Assez pour que chaque écran ait l'air d'un service qui tourne — une
 * file avec des urgences, des comptes-rendus signés par l'utilisateur et
 * par un confrère, un historique côté clinique — sans que la
 * démonstration se noie dans les lignes.
 */
export const DEMO_STUDIES: DemoStudy[] = [
  study({
    id: "1",
    patientName: "KOFFI^Ama",
    patientId: "STJ-04821",
    patientSex: "F",
    patientBirthDate: "1968-03-14",
    modality: "CT",
    bodyPart: "Thorax",
    clinic: STJ,
    status: "received",
    urgent: true,
    clinicalInfo:
      "Dyspnée aiguë, douleur thoracique, D-dimères élevés. Suspicion d’embolie pulmonaire.",
    seriesCount: 4,
    instanceCount: 1284,
    receivedMinutesAgo: 8,
  }),
  study({
    id: "2",
    patientName: "MENSAH^Kodjo",
    patientId: "STJ-04820",
    patientSex: "M",
    patientBirthDate: "1979-11-02",
    modality: "MR",
    bodyPart: "Crâne",
    clinic: STJ,
    status: "in_progress",
    clinicalInfo: "Céphalées inhabituelles depuis trois semaines.",
    seriesCount: 7,
    instanceCount: 642,
    receivedMinutesAgo: 47,
    reader: "me",
  }),
  study({
    id: "3",
    patientName: "SOGLO^Yawa",
    patientId: "PKA-01193",
    patientSex: "F",
    patientBirthDate: "1991-06-27",
    modality: "CR",
    bodyPart: "Thorax",
    clinic: PKA,
    status: "received",
    clinicalInfo: "Toux fébrile depuis cinq jours.",
    seriesCount: 1,
    instanceCount: 2,
    receivedMinutesAgo: 320,
  }),
  study({
    id: "4",
    patientName: "AGBEKO^Selom",
    patientId: "STJ-04815",
    patientSex: "M",
    patientBirthDate: "2001-01-19",
    modality: "CT",
    bodyPart: "Abdomen",
    clinic: STJ,
    status: "reported",
    clinicalInfo: "Douleurs de la fosse iliaque droite, fébricule.",
    seriesCount: 5,
    instanceCount: 918,
    receivedMinutesAgo: 190,
    reader: "bakari",
    turnaroundMinutes: 30,
  }),
  study({
    id: "5",
    patientName: "DOSSEH^Afi",
    patientId: "PKA-01190",
    patientSex: "F",
    patientBirthDate: "1987-09-08",
    modality: "US",
    bodyPart: "Pelvis",
    clinic: PKA,
    status: "assigned",
    clinicalInfo: "Douleurs pelviennes, contrôle d’un fibrome connu.",
    seriesCount: 1,
    instanceCount: 46,
    receivedMinutesAgo: 95,
    reader: "me",
  }),
  study({
    id: "6",
    patientName: "LAWSON^Enyonam",
    patientId: "STJ-04809",
    patientSex: "F",
    patientBirthDate: "1959-12-30",
    modality: "CT",
    bodyPart: "Rachis",
    clinic: STJ,
    status: "delivered",
    clinicalInfo:
      "Lombalgies chroniques, irradiation au membre inférieur droit.",
    seriesCount: 3,
    instanceCount: 1520,
    receivedMinutesAgo: 1580,
    reader: "bakari",
  }),
  study({
    id: "7",
    patientName: "TETTEH^Kossi",
    patientId: "PKA-01188",
    patientSex: "M",
    patientBirthDate: "1996-04-11",
    modality: "MR",
    bodyPart: "Genou",
    clinic: PKA,
    status: "received",
    urgent: true,
    clinicalInfo:
      "Traumatisme sportif, genou bloqué, suspicion de lésion méniscale.",
    seriesCount: 6,
    instanceCount: 384,
    receivedMinutesAgo: 21,
  }),
  study({
    id: "8",
    patientName: "AMEGAH^Komla",
    patientId: "STJ-04822",
    patientSex: "M",
    patientBirthDate: "1952-08-05",
    modality: "CT",
    bodyPart: "Crâne",
    clinic: STJ,
    status: "received",
    clinicalInfo: "Chute à domicile, sous anticoagulant. Céphalées.",
    seriesCount: 2,
    instanceCount: 212,
    receivedMinutesAgo: 34,
  }),
  study({
    id: "9",
    patientName: "BOKO^Essi",
    patientId: "PKA-01194",
    patientSex: "F",
    patientBirthDate: "1974-02-21",
    modality: "MG",
    bodyPart: "Sein",
    clinic: PKA,
    status: "received",
    clinicalInfo: "Mammographie de dépistage, antécédent familial.",
    seriesCount: 1,
    instanceCount: 4,
    receivedMinutesAgo: 76,
  }),
  study({
    id: "10",
    patientName: "ADJOVI^Mawuli",
    patientId: "STJ-04812",
    patientSex: "M",
    patientBirthDate: "1965-10-17",
    modality: "CT",
    bodyPart: "Thorax",
    clinic: STJ,
    status: "delivered",
    clinicalInfo: "Bilan d’extension d’un nodule pulmonaire.",
    seriesCount: 4,
    instanceCount: 1106,
    receivedMinutesAgo: 9 * 60 + 40,
    reader: "me",
    turnaroundMinutes: 52,
  }),
  study({
    id: "11",
    patientName: "KPODAR^Akossiwa",
    patientId: "PKA-01191",
    patientSex: "F",
    patientBirthDate: "1983-05-03",
    modality: "US",
    bodyPart: "Abdomen",
    clinic: PKA,
    status: "reported",
    clinicalInfo: "Douleurs de l’hypochondre droit post-prandiales.",
    seriesCount: 1,
    instanceCount: 38,
    receivedMinutesAgo: 4 * 60 + 15,
    reader: "me",
    turnaroundMinutes: 41,
  }),
  study({
    id: "12",
    patientName: "GBEDEMAH^Yao",
    patientId: "STJ-04806",
    patientSex: "M",
    patientBirthDate: "1948-07-29",
    modality: "CR",
    bodyPart: "Bassin",
    clinic: STJ,
    status: "delivered",
    urgent: true,
    clinicalInfo: "Chute, impotence fonctionnelle de la hanche gauche.",
    seriesCount: 1,
    instanceCount: 3,
    receivedMinutesAgo: 2 * 24 * 60 + 130,
    reader: "me",
    turnaroundMinutes: 18,
  }),
  study({
    id: "13",
    patientName: "ATTIOGBE^Edem",
    patientId: "PKA-01185",
    patientSex: "M",
    patientBirthDate: "1970-12-12",
    modality: "MR",
    bodyPart: "Rachis",
    clinic: PKA,
    status: "delivered",
    clinicalInfo: "Cervicalgies avec paresthésies du membre supérieur droit.",
    seriesCount: 6,
    instanceCount: 470,
    receivedMinutesAgo: 30 * 60,
    reader: "bakari",
    turnaroundMinutes: 95,
  }),
  study({
    id: "14",
    patientName: "HOUNKPATI^Dela",
    patientId: "STJ-04818",
    patientSex: "F",
    patientBirthDate: "1999-08-23",
    modality: "US",
    bodyPart: "Pelvis",
    clinic: STJ,
    status: "assigned",
    clinicalInfo: "Grossesse de 12 SA, datation.",
    seriesCount: 1,
    instanceCount: 22,
    receivedMinutesAgo: 2 * 60 + 5,
    reader: "bakari",
  }),
  study({
    id: "15",
    patientName: "FIAWOO^Kafui",
    patientId: "STJ-04801",
    patientSex: "M",
    patientBirthDate: "1985-03-09",
    modality: "CT",
    bodyPart: "Sinus",
    clinic: STJ,
    status: "delivered",
    clinicalInfo: "Sinusite chronique, bilan pré-opératoire.",
    seriesCount: 2,
    instanceCount: 356,
    receivedMinutesAgo: 3 * 24 * 60 + 300,
    reader: "me",
    turnaroundMinutes: 74,
  }),
];

/** Par ordre de réception, du plus récent au plus ancien — comme l'API. */
DEMO_STUDIES.sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime());

/**
 * Brouillons de démonstration.
 *
 * Seul l'examen en cours de rédaction en possède un : les autres
 * s'ouvrent sur un compte-rendu vierge, ce qui est le cas courant.
 */
const DEMO_DRAFTS: Record<string, Partial<ReportSections>> = {
  "2": {
    indication:
      "<p>Céphalées inhabituelles évoluant depuis trois semaines, résistantes aux antalgiques de palier I.</p>",
    technique:
      "<p>Séquences axiales T1, T2, FLAIR et diffusion. Coupes sagittales T1. Pas d’injection de produit de contraste.</p>",
    comparatif: "<p>Absence d’examen antérieur disponible.</p>",
    resultats:
      '<p style="text-align: justify">Absence d’anomalie de signal du parenchyme cérébral. Les structures de la ligne médiane sont en place. Le système ventriculaire est de morphologie et de taille normales, sans dilatation.</p><p style="text-align: justify">Pas d’argument pour un processus expansif intracrânien. Pas de prise de contraste anormale visible sur les séquences réalisées.</p>',
  },
};

/**
 * Brouillon de démonstration d'un examen.
 *
 * @param studyId Identifiant d'examen.
 * @returns Les sections déjà rédigées, vide si l'examen n'en a pas.
 */
export function demoDraftSections(studyId: string): Partial<ReportSections> {
  return DEMO_DRAFTS[studyId] ?? {};
}
