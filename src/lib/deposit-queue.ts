import type { DepositGrant } from "@/lib/actions/deposits";
import type {
  UploadController,
  UploadOptions,
  UploadPhase,
} from "@/lib/deposit-upload";
import {
  HEAD_BYTES,
  type InterruptedDeposit,
  type LocalRefusal,
  headDigest,
  localRefusal,
  matchInterrupted,
} from "@/lib/deposits";
import type { Locale } from "@/lib/i18n/locale";

/**
 * File des archives à envoyer, hors de React.
 *
 * Les archives partent l'une après l'autre : sur une liaison lente, deux
 * envois simultanés ne vont pas plus vite, ils finissent tous deux plus
 * tard. Chacune est contrôlée avant de partir (taille, signature ZIP), et
 * reconnue si elle reprend un envoi interrompu (même taille, même
 * empreinte du premier Mio).
 *
 * L'écran s'y abonne (`useSyncExternalStore`) ; la file se teste seule,
 * avec un envoi simulé (`deposit-queue.test.ts`).
 */

/** Une archive de la file. */
export interface QueueItem {
  key: string;
  file: File;
  /** Envoi interrompu que reprend ce fichier. */
  resumeOf: InterruptedDeposit | null;
  headSha256: string | null;
  /** Refus avant l'envoi (pas une archive, trop grosse, vide). */
  refusal: LocalRefusal | null;
  phase: UploadPhase | { kind: "queued" };
}

/** Ce dont la file a besoin, fourni par l'écran. */
export interface QueueConfig {
  /** Clinique des examens déposés ; `null` tant que l'équipe n'a pas choisi. */
  clinicId: string | null;
  /** Taille maximale d'une archive. */
  maxArchiveBytes: number;
  /** Envois interrompus de la clinique. */
  interrupted: readonly InterruptedDeposit[];
  /** Un jeton d'envoi pour la clinique, ou le refus à afficher. */
  grant: (clinicId: string) => Promise<DepositGrant | { error: string }>;
  /** Lance un envoi (le vrai, ou la simulation de la démonstration). */
  start: (options: UploadOptions) => UploadController;
  /** Démonstration : ni empreinte, ni jeton. */
  demo: boolean;
  locale: Locale;
  /** Messages d'échec génériques. */
  refusedMessage: (status: number) => string;
  tokenMessage: string;
  chooseClinicMessage: string;
  /** Une archive vient d'être reçue ou abandonnée : la liste se relit. */
  onSettled: () => void;
}

/** Marge avant l'expiration du jeton au-delà de laquelle on en redemande un. */
const TOKEN_MARGIN_MS = 60_000;

/** Les issues d'un envoi. */
const SETTLED = new Set(["received", "failed", "cancelled"]);

export class DepositQueue {
  private items: readonly QueueItem[] = [];
  private readonly listeners = new Set<() => void>();
  private readonly controllers = new Map<string, UploadController>();
  private activeKey: string | null = null;
  private token: {
    clinicId: string;
    value: DepositGrant;
    expiresAt: number;
  } | null = null;
  private sequence = 0;

  constructor(private config: QueueConfig) {}

  /** Met à jour ce que l'écran fournit (clinique choisie, envois interrompus). */
  configure(config: QueueConfig): void {
    if (config.clinicId !== this.config.clinicId) this.token = null;
    this.config = config;
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): readonly QueueItem[] => this.items;

  /** Vrai tant qu'une archive est en route : quitter la page l'arrêterait. */
  get sending(): boolean {
    return this.items.some((item) =>
      ["starting", "sending", "offline"].includes(item.phase.kind),
    );
  }

  /** Une archive reçue attend son contrôle : la liste se relit d'elle-même. */
  get awaitingCheck(): boolean {
    return this.items.some((item) => item.phase.kind === "received");
  }

  private set(next: readonly QueueItem[]): void {
    this.items = next;
    for (const listener of this.listeners) listener();
  }

  private patch(key: string, patch: Partial<QueueItem>): void {
    this.set(
      this.items.map((item) =>
        item.key === key ? { ...item, ...patch } : item,
      ),
    );
  }

