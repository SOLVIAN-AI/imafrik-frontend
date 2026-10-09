/**
 * Les cinq états d'un examen, tels que le schéma les définit.
 *
 * Ils forment une progression, et cet ordre compte : il détermine celui
 * des filtres et du tri. Voir `study_status` dans les migrations.
 *
 * `assigned` n'est posé par aucun chemin : la prise en charge fait passer
 * l'examen de `received` à `in_progress`. L'état reste dans le schéma (et
 * donc ici, pour que le contrat d'API concorde) et les filtres « ouverts »
 * le demandent par prudence, mais rien ne doit le présenter comme une
 * étape que l'examen traverse ; le jeu de démonstration ne l'emploie pas.
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
