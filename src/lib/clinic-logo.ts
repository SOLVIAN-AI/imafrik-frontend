/**
 * Règles du logo qu'une clinique imprime en filigrane de ses comptes-rendus.
 *
 * Les mêmes que le service (`app/services/clinic_logo.py`), qui fait foi :
 * l'écran s'en sert pour refuser d'emblée un fichier que le service
 * refuserait, sans l'envoyer.
 */

/** Plus gros fichier accepté, en octets. */
export const CLINIC_LOGO_MAX_BYTES = 2 * 1024 * 1024;

/** Types de fichier acceptés. Le SVG est refusé : il peut porter des scripts. */
export const CLINIC_LOGO_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

/**
 * Longueur maximale du fichier une fois encodé en base64.
 *
 * @returns Le nombre de caractères base64 de {@link CLINIC_LOGO_MAX_BYTES} octets.
 */
export function clinicLogoMaxBase64Length(): number {
  return Math.ceil(CLINIC_LOGO_MAX_BYTES / 3) * 4;
}
