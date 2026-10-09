import type { AppMessages } from "@/i18n";
import type { UploadGrant } from "@/lib/actions/uploads";
import type { Locale } from "@/lib/i18n/locale";

/**
 * Envoi d'un fichier au service de dépôt, depuis le navigateur.
 *
 * Séparé du composant de dépôt pour être testé sans rendu : c'est ici que
 * se décide ce que le service reçoit (jeton, langue) et comment sa réponse
 * devient l'état d'un fichier.
 */

/** État d'un fichier dans la file de dépôt. */
export type ItemState =
  | { kind: "waiting" }
  | { kind: "sending"; progress: number }
  | { kind: "stored" }
  | { kind: "duplicate" }
  | { kind: "ignored" }
  | { kind: "failed"; reason: string };

/** Textes du dépôt, dans la langue de l'utilisateur. */
type UploaderMessages = AppMessages["clinic"]["uploader"];

/**
 * Envoie un fichier à l'API, avec sa progression.
 *
 * `XMLHttpRequest` plutôt que `fetch` : seul il expose la progression de
 * l'envoi, et sans retour visible un dépôt de deux mille coupes donne
 * l'impression que rien ne se passe.
 *
 * @param grant      Jeton et adresse de dépôt.
 * @param file       Fichier à envoyer.
 * @param onProgress Appelé à chaque progression, avec la fraction envoyée.
 * @param messages   Textes du dépôt, pour les motifs d'échec génériques.
 * @param locale     Langue de l'utilisateur, celle de ses réglages.
 */
export function sendFile(
  grant: UploadGrant,
  file: File,
  onProgress: (fraction: number) => void,
  messages: UploaderMessages,
  locale: Locale,
): Promise<ItemState> {
  return new Promise((resolve) => {
    const request = new XMLHttpRequest();
    const body = new FormData();
    body.append("file", file, file.name);

    request.open("POST", grant.endpoint);
    request.setRequestHeader("X-Upload-Token", grant.token);
    // Les refus du service (« Ce fichier n'est pas une image DICOM ») sont
    // affichés tels quels : ils doivent suivre la langue choisie dans les
    // réglages, pas celle du navigateur, qu'il enverrait sinon d'office.
    // En-tête sans contrôle préalable CORS : sa valeur est un code simple.
    request.setRequestHeader("Accept-Language", locale);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    request.onload = () => {
      let detail = "";
      try {
        const payload = JSON.parse(request.responseText) as {
          status?: string;
          detail?: unknown;
        };
        if (request.status === 201 && payload.status) {
          resolve({
            kind: payload.status as "stored" | "duplicate" | "ignored",
          });
          return;
        }
        if (typeof payload.detail === "string") detail = payload.detail;
      } catch {
        // Corps illisible : message générique ci-dessous.
      }
      resolve({
        kind: "failed",
        reason: detail || messages.refused(request.status),
      });
    };
    request.onerror = () =>
      resolve({ kind: "failed", reason: messages.connectionLost });
    request.send(body);
  });
}
