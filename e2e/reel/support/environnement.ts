/**
 * Adresses et clés de l'environnement réel des parcours.
 *
 * Toutes viennent de la pile locale démarrée par la CI
 * (`tools/parcours-reels/pile.sh`) : le Supabase local, ses clés de
 * démonstration générées par la CLI, l'API lancée depuis son image, et un
 * secret de webhook propre aux tests. Aucune n'est un secret de
 * production, et aucune adresse distante n'est jamais visée : une
 * variable absente fait échouer le parcours, plutôt que de le laisser
 * deviner une valeur.
 */

/** Variables lues, et ce que chacune désigne. */
const VARIABLES = {
  supabaseUrl: "E2E_SUPABASE_URL",
  anonKey: "E2E_SUPABASE_ANON_KEY",
  serviceRoleKey: "E2E_SUPABASE_SERVICE_ROLE_KEY",
  databaseUrl: "E2E_DATABASE_URL",
  apiUrl: "E2E_API_URL",
  webhookSecret: "E2E_WEBHOOK_SECRET",
  mailpitUrl: "E2E_MAILPIT_URL",
} as const;

/** Environnement réel, tel que les parcours le consomment. */
export type Environnement = Record<keyof typeof VARIABLES, string>;

/** Hôtes admis : la pile des parcours tourne sur la machine elle-même. */
const HOTES_LOCAUX = new Set(["127.0.0.1", "localhost", "[::1]"]);

let memo: Environnement | null = null;

/**
 * Lit l'environnement réel, une fois par processus.
 *
 * @returns Les adresses et clés de la pile locale.
 * @throws Si une variable manque, ou si une adresse ne désigne pas la
 *         machine locale : ces parcours créent des comptes et des
 *         examens, ils ne doivent jamais viser un projet hébergé.
 */
export function environnement(): Environnement {
  if (memo) return memo;
  const manquantes: string[] = [];
  const valeurs = Object.fromEntries(
    Object.entries(VARIABLES).map(([cle, nom]) => {
      const valeur = process.env[nom]?.trim() ?? "";
      if (!valeur) manquantes.push(nom);
      return [cle, valeur];
    }),
  ) as Environnement;
  if (manquantes.length > 0) {
    throw new Error(
      `Parcours réels : variables manquantes (${manquantes.join(", ")}). ` +
        "Voir tools/parcours-reels/pile.sh.",
    );
  }
  for (const cle of [
    "supabaseUrl",
    "databaseUrl",
    "apiUrl",
    "mailpitUrl",
  ] as const) {
    const hote = new URL(valeurs[cle]).hostname;
    if (!HOTES_LOCAUX.has(hote)) {
      throw new Error(
        `Parcours réels : ${VARIABLES[cle]} vise « ${hote} », qui n’est pas la machine locale.`,
      );
    }
  }
  memo = valeurs;
  return valeurs;
}
