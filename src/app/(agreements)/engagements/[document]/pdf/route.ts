import type { NextRequest } from "next/server";

import { agreementKindFromSlug } from "@/lib/agreements";
import { ApiError, apiFetch } from "@/lib/api/client";
import { isDemoMode } from "@/lib/demo/mode";

/**
 * PDF d'un engagement, relayé depuis le service.
 *
 * Avant acceptation, le service rend le texte en vigueur ; après, la
 * version acceptée suivie de son certificat d'acceptation (signataire,
 * date et heure, empreinte du texte). Il le rend à la demande, sans le
 * conserver, et le jeton qui l'autorise vit dans un cookie `httpOnly` :
 * cette route le relaie donc avec la session de l'utilisateur, sans
 * cache. Le service vérifie que l'engagement est bien dû par l'appelant.
 *
 * Un segment inconnu, ou la démonstration, répond 404.
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext<"/engagements/[document]/pdf">,
) {
  const { document } = await context.params;
  const kind = agreementKindFromSlug(document);
  if (!kind || isDemoMode()) return new Response(null, { status: 404 });

  try {
    const upstream = await apiFetch(
      `/me/agreements/${encodeURIComponent(kind)}/pdf`,
    );
    return new Response(upstream.body, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="imafrik-${document}.pdf"`,
        "Cache-Control": "no-store, private",
      },
    });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    return new Response(null, { status });
  }
}
