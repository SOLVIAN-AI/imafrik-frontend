/**
 * Règles d'un mot de passe, partagées par le formulaire et le serveur.
 *
 * Le formulaire les affiche au fil de la saisie ; l'action serveur les
 * revérifie, parce qu'un formulaire se contourne. Les déclarer une seule
 * fois garantit que l'écran n'annonce jamais une règle que le serveur
 * n'applique pas — ou l'inverse.
 */
export const PASSWORD_RULES = [
  {
    label: "Douze caractères au minimum",
    test: (value: string) => value.length >= 12,
  },
  {
    label: "Une lettre majuscule",
    test: (value: string) => /[A-ZÀ-Ý]/.test(value),
  },
  {
    label: "Un chiffre ou un symbole",
    test: (value: string) => /[^\p{L}]/u.test(value),
  },
] as const;

/** Longueur maximale acceptée, pour borner le travail du hachage. */
export const PASSWORD_MAX_LENGTH = 128;

/**
 * Première règle non respectée.
 *
 * @param password Mot de passe saisi.
 * @returns Le libellé de la règle, ou `null` si toutes sont respectées.
 */
export function firstBrokenRule(password: string): string | null {
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `${PASSWORD_MAX_LENGTH} caractères au maximum`;
  }
  return PASSWORD_RULES.find((rule) => !rule.test(password))?.label ?? null;
}
