"use client";

import {
  CheckCircle2,
  CircleSlash,
  FileUp,
  FolderUp,
  Loader2,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { useLocale, useMessages } from "@/i18n/client";
import type { AppMessages } from "@/i18n";
import { type UploadGrant, getUploadGrant } from "@/lib/actions/uploads";
import { formatBytes } from "@/lib/format";
import { type ItemState, sendFile } from "@/lib/upload";
import { cn } from "@/lib/utils";

/** Fichiers envoyés en parallèle : assez pour remplir le lien, pas assez pour l'engorger. */
const CONCURRENCY = 3;

/** Marge avant l'expiration du jeton au-delà de laquelle on en redemande un. */
const TOKEN_MARGIN_MS = 60_000;

/** Textes du dépôt, dans la langue de l'utilisateur. */
type UploaderMessages = AppMessages["clinic"]["uploader"];

interface UploadItem {
  id: string;
  file: File;
  state: ItemState;
}

/**
 * Dépôt d'examens depuis le navigateur.
 *
 * Pour une clinique sans passerelle, ou un examen gravé sur CD : on
 * choisit des fichiers ou le dossier entier du CD, et ils partent vers
 * IMAFRIK. Le service les trie lui-même — le sommaire du CD est ignoré,
 * un fichier qui n'est pas une image est refusé — et chaque fichier dit
 * ce qu'il est devenu.
 *
 * L'examen apparaît dans le suivi une minute après le dernier fichier :
 * c'est le délai au-delà duquel le PACS considère l'étude complète.
 */
export function StudyUploader() {
  const router = useRouter();
  const t = useMessages().clinic.uploader;
  const locale = useLocale();
  const [items, setItems] = React.useState<UploadItem[]>([]);
  const [dragging, setDragging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [running, setRunning] = React.useState(false);
  const grant = React.useRef<{ value: UploadGrant; expiresAt: number } | null>(
    null,
  );
  const filesInput = React.useRef<HTMLInputElement>(null);
  const folderInput = React.useRef<HTMLInputElement>(null);

  const update = (id: string, state: ItemState) =>
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, state } : item)),
    );

  /** Jeton valide, redemandé s'il approche de son expiration. */
  const currentGrant = async (): Promise<UploadGrant | null> => {
    if (
      grant.current &&
      grant.current.expiresAt - Date.now() > TOKEN_MARGIN_MS
    ) {
      return grant.current.value;
    }
    const result = await getUploadGrant();
    if (!result.ok) {
      setError(result.error);
      return null;
    }
    grant.current = {
      value: result.data,
      expiresAt: Date.now() + result.data.expiresIn * 1000,
    };
    return result.data;
  };

  const start = async (queue: UploadItem[]) => {
    setError(null);
    setRunning(true);
    let next = 0;
    const worker = async () => {
      while (next < queue.length) {
        const item = queue[next++];
        const active = await currentGrant();
        if (!active) {
          update(item.id, { kind: "failed", reason: t.unavailable });
          continue;
        }
        update(item.id, { kind: "sending", progress: 0 });
        const outcome = await sendFile(
          active,
          item.file,
          (progress) => update(item.id, { kind: "sending", progress }),
          t,
          locale,
        );
        update(item.id, outcome);
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    setRunning(false);
    router.refresh();
  };

  const add = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const queued = Array.from(files).map((file, index) => ({
      // Nom et taille ne suffisent pas à distinguer deux coupes d'une même
      // série : l'horodatage et l'index les séparent.
      id: `${Date.now()}-${index}-${file.name}`,
      file,
      state: { kind: "waiting" } as ItemState,
    }));
    setItems((current) => [...current, ...queued]);
    void start(queued);
  };

  const done = items.filter((item) =>
    ["stored", "duplicate", "ignored"].includes(item.state.kind),
  );
  const failed = items.filter((item) => item.state.kind === "failed");

  return (
    <div className="flex flex-col gap-4 p-4">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          add(event.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center transition-colors",
          dragging ? "border-accent bg-accent-muted" : "border-border-default",
        )}
      >
        <FileUp className="size-6 text-tertiary" aria-hidden />
        <p className="text-sm font-medium">{t.dropTitle}</p>
        <p className="max-w-sm text-xs text-tertiary">{t.dropDetail}</p>
        <div className="mt-1 flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={running}
            onClick={() => filesInput.current?.click()}
          >
            <FileUp />
            {t.chooseFiles}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={running}
            onClick={() => folderInput.current?.click()}
          >
            <FolderUp />
            {t.chooseFolder}
          </Button>
        </div>
        <input
          ref={filesInput}
          type="file"
          multiple
          className="sr-only"
          onChange={(event) => {
            add(event.target.files);
            event.target.value = "";
          }}
        />
        <input
          ref={folderInput}
          type="file"
          multiple
          className="sr-only"
          // Attribut non standard, reconnu par tous les navigateurs courants.
          {...{ webkitdirectory: "" }}
          onChange={(event) => {
            add(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {error && (
        <p role="alert" className="text-xs text-urgent">
          {error}
        </p>
      )}

      {items.length > 0 && (
        <div>
          <p className="mb-2 text-xs text-secondary" aria-live="polite">
            {t.progress(done.length, items.length)}
            {failed.length > 0 && t.rejected(failed.length)}
            {!running && done.length > 0 && t.finished}
          </p>
          <ul className="max-h-80 divide-y divide-border-subtle overflow-auto rounded-lg border border-border-subtle">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 px-3 py-2 text-xs"
              >
                <ItemIcon state={item.state} />
                <span className="min-w-0 flex-1 truncate font-mono">
                  {item.file.name}
                </span>
                <span className="shrink-0 text-tertiary tabular-nums">
                  {formatBytes(item.file.size, locale)}
                </span>
                <span className="w-44 shrink-0 truncate text-right text-tertiary">
                  {describe(item.state, t)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Libellé de l'état d'un fichier.
 *
 * @param state    État du fichier.
 * @param messages Textes du dépôt, dans la langue de l'utilisateur.
 */
function describe(state: ItemState, messages: UploaderMessages): string {
  switch (state.kind) {
    case "waiting":
      return messages.waiting;
    case "sending":
      return messages.sending(Math.round(state.progress * 100));
    case "stored":
      return messages.stored;
    case "duplicate":
      return messages.duplicate;
    case "ignored":
      return messages.ignored;
    case "failed":
      return state.reason;
  }
}

/** Icône de l'état d'un fichier. */
function ItemIcon({ state }: { state: ItemState }) {
  if (state.kind === "sending" || state.kind === "waiting") {
    return (
      <Loader2
        className="size-3.5 shrink-0 animate-spin text-tertiary"
        aria-hidden
      />
    );
  }
  if (state.kind === "failed")
    return <XCircle className="size-3.5 shrink-0 text-urgent" aria-hidden />;
  if (state.kind === "ignored")
    return (
      <CircleSlash className="size-3.5 shrink-0 text-tertiary" aria-hidden />
    );
  return <CheckCircle2 className="size-3.5 shrink-0 text-done" aria-hidden />;
}
