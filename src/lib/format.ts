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
