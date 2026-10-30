"use client";

import { Lightbulb } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { useMessages } from "@/i18n/client";
import { helpScreenFor } from "@/lib/help";
import { ideasHref, proposesIdeas } from "@/lib/ideas";

/**
 * Raccourci « Proposer une idée pour cet écran », dans la barre du haut.
 *
 * Présent sur chaque écran des radiologues et des responsables de
 * clinique : une idée vient souvent au moment où l’on bute sur quelque
 * chose. Il ouvre « Vos idées » avec le nom de l’écran courant, une clé de
 * l’aide (`?ecran=worklist`), jamais l’adresse et ses paramètres, qui
 * peuvent porter un identifiant ou une recherche.
 */
export function IdeaShortcut() {
  const t = useMessages();
  const pathname = usePathname();
  const { active } = useSession();
  if (!proposesIdeas(active.role)) return null;
  const screen = helpScreenFor(active.role, pathname);
  const label = t.ideas.shortcut;
  return (
    <Button asChild variant="ghost" size="icon">
      <Link
        href={ideasHref(screen?.key)}
        aria-label={label}
        title={label}
        data-tour="ideas"
      >
        <Lightbulb />
      </Link>
    </Button>
  );
}
