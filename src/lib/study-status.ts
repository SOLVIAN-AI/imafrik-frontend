/**
 * Les cinq états d'un examen, tels que le schéma les définit.
 *
 * Ils forment une progression, et cet ordre compte : il détermine celui
 * des filtres et du tri. Voir `study_status` dans les migrations.
 *
 * Module pur, importable côté serveur comme côté navigateur ; les
 * libellés sont dans les textes de l'application (`common.studyStatus`).
 */
export const STUDY_STATUSES = [
  "received",
  "assigned",
  "in_progress",
  "reported",
  "delivered",
] as const;

/** Un état d'examen. */
export type StudyStatus = (typeof STUDY_STATUSES)[number];
