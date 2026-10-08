"use client";

import { Clock, IdCard, Settings } from "lucide-react";
import Link from "next/link";

import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { useMessages } from "@/i18n/client";
import { credentialBlock } from "@/lib/credentials";
import { cn } from "@/lib/utils";

/**
 * Bandeau du radiologue dont le numéro d'ordre n'est pas encore validé.
 *
 * Sans validation, la base lui masque tous les examens : sa file et ses
 * examens sont vides. Un écran vide sans explication passerait pour une
 * panne, ou pour une file à jour ; ce bandeau dit ce qui se passe et ce
 * qu'il reste à faire, sur un ton posé : ce n'est pas une erreur, c'est
 * une étape.
 *
 * Deux cas : le numéro manque (lien vers les paramètres), ou il attend la
 * vérification de l'équipe IMAFRIK (rien à faire). Rien n'est affiché
 * pour un radiologue validé ni pour les autres rôles.
 *
 * @param className Marges, selon l'écran qui l'accueille.
 */
export function CredentialsBanner({ className }: { className?: string }) {
  const session = useSession();
  const t = useMessages().worklist.credentials;
  const block = credentialBlock(session);
  if (!block) return null;

  const text = t[block];
  const Icon = block === "missing" ? IdCard : Clock;

  return (
    <section
      role="status"
      aria-labelledby="credentials-banner-title"
      data-credentials={block}
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-progress/30 bg-progress-muted px-4 py-3.5 sm:flex-row sm:items-start",
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0 text-progress" aria-hidden />
      <div className="min-w-0 flex-1">
        <h2
          id="credentials-banner-title"
          className="text-sm font-semibold text-primary"
        >
          {text.title}
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-secondary">
          {text.detail}
        </p>
        <p className="mt-1 text-2xs leading-relaxed text-tertiary">{t.why}</p>
      </div>
      {block === "missing" && (
        <Button
          asChild
          size="sm"
          variant="secondary"
          className="shrink-0 self-start"
        >
          <Link href="/parametres">
            <Settings aria-hidden />
            {t.missing.action}
          </Link>
        </Button>
      )}
    </section>
  );
}
