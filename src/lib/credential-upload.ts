import type { UploadGrant } from "@/lib/actions/uploads";
import type { Locale } from "@/lib/i18n/locale";

/**
 * Envoi d'un justificatif au service, depuis le navigateur.
 *
 * Séparé du composant pour être testé sans rendu : c'est ici que se
 * décide ce que le service reçoit (jeton, langue, nom, date de fin) et
 * comment sa réponse devient un résultat.
 */

/** Issue d'un envoi. */
export type DocumentUpload =
  { ok: true } | { ok: false; reason: string | null; status: number };

/** Ce qui accompagne le fichier. */
export interface DocumentDetails {
  /** Nom du fichier, pour l'affichage. */
  fileName: string;
  /** Attestation d'inscription : dernier jour de validité (`AAAA-MM-JJ`). */
  validUntil?: string;
}

/**
 * Adresse d'envoi : nom du fichier et date de fin en paramètres, le
 * fichier lui-même étant le corps de la requête.
 *
 * @param grant   Jeton et adresse de dépôt.
 * @param details Nom et date de fin.
 */
export function documentUploadUrl(
  grant: Pick<UploadGrant, "endpoint">,
  details: DocumentDetails,
): string {
  const params = new URLSearchParams({ file_name: details.fileName });
  if (details.validUntil) params.set("valid_until", details.validUntil);
  return `${grant.endpoint}?${params}`;
}

/**
 * Envoie un justificatif à l'API, avec sa progression.
 *
 * `XMLHttpRequest` plutôt que `fetch` : seul il expose la progression, et
 * une photo de 8 Mo sur une connexion mobile prend le temps qu'il faut
 * pour qu'on veuille la voir avancer.
 *
 * @param grant      Jeton et adresse de dépôt.
 * @param file       Fichier choisi.
 * @param details    Nom et date de fin.
 * @param onProgress Appelé à chaque progression, avec la fraction envoyée.
 * @param locale     Langue de l'utilisateur, pour les refus du service.
 * @returns Le succès, ou le refus du service (`reason` est son message,
 *          `null` si la connexion a été perdue ou la réponse illisible).
 */
export function sendDocument(
  grant: UploadGrant,
  file: Blob,
  details: DocumentDetails,
  onProgress: (fraction: number) => void,
  locale: Locale,
): Promise<DocumentUpload> {
  return new Promise((resolve) => {
    const request = new XMLHttpRequest();
    request.open("POST", documentUploadUrl(grant, details));
    request.setRequestHeader("X-Upload-Token", grant.token);
    request.setRequestHeader(
      "Content-Type",
      file.type || "application/octet-stream",
    );
    // Les refus du service suivent la langue des réglages, pas celle du
    // navigateur. En-tête sans contrôle préalable CORS.
    request.setRequestHeader("Accept-Language", locale);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    request.onload = () => {
      if (request.status === 201) {
        resolve({ ok: true });
        return;
      }
      let reason: string | null = null;
      try {
        const payload = JSON.parse(request.responseText) as {
          detail?: unknown;
        };
        if (typeof payload.detail === "string") reason = payload.detail;
      } catch {
        // Corps illisible : le composant affiche un message générique.
      }
      resolve({ ok: false, reason, status: request.status });
    };
    request.onerror = () => resolve({ ok: false, reason: null, status: 0 });
    request.send(file);
  });
}
