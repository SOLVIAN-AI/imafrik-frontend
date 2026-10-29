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

/** Profil Weasis d'IMAFRIK : préférences et instance distinctes. */
export const WEASIS_PROFILE = "imafrik";

/**
 * Sorties de Weasis que chaque ouverture depuis IMAFRIK doit couper
 * (`LOCKDOWN` du service, `app/routers/weasis.py`) : export DICOM, CD et
 * images, envoi, récupération sur un autre PACS, annotations, capture,
 * barre de menus. Une adresse qui en omet une n'est pas ouverte.
 */
export const WEASIS_LOCKDOWN = [
  "weasis.export.dicom",
  "weasis.export.dicom.send",
  "weasis.import.dicom.qr",
  "weasis.export.annotations",
  "weasis.all.screenshottoolbar.enable",
  "weasis.menu.menubar",
] as const;

/**
 * Commandes attendues dans l'adresse : la configuration de Weasis, puis
 * la fermeture de ce qu'il affiche et le manifeste.
 */
const LAUNCH_COMMANDS =
  /^\$weasis:config ((?:pro="[^"]+" )+)\$dicom:close --all \$dicom:get -w "([^"\s]+)"$/;

/** Une propriété qui coupe une fonction de Weasis. */
const DISABLED_PROPERTY = /^([a-z][\w.-]*) false$/;

/** Code d'ouverture : celui qu'émet le service, sans autre caractère. */
const LAUNCH_CODE = /^[A-Za-z0-9_-]{16,128}$/;

/**
 * Vrai si l'adresse `weasis://` reçue du service est bien celle qu'il émet.
 *
 * L'adresse est ouverte telle quelle par le système : un service
 * compromis, ou un intermédiaire, pourrait y glisser d'autres commandes
 * Weasis, rouvrir un export ou faire charger un manifeste ailleurs. Elle
 * n'est acceptée que si elle lance Weasis dans le profil d'IMAFRIK, avec
 * la configuration de l'API configurée et chacune des sorties de
 * {@link WEASIS_LOCKDOWN} coupée (d'autres propriétés ne peuvent que
 * couper davantage), puis ferme ce que Weasis affiche et charge le
 * manifeste de cet examen, sur cette API, avec un code et rien d'autre.
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
  if (!found || !isSafeBrowserUrl(found[2])) return false;
  let manifest: URL;
  let api: URL;
  try {
    manifest = new URL(found[2]);
    api = new URL(apiUrl);
  } catch {
    return false;
  }
  const base = api.pathname.replace(/\/$/, "");
  if (!isLockedConfig(found[1], `${api.origin}${base}`)) return false;
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

/**
 * Vrai si les propriétés de lancement verrouillent Weasis : profil
 * d'IMAFRIK, configuration servie par l'API, chaque sortie coupée.
 *
 * @param config Suite des `pro="…"` de `$weasis:config`.
 * @param api    Origine et chemin de base de l'API configurée.
 */
function isLockedConfig(config: string, api: string): boolean {
  const properties = [...config.matchAll(/pro="([^"]+)"/g)].map(
    (match) => match[1],
  );
  const [profile, extended, ...rest] = properties;
  if (profile !== `weasis.profile ${WEASIS_PROFILE}`) return false;
  if (
    extended !== `felix.extended.config.properties ${api}/weasis/configuration`
  )
    return false;
  const disabled = new Set<string>();
  for (const property of rest) {
    const match = DISABLED_PROPERTY.exec(property);
    if (!match) return false;
    disabled.add(match[1]);
  }
  return WEASIS_LOCKDOWN.every((key) => disabled.has(key));
}
