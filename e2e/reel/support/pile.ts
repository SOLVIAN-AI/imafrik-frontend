import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";

import { expect } from "@playwright/test";

import { environnement } from "./environnement";
import { totpNow } from "./totp";

/**
 * Accès directs à la pile réelle : comptes GoTrue, base, API, courriels.
 *
 * Les parcours préparent leurs données par les mêmes portes que
 * l'exploitation, sans passer par l'interface : l'API d'administration
 * de GoTrue pour créer un compte, la base (rôle `postgres` du Supabase
 * local) pour le rattacher à une organisation ou valider un numéro
 * d'ordre comme le ferait l'équipe IMAFRIK, le webhook de l'API pour
 * faire arriver un examen. L'interface n'est ensuite parcourue que pour
 * ce qu'elle doit montrer.
 *
 * Chaque appel échoue bruyamment : un parcours qui continuerait sur une
 * préparation ratée échouerait plus loin, pour une raison trompeuse.
 */

/** Organisations du jeu de départ du backend (`db/seed.sql`). */
export const ORGANISATIONS = {
  /** Clinique Saint-Joseph, Lomé : sous contrat avec le groupe ci-dessous. */
  clinique: "11111111-0000-0000-0000-000000000001",
  /** IMAFRIK Radiologie : lit les examens de la clinique. */
  groupe: "33333333-0000-0000-0000-000000000003",
} as const;

/** Rôles d'une appartenance (`user_role` côté base). */
export type Role = "clinic_staff" | "radiologist" | "platform_admin";

/** Compte créé pour un parcours. */
export interface Compte {
  id: string;
  email: string;
  password: string;
  fullName: string;
}

/**
 * Suffixe propre à un parcours : deux exécutions, ou deux tests, ne se
 * disputent jamais un compte ni un examen.
 */
export function suffixe(): string {
  return randomBytes(4).toString("hex");
}

/**
 * Exécute du SQL sur la base locale, avec des variables psql.
 *
 * Les valeurs passent par `-v` et s'écrivent `:'nom'` dans la requête :
 * psql les cite lui-même, aucune n'est concaténée au texte SQL.
 *
 * @param requete    Requête(s), lues sur l'entrée standard.
 * @param variables  Valeurs à citer.
 * @returns La sortie, sans alignement ni en-tête (`-At`), sans blancs de bord.
 */
export function sql(
  requete: string,
  variables: Record<string, string> = {},
): string {
  const { databaseUrl } = environnement();
  const args = [databaseUrl, "-v", "ON_ERROR_STOP=1", "-X", "-q", "-At"];
  for (const [nom, valeur] of Object.entries(variables)) {
    args.push("-v", `${nom}=${valeur}`);
  }
  args.push("-f", "-");
  return execFileSync("psql", args, {
    input: requete,
    encoding: "utf8",
  }).trim();
}

/** En-têtes de l'API d'administration de GoTrue (clé de service locale). */
function enTetesAdministration(): Record<string, string> {
  const { serviceRoleKey } = environnement();
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
  };
}

/**
 * Crée un compte confirmé, avec mot de passe, par l'API d'administration.
 *
 * @param prefixe  Début de l'adresse, pour lire les journaux.
 * @param fullName Nom complet, repris par le profil.
 * @returns Le compte créé.
 */
