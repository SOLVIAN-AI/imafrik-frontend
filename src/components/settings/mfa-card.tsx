import { ShieldAlert, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { Panel } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { getMessages } from "@/i18n/server";
import { cn } from "@/lib/utils";

/**
 * Double authentification, dans les paramètres.
 *
 * Elle est exigée pour tous les rôles, personnel de clinique compris
 * (`MFA_ROLES`, imposée à l'émission du jeton). Deux situations :
 * - **active** — rien à faire ; changer de téléphone passe par l'équipe,
 *   qui vérifie l'identité par un autre canal (un voleur de mot de passe
 *   ne doit pas pouvoir remplacer le téléphone de sa victime) ;
 * - **inactive** — ne devrait pas arriver ici : la session aurait été
 *   arrêtée à l'écran de double authentification. Si la liste des
 *   facteurs le laisse croire malgré tout, la carte le dit et mène à
 *   l'enrôlement.
 *
 * @param enrolled Un facteur vérifié existe.
 */
export async function MfaCard({ enrolled }: { enrolled: boolean }) {
  const t = (await getMessages()).t.settings.mfa;
  const Icon = enrolled ? ShieldCheck : ShieldAlert;
  return (
    <Panel className="overflow-hidden">
      <div className="border-b border-border-subtle px-4 py-3">
        <h2 className="text-sm font-semibold">{t.title}</h2>
        <p className="mt-0.5 text-xs text-tertiary">{t.description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-4">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
            enrolled
              ? "bg-done-muted text-done ring-done/20"
              : "bg-progress-muted text-progress ring-progress/20",
          )}
        >
          <Icon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-[1_1_14rem] text-sm">
          <p className="font-medium">{enrolled ? t.active : t.required}</p>
          <p className="mt-0.5 text-xs text-tertiary">
            {enrolled ? t.activeDetail : t.inactiveDetail}
          </p>
        </div>
        {!enrolled && (
          <Button asChild variant="secondary" size="sm">
            <Link href="/double-authentification?activer=1&suite=/parametres">
              {t.enable}
            </Link>
          </Button>
        )}
      </div>
    </Panel>
  );
}
