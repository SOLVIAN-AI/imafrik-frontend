import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

import { AppPreview } from "@/components/marketing/app-preview";
import { Button } from "@/components/ui/button";

/**
 * Engagements de délai.
 *
 * **Présentés comme des engagements, jamais comme des mesures.** Aucun
 * examen n'a encore été lu : afficher « délai moyen constaté » serait
 * invérifiable, et un établissement qui s'en apercevrait aurait raison
 * de douter du reste. Ce sont des délais contractuels, et l'étiquette le
 * dit.
 *
 * Ils devront être confrontés au réel dès les premiers mois, et revus
 * s'ils ne tiennent pas.
 */
const COMMITMENTS = [
  { value: "2 h", label: "Examen de routine" },
  { value: "30 min", label: "Urgence" },
  { value: "7 j/7", label: "Nuits et week-ends compris" },
] as const;

/**
 * Accroche de la page d'accueil.
 *
 * Elle dit ce que le service change, pas ce qu'il est : un directeur
 * d'établissement ne cherche pas « une plateforme de téléradiologie », il
 * cherche à ne plus attendre trois jours un compte-rendu de scanner.
 *
 * Le second paragraphe répond immédiatement à l'objection technique, qui
 * arrive toujours en deuxième : *que faut-il changer chez nous ?* La
 * réponse — rien, un logiciel s'installe à côté — désamorce le sujet
 * avant qu'il ne bloque la conversation.
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
            Le compte-rendu de vos examens,{" "}
            <span className="text-brand-gradient">le jour même</span>.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-secondary md:text-lg">
            Nous installons une passerelle sur un poste de votre établissement.
            Vos manipulateurs y envoient les examens comme à n’importe quelle
            destination du réseau interne. Un radiologue les lit à distance et
            signe le compte-rendu.
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

          <div className="mt-14">
            <p className="label-eyebrow">Nos engagements de délai</p>
            <dl className="mt-4 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
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
            <p className="mt-4 text-2xs text-tertiary">
              Délais fixés au contrat, à compter de la réception de l’examen.
            </p>
          </div>
        </div>

        <AppPreview className="mt-16" />
      </div>
    </section>
  );
}
