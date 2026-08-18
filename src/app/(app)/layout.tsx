import { AppShell } from "@/components/layout/app-shell";

/**
 * Disposition commune aux portails clinique et radiologue.
 *
 * Un seul châssis pour les deux : ce qui les distingue — navigation,
 * écrans, droits — découle du rôle dans l'organisation active, résolu
 * dans la navigation latérale. Deux dispositions séparées obligeraient à
 * dupliquer la barre supérieure, le thème et le sélecteur
 * d'organisation, et à les maintenir en phase.
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return <AppShell>{children}</AppShell>;
}
