"use server";

import { revalidatePath } from "next/cache";

import { getMessages } from "@/i18n/server";
import { apiSend } from "@/lib/api/client";
import {
  type ApiSigningAssetReview,
  type ApiSigningAssetUpload,
  type ApiSigningPinSet,
  signingAssetSchema,
} from "@/lib/api/contracts";
import {
  type ActionResult,
  demoUnavailable,
  rejectInvalidIds,
  run,
} from "@/lib/actions/result";
import {
  getSigningSetup,
  getUserSigningSetup,
  loadSigningImage,
  type SigningSetup,
} from "@/lib/data/signing";
import { isDemoMode } from "@/lib/demo/mode";
import {
  isPinFormat,
  newPinProblem,
  SIGNING_ASSET_KINDS,
  type SigningAssetKind,
  signingImageMaxBase64Length,
} from "@/lib/signing";

/**
 * Signature, cachet et code personnel : les gestes du radiologue sur ses
 * propres éléments, et ceux de l'équipe IMAFRIK qui les vérifie.
 *
 * **Le code personnel ne quitte jamais ces fonctions** que vers le
 * service : il n'est ni journalisé (`run` ne journalise que les erreurs
 * imprévues, jamais les arguments), ni renvoyé, ni gardé. Chaque
 * argument venu du navigateur est relu ici avant tout appel.
 */

/** Base64 standard, sans en-tête `data:`. */
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

/**
 * Dépose une nouvelle signature ou un nouveau cachet.
 *
 * L'image est relue par le service, puis attend la vérification de
 * l'équipe IMAFRIK ; d'ici là, l'image acceptée précédente reste celle
 * qui s'imprime. Le code personnel est exigé s'il est défini.
 *
 * @param kind        Signature ou cachet.
 * @param imageBase64 Fichier PNG ou JPEG, ou tracé exporté, en base64.
 * @param source      Tracé à l'écran, ou fichier importé.
 * @param pin         Code personnel, s'il est défini.
 */
export async function uploadSigningAsset(
  kind: SigningAssetKind,
  imageBase64: string,
  source: "drawn" | "uploaded",
  pin?: string,
): Promise<ActionResult> {
  const { t } = await getMessages();
  const text = t.settings.signing;
  if (
    !SIGNING_ASSET_KINDS.includes(kind) ||
    (source !== "drawn" && source !== "uploaded")
  ) {
    return { ok: false, error: t.common.errors.invalidRequest, status: 422 };
  }
  if (
    typeof imageBase64 !== "string" ||
    imageBase64.length > signingImageMaxBase64Length()
  ) {
    return { ok: false, error: text.errors.tooLarge, status: 422 };
  }
  if (!BASE64.test(imageBase64)) {
    return { ok: false, error: text.errors.unreadable, status: 422 };
  }
  if (pin !== undefined && (typeof pin !== "string" || !isPinFormat(pin))) {
    return { ok: false, error: text.pin.problems.format, status: 422 };
  }
  if (isDemoMode()) return await demoUnavailable(text.demoAction);
  const body: ApiSigningAssetUpload = {
    image_base64: imageBase64,
    source,
    ...(pin ? { pin } : {}),
  };
  const result = await run(async () => {
    await apiSend(
      `/me/signing/${encodeURIComponent(kind)}`,
      "PUT",
      body,
      signingAssetSchema,
    );
    return undefined;
  });
  revalidatePath("/parametres");
  return result;
}

/**
 * Définit le code personnel, ou le change en présentant l'actuel.
 *
 * @param input Nouveau code, sa seconde saisie, et l'actuel pour un
 *              changement.
 */
export async function setSigningPin(input: {
  pin: string;
  pinConfirmation: string;
  currentPin?: string;
}): Promise<ActionResult> {
  const { t } = await getMessages();
  const problems = t.settings.signing.pin.problems;
  const pin = typeof input?.pin === "string" ? input.pin : "";
  const confirmation =
    typeof input?.pinConfirmation === "string" ? input.pinConfirmation : "";
  const problem = newPinProblem(pin, confirmation);
  if (problem) return { ok: false, error: problems[problem], status: 422 };
  const current = input.currentPin;
  if (
    current !== undefined &&
    (typeof current !== "string" || !isPinFormat(current))
  ) {
    return { ok: false, error: problems.format, status: 422 };
  }
  if (isDemoMode()) {
    return await demoUnavailable(t.settings.signing.pin.demoAction);
  }
  const body: ApiSigningPinSet = {
    pin,
    pin_confirmation: confirmation,
    ...(current ? { current_pin: current } : {}),
  };
  const result = await run(async () => {
    await apiSend("/me/signing/pin", "PUT", body);
    return undefined;
  });
  revalidatePath("/parametres");
  return result;
}

