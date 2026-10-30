import type { ApiDepositReport } from "@/lib/api/contracts";
import { DEMO_CLINIC_IDS, DEMO_STUDIES } from "@/lib/demo/studies";

/**
 * Dépôts d'archives ZIP de la démonstration, dans la forme des réponses du
 * service (`/deposits`, `/admin/deposits`) : ils passent par la même
 * traduction que les vraies (`lib/data/deposits.ts`).
 *
 * Un dépôt par état qu'on rencontre : intégré (avec des fichiers ignorés
 * et un examen d'une autre clinique), envoi interrompu, en contrôle,
 * refusé (chemin dangereux), abandonné, et un dépôt de l'équipe IMAFRIK au
 * nom de la Polyclinique de Kara.
 */

const HOUR = 60 * 60 * 1000;
const MIB = 1024 * 1024;

const STJ = DEMO_CLINIC_IDS["Clinique Saint-Joseph"];
const PKA = DEMO_CLINIC_IDS["Polyclinique de Kara"];

/** Un examen de la démonstration, tel qu'un compte rendu le relie. */
function linked(id: string, series: number, instances: number, duplicates = 0) {
  const study = DEMO_STUDIES.find((item) => item.id === id);
  if (!study) throw new Error(`Examen de démonstration inconnu : ${id}`);
  return {
    study_instance_uid: study.studyInstanceUid,
    accepted: true,
    series_count: series,
    instances_count: instances,
    duplicates_count: duplicates,
    study_id: study.id,
    patient_name: study.patientName,
    modality: study.modality,
    study_date: study.receivedAt.toISOString(),
    study_status: study.status,
  };
}

/** Base d'un dépôt : les champs que tous partagent. */
function deposit(
  fields: Partial<ApiDepositReport> &
    Pick<ApiDepositReport, "id" | "file_name" | "size_bytes" | "status">,
  hoursAgo: number,
  clinicId: string = STJ,
): ApiDepositReport {
  const createdAt = Date.now() - hoursAgo * HOUR;
  return {
    organization_id: clinicId,
    clinic_name:
      clinicId === PKA ? "Polyclinique de Kara" : "Clinique Saint-Joseph",
    head_sha256: null,
    received_bytes: fields.size_bytes,
    refusal: null,
    on_behalf: false,
    author_name: "Afi Lawson",
    studies_count: 0,
    series_count: 0,
    instances_count: 0,
    duplicates_count: 0,
    ignored_count: 0,
    created_at: new Date(createdAt).toISOString(),
    received_at: new Date(createdAt + 0.4 * HOUR).toISOString(),
    processed_at: new Date(createdAt + 0.5 * HOUR).toISOString(),
    expires_at: null,
    entries_count: 0,
    studies: [],
    ignored: [],
    ...fields,
  };
}

const CD_FILES = [
  { name: "LISEZMOI.TXT", reason: "not_dicom" as const },
  { name: "AUTORUN.INF", reason: "not_dicom" as const },
  { name: "VIEWER/viewer.exe", reason: "not_dicom" as const },
  { name: "DICOMDIR", reason: "dicomdir" as const },
];

/** Les dépôts de la démonstration, les plus récents d'abord. */
export const DEMO_DEPOSITS: ApiDepositReport[] = [
  deposit(
    {
      id: "demo-depot-interrompu",
      file_name: "scanner-thorax-cd.zip",
      size_bytes: 612 * MIB,
      received_bytes: 251 * MIB,
      status: "uploading",
      head_sha256:
        "5d41402abc4b2a76b9719d911017c592ae2fbd5c4f0e5b0d7c3f5e9b0a1c2d3e",
      received_at: null,
      processed_at: null,
      expires_at: new Date(Date.now() + 69 * HOUR).toISOString(),
    },
    3,
  ),
  deposit(
    {
      id: "demo-depot-controle",
      file_name: "irm-genou-mensah.zip",
      size_bytes: 188 * MIB,
      status: "processing",
      processed_at: null,
    },
    1,
  ),
  deposit(
    {
      id: "demo-depot-integre",
      file_name: "cd-urgences-mardi.zip",
      size_bytes: 734 * MIB,
      status: "done",
      studies_count: 2,
      series_count: 9,
      instances_count: 1558,
      duplicates_count: 12,
      ignored_count: 6,
      entries_count: 1576,
      studies: [
        linked("4", 5, 918, 12),
        linked("2", 4, 640),
        {
          study_instance_uid: "1.2.826.0.1.3680043.10.1042.9.77",
          accepted: false,
          series_count: 0,
          instances_count: 0,
          duplicates_count: 0,
          study_id: null,
          patient_name: null,
          modality: null,
          study_date: null,
          study_status: null,
        },
      ],
      ignored: [
        { name: "DICOM/S9/IM00001", reason: "other_clinic" },
        { name: "DICOM/S9/IM00002", reason: "other_clinic" },
        ...CD_FILES,
      ],
    },
    26,
  ),
  deposit(
    {
      id: "demo-depot-equipe",
      file_name: "kara-radios-semaine.zip",
      size_bytes: 96 * MIB,
      status: "done",
      on_behalf: true,
      author_name: "Mawuli Dossou",
      studies_count: 1,
      series_count: 1,
      instances_count: 2,
      entries_count: 3,
      studies: [linked("3", 1, 2)],
      ignored: [{ name: "__MACOSX/._IM00001", reason: "system_file" }],
      ignored_count: 1,
    },
    30,
    PKA,
  ),
  deposit(
    {
      id: "demo-depot-refuse",
      file_name: "export-console.zip",
      size_bytes: 42 * MIB,
      status: "refused",
      refusal: "unsafe_path",
      entries_count: 214,
    },
    50,
  ),
  deposit(
    {
      id: "demo-depot-abandonne",
      file_name: "echo-obstetricale.zip",
      size_bytes: 310 * MIB,
      received_bytes: 87 * MIB,
      status: "expired",
      received_at: null,
      processed_at: null,
    },
    120,
  ),
];

/** L'identifiant de la clinique du responsable de la démonstration. */
export const DEMO_DEPOSIT_CLINIC = STJ;
