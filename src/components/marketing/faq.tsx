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
    question: "Faut-il remplacer notre PACS ?",
    answer:
      "Non. IMAFRIK reçoit les examens de votre PACS existant, quel qu’en soit l’éditeur, via le protocole DICOM standard. Votre installation ne change pas ; on y ajoute une destination d’envoi. Si votre console ne peut pas émettre vers l’extérieur, les fichiers se déposent depuis un navigateur.",
  },
  {
    question: "Que se passe-t-il si la connexion Internet est coupée ?",
    answer:
      "Les envois interrompus reprennent automatiquement au rétablissement de la liaison : le PACS conserve la file. Un examen n’est jamais perdu, il est retardé. Pour les urgences, un contact téléphonique reste prévu au contrat.",
  },
  {
    question: "Qui signe le compte-rendu, et qui en est responsable ?",
    answer:
      "Un radiologue nommément identifié, inscrit à l’Ordre, dont le numéro figure sur le document. La responsabilité de l’interprétation lui incombe, comme pour un examen lu sur place. IMAFRIK assure la transmission et la traçabilité.",
  },
  {
    question: "Où sont stockées les images de nos patients ?",
    answer:
      "Dans l’Union européenne, chiffrées au repos, sous une durée de conservation fixée au contrat. Elles restent la propriété de l’établissement, qui peut en demander l’export ou la suppression.",
  },
  {
    question: "Combien de temps prend la mise en service ?",
    answer:
      "Le raccordement d’un PACS prend en général une demi-journée, planifiée avec votre prestataire technique. Le dépôt manuel, lui, est utilisable dès la création du compte.",
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
