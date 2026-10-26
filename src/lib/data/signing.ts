import "server-only";

import { apiGet } from "@/lib/api/client";
import {
  type ApiSigningAsset,
  type ApiSigningSetup,
  signingAssetImageSchema,
  signingSetupSchema,
} from "@/lib/api/contracts";
import { isDemoMode } from "@/lib/demo/mode";
import { demoSigningImage, demoSigningSetup } from "@/lib/demo/signing";
import { isPinLocked, type SigningAssetKind } from "@/lib/signing";

/**
 * Une image de signature ou de cachet, sans son contenu.
 *
 * Le contenu ne voyage qu'à la demande : pour l'aperçu de son titulaire,
 * ou pour l'équipe IMAFRIK, dont chaque consultation est tracée.
 */
export interface SigningAsset {
  id: string;
  kind: SigningAssetKind;
  source: "drawn" | "uploaded" | "legacy";
  version: number;
  state: "pending_review" | "accepted" | "rejected";
  /** Motif d'un refus, écrit par l'équipe pour le radiologue. */
  rejectionReason: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
}

/** Les images d'une nature : celle qui s'imprime, celle qui attend, la refusée. */
export interface SigningSlot {
  /** Image acceptée : celle qui s'imprime. */
  accepted: SigningAsset | null;
  /** Image déposée, en attente de l'équipe IMAFRIK. */
  pending: SigningAsset | null;
  /** Dernière image déposée, refusée (motif), sans dépôt depuis. */
  rejected: SigningAsset | null;
}

/** Où en est un radiologue : ses deux images et son code personnel. */
export interface SigningSetup {
  signature: SigningSlot;
  stamp: SigningSlot;
  /** Code personnel défini : sinon, la signature propose de le créer. */
  pinSet: boolean;
  /** Fin du verrou posé après cinq erreurs, s'il court encore. */
  pinLockedUntil: Date | null;
}

/** Image et son contenu, prêts pour un `<img>`. */
export interface SigningImage {
  asset: SigningAsset;
  /** URI `data:` de l'image. */
  src: string;
}

/** Convertit une image telle que le service la décrit. */
function toAsset(row: ApiSigningAsset | null | undefined): SigningAsset | null {
  if (!row) return null;
  return {
    id: row.id,
    kind: row.kind,
    source: row.source,
    version: row.version,
    state: row.review_state,
    rejectionReason: row.rejection_reason ?? null,
    createdAt: new Date(row.created_at),
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : null,
  };
}

/** Convertit l'état renvoyé par le service. */
function toSetup(row: ApiSigningSetup): SigningSetup {
  const lockedUntil = row.pin_locked_until
    ? new Date(row.pin_locked_until)
    : null;
  return {
    signature: {
      accepted: toAsset(row.signature),
      pending: toAsset(row.signature_pending),
      rejected: toAsset(row.signature_rejected),
    },
    stamp: {
      accepted: toAsset(row.stamp),
      pending: toAsset(row.stamp_pending),
      rejected: toAsset(row.stamp_rejected),
    },
    pinSet: row.pin_set,
    pinLockedUntil: isPinLocked(lockedUntil) ? lockedUntil : null,
  };
}

/** Signature, cachet et code du radiologue connecté. */
export async function getSigningSetup(): Promise<SigningSetup> {
  if (isDemoMode()) return toSetup(demoSigningSetup());
  return toSetup(await apiGet("/me/signing", signingSetupSchema));
}

/**
 * Même lecture, sans faire échouer l'écran qui l'appelle.
 *
 * L'écran de lecture et les addenda s'ouvrent même si le service ne la
 * donne pas : la fenêtre de signature demande alors le code comme s'il
 * était défini, et le service dit, au besoin, qu'il faut le créer.
 */
export async function getSigningSetupOrNull(): Promise<SigningSetup | null> {
  try {
    return await getSigningSetup();
  } catch {
    return null;
  }
}

