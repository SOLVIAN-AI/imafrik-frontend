"use client";

import { CheckCircle2, FileUp, Loader2, X } from "lucide-react";
import * as React from "react";

import { DicomSettingsCard } from "@/components/domain/dicom-settings";
import { PageHeader, Panel } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/demo/session";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Un fichier en cours d'envoi, avec sa progression. */
interface UploadItem {
  id: string;
  name: string;
  size: number;
  progress: number;
}

/**
 * Envoi d'un examen.
 *
 * **Deux voies, et la seconde n'est pas un repli.** Le PACS de
 * l'établissement pousse ses examens automatiquement — c'est le mode
 * normal, celui qui ne demande aucun geste. Mais toutes les cliniques
 * n'ont pas un PACS capable d'émettre vers l'extérieur, et certaines
 * travaillent encore avec des CD gravés par la console d'acquisition :
 * sans dépôt manuel, une partie du marché visé ne peut pas utiliser le
 * service du tout.
 *
 * L'envoi manuel vient donc en premier à l'écran — c'est l'action — et
 * les paramètres automatiques en second, là où on les cherche une fois
 * pour la mise en service.
 */
export default function SendStudyPage() {
  const { active } = useSession();
  const [uploads, setUploads] = React.useState<UploadItem[]>([]);
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const addFiles = React.useCallback((files: FileList | null) => {
    if (!files) return;
    setUploads((current) => [
      ...current,
      ...Array.from(files).map((file, index) => ({
        // Nom et taille ne suffisent pas à distinguer deux coupes
        // identiques d'une même série : l'index les sépare.
        id: `${file.name}-${file.size}-${current.length + index}`,
        name: file.name,
        size: file.size,
        progress: 0,
      })),
    ]);
  }, []);

  // Progression simulée, à remplacer par l'envoi réel vers l'API. Elle
  // n'est pas décorative : sans retour visible, un dépôt de deux mille
  // coupes donne l'impression que rien ne se passe.
  React.useEffect(() => {
    if (uploads.every((upload) => upload.progress >= 100)) return;
    const timer = setInterval(() => {
      setUploads((current) =>
        current.map((upload) => ({
          ...upload,
          progress: Math.min(
            100,
            upload.progress + 8 + Math.round(upload.size % 7),
          ),
        })),
      );
    }, 220);
    return () => clearInterval(timer);
  }, [uploads]);

  const done = uploads.filter((upload) => upload.progress >= 100).length;

  return (
    <>
      <PageHeader
        title="Envoyer un examen"
        description={`${active.organizationName} · les images sont chiffrées pendant le transfert`}
      />

      <div className="grid min-h-0 flex-1 gap-4 overflow-auto px-6 pb-6 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Panel className="flex flex-col overflow-hidden">
            <h2 className="label-eyebrow flex h-11 shrink-0 items-center border-b border-border-subtle px-4">
              Dépôt manuel
            </h2>

            <div className="p-4">
              {/* Zone de dépôt. Le `label` enveloppe l'`input` : cliquer
                  n'importe où dans la zone ouvre le sélecteur, sans
                  script et sans perdre l'accessibilité au clavier. */}
              <label
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  addFiles(event.dataTransfer.files);
                }}
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center gap-2",
                  "rounded-xl border border-dashed px-6 py-12 text-center",
                  "transition-colors duration-100",
                  dragging
                    ? "border-accent bg-accent-muted"
                    : "border-border-default hover:border-border-strong hover:bg-surface-hover/50",
                )}
              >
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  accept=".dcm,application/dicom"
                  className="sr-only"
                  onChange={(event) => addFiles(event.target.files)}
                />
                <FileUp className="size-6 text-tertiary" aria-hidden />
                <p className="text-sm font-medium">
                  Déposez les fichiers DICOM ici
                </p>
                <p className="max-w-sm text-xs text-tertiary">
                  Fichiers .dcm ou dossier complet gravé depuis la console
                  d’acquisition. Les images sont regroupées automatiquement par
                  examen à l’arrivée.
                </p>
              </label>

              {uploads.length > 0 && (
                <>
                  <div className="mt-4 mb-2 flex items-center justify-between">
                    <p className="text-xs text-secondary">
                      {done} / {uploads.length} fichiers transférés
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUploads([])}
                    >
                      Vider la liste
                    </Button>
                  </div>
                  <ul className="max-h-64 divide-y divide-border-subtle overflow-auto rounded-lg border border-border-subtle">
                    {uploads.map((upload) => (
                      <UploadRow
                        key={upload.id}
                        upload={upload}
                        onRemove={() =>
                          setUploads((current) =>
                            current.filter((item) => item.id !== upload.id),
                          )
                        }
                      />
                    ))}
                  </ul>
                </>
              )}
            </div>
          </Panel>
        </div>

        <div className="flex flex-col gap-4">
          <Panel className="flex flex-col overflow-hidden">
            <h2 className="label-eyebrow flex h-11 shrink-0 items-center border-b border-border-subtle px-4">
              Envoi automatique
            </h2>
            <p className="px-4 pt-3 text-xs leading-relaxed text-secondary">
              Ces quatre valeurs se recopient dans la configuration du PACS de
              l’établissement. Une fois enregistrées, chaque examen validé sur
              la console part vers la plateforme sans autre geste.
            </p>
            <div className="mt-2">
              <DicomSettingsCard
                settings={{
                  calledAet: "IMAFRIK",
                  callingAet: "STJOSEPH_LOME",
                  host: "dicom.imafrik.com",
                  port: 11112,
                }}
              />
            </div>
            <p className="border-t border-border-subtle px-4 py-3 text-2xs text-tertiary">
              L’AET de l’établissement identifie vos envois : ne le communiquez
              pas en dehors de votre service technique.
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}

/** Une ligne de la file d'envoi. */
function UploadRow({
  upload,
  onRemove,
}: {
  upload: UploadItem;
  onRemove: () => void;
}) {
  const done = upload.progress >= 100;

  return (
    <li className="flex items-center gap-3 px-3 py-2">
      {done ? (
        <CheckCircle2 className="size-3.5 shrink-0 text-done" aria-hidden />
      ) : (
        <Loader2
          className="size-3.5 shrink-0 animate-spin text-tertiary"
          aria-hidden
        />
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs">{upload.name}</p>
        {/* La barre reste visible une fois pleine : elle sert alors de
            confirmation, et la liste ne change pas de hauteur. */}
        <div className="mt-1 h-0.5 w-full overflow-hidden rounded-full bg-surface-active">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-200",
              done ? "bg-done" : "bg-accent",
            )}
            style={{ width: `${upload.progress}%` }}
          />
        </div>
      </div>

      <span className="shrink-0 text-2xs text-tertiary tabular-nums">
        {formatBytes(upload.size)}
      </span>

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Retirer ${upload.name}`}
        className="shrink-0 text-tertiary transition-colors hover:text-urgent"
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </li>
  );
}
