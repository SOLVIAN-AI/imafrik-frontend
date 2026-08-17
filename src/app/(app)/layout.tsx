import {
  AppShell,
  type CurrentUser,
  type NavItem,
} from "@/components/layout/app-shell";

/**
 * Sections du portail radiologue.
 *
 * L'ordre suit le déroulé d'une journée : ce qui reste à lire, ce qu'on a
 * en main, ce qu'on a rendu. Un classement alphabétique obligerait à
 * réfléchir avant de cliquer.
 */
const NAV: NavItem[] = [
  { href: "/worklist", label: "À lire", icon: "worklist", count: 12, urgent: true },
  { href: "/mes-examens", label: "Mes examens", icon: "studies", count: 3 },
  { href: "/comptes-rendus", label: "Comptes-rendus", icon: "reports" },
  { href: "/parametres", label: "Paramètres", icon: "settings" },
];

/** Utilisateur de démonstration, en attendant la session Supabase. */
const USER: CurrentUser = {
  name: "Dr Adjo Kponton",
  role: "Radiologue",
  organisation: "IMAFRIK Radiologie",
};

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <AppShell nav={NAV} user={USER}>
      {children}
    </AppShell>
  );
}
