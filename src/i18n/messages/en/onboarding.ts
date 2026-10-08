import type { AppMessages } from "@/i18n/messages/fr";

/** Onboarding journey, in English. */
export const onboarding: AppMessages["onboarding"] = {
  steps: {
    clinic: {
      profil: {
        title: "Your profile",
        lead: "Your name, as it will appear in the access log.",
      },
      lecture: {
        title: "Who reads your examinations",
        lead: "Your own radiologists, or all those on the platform.",
      },
      "premier-envoi": {
        title: "First examination",
        lead: "One examination, sent through the gateway or from this browser, to confirm the connection.",
      },
      equipe: {
        title: "Team",
        lead: "The people who will follow your examinations day to day.",
      },
      termine: { title: "Done", lead: "Your service is up and running." },
    },
    radiologist: {
      profil: {
        title: "Your profile",
        lead: "What will be printed below your signature, and the registration number the IMAFRIK team will verify.",
      },
      termine: {
        title: "Done",
        lead: "Your profile is saved.",
      },
    },
    admin: {
      profil: {
        title: "Your profile",
        lead: "Your name, as it will appear in the audit log.",
      },
      termine: { title: "Done", lead: "The back office is waiting for you." },
    },
  },
  help: "Need help?",
  backToStep: (title: string) => `Go back to the step: ${title}`,
  continue: "Continue",
  skip: "Skip this step",
  profile: {
    fullName: "Full name",
    title: "Title",
    titleHintRadiologist:
      "Printed before your name, for example “Dr” or “Prof”.",
    titleHintStaff: "Your position in the facility.",
    license: "Registration number",
    licenseHint:
      "Printed below your signature. The IMAFRIK team checks it with the medical council before giving access to examinations.",
  },
  reading: {
    legend: "Who reads your examinations",
    poolTitle: "All radiologists on the platform",
    poolDetail:
      "Your examinations join the shared worklist; the first available radiologist takes them on.",
    ownTitle: "Our own radiologists only",
    ownDetail:
      "Only the radiologists you invite to your team will see your examinations.",
    note: "You can change this setting at any time in Settings.",
  },
  firstStudy: {
    waiting: "Waiting for an examination…",
    received: "An examination has arrived: the connection is working.",
    instructions:
      "Send an examination from your console, or upload it below. This screen updates automatically.",
  },
  team: {
    intro:
      "Invite the people who will follow your examinations, and the radiologists you employ. Each of them receives a link and chooses their own password.",
  },
  done: {
    openDashboard: "Open the dashboard",
    openWorklist: "Open the worklist",
    openControlTower: "Open the control tower",
    ready: "Everything is set up.",
    pendingTitle: "Your registration number is being verified.",
    pendingDetail:
      "The IMAFRIK team checks it with the medical council before opening your worklist: a signed report commits a physician. Examinations will appear as soon as it is verified; there is nothing else you need to do.",
    missingTitle: "Your registration number is still missing.",
    missingDetail:
      "Without it, the IMAFRIK team cannot approve your access to examinations. Go back to the previous step, or add it later in your settings.",
  },
};
