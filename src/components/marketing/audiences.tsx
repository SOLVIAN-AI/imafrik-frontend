import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";

import { Section } from "@/components/marketing/section";
import { VisualImage } from "@/components/marketing/visual-image";
import { Button } from "@/components/ui/button";
import { marketingCopy } from "@/content/marketing";
import { VISUALS } from "@/content/marketing/visuals";
import { REQUESTER_PARAM } from "@/lib/contact-form";
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
 *
 * Chaque carte porte une vraie coupe, en vignette dans son angle : un scanner
 * cérébral, l'examen qu'une clinique envoie le plus souvent ; une IRM
 * cérébrale, la lecture d'un radiologue. Décoratives (`alt` vide), elles
 * sont créditées sur la page « Crédits des images ».
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
    {
      key: "clinics",
      ...t.clinics,
      featured: true,
      requester: REQUESTER_PARAM.clinic,
      visual: VISUALS.ctBrainAxial,
    },
    {
      key: "radiologists",
      ...t.radiologists,
      featured: false,
      requester: REQUESTER_PARAM.radiologist,
      visual: VISUALS.mrBrainAxial,
    },
  ];
  return (
    <Section
      id={ANCHORS.profils[locale]}
      eyebrow={t.eyebrow}
      title={t.title}
      lead={t.lead}
    >
      <div className="mt-14 grid gap-5 lg:grid-cols-2">
        {audiences.map((audience, index) => (
          <article
            key={audience.key}
            data-reveal
            style={{ "--reveal-order": index } as React.CSSProperties}
            className={cn(
              "group relative isolate flex flex-col overflow-hidden rounded-2xl border p-7 shadow-raised sm:p-9",
              "transition-[border-color,box-shadow] duration-300 ease-(--ease-out-quart) hover:shadow-overlay",
              audience.featured
                ? "border-accent/30 bg-surface-raised hover:border-accent/50"
                : "border-border-subtle bg-surface-raised hover:border-border-default",
            )}
          >
            {/* La coupe, en vignette sombre comme dans une liste
                d'examens : elle garde son fond nuit dans les deux thèmes,
                et ne passe jamais sous le texte. */}
            <div
              className="absolute top-7 right-7 size-20 overflow-hidden rounded-xl bg-[#070e1c] shadow-raised ring-1 ring-white/10 sm:top-9 sm:right-9 sm:size-28"
              aria-hidden
            >
              <VisualImage
                visual={audience.visual}
                alt=""
                sizes="7rem"
                className="size-full transition-[scale] duration-700 ease-(--ease-out-quart) group-hover:scale-[1.06]"
              />
            </div>

            <p className="label-eyebrow max-w-[calc(100%-6rem)] text-accent sm:max-w-none">
              {audience.eyebrow}
            </p>
            <h3 className="mt-3 max-w-[calc(100%-6rem)] text-2xl leading-tight font-semibold sm:max-w-[calc(100%-8.5rem)] sm:text-[1.75rem]">
              {audience.title}
            </h3>

            <ul className="mt-8 flex flex-1 flex-col gap-3.5 sm:mt-10">
              {audience.points.map((point) => (
                <li
                  key={point}
                  className="flex gap-3 text-sm leading-relaxed text-secondary sm:text-base sm:leading-7"
                >
                  <span
                    className="mt-1 flex size-4.5 shrink-0 items-center justify-center rounded-full bg-accent-muted sm:mt-1.5"
                    aria-hidden
                  >
                    <Check className="size-3 text-accent" />
                  </span>
                  {point}
                </li>
              ))}
            </ul>

            <Button
              variant={audience.featured ? "primary" : "secondary"}
              size="xl"
              className="mt-9 self-start"
              asChild
            >
              {/* Le formulaire s'ouvre sur le bon demandeur. */}
              <Link
                href={`${localizePath("/contact", locale)}?profil=${audience.requester}`}
              >
                {audience.cta}
                <ArrowRight />
              </Link>
            </Button>
          </article>
        ))}
      </div>
    </Section>
  );
}
