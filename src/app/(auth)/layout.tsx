import { Clock3, Lock, Stethoscope } from "lucide-react";

import { Mark } from "@/components/layout/brand";

/**
 * Ce que la plateforme promet, en trois lignes.
 *
 * Trois, pas six : une page de connexion n'est pas une page de vente.
 * Ces arguments s'adressent à quelqu'un qui a déjà choisi et qui revient
 * — ils rassurent, ils ne convainquent pas.
 */
const PROOF_POINTS = [
  {
    icon: Clock3,
    title: "Comptes-rendus en moins de deux heures",
    detail: "Vingt minutes pour les urgences, la nuit et le week-end compris.",
  },
  {
    icon: Stethoscope,
    title: "Radiologues inscrits à l’Ordre",
    detail:
      "Qualifications vérifiées, signature nominative sur chaque document.",
  },
  {
    icon: Lock,
    title: "Images chiffrées, accès tracés",
    detail: "Chaque consultation d’examen est enregistrée et attribuable.",
  },
];

/**
 * Disposition des écrans d'authentification.
 *
 * **Écran scindé, et le côté marque n'est pas de la décoration.** Une
 * clinique confie ici les examens de ses patients à un tiers : la page
 * de connexion est souvent le seul écran que verra son directeur. Elle
 * doit dire ce qu'est le service et sur quoi il s'engage, pendant que le
 * formulaire fait son travail à droite.
 *
 * C'est aussi le seul endroit de l'application où la couleur s'exprime
 * pleinement — halos, dégradé de marque, trame. Ailleurs, elle est
 * réservée à l'interactif : une interface de lecture ne peut pas se
 * permettre ce que peut une page d'accueil.
 *
 * Sous 1024 px, le panneau de marque disparaît et le formulaire prend
 * toute la place : sur un téléphone, on vient se connecter, pas lire.
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh bg-surface-base">
      <aside className="relative hidden w-[54%] shrink-0 overflow-hidden bg-surface-sunken lg:flex lg:flex-col">
        {/* Deux halos décalés plutôt qu'un seul centré : le fond paraît
            éclairé par une source hors cadre, ce qu'un dégradé
            symétrique ne produit jamais. */}
        <div
          className="pointer-events-none absolute -top-40 -left-32 size-[36rem] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, var(--glow-accent), transparent)",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-40 -bottom-48 size-[42rem] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, var(--glow-brand), transparent)",
          }}
          aria-hidden
        />
        <div
          className="dot-grid pointer-events-none absolute inset-0"
          aria-hidden
        />

        <div className="relative flex flex-1 flex-col justify-between p-12 xl:p-16">
          <div className="flex items-center gap-2.5">
            <Mark className="size-7" />
            <span className="text-base font-semibold tracking-[-0.01em]">
              IMAFRIK
            </span>
          </div>

          <div className="max-w-lg">
            <h1 className="text-4xl font-semibold xl:text-5xl">
              La téléradiologie,
              <br />
              <span className="text-brand-gradient">sans le délai.</span>
            </h1>
            <p className="mt-5 text-base leading-relaxed text-secondary">
              Vos examens sont lus par des radiologues disponibles, où qu’ils
              soient. Vous gardez vos images, votre patient garde son
              établissement.
            </p>

            <ul className="mt-10 flex flex-col gap-5">
              {PROOF_POINTS.map((point) => (
                <li key={point.title} className="flex gap-3.5">
                  <span
                    className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent-muted ring-1 ring-accent/25 ring-inset"
                    aria-hidden
                  >
                    <point.icon className="size-4 text-accent" />
                  </span>
                  <span>
                    <span className="block text-sm font-medium">
                      {point.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-tertiary">
                      {point.detail}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-2xs text-tertiary">
            IMAFRIK est un service de SOLVIAN AI LLC · Lomé, Togo
          </p>
        </div>
      </aside>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        {children}
      </main>
    </div>
  );
}
