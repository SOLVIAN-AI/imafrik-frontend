import { type DetailedError, type HttpRequest, Upload } from "tus-js-client";

import type { Locale } from "@/lib/i18n/locale";
import {
  FIRST_CHUNK_BYTES,
  nextChunkSize,
  remainingSeconds,
  ThroughputMeter,
} from "@/lib/deposits";

/**
 * Envoi d'une archive au service, depuis le navigateur.
 *
 * **Le protocole tus, par sa bibliothèque de référence** (`tus-js-client`).
 * L'archive part par morceaux ; après une coupure, le navigateur demande
 * au service combien d'octets il a reçus, et reprend exactement là. Ce
 * module y ajoute ce qu'une liaison lente et instable demande :
 *
 * - des **morceaux réglés sur le débit** (`nextChunkSize`) : une
 *   quinzaine de secondes chacun, loin des 60 secondes au bout desquelles
 *   le relais du serveur coupe une requête ;
 * - la **reprise automatique au retour du réseau** : la bibliothèque
 *   renonce quand le navigateur se sait hors ligne ; l'envoi attend alors
 *   l'événement `online`, ou réessaie de lui-même toutes les 15 à 60
 *   secondes, tant que la page est ouverte ;
 * - un **jeton frais** à chaque requête : il vit trente minutes, un envoi
 *   peut durer des heures ;
 * - le **débit** et le **temps restant**, lissés sur vingt secondes.
 *
 * Après la fermeture de l'onglet, l'envoi reprend quand on choisit de
 * nouveau le même fichier : la page reconnaît l'envoi interrompu
 * (`matchInterrupted`) et passe son adresse (`uploadUrl`).
 */

/** Où en est un envoi. */
export type UploadPhase =
  | { kind: "starting" }
  | {
      kind: "sending";
      sent: number;
      total: number;
      bytesPerSecond: number | null;
      remainingSeconds: number | null;
    }
  | { kind: "paused"; sent: number; total: number }
  | { kind: "offline"; sent: number; total: number }
  | { kind: "received"; depositId: string }
  | { kind: "failed"; sent: number; total: number; message: string }
  | { kind: "cancelled" };

/** Réglages d'un envoi. */
export interface UploadOptions {
  /** L'archive. */
  file: File;
  /** Adresse de création des envois. */
  endpoint: string;
  /** Adresse d'un envoi interrompu à reprendre, ou `null` pour un nouveau. */
  uploadUrl: string | null;
  /** Empreinte du premier Mio, transmise au service. */
  headSha256: string;
  /** Langue des refus du service. */
  locale: Locale;
  /** Un jeton valide, renouvelé avant son expiration ; `null` s'il est refusé. */
  getToken: () => Promise<string | null>;
  /** Appelé à chaque changement, au plus quatre fois par seconde pendant l'envoi. */
  onPhase: (phase: UploadPhase) => void;
  /** Message d'un refus sans détail du service. */
  refusedMessage: (status: number) => string;
  /** Message d'un jeton refusé. */
  tokenMessage: string;
}

/** Ce qu'on peut faire d'un envoi lancé. */
export interface UploadController {
  pause(): void;
  resume(): void;
  /** Abandonne l'envoi ; le service efface ce qu'il en a reçu. */
  cancel(): Promise<void>;
}

/** Délais entre deux essais de la bibliothèque, avant l'attente du réseau. */
export const RETRY_DELAYS_MS = [0, 1_000, 3_000, 5_000, 10_000, 20_000];

/** Délais entre deux reprises automatiques, quand le réseau manque. */
export const RECONNECT_DELAYS_MS = [15_000, 30_000, 60_000];

/** Intervalle minimal entre deux annonces de progression. */
const PHASE_INTERVAL_MS = 250;

/** Statuts qui ne se règlent pas en réessayant (hors 409 et 423). */
function isRefusal(status: number): boolean {
  return status >= 400 && status < 500 && status !== 409 && status !== 423;
}