/**
 * Relit l'état du code personnel du radiologue connecté.
 *
 * Sert après un échec de signature survenu une fois le code créé dans le
 * même geste (texte modifié ailleurs pendant la signature, par exemple) :
 * la fenêtre doit alors demander ce code, et non en créer un autre.
 */
export async function readMyPinState(): Promise<
  ActionResult<{ pinSet: boolean; lockedUntil: Date | null }>
> {
  return run(async () => {
    const setup = await getSigningSetup();
    return { pinSet: setup.pinSet, lockedUntil: setup.pinLockedUntil };
  });
}

/** Ce que l'équipe IMAFRIK voit des éléments de signature d'un compte. */
export interface UserSigningReview {
  setup: SigningSetup;
  /** URI `data:` des images acceptées et en attente, par identifiant. */
  images: Record<string, string>;
}

/**
 * Charge les éléments de signature d'un compte, pour les vérifier.
 *
 * Seules les images acceptées et en attente sont lues : c'est ce que
 * l'équipe compare. Chaque lecture est tracée par le service
 * (`signing.asset_viewed`) : elle n'a lieu qu'à l'ouverture de la fenêtre
 * de vérification, jamais au rendu de la liste des comptes.
 *
 * @param profileId Compte examiné.
 */
export async function loadUserSigning(
  profileId: string,
): Promise<ActionResult<UserSigningReview>> {
  if (!isDemoMode()) {
    const invalid = await rejectInvalidIds(profileId);
    if (invalid) return invalid;
  }
  return run(async () => {
    const setup = await getUserSigningSetup(profileId);
    const assets = [setup.signature, setup.stamp].flatMap((slot) =>
      [slot.accepted, slot.pending].filter((asset) => asset !== null),
    );
    const loaded = await Promise.all(
      assets.map(async (asset) => {
        const src = await loadSigningImage(
          `/admin/users/${encodeURIComponent(profileId)}/signing/assets/${encodeURIComponent(asset.id)}/image`,
          asset.id,
        );
        return src ? ([asset.id, src] as const) : null;
      }),
    );
    return {
      setup,
      images: Object.fromEntries(loaded.filter((entry) => entry !== null)),
    };
  });
}

/**
 * Accepte ou refuse une image déposée par un radiologue.
 *
 * Acceptée, elle s'imprime sur ses comptes-rendus suivants ; refusée, son
 * motif lui est rendu. Il est prévenu par courriel dans les deux cas.
 *
 * @param profileId Radiologue.
 * @param assetId   Image examinée.
 * @param decision  Décision.
 * @param reason    Motif, obligatoire pour un refus.
 */
export async function reviewSigningAsset(
  profileId: string,
  assetId: string,
  decision: "accept" | "reject",
  reason?: string,
): Promise<ActionResult> {
  const { t } = await getMessages();
  const text = t.admin.signing;
  const motive = typeof reason === "string" ? reason.trim() : "";
  if (decision !== "accept" && decision !== "reject") {
    return { ok: false, error: t.common.errors.invalidRequest, status: 422 };
  }
  if (decision === "reject" && !motive) {
    return { ok: false, error: text.reasonRequired, status: 422 };
  }
  if (motive.length > 500) {
    return { ok: false, error: text.reasonTooLong, status: 422 };
  }
  if (isDemoMode()) return await demoUnavailable(text.demoActions.review);
  const invalid = await rejectInvalidIds(profileId, assetId);
  if (invalid) return invalid;
  const body: ApiSigningAssetReview =
    decision === "reject" ? { decision, reason: motive } : { decision };
  const result = await run(async () => {
    await apiSend(
      `/admin/users/${encodeURIComponent(profileId)}/signing/assets/${encodeURIComponent(assetId)}/review`,
      "POST",
      body,
      signingAssetSchema,
    );
    return undefined;
  });
  revalidatePath("/admin/utilisateurs");
  revalidatePath("/admin");
  return result;
}

/**
 * Efface le code personnel d'un radiologue qui l'a oublié ou bloqué.
 *
 * Le radiologue en crée un nouveau lui-même, à sa prochaine signature ou
 * dans ses paramètres ; il est prévenu par courriel. L'équipe ne choisit
 * jamais le code de quelqu'un.
 *
 * @param profileId Radiologue.
 */
export async function resetUserSigningPin(
  profileId: string,
): Promise<ActionResult> {
  const { t } = await getMessages();
  if (isDemoMode())
    return await demoUnavailable(t.admin.signing.demoActions.reset);
  const invalid = await rejectInvalidIds(profileId);
  if (invalid) return invalid;
  const result = await run(async () => {
    await apiSend(
      `/admin/users/${encodeURIComponent(profileId)}/signing/pin-reset`,
      "POST",
    );
    return undefined;
  });
  revalidatePath("/admin/utilisateurs");
  return result;
}
