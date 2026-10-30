import type { AppMessages } from "@/i18n/messages/fr";

/** Texts for the "reading" area, in English. */
export const reading: AppMessages["reading"] = {
  page: {
    awaitingReportTitle: "Report in preparation",
    awaitingReportDetail:
      "It will be available here as soon as a radiologist signs it. The images can already be viewed.",
    loading: "Opening the examination",
    claimedBy: (name: string) => `Examination claimed by ${name}.`,
    claimedByOther: "Examination claimed by another radiologist.",
    priorReadonly:
      "Prior examination shared with you: read-only, images and signed report.",
    notAuthor:
      "Report signed by a colleague: only its author can add an addendum to it.",
    /** IMAFRIK team: the draft being written, read-only. */
    adminDraft: (author: string, savedAt: string) =>
      `Unsigned draft by ${author}, saved on ${savedAt}. The clinic cannot see it yet; this screen follows the writing.`,
    adminDraftAuthorUnknown: "a radiologist",
  },
  reportLanguage: {
    chip: {
      fr: "Report in French",
      en: "Report in English",
    },
    tooltip: {
      fr: "This clinic receives its reports in French, as set out in its contract. Section headings are shown as they will be printed.",
      en: "This clinic receives its reports in English, as set out in its contract. Section headings are shown as they will be printed.",
    },
  },
  workspace: {
    signed: "Signed",
    backupFound:
      "Some text could not be sent during a connection loss. It has been kept on this device.",
    backupRestore: "Restore",
    backupDiscard: "Discard",
    backupConflictFound:
      "A copy of your text is kept on this device, but the saved draft has changed since: another tab, or a save whose response was lost. Restoring the copy replaces the saved draft.",
    conflictBanner:
      "This draft was changed elsewhere. Your text is still kept on this device: save it in place of the other version, or reload the saved version (your text will then be offered to you).",
    conflictKeepMine: "Keep my text",
    conflictReload: "Reload",
    conflictKept: "Your text has been saved.",
    conflictKeepFailed:
      "Your text could not be saved. It is still kept on this device: please try again in a moment.",
    conflictSignedElsewhere:
      "This report has been signed in the meantime and can no longer be edited. Your text is still kept on this device.",
    conflictBeforeSign:
      "This report has been changed elsewhere. Keep your text or reload the page before signing.",
    saveFailedBeforeSign:
      "The text could not be saved. Check your connection, then sign again.",
    signedToast: "Report signed and sent to the clinic.",
    nextStudy: "Next examination",
    releaseConfirm:
      "Return this examination? It will be to assign again, the draft you started will be deleted and the clinic notified.",
    release: "Return the examination",
    sign: "Sign",
    claim: "Take on",
    signedBanner:
      "Report signed and sent: it can no longer be edited. Corrections are made with a dated, signed addendum.",
    correct: "Correct with an addendum",
    claimBanner:
      "Take the examination on to start the report. It is reserved for you until you sign it or return it.",
    urgentClaimBanner:
      "Urgent examination from your urgent list: take it on to start the report. The first to take it gets it.",
    priors: {
      title: (count: number) =>
        count > 1
          ? `${count} shared prior examinations`
          : "1 shared prior examination",
      signedReport: "Signed report",
      noReport: "No signed report",
      open: "Open the prior examination in a new tab",
    },
    clinicalInfo: "Clinical information",
    copyToIndication: "Copy into the clinical indication",
    indication: "Indication",
    panes: {
      label: "Displayed pane",
      images: "Images",
      report: "Report",
    },
  },
  sections: {
    titles: {
      indication: "Clinical indication",
      technique: "Technique",
      comparatif: "Comparison",
      resultats: "Findings",
      conclusion: "Conclusion",
    },
    placeholders: {
      indication: "Reason for the examination, clinical information provided…",
      technique: "Acquisition protocol, contrast, reconstructions…",
      comparatif: "Previous examinations available, or no comparison…",
      resultats: "Description by organ…",
      conclusion: "Diagnostic summary.",
    },
  },
  editor: {
    requiredTitle: "Section required before signing",
    requiredLabel: "Required section, currently empty",
    offline: "Offline: copy kept on this device",
    conflict: "Changed elsewhere: text kept on this device",
    outline: {
      label: "Report sections",
      filled: ", written",
      requiredEmpty: ", required and empty",
      optionalEmpty: ", optional and empty",
    },
    words: (count: number) => (count === 1 ? "1 word" : `${count} words`),
    find: "Find and replace (Ctrl+F)",
    reviewButton: (count: number) =>
      count === 0
        ? "Review: nothing to report"
        : count === 1
          ? "Review: 1 point to check"
          : `Review: ${count} points to check`,
    shortcuts: "Keyboard shortcuts",
    focusEnter: "Write in full screen",
    focusExit: "Exit full screen",
    hint: {
      type: "Type",
      slash:
        "at the start of a line to insert a standard phrase, a subheading or a measurement table;",
      tab: "to move to the next field to complete, then to the next section.",
    },
    review: {
      title: "Review",
      withFindings:
        "Points to check before signing. These are flags, not definite errors: you remain the sole judge of your text.",
      clean:
        "Nothing to report: consistent laterality, no template field left behind, measurements with their units.",
    },
  },
  review: {
    kinds: {
      laterality: "Laterality",
      placeholder: "Template",
      unit: "Unit",
      repeat: "Repetition",
    },
    sides: { droit: "right", gauche: "left" },
    lateralityFindings: (asked: string, described: string) =>
      `The clinical indication concerns the ${asked} side, but the findings describe only the ${described} side.`,
    lateralityConclusion: (side: string, other: string) =>
      `The conclusion mentions the ${side} side, which appears in neither the clinical indication nor the findings; these refer only to the ${other} side.`,
    placeholder: (text: string) => `Template text not completed: “${text}”.`,
    unit: (text: string) => `Measurement without a unit: “${text}”.`,
    repeat: (text: string) => `Repeated word: “${text}”.`,
  },
  aiReview: {
    title: "Advanced review",
    badge: "AI",
    run: "Review",
    rerun: "Review again",
    idle: "Looks for inconsistencies between sections and with the examination. Nothing in your text is changed.",
    running: "Review in progress…",
    unavailable:
      "Advanced review is unavailable at the moment. You can carry on and sign.",
    withFindings:
      "Passages to check. These are flags, not definite errors: you remain the sole judge of your text.",
    nothing:
      "No inconsistency found. This is not a validation: the review may miss an error.",
    stale: "The text has changed since this review.",
    clinicalInfo: "Clinical information",
    kinds: {
      contradiction: "Contradiction",
      omission: "Omitted from the conclusion",
      laterality: "Laterality",
      context_mismatch: "Inconsistent with the examination",
      measurement: "Discrepant measurement",
      question_unanswered: "Unanswered question",
      critical_finding: "Finding to report without delay",
    },
    quoted: (quote: string) => `“${quote}”`,
    related: (section: string, quote: string) =>
      `Compare with, in ${section}: “${quote}”`,
    go: "View",
    dismiss: "Dismiss",
  },
  toolbar: {
    label: "Formatting",
    undo: "Undo",
    redo: "Redo",
    subtitle: "Subheading",
    bold: "Bold",
    italic: "Italic",
    underline: "Underline",
    strike: "Strikethrough",
    highlight: "Highlight",
    superscript: "Superscript (cm², mm³)",
    subscript: "Subscript",
    bulletList: "Bulleted list",
    orderedList: "Numbered list",
    outdent: "Decrease indent",
    indent: "Increase indent",
    alignment: "Alignment",
    align: {
      left: "Align left",
      center: "Centre",
      right: "Align right",
      justify: "Justify",
    },
    table: "Table",
    addRow: "Add a row below",
    addColumn: "Add a column to the right",
    headerRow: "Header row",
    deleteRow: "Delete row",
    deleteColumn: "Delete column",
    deleteTable: "Delete table",
    insertTable: "Insert a table",
    tablePresets: {
      values: "2 × 2: value and measurement",
      lesions: "3 × 3: lesions and dimensions",
      followUp: "4 × 3: comparative follow-up",
    },
    symbols: "Special characters",
    insertSymbol: "Insert a symbol",
    symbolNames: {
      "±": "plus or minus",
      "×": "multiplied by (dimensions)",
      "°": "degree",
      µ: "micro",
      "²": "squared",
      "³": "cubed",
      "≤": "less than or equal to",
      "≥": "greater than or equal to",
      "<": "less than",
      ">": "greater than",
      "≈": "approximately",
      "→": "progressing to",
      "↑": "increase",
      "↓": "decrease",
      Ø: "diameter",
      "‰": "per mille",
    },
    clearFormatting: "Clear formatting",
  },
  shortcuts: {
    title: "Keyboard shortcuts",
    description:
      "The usual word-processor shortcuts, plus a few specific to reporting.",
    groups: [
      {
        title: "Text",
        entries: [
          { label: "Bold", keys: "Mod B" },
          { label: "Italic", keys: "Mod I" },
          { label: "Underline", keys: "Mod U" },
          { label: "Strikethrough", keys: "Mod ⇧ S" },
          { label: "Highlight", keys: "Mod ⇧ H" },
          { label: "Superscript", keys: "Mod ." },
          { label: "Subscript", keys: "Mod ," },
        ],
      },
      {
        title: "Structure",
        entries: [
          { label: "Subheading", keys: "Mod Alt 3" },
          { label: "Bulleted list", keys: "Mod ⇧ 8" },
          { label: "Numbered list", keys: "Mod ⇧ 7" },
          { label: "Indent within a list", keys: "Tab · ⇧ Tab" },
          { label: "Align left / centre", keys: "Mod ⇧ L · E" },
          { label: "Align right / justify", keys: "Mod ⇧ R · J" },
        ],
      },
      {
        title: "Writing",
        entries: [
          { label: "Standard phrases, table…", keys: "/" },
          {
            label: "Next / previous field to complete",
            keys: "Tab · ⇧ Tab",
          },
          {
            label: "Next / previous section",
            keys: "↓ · ↑ at section edge",
          },
          { label: "Find", keys: "Mod F" },
          { label: "Find and replace", keys: "Ctrl H" },
          { label: "Undo / redo", keys: "Mod Z · Mod ⇧ Z" },
          { label: "Exit full screen", keys: "Esc" },
        ],
      },
      {
        title: "Autocorrect",
        entries: [
          { label: "±", keys: "+/-" },
          { label: "≤ · ≥", keys: "<= · >=" },
          { label: "→ · ←", keys: "-> · <-" },
          { label: "…", keys: "..." },
        ],
      },
    ],
  },
  slash: {
    groups: { structure: "Structure", phrases: "Standard phrases" },
    insert: "Insert",
    noMatch: "No matching command.",
    items: {
      subtitle: {
        title: "Subheading",
        hint: "An organ, a region",
        keywords: "heading title organ region",
      },
      paragraph: {
        title: "Paragraph",
        hint: "Body text",
        keywords: "text normal body",
      },
      bullets: { title: "Bulleted list", hint: "", keywords: "bullets list" },
      numbers: {
        title: "Numbered list",
        hint: "",
        keywords: "numbers list order",
      },
      table: {
        title: "Measurement table",
        hint: "3 columns, header row",
        keywords: "table measurements dimensions",
      },
    },
  },
  find: {
    label: "Search the report",
    placeholder: "Search the report",
    noResult: "No results",
    previous: "Previous match (Shift+Enter)",
    next: "Next match (Enter)",
    matchCase: "Match case",
    replace: "Replace",
    close: "Close (Esc)",
    replaceWith: "Replace with",
    replaceAll: "Replace all",
  },
  sign: {
    title: "Sign the report",
    description: {
      before: "The report for",
      middle: (signer: string) =>
        `will be signed in the name of ${signer}, then sent to the clinic. It will become`,
      locked: "final and locked",
      after:
        ": any later correction will take the form of an addendum, visible to the clinic.",
    },
    missing: (count: number) =>
      count === 1
        ? "A required section is empty"
        : `${count} required sections are empty`,
    review: (count: number) =>
      count === 1
        ? "Review: 1 point to check"
        : `Review: ${count} points to check`,
    signAnyway: "If this is intended, you can sign as it stands.",
    stillDraft: "The report remains a draft.",
    failed:
      "Signing failed. The report remains a draft; your changes have been kept.",
    keepWriting: "Continue writing",
    confirmAnyway: "Sign anyway",
    confirm: "Sign and send",
  },
  signPin: {
    applied: "Applied to the PDF",
    appliedNone:
      "No accepted signature or stamp: the PDF will carry your name and registration number.",
    signatureAlt: "Your signature, applied to the PDF",
    stampAlt: "Your stamp, applied to the PDF",
    settings: "Manage in settings",
  },
  viewer: {
    frameTitle: (uid: string) => `Images for examination ${uid}`,
    series: (count: number) => (count === 1 ? "1 series" : `${count} series`),
    images: (count: number, formatted: string) =>
      `${formatted} ${count === 1 ? "image" : "images"}`,
    simulated: "Simulated images",
    openFullscreen: "Open the images in full screen",
    fullscreen: "Full screen",
    closeFullscreen: "Leave the full-screen image view",
    exitFullscreen: "Exit full screen",
    archivedTitle: "Images archived",
    archivedBefore:
      "The retention period set in the clinic’s contract ended on",
    archivedAfter:
      ": the images have left the platform. The report can still be viewed, and the originals are kept by the clinic.",
    unavailableTitle: "Images unavailable",
    unavailableDetail:
      "The images could not be loaded. Reload the page; if the problem persists, the examination may still be transferring from the clinic.",
    /** What is unavailable in the demo. */
    name: "The viewer",
    reopened:
      "The image session had expired: the viewer was reopened on the examination.",
    reopenFailed:
      "The images can no longer be displayed. Reload the page to reopen the examination.",
  },
  /** Opening the examination in Weasis, installed on the computer. */
  weasis: {
    open: "Open in Weasis",
    openShort: "Weasis",
    openHint: "Open the examination in Weasis, installed on this computer",
    name: "Opening in Weasis",
    opening: "Opening the examination in Weasis…",
    help: "Weasis help",
    dialogTitle: "Open the examination in Weasis",
    dialogIntro:
      "Weasis is a free DICOM viewer installed on your computer, with native reconstructions (MPR, MIP, MinIP). The IMAFRIK viewer stays alongside it, unchanged.",
    notOpened: "Weasis didn’t open? It may not be installed on this computer.",
    stepsTitle: "Install Weasis, once per computer",
    steps: [
      "Download Weasis from its official site: Windows (.msi), macOS (.pkg, Apple silicon or Intel) or Linux.",
      "Install it with the default options; on a managed computer, your IT department may need to do it.",
      "Come back here, click “Open in Weasis” again and accept the browser’s request to open Weasis.",
    ],
    download: "Download Weasis (official site)",
    oneAtATime:
      "Weasis opens in an IMAFRIK profile, separate from your usual Weasis, and shows only the examination sent by IMAFRIK there, one at a time: it imports no files, CDs or other images, and you drop no files into it. Each opening replaces the previous one. The link is valid for five minutes and works once.",
    privacy:
      "Opened from IMAFRIK, Weasis offers no export, no sending to another PACS, and no saving or copying of images. It keeps the images on this computer while it is open and deletes them when it closes: close it after each read, make no copies (screenshot or photo of the screen, printing, copy of its temporary folder), and only use it on a computer with your own user session and an encrypted disk, as the practice agreement requires.",
    close: "Close",
  },
  scan: {
    label: (slice: number, total: number) =>
      `Simulated slice ${slice} of ${total} (demo)`,
    series: "Series 2 · Axial",
    window: "W 400 · L 40",
    thickness: "Thk 1.0 mm",
    right: "R",
    left: "L",
  },
  templates: {
    description:
      "Apply them from the reading screen; create them from a report in progress",
    emptyTitle: "No templates",
    emptyDetail:
      "On the reading screen, “Save as template” turns the current text into a template for the whole organisation.",
    search: "Search for a template",
    searchPlaceholder: "Name, region…",
    modality: "Modality",
    allModalities: "All",
    noMatch: "No template matches this search.",
    allRegions: "All regions",
    anyModality: "All modalities",
    organisation: "Organisation",
    providedByImafrik: "Provided by IMAFRIK",
    noneSelected: "No template selected",
    modalityNames: {
      CT: "CT",
      MR: "MRI",
      CR: "Radiography",
      DX: "Radiography",
      US: "Ultrasound",
      MG: "Mammography",
    },
    deleteConfirm: (name: string) =>
      `Delete the template “${name}” for the whole organisation?`,
    deleted: "Template deleted.",
    picker: "Template",
    pickerLabel: "Complete the empty sections",
    applied: (count: number) =>
      count === 1
        ? "Template applied: 1 section completed."
        : `Template applied: ${count} sections completed.`,
    nothingApplied:
      "All sections already contain text: nothing has been replaced.",
    saveAs: "Save as template",
    saveAsDescription:
      "The current text of the five sections becomes a template, offered to your colleagues for examinations of the same modality. First remove anything specific to this patient.",
    name: "Template name",
    namePlaceholder: "Normal chest CT",
    region: "Region",
    saved: "Template saved.",
    nameRequired: "Give the template a name",
    createDemoAction: "Creating a template",
    deleteDemoAction: "Deleting a template",
  },
  addenda: {
    title: "Addenda",
    license: (number: string) => `Reg. no. ${number}`,
    none: "No corrections since signing.",
    dialogTitle: "Sign the addendum",
    dialogDescription:
      "It will be signed in your name, visible to the clinic, and can no longer be changed.",
    added: "Addendum added and sent.",
    label: "New addendum",
    placeholder: "Correction or addition to the signed report…",
    submit: "Sign the addendum",
  },
  actions: {
    releaseDemoAction: "Returning an examination",
    signDemoAction: "Signing",
    pdfDemoAction: "Downloading the PDF",
    addendumDemoAction: "Adding an addendum",
    aiReviewDemoAction: "Advanced review",
    invalidDraft: "Invalid draft.",
    addendumEmpty: "The addendum is empty.",
    addendumTooLong: "The addendum exceeds 10,000 characters.",
  },
};
