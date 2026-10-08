import {
  ArrowRight,
  FileLock2,
  KeyRound,
  ScrollText,
  ServerCog,
} from "lucide-react";
import Link from "next/link";

import { Section } from "@/components/marketing/section";
import { marketingCopy } from "@/content/marketing";
import type { Locale } from "@/lib/i18n/locale";
import { localizePath } from "@/lib/i18n/routes";

/**
 * Les quatre garanties qu'un établissement vérifie avant de signer.
 *
 * Elles sont posées en page d'accueil, pas reléguées dans les mentions
 * légales : confier les examens de ses patients à un tiers est une
 * décision de responsabilité, et la question de la sécurité arrive dans
 * les cinq premières minutes de toute discussion.
 */
/** Icône de chaque garantie, dans l'ordre. */
const GUARANTEE_ICONS = [FileLock2, KeyRound, ScrollText, ServerCog] as const;

/**
 * Aperçu des garanties, renvoyant vers la page détaillée.
 *
 * @param locale Langue de la page.
 */
export function SecurityTeaser({ locale }: { locale: Locale }) {
  const t = marketingCopy(locale).securityTeaser;
  return (
    <Section eyebrow={t.eyebrow} title={t.title} lead={t.lead}>
      <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border-subtle bg-border-subtle sm:grid-cols-2">
        {t.guarantees.map((guarantee, index) => {
          const Icon = GUARANTEE_ICONS[index];
          return (
            <div
              key={guarantee.title}
              className="bg-surface-raised p-7 transition-colors duration-200 hover:bg-surface-hover"
            >
              <Icon className="size-5 text-accent" aria-hidden />
              <h3 className="mt-4 text-base font-semibold">
                {guarantee.title}
              </h3>
              <p className="prose-justify mt-2 text-sm leading-relaxed text-secondary">
                {guarantee.detail}
              </p>
            </div>
          );
        })}
      </div>

      <Link
        href={localizePath("/securite", locale)}
        className="mt-7 inline-flex items-center gap-1.5 py-1 text-sm text-accent transition-opacity hover:opacity-80"
      >
        {t.more}
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </Section>
  );
}
