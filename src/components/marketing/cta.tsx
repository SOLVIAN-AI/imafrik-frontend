import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { marketingCopy } from "@/content/marketing";
import type { Locale } from "@/lib/i18n/locale";
import { localizePath } from "@/lib/i18n/routes";

/**
 * Appel à l'action de fin de page.
 *
 * Quelqu'un qui a lu jusqu'ici a déjà les arguments : il ne reste qu'à
 * lui éviter de remonter chercher le bouton. Le bloc reprend donc le
 * traitement de l'accroche — halos, fond profond — pour refermer la page
 * là où elle a commencé.
 *
 * @param locale Langue de la page.
 */
export function FinalCta({ locale }: { locale: Locale }) {
  const t = marketingCopy(locale).finalCta;
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <div className="relative overflow-hidden rounded-2xl border border-border-default bg-surface-sunken px-8 py-14 text-center md:px-16 md:py-20">
        <div
          className="pointer-events-none absolute -top-32 left-1/2 size-[36rem] -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, var(--glow-accent), transparent)",
          }}
          aria-hidden
        />
        <div
          className="dot-grid pointer-events-none absolute inset-0"
          aria-hidden
        />

        <div className="relative mx-auto max-w-2xl">
          <h2 className="text-3xl font-semibold md:text-4xl">
            {t.title.before}
            <span className="text-brand-gradient">{t.title.highlight}</span>
            {t.title.after}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-secondary">
            {t.text}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href={localizePath("/contact", locale)}>
                {t.primary}
                <ArrowRight />
              </Link>
            </Button>
            <Button variant="ghost" size="lg" asChild>
              <Link href="/connexion">{t.secondary}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
