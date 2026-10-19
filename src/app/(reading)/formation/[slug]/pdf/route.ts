import type { NextRequest } from "next/server";

import { ApiError, apiFetch } from "@/lib/api/client";
import { getTrainingCase } from "@/lib/data/training";
import { isDemoMode } from "@/lib/demo/mode";

/** Nom court d'un cas : celui du catalogue, rien d'autre. */
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * PDF spécimen d'un exercice signé, relayé depuis le service.
 *
 * Le service le rend à la demande et ne le conserve nulle part : il n'y a
 * pas de lien pré-signé à donner, et le jeton qui l'autorise vit dans un
 * cookie `httpOnly`. Cette route le relaie donc, avec la session de
 * l'utilisateur, sans le garder en mémoire ni en cache. Le proxy a déjà
 * vérifié que la route est ouverte au rôle ; le service vérifie que
 * l'exercice est bien celui de l'appelant.
 *
 * Un exercice absent, pas encore signé ou servi en démonstration répond
 * 404 : la page qui y mène n'affiche le lien qu'une fois l'exercice signé.
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext<"/formation/[slug]/pdf">,
) {
  const { slug } = await context.params;
  if (!SLUG.test(slug) || isDemoMode()) {
    return new Response(null, { status: 404 });
  }
  const detail = await getTrainingCase(slug);
  const attempt = detail?.attempt;
  if (!attempt?.submittedAt) return new Response(null, { status: 404 });

  try {
    const upstream = await apiFetch(
      `/training/attempts/${encodeURIComponent(attempt.id)}/pdf`,
    );
    return new Response(upstream.body, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="exercice-${slug}.pdf"`,
        "Cache-Control": "no-store, private",
      },
    });
  } catch (error) {
    // 429 : un rendu est déjà en cours pour cet utilisateur.
    const status = error instanceof ApiError ? error.status : 502;
    return new Response(null, { status });
  }
}
