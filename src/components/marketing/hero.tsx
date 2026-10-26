import { ArrowRight, FileCheck2, QrCode } from "lucide-react";
import Link from "next/link";

import { CineViewer } from "@/components/marketing/cine-viewer";
import { Button } from "@/components/ui/button";
import { marketingCopy } from "@/content/marketing";
import type { Locale } from "@/lib/i18n/locale";
import { localizePath } from "@/lib/i18n/routes";
import { cn } from "@/lib/utils";

/**
 * Accroche de la page d'accueil.
 *
 * **Le texte dit ce que le service change, l'image montre le métier.** Un
 * directeur d'établissement ne cherche pas « une plateforme de
 * téléradiologie », il cherche à ne plus attendre trois jours un
 * compte-rendu de scanner : le titre le lui promet. À côté, le
 * visualiseur fait défiler de vraies coupes d'IRM, celles d'un examen
 * réel publié sous licence libre ; deux cartes posées dessus racontent le
 * reste du parcours, l'examen urgent qui attend dans la file et le
 * compte-rendu signé qui en sort. En une seconde, le visiteur a vu le
 * métier, le produit et la promesse, sans une image inventée.
 *
 * Le second paragraphe répond à l'objection technique, qui arrive
 * toujours en deuxième : *que faut-il changer chez nous ?* Rien, un
 * logiciel s'installe sur un poste.
 *
 * **Les délais sont présentés comme des engagements, jamais comme des
 * mesures.** Aucun examen n'a encore été lu : afficher « délai moyen
 * constaté » serait invérifiable. Ce sont des délais contractuels, et
 * l'étiquette le dit.
 *
 * Disposition : texte à gauche, visualiseur à droite à partir de 1024 px.
 * En dessous, le visualiseur suit immédiatement les boutons, avant les
 * engagements de délai : sur un téléphone, la coupe affleure dès le
 * premier écran. Les cartes y sont retirées : elles couvriraient l'image
 * sur un écran étroit.
 *
 * @param locale Langue de la page.
 */
