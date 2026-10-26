import { ApiError, apiFetch } from "@/lib/api/client";
import { isDemoMode } from "@/lib/demo/mode";

/** Nom du fichier servi : celui que le service annonce, s'il est sain. */
const FILE_NAME = /^[A-Za-z0-9._-]{1,100}$/;

/** Empreinte annoncée par le service. */
const SHA256 = /^[0-9a-f]{64}$/;

/**
 * Kit d'installation des passerelles, relayé depuis le service.
 *
 * Même raison que le PDF d'un exercice : le jeton qui autorise le
 * téléchargement vit dans un cookie `httpOnly`, le navigateur ne peut pas
 * appeler le service lui-même. Le fichier est relayé en flux, sans être
 * gardé en mémoire ni en cache. Le proxy a déjà vérifié que la route est
 * ouverte au rôle ; le service revérifie le rôle et trace le
 * téléchargement au journal d'audit (`gateway.kit_downloaded`).
 *
 * L'empreinte SHA-256 calculée par le serveur accompagne le fichier
 * (`X-Content-SHA256`) : c'est elle que la tour de contrôle affiche à
 * côté du bouton.
 *
 * En démonstration, aucun kit n'existe : 404, et le bouton le dit avant
 * même d'appeler cette route.
 */
export async function GET() {
  if (isDemoMode()) return new Response(null, { status: 404 });
  try {
    const upstream = await apiFetch("/admin/gateway-kit/download");
    const disposition = upstream.headers.get("Content-Disposition") ?? "";
    const announced = /filename="?([^";]+)"?/.exec(disposition)?.[1] ?? "";
    const fileName = FILE_NAME.test(announced)
      ? announced
      : "kit-passerelle.zip";
    const headers = new Headers({
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store, private",
    });
    const sha256 = upstream.headers.get("X-Content-SHA256") ?? "";
    if (SHA256.test(sha256)) headers.set("X-Content-SHA256", sha256);
    const length = upstream.headers.get("Content-Length");
    if (length && /^\d+$/.test(length)) headers.set("Content-Length", length);
    return new Response(upstream.body, { headers });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    return new Response(null, { status });
  }
}
