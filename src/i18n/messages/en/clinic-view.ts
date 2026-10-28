import type { AppMessages } from "@/i18n/messages/fr";

/** Clinic view, in English: IMAFRIK opens a clinic manager’s screens in view-only mode. */
export const clinicView: AppMessages["clinicView"] = {
  picker: {
    choose: "Choose a clinic",
    label: "Clinic being viewed",
    change: "Switch clinic",
    empty: "No clinic connected",
  },
  banner: {
    region: "Clinic view",
    title: (name: string) => `Viewing ${name}`,
    detail: "Its manager’s screens, with its data, in view-only mode.",
    suspended: "Clinic suspended: its manager no longer has access.",
    sheet: "Clinic page",
    back: "Back to the console",
  },
  chooser: {
    title: "Clinic view",
    description: "Choose a clinic: its screens open as its manager sees them.",
    empty: "No clinic is connected to the platform yet.",
  },
  team: {
    noManager:
      "This clinic has no manager: only the IMAFRIK team sees its screens.",
    soleManager:
      "The clinic has a single manager: it would be left without cover in their absence.",
    urgentList: "Urgent list",
  },
  activity: {
    plan: "Subscription plan",
  },
  reports: {
    teamDownload:
      "A PDF downloaded by the IMAFRIK team does not mark the report as delivered to the clinic.",
  },
};