export function Hero({ locale }: { locale: Locale }) {
  const copy = marketingCopy(locale);
  const t = copy.hero;
  const v = copy.heroViewer;
  return (
    <section className="relative isolate overflow-hidden">
      {/* Lumière venue de derrière le visualiseur, et profondeur marine en
          haut à gauche : deux sources décalées plutôt qu'un dégradé
          centré, dont la symétrie trahirait le gabarit. Un dégradé radial
          vers la transparence est déjà fondu : un filtre de flou par-dessus
          ne changerait rien à l'œil, et coûterait cher à peindre sur un
          téléphone. */}
      <div
        className="pointer-events-none absolute top-[-12rem] right-[-10rem] -z-10 size-[56rem] rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, var(--glow-accent), transparent)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-[-20rem] left-[-16rem] -z-10 size-[48rem] rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, var(--glow-brand), transparent)",
        }}
        aria-hidden
      />
      <div
        className="dot-grid pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_70%_60%_at_70%_30%,black,transparent)]"
        aria-hidden
      />

      <div className="mx-auto grid max-w-7xl gap-12 px-4 pt-10 pb-20 sm:px-6 md:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,34rem)] lg:grid-rows-[auto_auto] lg:gap-x-12 lg:gap-y-12 lg:px-8 lg:pt-20 lg:pb-28 xl:grid-cols-[minmax(0,1fr)_minmax(0,37rem)] xl:gap-x-20">
        <div className="max-w-2xl lg:col-start-1 lg:row-start-1 lg:self-end">
          <p className="inline-flex items-center gap-2.5 rounded-full border border-accent/25 bg-accent-muted py-1 pr-3.5 pl-2.5 text-2xs font-medium tracking-wide text-accent uppercase">
            {/* Trois coupes, celle du milieu lue : le motif du logotype. */}
            <span className="flex flex-col gap-[2px]" aria-hidden>
              <span className="h-[2px] w-2.5 rounded-full bg-current opacity-50" />
              <span className="h-[2px] w-3.5 rounded-full bg-current" />
              <span className="h-[2px] w-2 rounded-full bg-current opacity-50" />
            </span>
            {t.badge}
          </p>

          <h1 className="mt-7 text-[2.5rem] leading-[1.04] font-semibold tracking-[-0.04em] sm:text-5xl sm:leading-[1.02] lg:text-[3.5rem] xl:text-[4rem]">
            {t.title.before}
            <span className="text-brand-gradient">{t.title.highlight}</span>
            {t.title.after}
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-pretty text-secondary sm:text-lg sm:leading-[1.7]">
            {t.lead}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Button size="xl" asChild>
              <Link href={localizePath("/contact", locale)}>
                {t.primaryCta}
                <ArrowRight />
              </Link>
            </Button>
            <Button variant="secondary" size="xl" asChild>
              <Link href={localizePath("/securite", locale)}>
                {t.secondaryCta}
              </Link>
            </Button>
          </div>
        </div>

        <figure className="relative w-full max-w-xl lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:max-w-none lg:self-center">
          <CineViewer
            labels={{
              label: v.label,
              toolbar: v.toolbar,
              modality: v.modality,
              sequence: v.sequence,
              plane: v.plane,
              slice: v.slice,
              thickness: v.thickness,
              realSlice: v.realSlice,
              anterior: v.anterior,
              posterior: v.posterior,
              play: v.play,
              pause: v.pause,
            }}
          />

          {/* Le parcours, en deux cartes : l'examen qui attend, le
              compte-rendu qui en sort. Illustration ; la figure est
              décrite par le texte de remplacement de l'image. */}
          <div
            className="parallax-near absolute bottom-[16%] -left-10 hidden w-[18.5rem] rounded-xl border border-border-default bg-surface-overlay/90 p-3.5 shadow-overlay backdrop-blur-md lg:block xl:-left-16"
            aria-hidden
          >
            <p className="label-eyebrow">{v.worklist.title}</p>
            <ul className="mt-2.5 flex flex-col gap-1.5">
              {v.worklist.rows.map((row) => (
                <li
                  key={row.exam}
                  className={cn(
                    "flex items-center gap-2 rounded-md bg-surface-base px-2.5 py-2",
                    row.urgent && "rail-urgent",
                  )}
                >
                  <span className="min-w-0 flex-1 truncate text-xs font-medium">
                    {row.exam}
                  </span>
                  {row.urgent && (
                    <span className="rounded-full bg-urgent-muted px-1.5 py-px text-[0.625rem] font-semibold tracking-wide text-urgent uppercase">
                      {v.worklist.urgent}
                    </span>
                  )}
                  <span className="text-2xs text-tertiary tabular-nums">
                    {row.deadline}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div
            className="parallax-far absolute top-[17%] -right-6 hidden w-60 rounded-xl border border-border-default bg-surface-overlay/90 p-3.5 shadow-overlay backdrop-blur-md lg:block xl:-right-10"
            aria-hidden
          >
            <div className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-done-muted text-done">
                <FileCheck2 className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{v.signed.title}</p>
                <p className="mt-0.5 text-2xs leading-4 text-secondary">
                  {v.signed.detail}
                </p>
              </div>
            </div>
            <p className="mt-3 flex items-center gap-1.5 border-t border-border-subtle pt-2.5 text-2xs text-accent">
              <QrCode className="size-3.5" />
              {v.signed.verify}
            </p>
          </div>

          <figcaption className="mt-4 text-2xs leading-4 text-tertiary">
            {v.credit}{" "}
            <Link
              href={localizePath("/credits", locale)}
              className="underline decoration-border-strong underline-offset-2 transition-colors hover:text-accent"
            >
              {v.creditLink}
            </Link>
          </figcaption>
        </figure>

        <div className="w-full max-w-2xl border-t border-border-subtle pt-7 lg:col-start-1 lg:row-start-2 lg:self-start">
          <p className="label-eyebrow">{t.commitmentsTitle}</p>
          <dl className="mt-4 grid grid-cols-3 gap-4 sm:gap-6">
            {t.commitments.map((commitment, index) => (
              <div
                key={commitment.label}
                className={cn(
                  "flex flex-col gap-1",
                  index > 0 && "border-l border-border-subtle pl-4 sm:pl-6",
                )}
              >
                <dt className="text-2xl font-semibold tracking-[-0.03em] tabular-nums sm:text-[1.75rem]">
                  {commitment.value}
                </dt>
                <dd className="text-xs leading-snug text-tertiary">
                  {commitment.label}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-2xs text-tertiary">{t.commitmentsNote}</p>
        </div>
      </div>
    </section>
  );
}
