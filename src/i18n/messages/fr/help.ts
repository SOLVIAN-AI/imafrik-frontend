import { glossary } from "@/i18n/messages/fr/help-glossary";
import { guides } from "@/i18n/messages/fr/help-guides";
import { pages } from "@/i18n/messages/fr/help-pages";

/**
 * Aide contextuelle : le panneau, le glossaire et l'aide de chaque écran.
 *
 * Une page d'aide par écran **et par rôle** (`pages.radiologist`,
 * `pages.clinic`, `pages.admin`) : la même adresse ne se lit pas de la
 * même façon pour un radiologue et pour l'équipe IMAFRIK. Chaque page dit
 * à quoi sert l'écran, ses gestes clés dans l'ordre, et les termes du
 * glossaire qu'il emploie. `src/lib/help.ts` relie les adresses aux pages ;
 * un test vérifie que chaque écran de chaque rôle a la sienne.
 */
export const help = {
  panel: {
    title: "Aide",
    onThisPage: "Sur cette page :",
    searchLabel: "Rechercher dans l’aide",
    searchPlaceholder: "Un écran, un terme…",
    purpose: "À quoi sert cette page",
    steps: "Gestes clés",
    terms: "Termes employés ici",
    more: "Pour aller plus loin",
    shortcuts: "Raccourcis clavier",
    glossary: "Glossaire",
    openGlossary: "Ouvrir le glossaire complet",
    back: "Revenir à l’aide de cet écran",
    guides: "Guides",
    guideLink: (title: string) => `Guide : ${title}`,
    resultsPages: "Écrans",
    resultsTerms: "Termes",
    noResult: "Aucun résultat. Essayez un autre mot, ou ouvrez le glossaire.",
    noScreen:
      "Cet écran n’a pas d’aide propre. Cherchez un terme ci-dessus ou ouvrez le glossaire.",
    close: "Fermer l’aide",
    keys: {
      help: "Ouvrir ou fermer cette aide",
      palette: "Rechercher un patient, un écran",
      slash: "Rechercher, hors d’un champ de saisie",
      escape: "Fermer un panneau ou une fenêtre",
      browse: "Parcourir la liste des examens",
      open: "Ouvrir l’examen sélectionné",
    },
    enterKey: "Entrée",
    escapeKey: "Échap",
  },
  glossary,
  guides,
  pages,
};
