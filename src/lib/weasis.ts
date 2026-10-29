/**
 * Weasis, visualiseur DICOM installé sur le poste du radiologue.
 *
 * Proposé en option à côté du viewer de l'écran de lecture, sur ordinateur
 * seulement : Weasis n'existe ni pour tablette ni pour téléphone. Il
 * s'ouvre par son protocole `weasis://` ; l'adresse vient du service
 * (`POST /studies/{id}/weasis-launch`) et ne porte que l'identifiant de
 * l'examen et un code à usage unique, jamais le jeton des images.
 *
 * Module pur : ni rendu ni requête, pour être testé seul.
 */

import { isSafeBrowserUrl } from "@/lib/security/urls";

/** Page de téléchargement officielle de Weasis (HUG, Genève). */
export const WEASIS_DOWNLOAD_URL =
  "https://weasis.org/en/getting-started/download-dicom-viewer/";

/** Requête média d'un ordinateur : grand écran, souris ou pavé tactile. */
export const DESKTOP_MEDIA_QUERY =
  "(min-width: 1024px) and (hover: hover) and (pointer: fine)";

/** Ce que le navigateur dit de l'appareil, pour {@link isDesktopComputer}. */
export interface DeviceHints {
  userAgent: string;
  /** `navigator.platform`, vide s'il n'est pas renseigné. */
  platform: string;
  maxTouchPoints: number;
}

/** Téléphones et tablettes qui se nomment comme tels. */
const MOBILE_AGENT =
  /\b(iPhone|iPad|iPod|Android|Mobile|Tablet|Silk|Kindle)\b/i;

/**
 * Vrai si l'appareil est un ordinateur, où Weasis s'installe.
 *
 * La requête média ({@link DESKTOP_MEDIA_QUERY}) ne suffit pas : un iPad
 * en paysage avec un clavier à pavé tactile a la largeur et le pointeur
 * d'un ordinateur. Safari sur iPad se présente en outre comme un Mac
 * (« MacIntel ») : seul l'écran tactile le trahit, aucun Mac n'en ayant.
 *
 * @param hints Agent, plate-forme et points de contact du navigateur.
 */
export function isDesktopComputer(hints: DeviceHints): boolean {
  if (MOBILE_AGENT.test(hints.userAgent)) return false;
  const mac = /Mac/i.test(hints.platform) || /Macintosh/.test(hints.userAgent);
  return !(mac && hints.maxTouchPoints > 1);
}

/** Commandes attendues dans l'adresse, autour de l'adresse du manifeste. */
const LAUNCH_COMMANDS = /^\$dicom:close --all \$dicom:get -w "([^"\s]+)"$/;

/** Code d'ouverture : celui qu'émet le service, sans autre caractère. */
const LAUNCH_CODE = /^[A-Za-z0-9_-]{16,128}$/;

/**
 * Vrai si l'adresse `weasis://` reçue du service est bien celle qu'il émet.
 *
 * L'adresse est ouverte telle quelle par le système : un service
 * compromis, ou un intermédiaire, pourrait y glisser d'autres commandes
 * Weasis ou faire charger un manifeste ailleurs. Elle n'est acceptée que
 * si elle ferme ce que Weasis affiche puis charge le manifeste de cet
 * examen, sur l'API configurée, avec un code et rien d'autre.
 *
 * @param value      Adresse renvoyée par le service.
 * @param apiUrl     Adresse de l'API configurée (`NEXT_PUBLIC_API_URL`).
 * @param studyId    Examen ouvert.
 */
export function isWeasisLaunchUrl(
  value: string,
  apiUrl: string | undefined,
  studyId: string,
): boolean {
  if (!apiUrl || !value.startsWith("weasis://?")) return false;
  let commands: string;
  try {
    commands = decodeURIComponent(
      value.slice("weasis://?".length).replaceAll("+", " "),
    );
  } catch {
    return false;
  }
  const found = LAUNCH_COMMANDS.exec(commands);
  // En https, sauf sur la machine locale : le manifeste porte le jeton.
  if (!found || !isSafeBrowserUrl(found[1])) return false;
  let manifest: URL;
  let api: URL;
  try {
    manifest = new URL(found[1]);
    api = new URL(apiUrl);
  } catch {
    return false;
  }
  const base = api.pathname.replace(/\/$/, "");
  const params = [...manifest.searchParams.keys()];
  return (
    manifest.origin === api.origin &&
    manifest.pathname ===
      `${base}/studies/${encodeURIComponent(studyId)}/weasis-manifest` &&
    params.length === 1 &&
    LAUNCH_CODE.test(manifest.searchParams.get("code") ?? "") &&
    !manifest.hash &&
    !manifest.username &&
    !manifest.password
  );
}
