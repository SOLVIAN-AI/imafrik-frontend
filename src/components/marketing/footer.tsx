import Link from "next/link";

import { Mark } from "@/components/layout/brand";

/**
 * Colonnes du pied de page.
 *
 * Les mentions légales y figurent en clair plutôt qu'en petits
 * caractères : un service qui traite des données de santé se juge aussi
 * sur la facilité avec laquelle on trouve qui l'édite et ce qu'il fait
 * des données.
 */
const COLUMNS = [
  {
    title: "Produit",
    links: [
      { href: "/#fonctionnement", label: "Fonctionnement" },
      { href: "/#profils", label: "Pour les cliniques" },
      { href: "/#profils", label: "Pour les radiologues" },
      { href: "/#tarifs", label: "Tarifs" },
    ],
  },
  {
    title: "Confiance",
    links: [
      { href: "/securite", label: "Sécurité et conformité" },
      { href: "/confidentialite", label: "Données personnelles" },
      { href: "/cgu", label: "Conditions d’utilisation" },
      { href: "/mentions-legales", label: "Mentions légales" },
    ],
  },
  {
    title: "Contact",
    links: [
      { href: "/contact", label: "Demander une démonstration" },
      { href: "/connexion", label: "Accéder à mon compte" },
    ],
  },
] as const;

/** Pied de page de la vitrine. */
export function MarketingFooter() {
  return (
    <footer className="border-t border-border-subtle bg-surface-sunken">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <Mark className="size-6" />
            <span className="text-sm font-semibold tracking-[-0.01em]">
              IMAFRIK
            </span>
          </div>
          <p className="mt-3 max-w-xs text-xs leading-relaxed text-tertiary">
            Téléradiologie pour l’Afrique de l’Ouest. Vos examens lus par des
            radiologues inscrits à l’Ordre, sans investissement matériel.
          </p>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.title}>
            <p className="label-eyebrow">{column.title}</p>
            <ul className="mt-3 flex flex-col gap-2">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-xs text-secondary transition-colors hover:text-accent"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border-subtle">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-5 text-2xs text-tertiary sm:flex-row sm:items-center sm:justify-between">
          <p>IMAFRIK est un service édité par SOLVIAN AI LLC · Lomé, Togo</p>
          <p>Images hébergées dans l’Union européenne, chiffrées au repos.</p>
        </div>
      </div>
    </footer>
  );
}
