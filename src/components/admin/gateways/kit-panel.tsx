"use client";

import { AlertTriangle, BadgeCheck, Download, PackageX } from "lucide-react";
import { toast } from "sonner";

import { CopyButton } from "@/components/admin/gateways/copy-button";
import { DateTime } from "@/components/domain/date-time";
import { Button } from "@/components/ui/button";
import { useLocale, useMessages } from "@/i18n/client";
import { formatBytes } from "@/lib/format";
import { groupFingerprint } from "@/lib/gateways";

/** Kit présent sur le serveur, tel que la page le transmet. */
export interface KitInfo {
  fileName: string;
  sizeBytes: number;
  sha256: string;
  version: string | null;
  /** Production du kit, ISO 8601. */
  builtAt: string;
  manifestMatches: boolean | null;
  signatureStatus: "signed" | "unsigned" | null;
  publisher: string | null;
  /** ISO 8601. */
  signatureExpiresAt: string | null;
  timestamped: boolean | null;
}

/**
 * Kit d'installation : le télécharger, et lire son empreinte.
 *
 * Le téléchargement passe par une route de l'application, qui le relaie
 * avec la session (voir `admin/passerelles/kit/route.ts`) ; le service le
 * trace au journal d'audit. L'empreinte SHA-256 est celle que le serveur
 * a calculée sur le fichier même qu'il sert : l'installateur la compare
 * avant d'ouvrir l'archive.
 *
 * @param kit  Kit présent, ou `null`.
 * @param demo Démonstration : aucun fichier derrière le bouton.
 */
export function KitPanel({
  kit,
  demo,
}: {
  kit: KitInfo | null;
  demo: boolean;
}) {
  const t = useMessages();
  const locale = useLocale();
  const text = t.gateways.kit;

  if (!kit) {
    return (
      <div className="flex gap-3 text-xs">
        <PackageX
          className="mt-0.5 size-4 shrink-0 text-tertiary"
          aria-hidden
        />
        <div className="min-w-0">
          <p className="font-medium">{text.none}</p>
          <p className="mt-0.5 leading-relaxed text-tertiary">
            {text.noneDetail}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs sm:grid-cols-3">
        <div>
          <dt className="text-2xs text-tertiary">{text.version}</dt>
          <dd className="font-medium">{kit.version ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-2xs text-tertiary">{text.builtAt}</dt>
          <dd>
            <DateTime date={new Date(kit.builtAt)} />
          </dd>
        </div>
        <div>
          <dt className="text-2xs text-tertiary">{text.size}</dt>
          <dd className="tabular-nums">{formatBytes(kit.sizeBytes, locale)}</dd>
        </div>
      </dl>

      <Signature kit={kit} />

      <div className="flex flex-col gap-1.5">
        <p className="text-2xs text-tertiary">{text.sha256}</p>
        <p
          className="rounded-md border border-border-subtle bg-surface-sunken px-3 py-2 font-mono text-2xs leading-relaxed break-all select-all"
          data-testid="kit-sha256"
        >
          {groupFingerprint(kit.sha256)}
        </p>
        <p className="text-2xs leading-relaxed text-tertiary">
          {text.sha256Hint}
        </p>
      </div>

      <div className="flex flex-wrap items-start gap-2">
        {demo ? (
          <Button
            type="button"
            size="sm"
            onClick={() =>
              toast.info(
                t.common.errors.demoUnavailable(t.gateways.demoActions.kit),
              )
            }
          >
            <Download aria-hidden />
            {text.download}
          </Button>
        ) : (
          <Button asChild size="sm">
            {/* Lien ordinaire : le navigateur gère le téléchargement, sa
                progression et sa reprise. */}
            <a href="/admin/passerelles/kit" download={kit.fileName}>
              <Download aria-hidden />
              {text.download}
            </a>
          </Button>
        )}
        <CopyButton
          value={kit.sha256}
          label={t.gateways.detail.copyFingerprint}
          copied={t.gateways.detail.fingerprintCopied}
          failed={t.gateways.code.copyFailed}
          variant="ghost"
        />
      </div>
    </div>
  );
}

/**
 * Signature du kit, telle que son manifeste l'annonce, et l'accord de ce
 * manifeste avec le fichier servi.
 *
 * Un kit non signé, ou dont l'archive ne correspond plus au manifeste
 * (archive remplacée seule, dépôt incomplet), se signale en ambre : rien
 * ne prouverait au poste l'origine du kit, ou l'installateur comparerait
 * une empreinte qui n'est plus la bonne.
 */
function Signature({ kit }: { kit: KitInfo }) {
  const text = useMessages().gateways.kit;
  const warnings = [
    kit.signatureStatus === "unsigned" ? text.unsigned : null,
    kit.signatureStatus === null ? text.signatureUnknown : null,
    kit.manifestMatches === false ? text.manifestMismatch : null,
  ].filter((warning): warning is string => warning !== null);

  return (
    <div className="flex flex-col gap-2 text-xs">
      {kit.signatureStatus === "signed" && (
        <p className="flex gap-2 text-done">
          <BadgeCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span className="min-w-0">
            <span className="font-medium">{text.signed}</span>
            {kit.publisher && (
              <span className="block text-2xs break-words text-secondary">
                {text.publisherIs(kit.publisher)}
              </span>
            )}
            {kit.signatureExpiresAt && (
              <span className="block text-2xs text-secondary">
                {text.certificateUntil}{" "}
                <DateTime
                  date={new Date(kit.signatureExpiresAt)}
                  withTime={false}
                />
                {kit.timestamped ? ` · ${text.timestamped}` : ""}
              </span>
            )}
          </span>
        </p>
      )}
      {warnings.map((warning) => (
        <p
          key={warning}
          role="note"
          className="flex gap-2 rounded-lg bg-progress-muted px-3 py-2 leading-relaxed text-progress"
        >
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {warning}
        </p>
      ))}
    </div>
  );
}
