"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useHydrated } from "@/hooks/use-hydrated";
import { useMessages } from "@/i18n/client";

/**
 * Aide des raccourcis de l'éditeur.
 *
 * Un radiologue qui rédige des dizaines de comptes-rendus par jour vit au
 * clavier ; encore faut-il qu'il sache ce que le clavier permet. Les
 * raccourcis sont ceux des traitements de texte courants : rien à
 * réapprendre, seulement à découvrir.
 *
 * La liste, par famille, vit dans `reading.shortcuts.groups` : `Mod`
 * devient ⌘ sur Mac, Ctrl ailleurs.
 */
export function ShortcutsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const hydrated = useHydrated();
  const labels = useMessages().reading.shortcuts;
  const mod =
    hydrated && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription>{labels.description}</DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[60vh] gap-x-8 gap-y-5 overflow-auto sm:grid-cols-2">
          {labels.groups.map((group) => (
            <section key={group.title}>
              <h3 className="label-eyebrow mb-2">{group.title}</h3>
              <dl className="divide-y divide-border-subtle text-xs">
                {group.entries.map(({ label, keys }) => (
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
