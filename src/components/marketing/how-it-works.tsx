import { FileSignature, HardDrive, ScanLine } from "lucide-react";

import { Section } from "@/components/marketing/section";

/**
 * Les trois temps du service.
 *
 * La numérotation est justifiée : c'est une véritable séquence, et
 * l'ordre porte une information — on ne signe pas avant d'avoir lu. Un
 * marqueur numéroté sur des blocs qui ne se suivent pas ne serait que de
 * la décoration.
 *
 * La première étape décrit la passerelle sans la nommer autrement que
 * par ce qu'elle fait. « Store-and-forward » ne veut rien dire pour un
 * directeur d'établissement ; « l'examen est accepté même si la liaison
 * est coupée » lui parle immédiatement, parce que c'est arrivé la
 * semaine dernière.
 */
const STEPS = [
  {
    icon: HardDrive,
    title: "La passerelle reçoit",
    detail:
      "Vos modalités envoient l’examen à un boîtier posé dans l’établissement, comme à n’importe quelle destination du réseau interne. Il accepte immédiatement, même si la liaison est coupée.",
    note: "Aucun changement sur les consoles d’acquisition",
  },
  {
    icon: ScanLine,
    title: "Un radiologue lit",
    detail:
      "L’examen part vers la plateforme dès que la liaison le permet, compressé et chiffré. Il entre dans une file de travail ; les urgences remontent en tête.",
    note: "Images et compte-rendu côte à côte",
  },
  {
    icon: FileSignature,
    title: "Le compte-rendu est signé",
    detail:
      "Signature nominative, document verrouillé, transmis à l’établissement. Un code imprimé permet d’en vérifier l’authenticité en ligne.",
    note: "PDF disponible immédiatement",
  },
] as const;

/** Section « comment ça marche ». */
export function HowItWorks() {
  return (
    <Section
      id="fonctionnement"
      eyebrow="Fonctionnement"
      title="Trois étapes, rien à installer sur vos postes"
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
            <p className="prose-justify mt-2 flex-1 text-sm leading-relaxed text-secondary">
              {step.detail}
            </p>
            <p className="mt-4 border-t border-border-subtle pt-3 text-2xs text-tertiary">
              {step.note}
            </p>
          </li>
        ))}
      </ol>

      <p className="prose-justify mx-auto mt-6 max-w-2xl text-center text-xs leading-relaxed text-tertiary">
        Pas encore de passerelle, ou un examen gravé sur CD ? Les fichiers se
        déposent depuis un navigateur, sans rien installer.
      </p>
    </Section>
  );
}
