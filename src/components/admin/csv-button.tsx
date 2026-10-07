"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toCsv } from "@/lib/csv";

/**
 * Télécharge un tableau en CSV, fabriqué dans le navigateur.
 *
 * Les données sont déjà à l'écran : les renvoyer au serveur pour les
 * reformater ne protégerait rien et coûterait un aller-retour.
 *
 * @param filename Nom du fichier proposé.
 * @param headers  Intitulés des colonnes.
 * @param rows     Lignes.
 */
export function CsvButton({
  filename,
  headers,
  rows,
  disabled = false,
}: {
  filename: string;
  headers: string[];
  rows: (string | number | null)[][];
  disabled?: boolean;
}) {
  const download = () => {
    const blob = new Blob([toCsv(headers, rows)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    // Libéré au tour suivant : certains navigateurs lisent l'adresse
    // après le retour de `click()`.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={download}
      disabled={disabled}
    >
      <Download aria-hidden />
      Exporter en CSV
    </Button>
  );
}