export async function creerCompte(
  prefixe: string,
  fullName: string,
): Promise<Compte> {
  const { supabaseUrl } = environnement();
  // Domaine réel plutôt que `.test` : l'API valide les adresses, et
  // refuse les noms réservés. Rien ne sort de la machine : le Supabase
  // local remet tout courrier à son Mailpit.
  const email = `${prefixe}-${suffixe()}@parcours.imafrik.tech`;
  const password = `Parcours-${randomBytes(9).toString("base64url")}`;
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: enTetesAdministration(),
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    }),
  });
  const body = (await response.json()) as { id?: string; msg?: string };
  if (!response.ok || !body.id) {
    throw new Error(
      `Création du compte ${email} refusée (${response.status}) : ${JSON.stringify(body)}`,
    );
  }
  // Le profil naît avec le compte (déclencheur) ; son nom est posé ici,
  // comme le ferait l'accueil. L'insertion couvre une base où le
  // déclencheur manquerait : le parcours échouerait alors plus loin, sur
  // un symptôme sans rapport.
  sql(
    `insert into public.profiles (id, full_name) values (:'id', :'nom')
     on conflict (id) do update set full_name = excluded.full_name;`,
    { nom: fullName, id: body.id },
  );
  return { id: body.id, email, password, fullName };
}

/**
 * Rattache un compte à une organisation.
 *
 * La première appartenance devient l'organisation active du compte
 * (déclencheur côté base), lue par le hook du jeton.
 */
export function rattacher(
  compte: Compte,
  organisation: string,
  role: Role,
): void {
  sql(
    `insert into public.memberships (profile_id, organization_id, role)
     values (:'profil', :'organisation', :'role'::public.user_role);`,
    { profil: compte.id, organisation, role },
  );
}

/**
 * Renseigne et valide l'identité professionnelle d'un radiologue.
 *
 * Deux écritures, dans l'ordre où elles arrivent en vrai : le radiologue
 * déclare son titre et son numéro d'ordre (ce qui remet toute validation
 * à zéro), puis l'équipe IMAFRIK le valide.
 *
 * @returns Le numéro d'ordre enregistré.
 */
export function habiliterRadiologue(compte: Compte): string {
  const licence = `TG-${suffixe().toUpperCase()}`;
  sql(
    `update public.profiles
        set title = 'Dr', license_number = :'licence'
      where id = :'id';
     update public.profiles
        set credentials_verified_at = now()
      where id = :'id';`,
    { licence, id: compte.id },
  );
  return licence;
}

