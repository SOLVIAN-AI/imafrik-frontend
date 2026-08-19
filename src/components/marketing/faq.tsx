import { ChevronDown } from "lucide-react";

import { Section } from "@/components/marketing/section";

/**
 * Les objections réelles, dans l'ordre où elles viennent.
 *
 * Une FAQ n'est pas un espace de reformulation du discours commercial :
 * chaque entrée doit répondre à une question qui, sans réponse, empêche
 * de signer. D'où le ton — direct, et assumant les limites du service
 * quand il en a.
 */
const QUESTIONS = [
  {
    question: "Faut-il changer notre installation ?",
    answer:
      "Non. La passerelle se pose à côté de l’existant et vos modalités lui envoient les examens comme à n’importe quelle destination du réseau interne. Si vous avez déjà un PACS, il reste en place et continue de fonctionner.",
  },
  {
    question: "Que se passe-t-il si Internet ou le courant est coupé ?",
    answer:
      "L’examen est accepté quand même : la passerelle le conserve et le transfère dès que la liaison revient. Vos images restent consultables sur place pendant la coupure. C’est la raison d’être du boîtier : une console d’acquisition ne garde pas les envois qui échouent.",
  },
  {
    question: "Qui signe le compte-rendu, et qui en est responsable ?",
    answer:
      "Un radiologue nommément identifié, inscrit à un ordre professionnel, dont le numéro figure sur le document. La responsabilité de l’interprétation lui incombe, comme pour un examen lu sur place. IMAFRIK assure la transmission et la traçabilité.",
  },
  {
    question: "Où sont stockées les images de nos patients ?",
    answer:
      "Sur la passerelle de votre établissement, et sur nos serveurs dans l’Union européenne, chiffrées. Elles restent la propriété de l’établissement, qui peut en demander l’export ou la suppression. La durée de conservation est fixée au contrat.",
  },
  {
    question: "Combien de temps prend la mise en service ?",
    answer:
      "Le raccordement des modalités à la passerelle se planifie avec votre technicien. Le dépôt depuis un navigateur, lui, est utilisable dès la création du compte : vous pouvez envoyer votre premier examen sans attendre le boîtier.",
  },
  {
    question: "Peut-on essayer avant de s’engager ?",
    answer:
      "Oui. La démonstration se fait sur des examens de test, sans aucune donnée patient. Les premiers examens réels peuvent être traités sous convention d’essai avant contrat.",
  },
] as const;

/**
 * Foire aux questions.
 *
 * Construite sur `<details>` natif : le repli fonctionne sans
 * JavaScript, reste accessible au clavier et se laisse chercher par la
 * recherche du navigateur. Une bibliothèque d'accordéon n'apporterait
 * ici qu'une dépendance.
 */
export function Faq() {
  return (
    <Section eyebrow="Questions" title="Ce qu’on nous demande avant de signer">
      <div className="mt-10 divide-y divide-border-subtle overflow-hidden rounded-2xl border border-border-subtle bg-surface-raised">
        {QUESTIONS.map((entry) => (
          <details key={entry.question} className="group">
            <summary
              className={
                "flex cursor-pointer list-none items-center gap-4 px-6 py-5 " +
                "transition-colors hover:bg-surface-hover"
              }
            >
              <h3 className="flex-1 text-sm font-medium">{entry.question}</h3>
              <ChevronDown
                className="size-4 shrink-0 text-tertiary transition-transform duration-150 group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <p className="max-w-3xl px-6 pb-5 text-sm leading-relaxed text-secondary">
              {entry.answer}
            </p>
          </details>
        ))}
      </div>
    </Section>
  );
}
