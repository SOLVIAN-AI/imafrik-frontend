import {
  ArrowRight,
  Database,
  EarthLock,
  KeyRound,
  LockKeyhole,
  ScrollText,
  Signature,
} from "lucide-react";
import Link from "next/link";

import { SectionHeading } from "@/components/marketing/section";
import { VisualImage } from "@/components/marketing/visual-image";
import { marketingCopy } from "@/content/marketing";
import { VISUALS } from "@/content/marketing/visuals";
import type { Locale } from "@/lib/i18n/locale";
import { localizePath } from "@/lib/i18n/routes";

/** Icône de chaque garantie, dans l'ordre des textes. */
const GUARANTEE_ICONS = [
  LockKeyhole,
  KeyRound,
  Signature,
  ScrollText,
  Database,
  EarthLock,
] as const;

/**
 * Les garanties qu'un établissement vérifie avant de signer.
 *
 * Elles sont posées en page d'accueil, pas reléguées dans les mentions
 * légales : confier les examens de ses patients à un tiers est une
 * décision de responsabilité, et la question de la sécurité arrive dans
 * les cinq premières minutes de toute discussion.
 *
 * **Des mécanismes, pas des adjectifs.** Chaque garantie nomme ce que fait
 * le service (DICOM TLS mutuel, code personnel de signature, isolation
 * par la base) : c'est ce qu'un directeur technique ou un responsable de
 * la protection des données peut vérifier, et ce qu'un « sécurisé »
 * générique ne dit pas.
 *
 * Bande sombre dans les deux thèmes (`theme-dark`) : en thème clair, elle
 * rompt la suite des sections blanches à l'endroit où le propos devient
 * le plus grave. En fond, une coupe coronale très atténuée, symétrique et
 * calme.
 *
 * @param locale Langue de la page.
 */
export function SecurityTeaser({ locale }: { locale: Locale }) {
  const t = marketingCopy(locale).securityTeaser;
  return (
    <section className="theme-dark relative isolate overflow-hidden bg-surface-sunken text-primary">
      <div
        className="pointer-events-none absolute top-1/2 right-[-12rem] -z-10 hidden w-[44rem] -translate-y-1/2 opacity-[0.16] [mask-image:radial-gradient(closest-side,black_40%,transparent)] lg:block"
        aria-hidden
      >
        <VisualImage
          visual={VISUALS.mrBrainCoronal}
          alt=""
          sizes="44rem"
          className="w-full"
        />
      </div>
      <div
        className="dot-grid pointer-events-none absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,black,transparent_70%)]"
        aria-hidden
      />

      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-24 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading eyebrow={t.eyebrow} title={t.title} lead={t.lead} />
          <Link
            href={localizePath("/securite", locale)}
            className="group inline-flex shrink-0 items-center gap-1.5 self-start py-1 text-sm font-medium text-accent transition-colors hover:text-accent-hover lg:self-end"
          >
            {t.more}
            <ArrowRight
              className="size-4 transition-transform duration-200 ease-(--ease-out-quart) group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </div>

        <ul className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border-default bg-border-subtle sm:grid-cols-2 lg:grid-cols-3">
          {t.guarantees.map((guarantee, index) => {
            const Icon = GUARANTEE_ICONS[index];
            return (
              <li
                key={guarantee.title}
                data-reveal
                style={{ "--reveal-order": index % 3 } as React.CSSProperties}
                className="group bg-surface-base/95 p-7 transition-colors duration-300 hover:bg-surface-raised sm:p-8"
              >
                <span
                  className="flex size-10 items-center justify-center rounded-xl bg-accent-muted ring-1 ring-accent/25 transition-transform duration-300 ease-(--ease-out-quart) ring-inset group-hover:scale-105"
                  aria-hidden
                >
                  <Icon className="size-[1.125rem] text-accent" />
                </span>
                <h3 className="mt-5 text-lg font-semibold">
                  {guarantee.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-pretty text-secondary">
                  {guarantee.detail}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
