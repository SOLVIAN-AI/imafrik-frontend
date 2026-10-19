import type { AppMessages } from "@/i18n/messages/fr";

/** Training area, in English. */
export const training: AppMessages["training"] = {
  page: {
    title: "Training",
    description:
      "Three real, anonymised examinations to get to grips with the reading screen. Nothing you do here reaches a patient or a clinic.",
    stepsTitle: "The workflow, as on a real examination",
    steps: [
      "Take the exercise.",
      "Read the images and write, with your templates.",
      "Sign the exercise, then download its specimen PDF.",
      "Compare with the model answer when there is one, and start again whenever you like.",
    ],
    emptyTitle: "Exercises are on their way",
    emptyDetail:
      "The three training examinations are being prepared. They will appear here as soon as a radiologist has reviewed their clinical context.",
  },
  states: {
    todo: "To do",
    draft: "In progress",
    submitted: "Signed",
  },
  actions: {
    start: "Start",
    resume: "Resume",
    review: "Review",
    preview: "Preview",
  },
  underReview: "Under review",
  underReviewHint:
    "Visible to the IMAFRIK team only, until a radiologist has reviewed the clinical context.",
  reviewedBy: (name: string) => `Context reviewed by ${name}`,
  source: (name: string, license: string) =>
    `Images: ${name}, ${license} licence.`,
  sourceLink: "View the source",
  hasReference: "Model answer available",
  facility: "IMAFRIK training area",
  caseId: (position: number) =>
    `IMAFRIK-TRAINING-${String(position).padStart(2, "0")}`,
  workspace: {
    notice:
      "Training exercise: nothing you do here reaches a patient or a clinic.",
    previewNotice:
      "Preview: this case is under review. The exercise will open once the case is published.",
    claim: "Start the exercise",
    claimBanner: "Take the exercise to write, as on a real examination.",
    sign: "Sign the exercise",
    signedToast: "Exercise signed. Its specimen PDF is ready.",
    signedBanner:
      "Exercise signed: the text is locked, like a real report. An addendum is still possible.",
    release: "Start again",
    releaseConfirm:
      "Delete this exercise and start again? The text you wrote will be lost.",
  },
  sign: {
    title: "Sign the exercise",
    description: {
      before: "The exercise",
      middle: (signer: string) =>
        `will be signed in the name of ${signer}, like a real report, but sent to no one. It will become`,
      locked: "locked",
      after: ": any correction will take the form of an addendum, as for real.",
    },
    missing: (count: number) =>
      count === 1
        ? "A required section is empty"
        : `${count} required sections are empty`,
    review: (count: number) =>
      count === 1
        ? "Review: one point to check"
        : `Review: ${count} points to check`,
    signAnyway: "If this is intended, you can sign as it is.",
    stillDraft: "The exercise is still in progress.",
    failed:
      "Signing did not go through. The exercise is still in progress; your changes are kept.",
    keepWriting: "Keep writing",
    confirmAnyway: "Sign anyway",
    confirm: "Sign the exercise",
  },
  afterword: {
    title: "After signing",
    pdf: "Download the specimen PDF",
    pdfHint:
      "The real layout, with no medical value: watermark on every page, no QR code.",
    pdfDemo: "The specimen PDF is not produced in demo mode.",
    reference: "Model answer",
    referenceBy: (name: string) => `Written or approved by ${name}.`,
    noReference:
      "No model answer for this case yet: it will only have one once approved by a radiologist.",
    addenda: "Exercise addenda",
    addendumLabel: "New addendum",
    addendumPlaceholder: "Clarification or correction, as on a real report…",
    addendumSave: "Add the addendum",
    addendumAdded: "Addendum added.",
    restart: "Start the exercise again",
    restarted: "Exercise deleted: you can start again.",
  },
  errors: {
    invalidDraft: "The exercise text cannot be read: reload the page.",
    emptyAddendum: "The addendum is empty.",
    demo: "Available on a real account: in demo mode, the exercise is not saved.",
  },
  admin: {
    label: "Training",
    progress: (done: number, total: number) =>
      `${done} exercise${done === 1 ? "" : "s"} signed out of ${total}`,
    inProgress: (count: number) =>
      count === 1 ? "one in progress" : `${count} in progress`,
    none: "No exercise yet",
  },
  onboarding: {
    link: "Practise on three sample examinations",
    hint: "CT, MRI and radiograph, in the real reading screen, with no patient.",
  },
};
