import type { AppMessages } from "@/i18n/messages/fr";

/**
 * Contractual commitments: the radiologist practice agreement, the
 * facility service agreement. In English. Same shape as the French.
 */
export const agreements: AppMessages["agreements"] = {
  demoAction: "Accepting an agreement",

  page: {
    title: "Your agreements",
    lead: "A version of your agreements awaits your consent. Your portal opens as soon as you have accepted it.",
    metaTitle: "Agreements",
  },

  review: {
    version: (version, date) => `Version ${version}, effective ${date}`,
    translationNotice:
      "Courtesy translation: only the French version is authoritative, and it is the one you accept.",
    documentLabel: (title) => `Text: ${title}`,
    download: "Download the PDF",
    downloadAccepted: "Download my copy",
    acceptRadiologist: (version) =>
      `I have read the practice agreement (version ${version}) and I accept it.`,
    acceptClinic: (version) =>
      `I have read the service agreement (version ${version}) and I accept it on behalf of the facility.`,
    capacityLabel: "Your position",
    capacityHint:
      "As it will appear on the acceptance certificate, for example “Managing Director”.",
    authorityLabel: "I declare that I am authorised to bind the facility.",
    submit: "Accept",
    submitAndContinue: "Accept and continue",
    acceptedOn: (date, by) =>
      by ? `Accepted on ${date} by ${by}.` : `Accepted on ${date}.`,
    accepted: "Agreement accepted.",
    proofNote:
      "Your acceptance is timestamped and bound to the fingerprint of the text shown. Your copy remains available for download in your settings.",
    cannotAccept:
      "An authorised person at your facility must accept the agreement. Your portal will open as soon as they have done so.",
    changed:
      "The text changed while you were reading: please review the version in force.",
    unavailable: "There is no agreement to accept at the moment.",
  },

  settings: {
    title: "Agreements",
    lead: "The texts you have accepted, and your copy of each.",
    pending: "To accept",
    review: "Read and accept",
    none: "No agreement is attached to your account.",
  },

  problems: {
    capacity_missing: "State your position within the facility.",
    authority_missing:
      "Tick the declaration: only an authorised person can bind the facility.",
  },
};
