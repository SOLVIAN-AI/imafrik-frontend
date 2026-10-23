import type { AppMessages } from "@/i18n/messages/fr";

/**
 * Radiologist accreditation: practice, supporting documents, the IMAFRIK
 * team's decision. In English. Same shape as the French.
 */
export const credentials: AppMessages["credentials"] = {
  demoAction: "uploading a supporting document",

  states: {
    undeclared: {
      title: "Complete your file",
      detail:
        "State your practice and upload your supporting document: the IMAFRIK team reviews it before opening your access to examinations.",
      action: "Complete my file",
    },
    license_missing: {
      title: "Enter your registration number",
      detail:
        "Your registration number is printed under your signature: the IMAFRIK team checks it against your diploma before opening your access to examinations.",
      action: "Enter my number",
    },
    documents_missing: {
      title: "Upload your supporting document",
      detail:
        "The IMAFRIK team opens your access to examinations once it has reviewed your supporting document.",
      action: "Upload my document",
    },
    pending: {
      title: "Your file is being reviewed",
      detail:
        "The IMAFRIK team is reviewing your supporting document. Examinations will appear here as soon as it is approved; there is nothing else you need to do.",
      action: "View my file",
    },
    expired: {
      title: "Your enrolment certificate has expired",
      detail:
        "Upload your new certificate: access to examinations resumes as soon as the IMAFRIK team approves it.",
      action: "Upload my new certificate",
    },
  },
  why: "A signed report commits a physician: their right to practise is verified before any access to examinations.",

  chip: {
    undeclared: "File to complete",
    license_missing: "Number missing",
    documents_missing: "Document to upload",
    pending: "Under review",
    expired: "Certificate expired",
    verified: "Approved by IMAFRIK",
  },

  practice: {
    legend: "Your practice",
    registered: {
      title: "Registered with the Medical Council",
      detail: "You upload your diploma and enter your registration number.",
    },
    resident: {
      title: "In specialist training",
      detail: "You upload your enrolment certificate, with its end date.",
    },
    changeWarning:
      "Changing your practice suspends your access to examinations until your new supporting document is approved.",
    save: "Save my practice",
    saved: "Practice saved.",
  },

  documents: {
    kinds: {
      diploma: "Diploma",
      enrollment_certificate: "Enrolment certificate",
    },
    hints: {
      diploma:
        "Your medical degree or specialist diploma, as a PDF or a legible photo.",
      enrollment_certificate:
        "Your specialist training enrolment certificate for the current year, as a PDF or a legible photo.",
    },
    formats: "PDF, JPEG or PNG, 10 MB maximum.",
    privacy:
      "Only the IMAFRIK team views this document, and every viewing is logged.",
    missingFile: "Choose the file of your supporting document.",
    choose: "Choose a file",
    replace: "Replace the file",
    send: "Send",
    sending: (percent: number) => `Sending… ${percent}%`,
    sent: "Document sent: the IMAFRIK team will review it.",
    selected: (name: string, size: string) => `${name} · ${size}`,
    tooLarge:
      "This file is larger than 10 MB: take a photo of the document, or compress the PDF.",
    badType: "Format not accepted: upload a PDF, or a JPEG or PNG photo.",
    failed: "The upload did not go through. Try again in a moment.",
    connectionLost:
      "The connection was interrupted during the upload. Check your network, then try again.",
    validUntil: "Certificate end date",
    validUntilHint:
      "Your access to examinations runs until this date; IMAFRIK reminds you 30 days before.",
    validUntilRequired: "Enter your certificate’s end date.",
    /** Ends within a month: a warning, not a block. */
    validUntilShort: (days: number) =>
      `Your access would close ${days === 0 ? "tomorrow" : `in ${days + 1} days`}: check the date printed on your certificate.`,
    validUntilPast:
      "This date has passed: upload your most recent certificate.",
    history: "Your uploads",
    uploadedOn: (date: string) => `Uploaded on ${date}`,
    validUntilOn: (date: string) => `Valid until ${date}`,
    status: {
      pending: "Under review",
      accepted: "Accepted",
      rejected: "Refused",
    },
    rejectionReason: "Reason",
    renewal: (days: number, date: string) =>
      days <= 0
        ? `Your certificate ends today (${date}): upload the new one now.`
        : `Your certificate ends in ${days} day${days > 1 ? "s" : ""}, on ${date}: upload the new one so your access is not interrupted.`,
  },

  settings: {
    title: "Practice and documents",
    description:
      "What the IMAFRIK team verifies before opening your access to examinations.",
    validUntil: (date: string) =>
      `Access open until ${date}, the end of your certificate.`,
  },
};
