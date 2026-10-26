import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { VisualImage } from "@/components/marketing/visual-image";
import { Button } from "@/components/ui/button";
import { marketingCopy } from "@/content/marketing";
import { VISUALS } from "@/content/marketing/visuals";
import type { Locale } from "@/lib/i18n/locale";
import { localizePath } from "@/lib/i18n/routes";

/**
 * Appel à l'action de fin de page.
 *
 * Quelqu'un qui a lu jusqu'ici a déjà les arguments : il ne reste qu'à
 * lui éviter de remonter chercher le bouton. Le bloc referme la page là
 * où elle a commencé : fond sombre dans les deux thèmes, la coupe
 * sagittale de l'accroche, stylisée cette fois dans la palette, et la
 * même promesse.
 *
 * @param locale Langue de la page.
 */
export function FinalCta({ locale }: { locale: Locale }) {
  const t = marketingCopy(locale).finalCta;
  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
      <div
        data-reveal
        className="theme-dark relative isolate overflow-hidden rounded-3xl border border-border-default bg-surface-sunken px-6 py-16 text-primary sm:px-12 md:py-24 lg:px-16"
      >
        <div
          className="pointer-events-none absolute top-1/2 right-[-8rem] -z-10 hidden w-[30rem] -translate-y-1/2 opacity-45 [mask-image:radial-gradient(closest-side,black_50%,transparent)] md:block lg:right-[-2rem] lg:w-[36rem] lg:opacity-80"
          aria-hidden
        >
          <VisualImage
            visual={VISUALS.mrBrainSagittal}
            alt=""
            sizes="36rem"
            className="w-full"
          />
        </div>
        <div
          className="pointer-events-none absolute -top-40 -left-32 -z-10 size-[36rem] rounded-full"
          style={{
            background:
              "radial-gradient(closest-side, var(--glow-accent), transparent)",
          }}
          aria-hidden
        />
        <div
          className="dot-grid pointer-events-none absolute inset-0 -z-10"
          aria-hidden
        />

        <div className="max-w-xl">
          <h2 className="text-[2rem] leading-[1.08] font-semibold text-balance md:text-5xl md:leading-[1.04]">
            {t.title.before}
            <span className="text-brand-gradient">{t.title.highlight}</span>
            {t.title.after}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-pretty text-secondary md:text-lg md:leading-[1.7]">
            {t.text}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Button size="xl" asChild>
              <Link href={localizePath("/contact", locale)}>
                {t.primary}
                <ArrowRight />
              </Link>
            </Button>
            <Button variant="ghost" size="xl" asChild>
              <Link href="/connexion" prefetch={false}>
                {t.secondary}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
