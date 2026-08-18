import { FileSignature, Send, ScanLine } from "lucide-react";

import { Section } from "@/components/marketing/section";

/**
 * Les trois temps du service.
 *
 * La numérotation est ici justifiée : c'est une véritable séquence, et
 * l'ordre porte une information — on ne signe pas avant d'avoir lu. Un
 * marqueur numéroté sur des blocs qui ne se suivent pas ne serait que
 * de la décoration.
 */
const STEPS = [
  {
    icon: Send,
    title: "La clinique envoie",
    detail:
      "Le PACS pousse l’examen automatiquement dès la validation sur la console. Sans PACS routable, les fichiers se déposent depuis le navigateur.",
    note: "Transfert chiffré · aucun logiciel à installer",
  },
  {
    icon: ScanLine,
    title: "Un radiologue lit",
    detail:
      "L’examen entre dans une file commune. Le premier radiologue disponible le prend en charge ; les urgences remontent en tête.",
    note: "Images et compte-rendu côte à côte",
  },
  {
    icon: FileSignature,
    title: "Le compte-rendu est signé",
    detail:
      "Signature nominative, document verrouillé, transmis à l’établissement. Un code de vérification permet d’en attester l’authenticité.",
    note: "PDF disponible immédiatement",
  },
] as const;

/** Section « comment ça marche ». */
export function HowItWorks() {
  return (
    <Section
      id="fonctionnement"
      eyebrow="Fonctionnement"
      title="Trois étapes, aucune installation"
      lead="Entre l’acquisition et le compte-rendu signé, il n’y a que le temps de lecture du radiologue."
    >
      <ol className="mt-12 grid gap-5 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            className="relative flex flex-col rounded-xl border border-border-subtle bg-surface-raised p-6 shadow-raised"
          >
            <div className="flex items-center justify-between">
              <span
                className="flex size-10 items-center justify-center rounded-lg bg-accent-muted ring-1 ring-accent/25 ring-inset"
                aria-hidden
              >
                <step.icon className="size-4.5 text-accent" />
              </span>
              <span className="font-mono text-2xs text-tertiary">
                0{index + 1}
              </span>
            </div>

            <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-secondary">
              {step.detail}
            </p>
            <p className="mt-4 border-t border-border-subtle pt-3 text-2xs text-tertiary">
              {step.note}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
