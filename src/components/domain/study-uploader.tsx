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
import { type UploadGrant, getUploadGrant } from "@/lib/actions/uploads";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Fichiers envoyés en parallèle : assez pour remplir le lien, pas assez pour l'engorger. */
const CONCURRENCY = 3;

/** Marge avant l'expiration du jeton au-delà de laquelle on en redemande un. */
const TOKEN_MARGIN_MS = 60_000;

type ItemState =
  | { kind: "waiting" }
  | { kind: "sending"; progress: number }
  | { kind: "stored" }
  | { kind: "duplicate" }
  | { kind: "ignored" }
  | { kind: "failed"; reason: string };

interface UploadItem {
  id: string;
  file: File;
  state: ItemState;
}

/**
 * Envoie un fichier à l'API, avec sa progression.
 *
 * `XMLHttpRequest` plutôt que `fetch` : seul il expose la progression de
 * l'envoi, et sans retour visible un dépôt de deux mille coupes donne
 * l'impression que rien ne se passe.
 */
function sendFile(
  grant: UploadGrant,
  file: File,
  onProgress: (fraction: number) => void,
): Promise<ItemState> {
  return new Promise((resolve) => {
    const request = new XMLHttpRequest();
    const body = new FormData();
    body.append("file", file, file.name);

    request.open("POST", grant.endpoint);
    request.setRequestHeader("X-Upload-Token", grant.token);
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
        reason: detail || `Refusé (${request.status})`,
      });
    };
    request.onerror = () =>
      resolve({ kind: "failed", reason: "Connexion interrompue" });
    request.send(body);
  });
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
          update(item.id, { kind: "failed", reason: "Dépôt indisponible" });
          continue;
        }
        update(item.id, { kind: "sending", progress: 0 });
        const outcome = await sendFile(active, item.file, (progress) =>
          update(item.id, { kind: "sending", progress }),
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
        <p className="text-sm font-medium">
          Déposez ici les fichiers de l’examen
        </p>
        <p className="max-w-sm text-xs text-tertiary">
          Ou choisissez le dossier entier d’un CD : le sommaire et les fichiers
          qui ne sont pas des images sont écartés automatiquement.
        </p>
        <div className="mt-1 flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={running}
            onClick={() => filesInput.current?.click()}
          >
            <FileUp />
            Choisir des fichiers
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={running}
            onClick={() => folderInput.current?.click()}
          >
            <FolderUp />
            Choisir un dossier
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
            {done.length} / {items.length} fichier{items.length > 1 ? "s" : ""}{" "}
            traité
            {done.length > 1 ? "s" : ""}
            {failed.length > 0 &&
              ` · ${failed.length} refusé${failed.length > 1 ? "s" : ""}`}
            {!running &&
              done.length > 0 &&
              " · l’examen apparaîtra dans le suivi d’ici une minute"}
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
                  {formatBytes(item.file.size)}
                </span>
                <span className="w-44 shrink-0 truncate text-right text-tertiary">
                  {describe(item.state)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Libellé de l'état d'un fichier. */
function describe(state: ItemState): string {
  switch (state.kind) {
    case "waiting":
      return "En attente";
    case "sending":
      return `Envoi… ${Math.round(state.progress * 100)} %`;
    case "stored":
      return "Envoyé";
    case "duplicate":
      return "Déjà reçu";
    case "ignored":
      return "Sommaire du CD, écarté";
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
