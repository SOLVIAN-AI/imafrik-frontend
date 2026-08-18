import { Check } from "lucide-react";
import Link from "next/link";

import { Section } from "@/components/marketing/section";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Les deux profils, et ce que chacun y gagne.
 *
 * Deux colonnes plutôt qu'une liste unique : les arguments ne se
 * recouvrent pas. Une clinique achète un délai et une absence
 * d'investissement ; un radiologue cherche du volume et un outil de
 * lecture qui ne lui coûte pas de temps. Les mélanger produirait une
 * liste où chacun ne lit que la moitié.
 */
const AUDIENCES = [
  {
    key: "clinics",
    eyebrow: "Pour les cliniques",
    title: "Un service de radiologie, sans radiologue sur place",
    points: [
      "Aucun investissement : ni serveur, ni licence, ni maintenance",
      "Vos images restent les vôtres, hébergées et chiffrées",
      "Suivi en temps réel de chaque examen envoyé",
      "Comptes-rendus signés, téléchargeables en PDF",
      "Continuité la nuit, le week-end et pendant les congés",
    ],
    cta: { label: "Demander une démonstration", href: "/contact" },
    featured: true,
  },
  {
    key: "radiologists",
    eyebrow: "Pour les radiologues",
    title: "Lire depuis là où vous êtes, avec un outil qui suit",
    points: [
      "File de travail commune, urgences signalées",
      "Images et compte-rendu en écran scindé",
      "Modèles par modalité et par région anatomique",
      "Signature nominative, document verrouillé après signature",
      "Rémunération à l’acte, relevé consultable",
    ],
    cta: { label: "Rejoindre le réseau", href: "/contact" },
    featured: false,
  },
] as const;

/** Section « à qui s'adresse le service ». */
export function Audiences() {
  return (
    <Section
      id="profils"
      eyebrow="Deux métiers"
      title="Le même service, vu des deux côtés"
      lead="Une clinique et un radiologue n’attendent pas la même chose d’une plateforme. Chacun dispose de son propre portail."
    >
      <div className="mt-12 grid gap-5 lg:grid-cols-2">
        {AUDIENCES.map((audience) => (
          <div
            key={audience.key}
            className={cn(
              "relative flex flex-col overflow-hidden rounded-2xl border p-8",
              audience.featured
                ? "border-accent/30 bg-surface-raised shadow-raised"
                : "border-border-subtle bg-surface-raised/60",
            )}
          >
            {/* Le halo ne distingue que la colonne principale : sur deux
                blocs identiques, l'œil ne sait pas par où commencer. */}
            {audience.featured && (
              <div
                className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full blur-3xl"
                style={{
                  background:
                    "radial-gradient(closest-side, var(--glow-accent), transparent)",
                }}
                aria-hidden
              />
            )}

            <p className="label-eyebrow relative text-accent">
              {audience.eyebrow}
            </p>
            <h3 className="relative mt-3 text-2xl font-semibold">
              {audience.title}
            </h3>

            <ul className="relative mt-7 flex flex-1 flex-col gap-3">
              {audience.points.map((point) => (
                <li key={point} className="flex gap-2.5 text-sm text-secondary">
                  <Check
                    className="mt-0.5 size-4 shrink-0 text-accent"
                    aria-hidden
                  />
                  {point}
                </li>
              ))}
            </ul>

            <Button
              variant={audience.featured ? "primary" : "secondary"}
              size="lg"
              className="relative mt-8 self-start"
              asChild
            >
              <Link href={audience.cta.href}>{audience.cta.label}</Link>
            </Button>
          </div>
        ))}
      </div>
    </Section>
  );
}
