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
