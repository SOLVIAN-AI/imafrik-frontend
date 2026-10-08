import { Check } from "lucide-react";
import Link from "next/link";

import { Section } from "@/components/marketing/section";
import { Button } from "@/components/ui/button";
import { marketingCopy } from "@/content/marketing";
import type { Locale } from "@/lib/i18n/locale";
import { ANCHORS, localizePath } from "@/lib/i18n/routes";
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

/**
 * Section « à qui s'adresse le service ».
 *
 * La colonne des cliniques est mise en avant : c'est elle qui achète.
 *
 * @param locale Langue de la page.
 */
export function Audiences({ locale }: { locale: Locale }) {
  const t = marketingCopy(locale).audiences;
  const audiences = [
    { key: "clinics", ...t.clinics, featured: true },
    { key: "radiologists", ...t.radiologists, featured: false },
  ];
  return (
    <Section
      id={ANCHORS.profils[locale]}
      eyebrow={t.eyebrow}
      title={t.title}
      lead={t.lead}
    >
      <div className="mt-12 grid gap-5 lg:grid-cols-2">
        {audiences.map((audience) => (
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
              <Link href={localizePath("/contact", locale)}>
                {audience.cta}
              </Link>
            </Button>
          </div>
        ))}
      </div>
    </Section>
  );
}
