import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Appel à l'action de fin de page.
 *
 * Quelqu'un qui a lu jusqu'ici a déjà les arguments : il ne reste qu'à
 * lui éviter de remonter chercher le bouton. Le bloc reprend donc le
 * traitement de l'accroche — halos, fond profond — pour refermer la page
 * là où elle a commencé.
 */
export function FinalCta() {
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
            Voyons ce que cela donnerait{" "}
            <span className="text-brand-gradient">chez vous</span>.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-secondary">
            Trente minutes suffisent : vous nous décrivez votre installation et
            votre volume, nous vous montrons le parcours complet d’un examen, de
            l’envoi au compte-rendu signé.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/contact">
                Demander une démonstration
                <ArrowRight />
              </Link>
            </Button>
            <Button variant="ghost" size="lg" asChild>
              <Link href="/connexion">J’ai déjà un compte</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
