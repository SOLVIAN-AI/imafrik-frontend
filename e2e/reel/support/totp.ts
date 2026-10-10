import { createHmac } from "node:crypto";

/**
 * Codes à usage unique fondés sur le temps (TOTP, RFC 6238).
 *
 * Le parcours enrôle un vrai second facteur auprès du Supabase local : il
 * lit la clé affichée à l'enrôlement, puis calcule le code comme le ferait
 * l'application d'authentification du radiologue. Paramètres de GoTrue :
 * HMAC-SHA1, six chiffres, période de trente secondes.
 */

/** Alphabet Base32 (RFC 4648), celui des clés TOTP. */
const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** Durée de validité d'un code, en secondes. */
export const TOTP_PERIOD = 30;

/**
 * Décode une clé Base32, espaces et remplissage ignorés.
 *
 * @param secret Clé telle qu'affichée, éventuellement groupée par quatre.
 * @returns Les octets de la clé.
 * @throws Si la clé contient un caractère hors de l'alphabet.
 */
export function decodeBase32(secret: string): Buffer {
  const clean = secret.replace(/[\s=]/g, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of clean) {
    const index = BASE32.indexOf(char);
    if (index === -1) throw new Error(`Caractère Base32 invalide : ${char}`);
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/**
 * Calcule le code TOTP d'une clé à un instant donné.
 *
 * @param key    Clé brute (octets).
 * @param atMs   Instant, en millisecondes depuis l'époque Unix.
 * @param digits Nombre de chiffres du code.
 * @returns Le code, complété de zéros à gauche.
 */
export function totpAt(key: Buffer, atMs: number, digits = 6): string {
  const counter = Math.floor(atMs / 1000 / TOTP_PERIOD);
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac("sha1", key).update(message).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary = hmac.readUInt32BE(offset) & 0x7fffffff;
  return String(binary % 10 ** digits).padStart(digits, "0");
}

/** Dernière période dont le code a été présenté, par clé. */
const presented = new Map<string, number>();

/**
 * Code TOTP courant d'une clé affichée à l'enrôlement.
 *
 * Deux précautions, qui évitent un parcours qui échouerait au hasard :
 *
 * - un code calculé dans les dernières secondes de sa période risque
 *   d'expirer avant d'arriver au service : on attend la suivante ;
 * - un code déjà présenté ne l'est pas une seconde fois (une application
 *   d'authentification ne le ferait pas non plus) : une nouvelle
 *   vérification attend la période suivante.
 *
 * @param secret Clé Base32, telle qu'affichée.
 * @returns Un code valable encore au moins cinq secondes, jamais présenté.
 */
export async function totpNow(secret: string): Promise<string> {
  const period = () => Math.floor(Date.now() / 1000 / TOTP_PERIOD);
  const remaining = () => TOTP_PERIOD - ((Date.now() / 1000) % TOTP_PERIOD);
  const wait = (seconds: number) =>
    new Promise((resolve) => setTimeout(resolve, seconds * 1000 + 250));

  if (presented.get(secret) === period()) await wait(remaining());
  if (remaining() < 5) await wait(remaining());
  presented.set(secret, period());
  return totpAt(decodeBase32(secret), Date.now());
}
