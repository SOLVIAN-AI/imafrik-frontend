import type { z } from "zod";

import type { AppMessages } from "@/i18n";
import { userListHref } from "@/lib/admin-params";
import type { studyEligibilitySchema } from "@/lib/api/contracts";
import { modalityGroupOf } from "@/lib/modalities";

/**
 * Quand personne ne peut recevoir un examen : pourquoi, et quoi faire.
 *
 * La raison vient du service (`POST /admin/studies/eligibility`), pour
 * l'équipe IMAFRIK seulement ; le responsable d'une clinique, lui, ne
 * choisit que parmi ses radiologues, et reçoit les vérifications à sa
 * portée. Pur : éprouvé par `assignment-blocker.test.ts`.
 */

/** Pourquoi aucun radiologue ne peut recevoir un examen. */
export type NoCandidateReason = NonNullable<
  z.output<typeof studyEligibilitySchema>["reason"]
>;

/** Qui peut recevoir un examen à attribuer. */
export interface Eligibility {
  /** Radiologues qui peuvent le recevoir : ceux de la fenêtre d'attribution. */
  candidates: number;
  /** Sans aucun candidat, pourquoi. */
  reason: NoCandidateReason | null;
}

/** Un geste qui débloque l'attribution, et l'écran où le faire. */
export type RemedyKey =
  | "reactivate"
  | "openToPool"
  | "attachRadiologist"
  | "validateCredentials"
  | "setModalities"
  | "checkTeam"
  | "askTeam";

export interface Remedy {
  key: RemedyKey;
  /** Écran où le faire ; `null` quand il n'y en a pas (demander à l'équipe). */
  href: string | null;
}

/**
 * Les gestes qui permettraient d'attribuer l'examen, du plus direct au
 * plus large.
 *
 * @param portal   Portail de l'appelant.
 * @param reason   Raison connue ; `null` si le service ne l'a pas dite.
 * @param clinicId Clinique de l'examen, pour mener à sa fiche.
 */
export function remediesFor(
  portal: "clinic" | "team",
  reason: NoCandidateReason | null,
  clinicId: string | null,
): Remedy[] {
  if (portal === "clinic")
    return [
      { key: "checkTeam", href: "/equipe" },
      { key: "askTeam", href: null },
    ];
  const sheet = clinicId
    ? `/admin/organisations/${encodeURIComponent(clinicId)}`
    : "/admin/organisations";
  const accounts = userListHref("all");
  switch (reason) {
    case "clinic_inactive":
      return [{ key: "reactivate", href: sheet }];
    case "no_reader":
      return [
        { key: "openToPool", href: sheet },
        { key: "attachRadiologist", href: accounts },
      ];
    case "not_credentialed":
      return [
        { key: "validateCredentials", href: userListHref("unverified") },
        { key: "openToPool", href: sheet },
      ];
    case "modality_not_read":
    case null:
      return [
        { key: "setModalities", href: accounts },
        { key: "openToPool", href: sheet },
      ];
  }
}

/**
 * Pourquoi personne ne peut recevoir un examen, en une phrase : la raison
 * du service, la modalité nommée quand c'est elle qui manque.
 *
 * @param text     Textes de l'attribution.
 * @param reason   Raison du service ; `null` si inconnue.
 * @param modality Code DICOM de l'examen (`MG`…), ou `null`.
 */
export function blockedReason(
  text: AppMessages["assignment"],
  reason: NoCandidateReason | null,
  modality: string | null,
): string {
  if (reason === null) return text.blocked.unknown;
  if (reason === "modality_not_read" && modality)
    return text.blocked.modalityNotRead(
      text.modalities[modalityGroupOf(modality)],
    );
  return text.blocked.reasons[reason];
}