/** Identifiant du dépôt, dernier segment de son adresse. */
export function depositIdOf(url: string | null): string | null {
  if (!url) return null;
  const last = url.split("?")[0].split("/").filter(Boolean).at(-1);
  return last ?? null;
}

/** Message d'un refus du service, lu dans son corps `{"detail": …}`. */
function refusalDetail(error: DetailedError): string | null {
  try {
    const body = error.originalResponse?.getBody();
    if (!body) return null;
    const detail = (JSON.parse(body) as { detail?: unknown }).detail;
    return typeof detail === "string" ? detail : null;
  } catch {
    return null;
  }
}

/**
 * Lance l'envoi d'une archive.
 *
 * @param options Réglages de l'envoi.
 * @returns De quoi le mettre en pause, le reprendre ou l'abandonner.
 */
export function startUpload(options: UploadOptions): UploadController {
  const { file, onPhase } = options;
  const total = file.size;
  const meter = new ThroughputMeter();
  let sent = 0;
  let lastAnnounce = 0;
  let paused = false;
  let finished = false;
  let reconnects = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let tokenRefused = false;

  const announceSending = (force = false) => {
    const now = Date.now();
    if (!force && now - lastAnnounce < PHASE_INTERVAL_MS) return;
    lastAnnounce = now;
    const rate = meter.bytesPerSecond();
    onPhase({
      kind: "sending",
      sent,
      total,
      bytesPerSecond: rate,
      remainingSeconds: remainingSeconds(total - sent, rate),
    });
  };

  const upload = new Upload(file, {
    endpoint: options.endpoint,
    uploadUrl: options.uploadUrl ?? undefined,
    chunkSize: FIRST_CHUNK_BYTES,
    retryDelays: RETRY_DELAYS_MS,
    // L'envoi interrompu se retrouve par la liste des dépôts du service,
    // pas par le stockage local du navigateur : il reprend aussi depuis
    // un autre poste, et aucun nom de fichier ne reste sur celui-ci.
    storeFingerprintForResuming: false,
    metadata: {
      filename: file.name,
      filetype: file.type || "application/zip",
      head: options.headSha256,
    },
    onBeforeRequest: async (request: HttpRequest) => {
      const token = await options.getToken();
      if (!token) {
        tokenRefused = true;
        throw new Error(options.tokenMessage);
      }
      request.setHeader("X-Upload-Token", token);
      // Les refus du service suivent la langue des réglages.
      request.setHeader("Accept-Language", options.locale);
    },
    onProgress: (bytesSent) => {
      sent = bytesSent;
      meter.add(Date.now(), bytesSent);
      announceSending();
    },
    onChunkComplete: (_chunk, accepted) => {
      sent = accepted;
      reconnects = 0;
      // Le prochain morceau dure une quinzaine de secondes au débit mesuré.
      upload.options.chunkSize = nextChunkSize(meter.bytesPerSecond());
    },
    onSuccess: () => {
      finished = true;
      onPhase({
        kind: "received",
        depositId: depositIdOf(upload.url) ?? "",
      });
    },
    onError: (error) => {
      if (paused || finished) return;
      const status =
        "originalResponse" in error
          ? ((error as DetailedError).originalResponse?.getStatus() ?? 0)
          : 0;
      if (tokenRefused || isRefusal(status)) {
        finished = true;
        onPhase({
          kind: "failed",
          sent,
          total,
          message: tokenRefused
            ? options.tokenMessage
            : (refusalDetail(error as DetailedError) ??
              options.refusedMessage(status)),
        });
        return;
      }
      waitForNetwork();
    },
  });

  /** Le réseau manque : attendre son retour, ou réessayer de soi-même. */
  const waitForNetwork = () => {
    meter.reset();
    onPhase({ kind: "offline", sent, total });
    const delay =
      RECONNECT_DELAYS_MS[Math.min(reconnects, RECONNECT_DELAYS_MS.length - 1)];
    reconnects += 1;
    clearReconnect();
    reconnectTimer = setTimeout(restart, delay);
    window.addEventListener("online", restart, { once: true });
  };

  const clearReconnect = () => {
    if (reconnectTimer !== null) clearTimeout(reconnectTimer);
    reconnectTimer = null;
    window.removeEventListener("online", restart);
  };

  const restart = () => {
    clearReconnect();
    if (paused || finished) return;
    announceSending(true);
    upload.start();
  };

  onPhase({ kind: "starting" });
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    waitForNetwork();
  } else {
    upload.start();
  }

  return {
    pause() {
      if (finished || paused) return;
      paused = true;
      clearReconnect();
      meter.reset();
      void upload.abort();
      onPhase({ kind: "paused", sent, total });
    },
    resume() {
      if (finished || !paused) return;
      paused = false;
      announceSending(true);
      upload.start();
    },
    async cancel() {
      if (finished) return;
      finished = true;
      clearReconnect();
      try {
        // `true` : le service abandonne l'envoi et efface ce qu'il en a reçu.
        await upload.abort(Boolean(upload.url));
      } catch {
        // L'envoi expirera de lui-même, effacé par le service sous 72 heures.
      }
      onPhase({ kind: "cancelled" });
    },
  };
}

