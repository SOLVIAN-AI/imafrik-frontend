/**
 * Formate un nom au format DICOM pour la lecture.
 *
 * DICOM stocke `NOM^Prénom`. Affiché tel quel, le séparateur trahit une
 * interface qui expose sa plomberie.
 *
 * @param dicomName Nom brut issu du tag PatientName.
 * @returns Le nom lisible, ou « — » s'il est absent.
 */
export function formatPatientName(dicomName: string): string {
  const [family = "", given = ""] = dicomName.split("^");
  const formatted = [family.toUpperCase(), given].filter(Boolean).join(" ");
  return formatted || "—";
}

/**
 * Date longue, en français.
 *
 * La locale est imposée plutôt que déduite du navigateur : le service
 * s'adresse à des professionnels francophones, et une date rendue
 * différemment par le serveur et par le client provoquerait une
 * divergence d'hydratation.
 *
 * @param date Date à formater.
 * @returns Par exemple « 18 août 2026 ».
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/**
 * Date et heure, format court.
 *
 * @param date Date à formater.
 * @returns Par exemple « 18/08/2026 à 14:32 ».
 */
export function formatDateTime(date: Date): string {
  const formatted = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
  return formatted.replace(" ", " à ");
}

/**
 * Taille de fichier lisible.
 *
 * @param bytes Taille en octets.
 * @returns Par exemple « 12,4 Mo ».
 */
export function formatBytes(bytes: number): string {
  const units = ["o", "ko", "Mo", "Go"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} ${units[unit]}`;
}

/**
 * Durée lisible, à partir d'un nombre de minutes.
 *
 * @param minutes Durée en minutes.
 * @returns Par exemple « 45 min », « 2 h 10 », « 3 j 4 h ».
 */
export function formatDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  if (hours < 24) {
    const rest = total % 60;
    return rest ? `${hours} h ${String(rest).padStart(2, "0")}` : `${hours} h`;
  }
  const days = Math.floor(hours / 24);
  const restHours = hours % 24;
  return restHours ? `${days} j ${restHours} h` : `${days} j`;
}

/**
 * Sexe DICOM en toutes lettres.
 *
 * @param sex Valeur du tag PatientSex : `M`, `F`, `O`, ou vide.
 * @returns « Homme », « Femme », « Autre », ou `null` s'il n'a pas été transmis.
 */
export function formatSex(sex: string | null): string | null {
  switch (sex?.trim().toUpperCase()) {
    case "M":
      return "Homme";
    case "F":
      return "Femme";
    case "O":
      return "Autre";
    default:
      return null;
  }
}

/**
 * Âge du patient à une date donnée — celle de l'examen, pas d'aujourd'hui.
 *
 * Un compte-rendu se relit des mois plus tard : l'âge qui compte pour
 * l'interprétation est celui du jour de l'acquisition. En dessous de deux
 * ans, l'âge se dit en mois, comme en pédiatrie.
 *
 * @param birthDate Date de naissance `AAAA-MM-JJ`, ou `null`.
 * @param at        Date de référence.
 * @returns Par exemple « 58 ans » ou « 14 mois », ou `null` si la date
 *          de naissance est absente ou illisible.
 */
export function formatPatientAge(
  birthDate: string | null,
  at: Date,
): string | null {
  const match = birthDate?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  let months =
    (at.getUTCFullYear() - year) * 12 + (at.getUTCMonth() + 1 - month);
  if (at.getUTCDate() < day) months -= 1;
  if (months < 0) return null;
  if (months < 24) return `${months} mois`;
  return `${Math.floor(months / 12)} ans`;
}

/**
 * Sexe et âge sur une ligne, pour situer un patient d'un coup d'œil.
 *
 * @returns Par exemple « Femme · 58 ans », ou `null` si rien n'a été transmis.
 */
export function formatDemographics(
  sex: string | null,
  birthDate: string | null,
  at: Date,
): string | null {
  const parts = [formatSex(sex), formatPatientAge(birthDate, at)].filter(
    Boolean,
  );
  return parts.length > 0 ? parts.join(" · ") : null;
}

/**
 * Nom précédé du titre, tel qu'il s'imprime au bas d'un compte-rendu.
 *
 * @param title Titre du profil — « Dr », « Pr » — ou vide.
 * @param name  Nom complet.
 * @returns Par exemple « Dr Adjo Kponton ».
 */
export function formatPersonName(title: string | null, name: string): string {
  return [title?.trim(), name.trim()].filter(Boolean).join(" ");
}

/** Tiret des valeurs absentes : une case vide ressemble à un oubli. */
export const MISSING = "—";

/**
 * Proportion en pourcentage entier.
 *
 * @param ratio Proportion entre 0 et 1, ou `null` sans donnée.
 * @returns Par exemple « 94 % », ou « — ».
 */
export function formatPercent(ratio: number | null): string {
  if (ratio === null || !Number.isFinite(ratio)) return MISSING;
  return `${Math.round(ratio * 100)} %`;
}

/**
 * Durée en minutes, tolérante à l'absence de donnée.
 *
 * @param minutes Minutes, ou `null` — une étape jamais atteinte.
 * @returns La durée lisible ({@link formatDuration}), ou « — ».
 */
export function formatMinutes(minutes: number | null): string {
  if (minutes === null || !Number.isFinite(minutes)) return MISSING;
  // Sous la minute, « 0 min » mentirait : un transfert de 20 secondes
  // n'est pas instantané.
  if (minutes > 0 && minutes < 1) return `${Math.round(minutes * 60)} s`;
  return formatDuration(minutes);
}

/**
 * Débit de réception.
 *
 * @param mbPerSecond Mégaoctets par seconde, ou `null`.
 * @returns Par exemple « 2,4 Mo/s », ou « — ».
 */
export function formatRate(mbPerSecond: number | null): string {
  if (mbPerSecond === null || !Number.isFinite(mbPerSecond)) return MISSING;
  return `${mbPerSecond.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mo/s`;
}

/**
 * Nombre entier avec séparateur de milliers français.
 *
 * @param value Nombre.
 * @returns Par exemple « 12 480 ».
 */
export function formatCount(value: number): string {
  return value.toLocaleString("fr-FR", { maximumFractionDigits: 0 });
}

/**
 * Jour court, pour une étiquette d'axe.
 *
 * @param date Jour, lu en UTC.
 * @returns Par exemple « 7 oct. ».
 */
export function formatDayShort(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}
