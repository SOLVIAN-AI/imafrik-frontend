/**
 * Règles d'un mot de passe, partagées par le formulaire et le serveur.
 *
 * Le formulaire les affiche au fil de la saisie ; l'action serveur les
 * revérifie, parce qu'un formulaire se contourne. Les déclarer une seule
 * fois garantit que l'écran n'annonce jamais une règle que le serveur
 * n'applique pas, ou l'inverse. Les libellés vivent dans les textes de
 * l'application (`settings.password.rules`), dans chaque langue.
 */
export const PASSWORD_RULES = [
  { id: "length", test: (value: string) => value.length >= 12 },
  { id: "uppercase", test: (value: string) => /[A-ZÀ-Ý]/.test(value) },
  { id: "digitOrSymbol", test: (value: string) => /[^\p{L}]/u.test(value) },
] as const;

/** Identifiant d'une règle ; son libellé est dans `settings.password.rules`. */
export type PasswordRuleId = (typeof PASSWORD_RULES)[number]["id"] | "tooLong";

/** Longueur maximale acceptée, pour borner le travail du hachage. */
export const PASSWORD_MAX_LENGTH = 128;

/**
 * Première règle non respectée.
 *
 * @param password Mot de passe saisi.
 * @returns Le libellé de la règle, ou `null` si toutes sont respectées.
 */
export function firstBrokenRule(password: string): PasswordRuleId | null {
  if (password.length > PASSWORD_MAX_LENGTH) return "tooLong";
  return PASSWORD_RULES.find((rule) => !rule.test(password))?.id ?? null;
}
