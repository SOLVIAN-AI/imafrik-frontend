import { ShieldAlert, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { Panel } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Double authentification, dans les paramètres.
 *
 * Trois situations :
 * - **active** — rien à faire ; changer de téléphone passe par l'équipe,
 *   qui vérifie l'identité par un autre canal (un voleur de mot de passe
 *   ne doit pas pouvoir remplacer le téléphone de sa victime) ;
 * - **facultative et inactive** — personnel de clinique : on la propose,
 *   on explique pourquoi ;
 * - **exigée et inactive** — n'arrive pas ici : la session aurait été
 *   arrêtée à l'écran de double authentification.
 *
 * @param enrolled Un facteur vérifié existe.
 * @param required Le rôle actif l'exige.
 */
export function MfaCard({
  enrolled,
  required,
}: {
  enrolled: boolean;
  required: boolean;
}) {
  const Icon = enrolled ? ShieldCheck : ShieldAlert;
  return (
    <Panel className="overflow-hidden">
      <div className="border-b border-border-subtle px-4 py-3">
        <h2 className="text-sm font-semibold">Double authentification</h2>
        <p className="mt-0.5 text-xs text-tertiary">
          Un code à usage unique, en plus du mot de passe, à chaque connexion.
        </p>
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
          <p className="font-medium">
            {enrolled
              ? "Active"
              : required
                ? "Exigée pour votre rôle"
                : "Recommandée, non activée"}
          </p>
          <p className="mt-0.5 text-xs text-tertiary">
            {enrolled
              ? "Téléphone perdu ou changé : contactez l’équipe IMAFRIK, qui réinitialise l’accès après vérification de votre identité."
              : "Un mot de passe volé ne suffit plus à ouvrir votre compte. Une fois activée, elle vous est demandée à chaque connexion."}
          </p>
        </div>
        {!enrolled && (
          <Button asChild variant="secondary" size="sm">
            <Link href="/double-authentification?activer=1&suite=/parametres">
              Activer
            </Link>
          </Button>
        )}
      </div>
    </Panel>
  );
}
