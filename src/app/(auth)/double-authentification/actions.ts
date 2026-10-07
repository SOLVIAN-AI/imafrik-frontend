"use server";

import { redirect } from "next/navigation";

import type { ActionResult } from "@/lib/actions/result";
import { isDemoMode } from "@/lib/demo/mode";
import { homeFor } from "@/lib/navigation";
import { safeRedirect } from "@/lib/security/redirect";
import { normalizeOtp } from "@/lib/session/mfa";
import { getAuthState } from "@/lib/session/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Enrôlement et vérification du second facteur.
 *
 * **Côté serveur, comme la connexion.** Le jeton de session vit dans un
 * cookie `httpOnly` : c'est le serveur qui parle à Supabase, et c'est lui
 * qui pose le nouveau jeton — de niveau `aal2` — une fois le code vérifié.
 *
 * Le facteur est une application d'authentification (TOTP) : Google
 * Authenticator, Microsoft Authenticator, 2FAS… Pas de SMS : le réseau
 * mobile se détourne trop facilement, et la couverture n'est pas
 * garantie dans une salle de lecture.
 */

/** Ce qu'il faut afficher pour enrôler une application. */
export interface Enrollment {
  factorId: string;
  /** QR code, en image SVG encodée (`data:`). */
  qrCode: string;
  /** Clé à saisir à la main si l'on ne peut pas scanner. */
  secret: string;
}

/**
 * Démarre l'enrôlement d'une application d'authentification.
 *
 * Les tentatives inachevées sont d'abord supprimées : un QR code affiché
 * puis abandonné laisse un facteur « non vérifié », et Supabase refuse
 * d'en créer un second du même nom.
 *
 * **Refusé si un facteur vérifié existe déjà.** Sans cette règle, qui a
 * volé un mot de passe pourrait enrôler son propre téléphone à côté de
 * celui de la victime. Changer de téléphone passe par l'administration,
 * qui vérifie l'identité par un autre canal.
 */
export async function startEnrollment(): Promise<ActionResult<Enrollment>> {
  if (isDemoMode()) {
    return {
      ok: false,
      error:
        "La double authentification n’est pas disponible en démonstration.",
      status: 503,
    };
  }
  const state = await getAuthState();
  if (state === "anonymous") {
    return { ok: false, error: "Session expirée.", status: 401 };
  }

  const supabase = await createClient();
  const { data: factors, error: listError } =
    await supabase.auth.mfa.listFactors();
  if (listError) {
    return {
      ok: false,
      error: "Le service d’authentification ne répond pas. Réessayez.",
      status: 503,
    };
  }
  if (factors.totp.some((factor) => factor.status === "verified")) {
    return {
      ok: false,
      error:
        "Une application est déjà associée à ce compte. Pour changer de téléphone, contactez l’équipe IMAFRIK.",
      status: 409,
    };
  }
  for (const factor of factors.all) {
    if (factor.factor_type === "totp" && factor.status !== "verified") {
      await supabase.auth.mfa.unenroll({ factorId: factor.id });
    }
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    issuer: "IMAFRIK",
    friendlyName: "Application d’authentification",
  });
  if (error || !data) {
    return {
      ok: false,
      error: "L’enrôlement n’a pas pu démarrer. Réessayez.",
      status: 503,
    };
  }
  return {
    ok: true,
    data: {
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
    },
  };
}

/**
 * Vérifie un code et, s'il est juste, élève la session au niveau `aal2`
 * puis ouvre le portail — ou la page demandée avant la connexion.
 *
 * Le message d'échec ne distingue pas un code faux d'un code expiré :
 * dans les deux cas, le geste est le même — saisir le code affiché
 * maintenant. Supabase limite le nombre d'essais.
 *
 * @param factorId Facteur à vérifier — celui qu'on vient d'enrôler, ou
 *                 le facteur existant.
 * @param input    Code saisi.
 * @param suite    Destination demandée, validée par `safeRedirect`.
 */
export async function verifyCode(
  factorId: string,
  input: string,
  suite: string,
): Promise<ActionResult> {
  const code = normalizeOtp(input);
  if (!code) {
    return {
      ok: false,
      error: "Le code compte six chiffres.",
      status: 422,
    };
  }
  if (isDemoMode() || !factorId) {
    return { ok: false, error: "Facteur inconnu.", status: 422 };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code,
  });
  if (error) {
    return {
      ok: false,
      error:
        error.status === 429
          ? "Trop d’essais. Patientez une minute avant de recommencer."
          : "Code incorrect ou expiré. Saisissez le code affiché maintenant.",
      status: error.status ?? 401,
    };
  }

  // Le nouveau jeton (aal2) est posé ; l'état est relu avec lui.
  const state = await getAuthState();
  if (state === "anonymous") redirect("/connexion");
  if (state === "no-membership") redirect("/en-attente");
  if (state === "mfa-required") {
    return {
      ok: false,
      error: "La vérification n’a pas été prise en compte. Réessayez.",
      status: 409,
    };
  }
  redirect(safeRedirect(suite) ?? homeFor(state.active.role));
}
