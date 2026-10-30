"use client";

import {
  CheckCircle2,
  CircleSlash,
  FileArchive,
  Loader2,
  Pause,
  Play,
  WifiOff,
  X,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { InfoTip } from "@/components/ui/info-tip";
import { useLocale, useMessages } from "@/i18n/client";
import type { AppMessages } from "@/i18n";
import { getDepositGrant, getTeamDepositGrant } from "@/lib/actions/deposits";
import type { DepositLimits } from "@/lib/data/deposits";
import {
  DepositQueue,
  type QueueConfig,
  type QueueItem,
} from "@/lib/deposit-queue";
import { simulateUpload, startUpload } from "@/lib/deposit-upload";
import type { InterruptedDeposit } from "@/lib/deposits";
import { formatBytes, formatDuration } from "@/lib/format";
import type { Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

/** Textes de l'envoi, dans la langue de l'utilisateur. */
type UploaderText = AppMessages["deposits"]["uploader"];

/** File vide, pour le rendu au serveur. */
const NO_ITEMS: readonly QueueItem[] = [];

const ResumeContext = React.createContext<
  (deposit: InterruptedDeposit) => void
>(() => {});

/**
 * Demande la reprise d'un envoi interrompu : ouvre le choix du fichier.
 * À appeler pendant le clic, sans quoi le navigateur refuse d'ouvrir le
 * sélecteur.
 */
export function useResumeDeposit(): (deposit: InterruptedDeposit) => void {
  return React.useContext(ResumeContext);
}

/**
 * Dépôt d'archives ZIP, et ce qui en reprend un.
 *
 * **L'envoi** : glisser-déposer ou sélecteur, une ou plusieurs archives,
 * qui partent l'une après l'autre (`lib/deposit-queue.ts`). Chaque
 * archive est contrôlée avant de partir (taille, signature ZIP) et dit où
 * elle en est : progression, débit, temps restant, connexion perdue
 * (l'envoi reprend seul au retour du réseau), reçue.
 *
 * **La reprise** : un fichier qui est celui d'un envoi interrompu (même
 * taille, même empreinte de son premier Mio) reprend cet envoi à l'octet
 * près, même après la fermeture de l'onglet, même depuis un autre poste.
 * « Reprendre » sur une ligne de la liste ouvre le choix du fichier
 * (`useResumeDeposit`).
 *
 * Le message est honnête : une connexion reste nécessaire au moment de
 * l'envoi ; ce qui est promis, c'est de ne rien perdre à chaque coupure.
 *
 * @param clinic       Clinique propriétaire des examens déposés (`null` :
 *                     l'équipe n'en a pas encore choisi).
 * @param team         `true` pour l'équipe IMAFRIK, au nom de la clinique.
 * @param limits       Limites du service.
 * @param interrupted  Envois interrompus de la clinique.
 * @param reportBase   Adresse des comptes rendus (`/examens/depots`).
 * @param demo         Démonstration : l'envoi est simulé.
 * @param clinicPicker Choix de la clinique, pour l'équipe.
 * @param children     La liste des dépôts, dont les lignes demandent une reprise.
 */
export function DepositWorkspace({
  clinic,
  team,
  limits,
  interrupted,
  reportBase,
  demo,
  clinicPicker,
  children,
}: {
  clinic: { id: string; name: string } | null;
  team: boolean;
  limits: DepositLimits;
  interrupted: InterruptedDeposit[];
  reportBase: string;
  demo: boolean;
  clinicPicker?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const text = useMessages().deposits.uploader;
  const locale = useLocale() as Locale;
  const [dragging, setDragging] = React.useState(false);
  const [expected, setExpected] = React.useState<InterruptedDeposit | null>(
    null,
  );
  const input = React.useRef<HTMLInputElement>(null);
  const clinicId = clinic?.id ?? null;

  const config = React.useMemo<QueueConfig>(
    () => ({
      clinicId,
      maxArchiveBytes: limits.maxArchiveBytes,
      interrupted,
      demo,
      locale,
      start: demo ? simulateUpload : startUpload,
      grant: async (id) => {
        const result = team
          ? await getTeamDepositGrant(id)
          : await getDepositGrant();
        return result.ok ? result.data : { error: result.error };
      },
      refusedMessage: text.refusedStatus,
      tokenMessage: text.tokenRefused,
      chooseClinicMessage: text.chooseClinicFirst,
      onSettled: () => router.refresh(),
    }),
    [
      clinicId,
      limits.maxArchiveBytes,
      interrupted,
      demo,
      locale,
      team,
      text,
      router,
    ],
  );
  const [queue] = React.useState(() => new DepositQueue(config));
  React.useEffect(() => queue.configure(config), [queue, config]);
  const items = React.useSyncExternalStore(
    queue.subscribe,
    queue.getSnapshot,
    () => NO_ITEMS,
  );

  // Quitter la page pendant un envoi l'arrête : le navigateur le dit.
  const sending = queue.sending;
  React.useEffect(() => {
    if (!sending) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [sending]);

  // Une archive reçue est en contrôle : la liste se relit d'elle-même, deux
  // minutes au plus.
  const awaitingCheck = queue.awaitingCheck;
  React.useEffect(() => {
    if (!awaitingCheck) return;
    const timer = window.setInterval(() => router.refresh(), 5_000);
    const stop = window.setTimeout(() => window.clearInterval(timer), 120_000);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(stop);
    };
  }, [awaitingCheck, router]);

  const add = (files: File[]) => {
    if (files.length === 0) return;
    const wanted = expected;
    setExpected(null);
    void queue.add(files, wanted);
  };

  const resume = React.useCallback((deposit: InterruptedDeposit) => {
    setExpected(deposit);
    input.current?.click();
  }, []);

  const disabled = !clinicId;
  const maxArchive = formatBytes(limits.maxArchiveBytes, locale);

  return (
    <ResumeContext.Provider value={resume}>
      <section
        aria-labelledby="depot-titre"
        className="rounded-xl border border-border-subtle bg-surface-raised shadow-raised"
      >
        <header className="flex min-h-11 flex-wrap items-center gap-x-2 gap-y-1 border-b border-border-subtle px-4 py-2">
          <h2 id="depot-titre" className="label-eyebrow flex items-center">
            {text.section}
            <InfoTip label={text.section} text={text.sectionTip} term="depot" />
          </h2>
        </header>

        <div className="flex flex-col gap-4 p-4">
          {clinicPicker}
          {team && clinic && (
            <p className="text-xs text-secondary">
              {text.onBehalf(clinic.name)}
            </p>
          )}

          <div
            onDragOver={(event) => {
              if (disabled) return;
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              if (!disabled) add([...event.dataTransfer.files]);
            }}
            className={cn(
              "flex flex-col items-center gap-3 rounded-xl border border-dashed px-4 py-8 text-center transition-colors sm:px-6",
              dragging
                ? "border-accent bg-accent-muted"
                : "border-border-default",
              disabled && "opacity-60",
            )}
          >
            <FileArchive className="size-6 text-tertiary" aria-hidden />
            <p className="text-sm font-medium">{text.dropTitle}</p>
            <p className="max-w-md text-xs text-tertiary">
              {text.dropDetail(maxArchive)}
            </p>
            {expected && (
              <p
                className="max-w-md text-xs font-medium text-accent"
                role="status"
              >
                {expected.fileName} · {formatBytes(expected.sizeBytes, locale)}
              </p>
            )}
            <Button
              size="sm"
              disabled={disabled}
              onClick={() => input.current?.click()}
            >
              <FileArchive />
              {text.choose}
            </Button>
            <p className="text-2xs text-tertiary">
              {disabled ? text.chooseClinicFirst : text.chooseMany}
            </p>
            <input
              ref={input}
              type="file"
              multiple
              accept=".zip,application/zip,application/x-zip-compressed"
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              data-testid="depot-fichier"
              onChange={(event) => {
                add(event.target.files ? [...event.target.files] : []);
                event.target.value = "";
              }}
            />
          </div>

          {items.length > 0 && (
            <ul
              className="divide-y divide-border-subtle rounded-lg border border-border-subtle"
              aria-live="polite"
              aria-label={text.section}
            >
              {items.map((item) => (
                <UploadRow
                  key={item.key}
                  item={item}
                  text={text}
                  locale={locale}
                  reportBase={reportBase}
                  controllable={queue.controllable(item.key)}
                  onPause={() => queue.pause(item.key)}
                  onResume={() => queue.resume(item.key)}
                  onCancel={() => void queue.cancel(item.key)}
                  onRemove={() => queue.remove(item.key)}
                />
              ))}
            </ul>
          )}

          <div className="flex gap-3 rounded-lg border border-border-subtle bg-surface-sunken px-3 py-2.5 text-xs">
            <WifiOff
              className="mt-0.5 size-4 shrink-0 text-tertiary"
              aria-hidden
            />
            <div className="min-w-0 space-y-1 text-secondary">
              <p className="font-medium text-primary">{text.honestTitle}</p>
              <p>{text.honest}</p>
              <p>{text.honestClosed(limits.expiryHours)}</p>
              <p className="flex items-center text-tertiary">
                {text.limits}
                <InfoTip
                  label={text.limits}
                  text={text.limitsTip(
                    maxArchive,
                    limits.maxEntries.toLocaleString(locale),
                    formatBytes(limits.maxEntryBytes, locale),
                  )}
                  term="archiveZip"
                />
              </p>
            </div>
          </div>

          {demo && <p className="text-2xs text-tertiary">{text.demoNotice}</p>}
        </div>
      </section>
      {children}
    </ResumeContext.Provider>
  );
}

/** Une archive de la file, et où en est son envoi. */
function UploadRow({
  item,
  text,
  locale,
  reportBase,
  controllable,
  onPause,
  onResume,
  onCancel,
  onRemove,
}: {
  item: QueueItem;
  text: UploaderText;
  locale: Locale;
  reportBase: string;
  controllable: boolean;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onRemove: () => void;
}) {
  const { phase } = item;
  const size = formatBytes(item.file.size, locale);
  const progress =
    "sent" in phase && "total" in phase && phase.total > 0
      ? phase.sent / phase.total
      : phase.kind === "received"
        ? 1
        : 0;
  const percent = Math.floor(progress * 100);
  const settled =
    item.refusal !== null ||
    ["received", "failed", "cancelled"].includes(phase.kind);

  return (
    <li className="flex flex-col gap-2 px-3 py-3 text-xs">
      <div className="flex items-center gap-3">
        <RowIcon item={item} />
        <span className="min-w-0 flex-1 truncate font-medium">
          {item.file.name}
        </span>
        <span className="shrink-0 text-tertiary tabular-nums">{size}</span>
      </div>

      {!settled && (
        <div
          className="h-1.5 overflow-hidden rounded-full bg-surface-sunken"
          role="progressbar"
          aria-label={item.file.name}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-300",
              phase.kind === "offline" ? "bg-progress" : "bg-accent",
            )}
            style={{ width: `${Math.max(progress * 100, 1)}%` }}
          />
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <PhaseText item={item} text={text} locale={locale} />
        <div className="flex flex-wrap items-center gap-2">
          {phase.kind === "sending" && controllable && (
            <Button variant="secondary" size="sm" onClick={onPause}>
              <Pause />
              {text.pause}
            </Button>
          )}
          {phase.kind === "paused" && controllable && (
            <Button variant="secondary" size="sm" onClick={onResume}>
              <Play />
              {text.resume}
            </Button>
          )}
          {!settled && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X />
              {text.cancel}
            </Button>
          )}
          {phase.kind === "received" &&
            !phase.depositId.startsWith("demo-") && (
              <Button variant="secondary" size="sm" asChild>
                <Link
                  href={`${reportBase}/${encodeURIComponent(phase.depositId)}`}
                >
                  {text.report}
                </Link>
              </Button>
            )}
          {settled && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              aria-label={`${text.remove} : ${item.file.name}`}
            >
              <X />
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}

/** Ce que dit la ligne : progression, débit, temps restant, ou issue. */
function PhaseText({
  item,
  text,
  locale,
}: {
  item: QueueItem;
  text: UploaderText;
  locale: Locale;
}) {
  const { phase } = item;
  if (item.refusal) {
    return (
      <span className="text-urgent" role="alert">
        {item.refusal === "too_large"
          ? text.refused.too_large(formatBytes(item.file.size, locale))
          : text.refused[item.refusal]}
      </span>
    );
  }
  switch (phase.kind) {
    case "queued":
    case "starting":
      return (
        <span className="text-tertiary">
          {item.resumeOf
            ? text.resuming(
                Math.floor(
                  (item.resumeOf.receivedBytes / item.file.size) * 100,
                ),
              )
            : text.checking}
        </span>
      );
    case "sending": {
      const percent = Math.floor((phase.sent / Math.max(phase.total, 1)) * 100);
      const remaining =
        phase.remainingSeconds === null
          ? null
          : phase.remainingSeconds < 60
            ? text.underAMinute
            : formatDuration(phase.remainingSeconds / 60, locale);
      return (
        <span className="flex flex-wrap items-center gap-x-2 tabular-nums text-secondary">
          <span className="font-medium text-primary">
            {text.percent(percent)}
          </span>
          <span>
            {text.of(
              formatBytes(phase.sent, locale),
              formatBytes(phase.total, locale),
            )}
          </span>
          <span>
            {phase.bytesPerSecond === null
              ? text.measuring
              : text.rate(formatBytes(phase.bytesPerSecond, locale))}
          </span>
          {remaining && <span>{text.remaining(remaining)}</span>}
        </span>
      );
    }
    case "offline":
      return <span className="text-progress">{text.offline}</span>;
    case "paused":
      return (
        <span className="text-tertiary">
          {text.paused} ·{" "}
          {text.of(
            formatBytes(phase.sent, locale),
            formatBytes(phase.total, locale),
          )}
        </span>
      );
    case "received":
      return <span className="text-done">{text.received}</span>;
    case "failed":
      return (
        <span className="text-urgent" role="alert">
          {phase.message}
        </span>
      );
    case "cancelled":
      return <span className="text-tertiary">{text.cancelled}</span>;
  }
}

/** Icône d'une ligne. */
function RowIcon({ item }: { item: QueueItem }) {
  if (item.refusal || item.phase.kind === "failed") {
    return <XCircle className="size-4 shrink-0 text-urgent" aria-hidden />;
  }
  switch (item.phase.kind) {
    case "received":
      return <CheckCircle2 className="size-4 shrink-0 text-done" aria-hidden />;
    case "cancelled":
      return (
        <CircleSlash className="size-4 shrink-0 text-tertiary" aria-hidden />
      );
    case "offline":
      return <WifiOff className="size-4 shrink-0 text-progress" aria-hidden />;
    case "paused":
      return <Pause className="size-4 shrink-0 text-tertiary" aria-hidden />;
    default:
      return (
        <Loader2
          className="size-4 shrink-0 animate-spin text-accent"
          aria-hidden
        />
      );
  }
}
