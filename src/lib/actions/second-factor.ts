import "server-only";

import { headers } from "next/headers";

import { getMessages } from "@/i18n/server";
import {
  attemptSucceeded,
  beginAttempt,
  retryMinutes,
} from "@/lib/security/auth-throttle";
import { normalizeOtp } from "@/lib/session/mfa";
import { createClient } from "@/lib/supabase/server";

/**
 * Preuve d'une authentification récente, pour les gestes les plus
 * sensibles de la tour de contrôle (connexion Tailscale, politique
 * d'accès).
 *
 * Le service exige qu'un second facteur ait été présenté depuis moins de
 * dix minutes (claim `amr` du jeton). Plutôt que de renvoyer
 * l'administrateur vers l'écran de double authentification, le formulaire
 * du geste demande le code de son application : il est vérifié ici, ce
 * qui pose un nouveau jeton portant l'instant de la vérification, et le
 * geste part aussitôt avec ce jeton. Une session volée ne suffit donc
 * pas : il faut aussi le téléphone.
 *
 * Mêmes garde-fous que la double authentification de la connexion :
 * essais ralentis puis suspendus, par compte et par visiteur.
 *
 * @param input Code saisi.
 * @returns `null` si le code est juste (la session est rafraîchie), ou le
 *          refus à rendre à l'écran.
 */
export async function confirmSecondFactor(
  input: string,
): Promise<{ ok: false; error: string; status: number } | null> {
  const { t } = await getMessages();
  const code = normalizeOtp(input);
  if (!code) {
    return { ok: false, error: t.gateways.tailscale.otpInvalid, status: 422 };
  }
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;
  if (!userId) {
    return { ok: false, error: t.common.errors.sessionExpired, status: 401 };
  }
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const factorId = factors?.totp.find(
    (factor) => factor.status === "verified",
  )?.id;
  if (!factorId) {
    return {
      ok: false,
      error: t.session.mfa.errors.unknownFactor,
      status: 422,
    };
  }
  const attempt = await beginAttempt(supabase, "totp", userId, await headers());
  if (!attempt.allowed) {
    return {
      ok: false,
      error: t.session.mfa.errors.locked(
        retryMinutes(attempt.retryAfterSeconds),
      ),
      status: 429,
    };
  }
  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code,
  });
  if (error) {
    return {
      ok: false,
      error:
        error.status === 429
          ? t.session.mfa.errors.tooManyAttempts
          : t.session.mfa.errors.wrongCode,
      status: 401,
    };
  }
  await attemptSucceeded(supabase, attempt.keys);
  return null;
}