  /**
   * Ajoute des archives à la file.
   *
   * @param files    Fichiers choisis.
   * @param expected Envoi interrompu dont « Reprendre » a ouvert le choix :
   *                 en démonstration, il est repris sans empreinte.
   */
  async add(
    files: readonly File[],
    expected: InterruptedDeposit | null = null,
  ): Promise<void> {
    const prepared: QueueItem[] = [];
    for (const file of files) {
      const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
      const refusal = localRefusal(
        { size: file.size, head },
        this.config.maxArchiveBytes,
      );
      const headSha256 =
        refusal || this.config.demo
          ? null
          : await headDigest(file.slice(0, HEAD_BYTES));
      const matched = headSha256
        ? matchInterrupted(
            { size: file.size, headSha256 },
            this.config.interrupted,
          )
        : null;
      this.sequence += 1;
      prepared.push({
        key: `archive-${this.sequence}`,
        file,
        resumeOf: matched ?? (this.config.demo && !refusal ? expected : null),
        headSha256,
        refusal,
        phase: refusal
          ? { kind: "failed", sent: 0, total: file.size, message: "" }
          : { kind: "queued" },
      });
    }
    this.set([...this.items, ...prepared]);
    await this.launchNext();
  }

  /** Lance la prochaine archive, s'il n'y en a pas déjà une en route. */
  private async launchNext(): Promise<void> {
    if (this.activeKey) return;
    const next = this.items.find((item) => item.phase.kind === "queued");
    if (!next) return;
    this.activeKey = next.key;

    const onPhase = (phase: UploadPhase) => {
      this.patch(next.key, { phase });
      if (SETTLED.has(phase.kind)) {
        this.controllers.delete(next.key);
        this.activeKey = null;
        if (phase.kind !== "failed") this.config.onSettled();
        void this.launchNext();
      }
    };

    const { clinicId } = this.config;
    if (!clinicId) {
      onPhase({
        kind: "failed",
        sent: 0,
        total: next.file.size,
        message: this.config.chooseClinicMessage,
      });
      return;
    }
    const first = this.config.demo ? null : await this.grantFor(clinicId);
    if (first && "error" in first) {
      onPhase({
        kind: "failed",
        sent: 0,
        total: next.file.size,
        message: first.error,
      });
      return;
    }
    const endpoint = first?.endpoint ?? "";
    this.controllers.set(
      next.key,
      this.config.start({
        file: next.file,
        endpoint,
        uploadUrl: next.resumeOf ? `${endpoint}/${next.resumeOf.id}` : null,
        headSha256: next.headSha256 ?? "",
        locale: this.config.locale,
        getToken: async () => {
          const fresh = await this.grantFor(clinicId);
          return "error" in fresh ? null : fresh.token;
        },
        onPhase,
        refusedMessage: this.config.refusedMessage,
        tokenMessage: this.config.tokenMessage,
      }),
    );
  }

  /** Un jeton valide pour la clinique, redemandé s'il approche de son expiration. */
  private async grantFor(
    clinicId: string,
  ): Promise<DepositGrant | { error: string }> {
    const cached = this.token;
    if (
      cached &&
      cached.clinicId === clinicId &&
      cached.expiresAt - Date.now() > TOKEN_MARGIN_MS
    ) {
      return cached.value;
    }
    const result = await this.config.grant(clinicId);
    if ("error" in result) return result;
    this.token = {
      clinicId,
      value: result,
      expiresAt: Date.now() + result.expiresIn * 1000,
    };
    return result;
  }

  /** Vrai si l'archive a un envoi qu'on peut piloter. */
  controllable(key: string): boolean {
    return this.controllers.has(key);
  }

  pause(key: string): void {
    this.controllers.get(key)?.pause();
  }

  resume(key: string): void {
    this.controllers.get(key)?.resume();
  }

  async cancel(key: string): Promise<void> {
    const controller = this.controllers.get(key);
    if (controller) {
      await controller.cancel();
      return;
    }
    // Pas encore partie : elle quitte la file.
    this.remove(key);
  }

  /** Retire une archive de la file (envoyée, refusée ou pas encore partie). */
  remove(key: string): void {
    if (this.controllers.has(key)) return;
    this.set(this.items.filter((item) => item.key !== key));
  }
}