/** Durée d'un envoi simulé, en millisecondes. */
const SIMULATED_DURATION_MS = 9_000;

/** Fraction à laquelle l'envoi simulé connaît sa coupure. */
const SIMULATED_CUT_AT = 0.42;

/** Durée de la coupure simulée. */
const SIMULATED_CUT_MS = 2_500;

/**
 * Envoi simulé, pour la démonstration : rien ne quitte le poste. Il
 * montre ce que vit l'utilisateur, coupure comprise : progression, débit,
 * temps restant, attente du réseau, reprise, archive reçue.
 *
 * @param options Réglages de l'envoi (seuls le fichier et `onPhase` comptent).
 */
export function simulateUpload(
  options: Pick<UploadOptions, "file" | "onPhase">,
): UploadController {
  const { file, onPhase } = options;
  const total = file.size;
  const step = 200;
  const perStep = Math.max(
    1,
    Math.ceil(total / (SIMULATED_DURATION_MS / step)),
  );
  // Le débit annoncé est celui d'une liaison de 3G ordinaire, quelle que
  // soit la taille du fichier : la démonstration montre un vrai cas.
  const shownRate = 180 * 1024;
  let sent = 0;
  let cut = false;
  let paused = false;
  let timer: ReturnType<typeof setInterval> | null = null;

  const tick = () => {
    if (paused) return;
    if (!cut && sent >= total * SIMULATED_CUT_AT) {
      cut = true;
      stop();
      onPhase({ kind: "offline", sent, total });
      setTimeout(() => {
        if (!paused) run();
      }, SIMULATED_CUT_MS);
      return;
    }
    sent = Math.min(total, sent + perStep);
    if (sent >= total) {
      stop();
      onPhase({ kind: "received", depositId: "demo-depot-nouveau" });
      return;
    }
    onPhase({
      kind: "sending",
      sent,
      total,
      bytesPerSecond: shownRate,
      remainingSeconds: Math.ceil(((total - sent) / total) * 1_800),
    });
  };
  const run = () => {
    stop();
    timer = setInterval(tick, step);
  };
  const stop = () => {
    if (timer !== null) clearInterval(timer);
    timer = null;
  };

  onPhase({ kind: "starting" });
  run();
  return {
    pause() {
      paused = true;
      stop();
      onPhase({ kind: "paused", sent, total });
    },
    resume() {
      paused = false;
      run();
    },
    async cancel() {
      paused = true;
      stop();
      onPhase({ kind: "cancelled" });
    },
  };
}
