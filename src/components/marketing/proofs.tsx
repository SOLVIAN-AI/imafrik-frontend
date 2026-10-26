import {
  HandCoins,
  KeyRound,
  LockKeyhole,
  ScrollText,
  ServerCog,
  Signature,
} from "lucide-react";

import { marketingCopy } from "@/content/marketing";
import type { Locale } from "@/lib/i18n/locale";

/** Icône de chaque garantie, dans l'ordre des textes. */
const PROOF_ICONS = [
  LockKeyhole,
  KeyRound,
  Signature,
  ScrollText,
  ServerCog,
  HandCoins,
] as const;

/**
 * Bandeau des garanties, sous l'accroche.
 *
 * Là où d'autres sites alignent des logos de clients, celui-ci aligne ce
 * que le service garantit, et que chacun peut vérifier au contrat ou dans
 * le produit. IMAFRIK démarre : afficher des logos ou des chiffres de
 * clientèle serait inventer. Chaque mention est développée plus bas (la
 * sécurité, les tarifs).
 *
 * @param locale Langue de la page.
 */
export function Proofs({ locale }: { locale: Locale }) {
  const t = marketingCopy(locale).proofs;
  return (
    <section
      aria-label={t.label}
      className="border-y border-border-subtle bg-surface-sunken/60"
    >
      <ul className="mx-auto grid max-w-7xl grid-cols-1 gap-x-8 gap-y-3.5 px-4 py-7 min-[480px]:grid-cols-2 sm:px-6 md:grid-cols-3 lg:px-8 xl:grid-cols-6 xl:gap-x-6">
        {t.items.map((item, index) => {
          const Icon = PROOF_ICONS[index];
          return (
            <li
              key={item}
              className="flex items-center gap-2.5 text-xs leading-snug text-secondary"
            >
              <Icon className="size-4 shrink-0 text-accent" aria-hidden />
              {item}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
