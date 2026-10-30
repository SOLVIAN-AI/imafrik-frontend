import type { AppMessages } from "@/i18n/messages/fr";

/**
 * “Your ideas”: improvement ideas from radiologists and clinic managers,
 * and the inbox where the IMAFRIK team follows them up, in English.
 */
export const ideas: AppMessages["ideas"] = {
  title: "Your ideas",
  description:
    "An idea to improve IMAFRIK? Share it: the team reads it, answers you and keeps you posted at every step.",
  shortcut: "Suggest an idea for this screen",
  form: {
    title: "Suggest an idea",
    intro:
      "Whatever would save you time, or bring clarity or safety to your daily work.",
    titleLabel: "Title",
    titlePlaceholder: "In a few words",
    bodyLabel: "Description",
    bodyPlaceholder:
      "What gets in your way today, and what you would like instead.",
    counter: (count: number, max: number) => `${count} of ${max}`,
    categoryLabel: "Category",
    benefitLabel: "It would bring me",
    benefitInfo:
      "Optional: what the idea would bring you first. The team uses it to rank ideas.",
    benefitNone: "Not sure",
    patientTitle: "Never a patient’s identity",
    patientWarning:
      "Do not write a patient’s name, identifier or date of birth, not even as an example: describe the situation, not the person. No screenshot is attached.",
    contextLabel: "Attached context",
    contextInfo:
      "The screen name, the application version and the type of device help the team understand the idea. Never the page address nor an image.",
    contextScreen: (screen: string) => `“${screen}” screen`,
    contextNoScreen: "No specific screen",
    contextVersion: (version: string) => `version ${version}`,
    attachContext: "Attach this context",
    submit: "Send the idea",
    sent: "Thank you! Your idea has been sent: the IMAFRIK team will read it.",
    errors: {
      titleShort: (min: number) =>
        `The title needs at least ${min} characters.`,
      titleLong: (max: number) => `The title can be at most ${max} characters.`,
      bodyShort: (min: number) =>
        `Describe the idea in at least ${min} characters.`,
      bodyLong: (max: number) =>
        `The description can be at most ${max} characters.`,
      category: "Choose a category.",
      responseLong: (max: number) =>
        `The answer can be at most ${max} characters.`,
    },
  },
  mine: {
    title: "My ideas",
    empty: "No ideas yet",
    emptyDetail:
      "The ideas you suggest appear here, with their status and the IMAFRIK team’s answer.",
    proposedOn: "Suggested on",
    response: "Answer from the IMAFRIK team",
    grouped:
      "Grouped with a similar idea received earlier: it follows that idea’s status.",
  },
  categories: {
    reading: "Reading and viewer",
    reporting: "Report and dictation",
    assignment: "Assignment and schedule",
    studies: "Examinations and image upload",
    billing: "Billing",
    other: "Other",
  },
  benefits: {
    time: "Time",
    clarity: "Clarity",
    safety: "Safety",
  },
  benefitTags: {
    time: "Saves time",
    clarity: "Adds clarity",
    safety: "Adds safety",
  },
  status: {
    received: "Received",
    under_review: "Under review",
    planned: "Planned",
    shipped: "Shipped",
    declined: "Not taken forward",
  },
  statusPlural: {
    received: "Received",
    under_review: "Under review",
    planned: "Planned",
    shipped: "Shipped",
    declined: "Not taken forward",
  },
  statusLabel: "Status",
  statusInfo:
    "Received: not read yet. Under review: the team is looking into it. Planned: in an upcoming release. Shipped: available. Not taken forward: not for now.",
  devices: {
    desktop: "computer",
    tablet: "tablet",
    phone: "phone",
  },
  inbox: {
    title: "Ideas",
    description: (total: number, fresh: number) =>
      `${total} idea${total === 1 ? "" : "s"} suggested, ${fresh} received and waiting to be read`,
    searchLabel: "Search for an idea",
    searchPlaceholder: "Title, text, author…",
    empty: "No ideas received",
    emptyDetail:
      "Radiologists and clinic managers suggest their ideas from “Your ideas”.",
    truncated: (shown: number, total: number) =>
      `The ${shown} most recent ideas out of ${total}.`,
    unknownAuthor: "Deleted account",
    noOrganization: "No organisation",
    context: "Context",
    noContext: "No context",
    responseLabel: "Answer to the author",
    responsePlaceholder:
      "What the team thinks, what is planned. The author reads it in “Your ideas” and receives it by email.",
    groupLabel: "Same idea as…",
    groupInfo:
      "Links this idea to a main idea that asks for the same thing: it follows that idea’s status, and its author is told.",
    groupNone: "None: main idea",
    groupSearch: "Search for a main idea",
    groupNoMatch: "No idea matches.",
    groupMatches: (count: number) =>
      count === 0 ? "No idea" : count === 1 ? "1 idea" : `${count} ideas`,
    groupedUnder: (title: string) => `Same idea as “${title}”`,
    duplicates: (count: number) =>
      count === 1 ? "1 idea grouped with it" : `${count} ideas grouped with it`,
    followsMain: "Follows the main idea’s status",
    respondedBy: (name: string) => `Answered by ${name}`,
    saved: "Idea updated",
    savedNotified: "Idea updated: the author is notified by email",
  },
  demoActions: {
    submit: "Sending an idea",
    tracking: "Following up an idea",
  },
};
