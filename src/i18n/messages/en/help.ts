import { glossary } from "@/i18n/messages/en/help-glossary";
import { guides } from "@/i18n/messages/en/help-guides";
import { pages } from "@/i18n/messages/en/help-pages";
import type { AppMessages } from "@/i18n/messages/fr";

/** Contextual help, in English: the panel, the glossary and each screen’s help. */
export const help: AppMessages["help"] = {
  panel: {
    title: "Help",
    onThisPage: "On this page:",
    searchLabel: "Search the help",
    searchPlaceholder: "A screen, a term…",
    purpose: "What this page is for",
    steps: "Key steps",
    terms: "Terms used here",
    more: "Going further",
    shortcuts: "Keyboard shortcuts",
    glossary: "Glossary",
    openGlossary: "Open the full glossary",
    back: "Back to this screen’s help",
    guides: "Guides",
    guideLink: (title: string) => `Guide: ${title}`,
    resultsPages: "Screens",
    resultsTerms: "Terms",
    noResult: "No results. Try another word, or open the glossary.",
    noScreen:
      "This screen has no help of its own. Search for a term above or open the glossary.",
    close: "Close help",
    keys: {
      help: "Open or close this help",
      palette: "Search for a patient or a screen",
      slash: "Search, outside a text field",
      escape: "Close a panel or a window",
      browse: "Move through the list of examinations",
      open: "Open the selected examination",
    },
    enterKey: "Enter",
    escapeKey: "Esc",
  },
  glossary,
  guides,
  pages,
};
