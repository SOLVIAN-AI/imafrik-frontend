import { createHmac } from "node:crypto";
import { isIP } from "node:net";

/**
 * Adresse du visiteur du formulaire de contact, relayée à l'API.
 *
 * La demande part d'une fonction serveur de l'application, pas du
 * navigateur : l'API voit l'adresse du serveur (Vercel), la même pour
 * tous les visiteurs. Sa limite de cinq demandes par heure et par adresse
 * bloquait donc le formulaire pour tout le monde dès la cinquième demande.
 *
 * L'adresse du visiteur est relayée dans `X-Visitor-Ip`, signée en
 * HMAC-SHA256 sous un secret partagé avec l'API
 * (`CONTACT_IP_SIGNING_SECRET`, variable serveur, jamais `NEXT_PUBLIC_`).
 * L'API ne la croit qu'avec une signature valide. Sans secret, rien n'est
 * relayé : le formulaire fonctionne, avec une limite commune à tous.
 *
 * L'adresse est lue dans `x-real-ip`, sinon dans le premier élément de
 * `x-forwarded-for`. Vercel réécrit ces deux en-têtes avec l'adresse
 * réelle du client : un visiteur ne peut pas les choisir. Sur un autre
 * hébergement, seul un mandataire qui les réécrit de même les rend dignes
 * de foi.
 */

/** En-tête portant l'adresse du visiteur. */
export const VISITOR_IP_HEADER = "X-Visitor-Ip";

/** En-tête portant la signature de cette adresse. */
export const VISITOR_IP_SIGNATURE_HEADER = "X-Visitor-Ip-Signature";

/**
 * Adresse IP du visiteur, d'après les en-têtes de la requête reçue.
 *
 * @param headers En-têtes de la requête entrante.
 * @returns L'adresse, ou `null` si aucune adresse valide n'y figure.
 */
export function visitorIp(headers: Headers): string | null {
  const candidates = [
    headers.get("x-real-ip"),
    headers.get("x-forwarded-for")?.split(",")[0],
  ];
  for (const candidate of candidates) {
    const address = candidate?.trim();
    if (address && isIP(address) !== 0) return address;
  }
  return null;
}

/**
 * Signe une adresse, comme l'API la vérifie (`sign_visitor_ip`).
 *
 * @param address Adresse IP du visiteur.
 * @param secret  Secret partagé `CONTACT_IP_SIGNING_SECRET`.
 * @returns La signature HMAC-SHA256, en hexadécimal.
 */
export function signVisitorIp(address: string, secret: string): string {
  return createHmac("sha256", secret).update(address).digest("hex");
}

/**
 * En-têtes à joindre à l'appel de l'API pour lui relayer le visiteur.
 *
 * @param headers En-têtes de la requête entrante.
 * @param secret  Secret partagé ; absent, rien n'est relayé.
 * @returns Les deux en-têtes, ou un objet vide.
 */
export function visitorIpHeaders(
  headers: Headers,
  secret: string | undefined,
): Record<string, string> {
  const address = visitorIp(headers);
  if (!secret || !address) return {};
  return {
    [VISITOR_IP_HEADER]: address,
    [VISITOR_IP_SIGNATURE_HEADER]: signVisitorIp(address, secret),
  };
}