/**
 * Signature, cachet et code d'un compte, pour l'équipe IMAFRIK.
 *
 * @param profileId Compte examiné.
 */
export async function getUserSigningSetup(
  profileId: string,
): Promise<SigningSetup> {
  if (isDemoMode()) return toSetup(demoSigningSetup(profileId));
  return toSetup(
    await apiGet(
      `/admin/users/${encodeURIComponent(profileId)}/signing`,
      signingSetupSchema,
    ),
  );
}

/**
 * Contenu d'une image, en URI `data:`.
 *
 * @param path Route du service qui la renvoie.
 * @param demoId Identifiant de l'image, en démonstration.
 */
export async function loadSigningImage(
  path: string,
  demoId: string,
): Promise<string | null> {
  if (isDemoMode()) {
    const png = demoSigningImage(demoId);
    return png ? `data:image/png;base64,${png}` : null;
  }
  const image = await apiGet(path, signingAssetImageSchema, {
    notFoundAsNull: true,
  });
  return image ? `data:${image.media_type};base64,${image.image_base64}` : null;
}

/**
 * Aperçus du radiologue connecté : ses images acceptées et en attente.
 *
 * Lus côté serveur, au rendu des paramètres : l'aperçu est son propre
 * bien, sans trace à laisser. Une image illisible n'empêche pas les
 * autres de s'afficher.
 *
 * @param setup État lu par {@link getSigningSetup}.
 * @returns Les URI `data:` par identifiant d'image.
 */
export async function getMySigningPreviews(
  setup: SigningSetup,
): Promise<Record<string, string>> {
  const assets = [setup.signature, setup.stamp].flatMap((slot) =>
    [slot.accepted, slot.pending, slot.rejected].filter(
      (asset): asset is SigningAsset => asset !== null,
    ),
  );
  const entries = await Promise.all(
    assets.map(async (asset) => {
      const src = await loadSigningImage(
        `/me/signing/assets/${encodeURIComponent(asset.id)}/image`,
        asset.id,
      ).catch(() => null);
      return src ? ([asset.id, src] as const) : null;
    }),
  );
  return Object.fromEntries(
    entries.filter((entry): entry is readonly [string, string] => !!entry),
  );
}

/** Ce que la fenêtre de signature d'un vrai compte-rendu doit savoir. */
export interface SigningContext {
  /** État du code ; `null` si le service ne l'a pas donné. */
  status: { pinSet: boolean; lockedUntil: Date | null } | null;
  /** Images acceptées qui s'imprimeront ; `null` si inconnues. */
  applied: { signature?: string; stamp?: string } | null;
}

/**
 * Code personnel et images apposées, pour la fenêtre de signature ou
 * d'addendum du radiologue connecté.
 *
 * Ne fait jamais échouer l'écran : sans réponse du service, la fenêtre
 * demande le code comme s'il était défini, et le service dit au besoin
 * qu'il faut le créer.
 */
export async function getSigningContext(): Promise<SigningContext> {
  const setup = await getSigningSetupOrNull();
  if (!setup) return { status: null, applied: null };
  const accepted = {
    signature: setup.signature.accepted,
    stamp: setup.stamp.accepted,
  };
  const previews = await getMySigningPreviews({
    ...setup,
    signature: { accepted: accepted.signature, pending: null, rejected: null },
    stamp: { accepted: accepted.stamp, pending: null, rejected: null },
  }).catch(() => null);
  return {
    status: { pinSet: setup.pinSet, lockedUntil: setup.pinLockedUntil },
    applied: previews
      ? {
          ...(accepted.signature && previews[accepted.signature.id]
            ? { signature: previews[accepted.signature.id] }
            : {}),
          ...(accepted.stamp && previews[accepted.stamp.id]
            ? { stamp: previews[accepted.stamp.id] }
            : {}),
        }
      : null,
  };
}
