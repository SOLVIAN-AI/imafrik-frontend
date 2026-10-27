"use client";

import { CircleHelp } from "lucide-react";

import { useHelp } from "@/components/help/help-panel";
import { Button } from "@/components/ui/button";
import { useMessages } from "@/i18n/client";

/**
 * Bouton d'aide : ouvre ou ferme l'aide de l'écran (`HelpPanel`).
 *
 * Présent dans la barre supérieure du portail et dans celle de l'écran de
 * lecture, au même endroit d'un écran à l'autre. La touche `?` fait de
 * même hors d'un champ de saisie. Le panneau reprend ce que proposait
 * l'ancien menu (visite de l'écran, formation, contact) sous « Pour aller
 * plus loin ».
 */
export function HelpMenu() {
  const t = useMessages();
  const { open, toggle } = useHelp();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={t.tour.help.button}
      aria-expanded={open}
      aria-keyshortcuts="?"
      data-tour="help"
      onClick={toggle}
    >
      <CircleHelp />
    </Button>
  );
}
