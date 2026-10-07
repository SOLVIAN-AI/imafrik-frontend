"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useHydrated } from "@/hooks/use-hydrated";

/** Raccourcis, par famille. `Mod` devient ⌘ sur Mac, Ctrl ailleurs. */
const GROUPS = [
  {
    title: "Texte",
    entries: [
      ["Gras", "Mod B"],
      ["Italique", "Mod I"],
      ["Souligné", "Mod U"],
      ["Barré", "Mod ⇧ S"],
      ["Surligner", "Mod ⇧ H"],
      ["Exposant", "Mod ."],
      ["Indice", "Mod ,"],
    ],
  },
  {
    title: "Structure",
    entries: [
      ["Sous-titre", "Mod Alt 3"],
      ["Liste à puces", "Mod ⇧ 8"],
      ["Liste numérotée", "Mod ⇧ 7"],
      ["Retrait dans une liste", "Tab · ⇧ Tab"],
      ["Aligner à gauche / centrer", "Mod ⇧ L · E"],
      ["Aligner à droite / justifier", "Mod ⇧ R · J"],
    ],
  },
  {
    title: "Rédaction",
    entries: [
      ["Phrases types, tableau…", "/"],
      ["Champ à compléter suivant / précédent", "Tab · ⇧ Tab"],
      ["Section suivante / précédente", "↓ · ↑ en bord de section"],
      ["Rechercher", "Mod F"],
      ["Rechercher et remplacer", "Ctrl H"],
      ["Annuler / rétablir", "Mod Z · Mod ⇧ Z"],
      ["Quitter le plein écran", "Échap"],
    ],
  },
  {
    title: "Saisie automatique",
    entries: [
      ["±", "+/-"],
      ["≤ · ≥", "<= · >="],
      ["→ · ←", "-> · <-"],
      ["…", "..."],
    ],
  },
] as const;

/**
 * Aide des raccourcis de l'éditeur.
 *
 * Un radiologue qui rédige des dizaines de comptes-rendus par jour vit au
 * clavier ; encore faut-il qu'il sache ce que le clavier permet. Les
 * raccourcis sont ceux des traitements de texte courants : rien à
 * réapprendre, seulement à découvrir.
 */
export function ShortcutsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const hydrated = useHydrated();
  const mod =
    hydrated && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Raccourcis clavier</DialogTitle>
          <DialogDescription>
            Ceux des traitements de texte courants, plus quelques gestes propres
            au compte-rendu.
          </DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[60vh] gap-x-8 gap-y-5 overflow-auto sm:grid-cols-2">
          {GROUPS.map((group) => (
            <section key={group.title}>
              <h3 className="label-eyebrow mb-2">{group.title}</h3>
              <dl className="divide-y divide-border-subtle text-xs">
                {group.entries.map(([label, keys]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-4 py-1.5"
                  >
                    <dt className="text-secondary">{label}</dt>
                    <dd className="flex shrink-0 gap-1">
                      {keys
                        .replaceAll("Mod", mod)
                        .split(" ")
                        .map((key, index) =>
                          key === "·" ? (
                            <span key={index} className="text-tertiary">
                              ·
                            </span>
                          ) : (
                            <kbd
                              key={index}
                              className="min-w-6 rounded border border-border-default bg-surface-sunken px-1.5 py-0.5 text-center font-sans text-2xs text-primary"
                            >
                              {key}
                            </kbd>
                          ),
                        )}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
