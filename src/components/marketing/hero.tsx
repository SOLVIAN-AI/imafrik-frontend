import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

import { AppPreview } from "@/components/marketing/app-preview";
import { Button } from "@/components/ui/button";

/**
 * Engagements de service affichés sous l'accroche.
 *
 * Ce sont des **engagements**, pas des statistiques mesurées : les
 * formuler comme des chiffres constatés serait invérifiable avant le
 * premier mois d'exploitation. Ils devront être confirmés — ou revus —
 * avant la mise en ligne, et deviendront alors des indicateurs réels
 * tirés de la plateforme.
 */
const COMMITMENTS = [
  { value: "< 2 h", label: "Compte-rendu de routine" },
  { value: "< 20 min", label: "Urgences" },
  { value: "24/7", label: "Nuits, week-ends, jours fériés" },
] as const;

/**
 * Accroche de la page d'accueil.
 *
 * Elle dit ce que le service change, pas ce qu'il est : un directeur
 * d'établissement ne cherche pas « une plateforme de téléradiologie », il
 * cherche à ne plus attendre trois jours un compte-rendu de scanner.
 *
 * L'aperçu de l'interface vient immédiatement après, avant tout argument
 * détaillé : le produit se juge d'abord à ce qu'il donne à voir.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Trois sources lumineuses décalées. Un dégradé centré produirait
          une symétrie qui trahit le gabarit ; décalées, elles donnent
          l'impression d'une lumière venue de hors cadre. */}
      <div
        className="pointer-events-none absolute -top-64 -left-40 size-[42rem] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, var(--glow-accent), transparent)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -top-40 right-0 size-[36rem] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, var(--glow-brand), transparent)",
        }}
        aria-hidden
      />
      <div
        className="dot-grid pointer-events-none absolute inset-0 opacity-60"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-16 md:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent-muted px-3 py-1 text-2xs font-medium tracking-wide text-accent uppercase">
            <Sparkles className="size-3" aria-hidden />
            Téléradiologie pour l’Afrique de l’Ouest
          </span>

          <h1 className="mt-7 text-4xl font-semibold md:text-5xl lg:text-[3.5rem] lg:leading-[1.05]">
            Vos examens lus{" "}
            <span className="text-brand-gradient">le jour même</span>, par des
            radiologues inscrits à l’Ordre.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-secondary md:text-lg">
            Votre clinique envoie ses images depuis son PACS — ou depuis un
            simple navigateur. Un radiologue les lit à distance et signe le
            compte-rendu. Aucun investissement matériel, aucun logiciel à
            installer.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/contact">
                Demander une démonstration
                <ArrowRight />
              </Link>
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <Link href="/securite">Voir les garanties de sécurité</Link>
            </Button>
          </div>

          <dl className="mt-14 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {COMMITMENTS.map((commitment) => (
              <div key={commitment.label} className="text-center">
                <dt className="text-2xl font-semibold tracking-[-0.03em] tabular-nums">
                  {commitment.value}
                </dt>
                <dd className="mt-1 text-xs text-tertiary">
                  {commitment.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <AppPreview className="mt-16" />
      </div>
    </section>
  );
}
