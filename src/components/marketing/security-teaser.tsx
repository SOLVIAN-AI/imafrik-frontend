import {
  ArrowRight,
  FileLock2,
  KeyRound,
  ScrollText,
  ServerCog,
} from "lucide-react";
import Link from "next/link";

import { Section } from "@/components/marketing/section";

/**
 * Les quatre garanties qu'un établissement vérifie avant de signer.
 *
 * Elles sont posées en page d'accueil, pas reléguées dans les mentions
 * légales : confier les examens de ses patients à un tiers est une
 * décision de responsabilité, et la question de la sécurité arrive dans
 * les cinq premières minutes de toute discussion.
 */
const GUARANTEES = [
  {
    icon: FileLock2,
    title: "Rien en clair sur Internet",
    detail:
      "Les images sortent chiffrées de la passerelle et le restent au stockage. Aucun port d’imagerie n’est exposé sur Internet.",
  },
  {
    icon: KeyRound,
    title: "Cloisonnement par établissement",
    detail:
      "L’isolation est appliquée par la base de données, pas seulement par l’interface : une erreur de programmation ne peut pas l’ouvrir.",
  },
  {
    icon: ScrollText,
    title: "Journal d’accès complet",
    detail:
      "Chaque consultation d’examen est enregistrée, horodatée et attribuable à une personne nommée.",
  },
  {
    icon: ServerCog,
    title: "Hébergement européen",
    detail:
      "Stockage dans l’Union européenne. Durée de conservation et suppression fixées au contrat.",
  },
] as const;

/** Aperçu des garanties, renvoyant vers la page détaillée. */
export function SecurityTeaser() {
  return (
    <Section
      eyebrow="Confiance"
      title="Des données de santé, traitées comme telles"
      lead="La sécurité n’est pas une option activable : elle est intégrée à l’architecture du service."
    >
      <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border-subtle bg-border-subtle sm:grid-cols-2">
        {GUARANTEES.map((guarantee) => (
          <div key={guarantee.title} className="bg-surface-raised p-7">
            <guarantee.icon className="size-5 text-accent" aria-hidden />
            <h3 className="mt-4 text-base font-semibold">{guarantee.title}</h3>
            <p className="prose-justify mt-2 text-sm leading-relaxed text-secondary">
              {guarantee.detail}
            </p>
          </div>
        ))}
      </div>

      <Link
        href="/securite"
        className="mt-8 inline-flex items-center gap-1.5 text-sm text-accent transition-opacity hover:opacity-80"
      >
        Le détail des garanties et de la conformité
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </Section>
  );
}
