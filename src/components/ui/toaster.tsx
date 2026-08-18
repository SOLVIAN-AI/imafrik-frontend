"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

/**
 * Notifications éphémères.
 *
 * Réservées à ce qui confirme une action déjà faite — « modifications
 * enregistrées », « invitation envoyée ». Jamais pour une erreur qui
 * demande une décision : un message qui disparaît tout seul ne peut pas
 * porter un choix, et disparaîtrait pendant qu'on lit l'écran.
 *
 * Le thème suit celui de l'application : une notification claire posée
 * sur une interface sombre agresse dans une salle de lecture.
 */
export function Toaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      theme={resolvedTheme === "light" ? "light" : "dark"}
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "!bg-surface-overlay !border-border-default !text-primary !shadow-overlay !rounded-lg",
          description: "!text-secondary",
        },
      }}
    />
  );
}
