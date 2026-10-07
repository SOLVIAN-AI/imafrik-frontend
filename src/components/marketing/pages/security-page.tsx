import {
  Building2,
  FileLock2,
  History,
  KeyRound,
  RefreshCcw,
  ScrollText,
  ShieldAlert,
  Users,
} from "lucide-react";

import { marketingCopy } from "@/content/marketing";
import type { Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

/**
 * Icône de chaque chapitre, dans l'ordre des textes.
 *
 * L'ordre n'est pas thématique mais chronologique : on suit la donnée.
 * Elle arrive, elle est rangée, elle est consultée, elle est conservée,
 * puis rendue ou supprimée. Un directeur d'établissement vérifie dans cet
 * ordre parce que c'est celui de sa responsabilité.
 */
const CHAPTER_ICONS = [
  FileLock2,
  KeyRound,
  Users,
  ScrollText,
  Building2,
  History,
  RefreshCcw,
  ShieldAlert,
] as const;

/**
 * Page « sécurité et conformité », dans une langue.
 *
 * **Elle s'adresse à un décideur, pas à un ingénieur.** Chaque garantie
 * est formulée par ce qu'elle empêche, pas par la technologie qui la
 * met en œuvre : « une erreur dans le code ne suffit pas à ouvrir le
 * cloisonnement » dit quelque chose ; « politiques RLS PostgreSQL » ne
 * dit rien à qui signe le contrat. Aucune garantie n’y est absolue : la
 * page promet ce que le service tient, pas davantage.
 *
 * @param locale Langue de la page.
 */
export function SecurityPage({ locale }: { locale: Locale }) {
  const t = marketingCopy(locale).securityPage;
  return (
    <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
      {/* En-tête centré : la grille de garanties qui suit est
          symétrique, et un titre calé à gauche au-dessus d'elle
          déséquilibre la page. Les paragraphes, eux, restent justifiés —
          c'est de la lecture suivie. */}
      <div className="mx-auto max-w-2xl text-center">
        <p className="label-eyebrow text-accent">{t.eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold md:text-4xl">{t.title}</h1>
        <p className="prose-justify mt-5 text-base leading-relaxed text-secondary">
          {t.lead}
        </p>
      </div>

      <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border-subtle bg-border-subtle sm:grid-cols-2">
        {t.chapters.map((chapter, index) => {
          const Icon = CHAPTER_ICONS[index];
          return (
            <section key={chapter.title} className="bg-surface-raised p-7">
              <Icon className="size-5 text-accent" aria-hidden />
              <h2 className="mt-4 text-base font-semibold">{chapter.title}</h2>
              <p className="prose-justify mt-2 text-sm leading-relaxed text-secondary">
                {chapter.detail}
              </p>
            </section>
          );
        })}
      </div>

      <section className="mt-14 rounded-2xl border border-border-subtle bg-surface-raised p-8">
        <h2 className="text-lg font-semibold">{t.obligationsTitle}</h2>
        {t.obligations.map((paragraph, index) => (
          <p
            key={paragraph}
            className={cn(
              "prose-justify text-sm leading-relaxed text-secondary",
              index === 0 ? "mt-3" : "mt-4",
            )}
          >
            {paragraph}
          </p>
        ))}
      </section>
    </div>
  );
}