/** Appelle GoTrue (`/auth/v1/…`) et renvoie le corps d'une réponse réussie. */
async function gotrue<T>(
  path: string,
  body: unknown,
  accessToken?: string,
): Promise<T> {
  const { supabaseUrl, anonKey } = environnement();
  const headers: Record<string, string> = {
    apikey: anonKey,
    "Content-Type": "application/json",
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  const response = await fetch(`${supabaseUrl}/auth/v1${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const texte = await response.text();
  if (!response.ok) {
    throw new Error(`GoTrue ${path} : ${response.status} : ${texte}`);
  }
  return JSON.parse(texte) as T;
}

/**
 * Ouvre, hors du navigateur, une session dont le second facteur est
 * vérifié, pour appeler l'API au nom d'un compte.
 *
 * La double authentification vaut pour tous les rôles : un jeton obtenu
 * par le seul mot de passe ne porte aucun rôle, et l'API le refuse. Le
 * compte enrôle donc un facteur TOTP et le vérifie, par les mêmes appels
 * que l'application.
 *
 * @returns Le jeton d'accès de niveau `aal2`, porteur des claims du hook.
 */
export async function jetonDe(compte: Compte): Promise<string> {
  const session = await gotrue<{ access_token: string }>(
    "/token?grant_type=password",
    { email: compte.email, password: compte.password },
  );
  const facteur = await gotrue<{ id: string; totp: { secret: string } }>(
    "/factors",
    { factor_type: "totp", friendly_name: `parcours-${suffixe()}` },
    session.access_token,
  );
  const defi = await gotrue<{ id: string }>(
    `/factors/${facteur.id}/challenge`,
    {},
    session.access_token,
  );
  const verifiee = await gotrue<{ access_token: string }>(
    `/factors/${facteur.id}/verify`,
    { challenge_id: defi.id, code: await totpNow(facteur.totp.secret) },
    session.access_token,
  );
  return verifiee.access_token;
}

/**
 * Appelle l'API, et renvoie le corps JSON d'une réponse réussie.
 *
 * @param path    Chemin, depuis la racine de l'API.
 * @param init    Options `fetch` ; le corps est déjà sérialisé.
 * @param attendu Statut attendu.
 */
export async function api<T>(
  path: string,
  init: RequestInit,
  attendu: number,
): Promise<T> {
  const { apiUrl } = environnement();
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  headers.set("Accept-Language", "fr");
  if (init.body) headers.set("Content-Type", "application/json");
  const response = await fetch(`${apiUrl}${path}`, { ...init, headers });
  const texte = await response.text();
  if (response.status !== attendu) {
    throw new Error(
      `${init.method ?? "GET"} ${path} : ${response.status} au lieu de ${attendu} : ${texte}`,
    );
  }
  return (texte ? JSON.parse(texte) : null) as T;
}

/** Examen tel que le webhook d'ingestion le reçoit d'Orthanc. */
export interface ExamenRecu {
  /** Identifiant métier créé par l'ingestion. */
  studyId: string;
  /** Nom du patient, au format DICOM (`NOM^Prénom`). */
  patientName: string;
  /** Nom tel que l'interface l'affiche (`NOM Prénom`). */
  displayName: string;
}

/**
 * Fait arriver un examen par le webhook d'ingestion, comme le script Lua
 * d'Orthanc à la fin d'une réception.
 *
 * Les tâches de fond qui suivent (étiquetage et mesure du transfert dans
 * Orthanc) échouent en silence, faute de PACS dans la pile : c'est le
 * comportement prévu, la réconciliation les rejouerait.
 */
export async function ingererExamen(organisation: string): Promise<ExamenRecu> {
  const { webhookSecret } = environnement();
  const nom = `PARCOURS${suffixe().toUpperCase()}`;
  const uid = `1.2.826.0.1.3680043.10.1424.${Date.now()}.${parseInt(suffixe(), 16)}`;
  const result = await api<{ study_id: string; created: boolean }>(
    "/internal/webhooks/study-stable",
    {
      method: "POST",
      headers: { "X-Webhook-Secret": webhookSecret },
      body: JSON.stringify({
        orthanc_study_id: `e2e-${suffixe()}-${suffixe()}`,
        study_instance_uid: uid,
        organization_id: organisation,
        patient_name: `${nom}^Afi`,
        patient_id_local: `IPP-${suffixe()}`,
        patient_birthdate: "19800412",
        patient_sex: "F",
        modality: "CT",
        body_part: "CHEST",
        study_date: "20261009",
        instance_count: 212,
        series_count: 3,
      }),
    },
    201,
  );
  expect(result.created, "l’ingestion doit créer l’examen").toBe(true);
  return {
    studyId: result.study_id,
    patientName: `${nom}^Afi`,
    displayName: `${nom} Afi`,
  };
}

/** Message reçu par le Mailpit du Supabase local. */
export interface Courriel {
  subject: string;
  html: string;
}

/**
 * Attend le courriel adressé à une personne, dans le Mailpit local.
 *
 * @param destinataire Adresse du destinataire.
 * @returns Le dernier message reçu pour elle.
 */
export async function courrielPour(destinataire: string): Promise<Courriel> {
  const { mailpitUrl } = environnement();
  let id: string | null = null;
  await expect
    .poll(
      async () => {
        const response = await fetch(
          `${mailpitUrl}/api/v1/search?query=${encodeURIComponent(`to:"${destinataire}"`)}`,
        );
        if (!response.ok) return null;
        const body = (await response.json()) as {
          messages?: { ID: string }[];
        };
        id = body.messages?.[0]?.ID ?? null;
        return id;
      },
      {
        message: `courriel pour ${destinataire} dans Mailpit`,
        timeout: 30_000,
      },
    )
    .not.toBeNull();
  const response = await fetch(`${mailpitUrl}/api/v1/message/${id}`);
  const body = (await response.json()) as { Subject: string; HTML: string };
  return { subject: body.Subject, html: body.HTML };
}
