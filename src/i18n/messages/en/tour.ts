import type { AppMessages } from "@/i18n/messages/fr";

/** Guided tours, in English. */
export const tour: AppMessages["tour"] = {
  ui: {
    next: "Next",
    previous: "Back",
    finish: "Finish",
    skip: "Skip the tour",
    progress: (step: number, total: number) => `Step ${step} of ${total}`,
  },
  help: {
    button: "Help",
    tourOfHome: "Guided tour of the home screen",
    training: "Practise in the training area",
    contact: "Write to the IMAFRIK team",
    replayHere: "Replay this screen’s tour",
  },
  tours: {
    "radiologue-file": {
      welcome: {
        title: "Welcome to IMAFRIK",
        body: "In one minute, here is where to find your examinations, how to open them and where to practise. You can replay this tour at any time from the help button.",
      },
      worklist: {
        title: "The worklist",
        body: "Examinations sent by clinics arrive here, sorted by deadline. The counter shows how many are waiting for a reader; it turns red while an urgent examination is not reported.",
      },
      metrics: {
        title: "The essentials at a glance",
        body: "Examinations to claim, unclaimed urgent ones, overdue ones and the next deadline: these figures refresh with the worklist, every thirty seconds.",
      },
      filters: {
        title: "Filter the worklist",
        body: "Keep a single modality or a single clinic. The filter stays in the page address, so it survives a reload.",
      },
      table: {
        title: "Open an examination",
        body: "Click a row, or move through the list with J and K, then Enter. The deadline shows the time left before the promised turnaround.",
      },
      mine: {
        title: "Your examinations",
        body: "The ones you have claimed, until they are signed: find them here without searching the worklist.",
      },
      training: {
        title: "Practise safely",
        body: "Sample examinations to learn the reading screen: nothing you do there reaches a patient or a clinic.",
      },
      search: {
        title: "Find anything",
        body: "A patient, an examination, a screen: type a few letters. The ⌘ K or Ctrl K shortcut opens it from anywhere.",
      },
      help: {
        title: "Need help?",
        body: "This button replays this tour, opens the training area, or puts you in touch with the IMAFRIK team.",
      },
    },
    lecture: {
      viewer: {
        title: "The images",
        body: "Scroll through slices with the mouse wheel, adjust the window and measure with the viewer tools. Full screen enlarges the images.",
      },
      clinical: {
        title: "Clinical information",
        body: "What comes with the examination. While your report’s indication is empty, one click copies it there.",
      },
      claim: {
        title: "Claim the examination",
        body: "Claim the examination to write its report. On a real examination it is then reserved for you: nobody else can write it, and you can return it to the pool at any time.",
      },
      editor: {
        title: "The report",
        body: "Five sections, saved automatically as you write. Type / at the start of a line to insert a standard phrase.",
      },
      templates: {
        title: "Your templates",
        body: "A template fills the sections that are still empty: you only correct what differs. Your own templates are saved from any text.",
      },
      sign: {
        title: "Sign",
        body: "Signing locks the text and produces the PDF; on a real examination it carries a verification QR code. Any later correction is an addendum.",
      },
      back: {
        title: "Back to the list",
        body: "This button takes you back to the list you came from. This tour can be replayed from the help button in the bar.",
      },
    },
    "clinique-accueil": {
      welcome: {
        title: "Welcome to IMAFRIK",
        body: "In one minute, here is how to send an examination, follow its reading and get its report.",
      },
      send: {
        title: "Send an examination",
        body: "Drop the DICOM files or a CD folder. Your facility’s console can also send examinations on its own.",
      },
      stats: {
        title: "Follow the activity",
        body: "Examinations sent, being read, reports ready, and the median time from receipt to signature, over thirty days.",
      },
      ready: {
        title: "Get the reports",
        body: "As soon as a report is signed, it appears here, ready to download as a PDF.",
      },
      studies: {
        title: "Your examinations",
        body: "Each examination from sending to signature. On its page, you can flag it as urgent and complete the clinical information.",
      },
      team: {
        title: "Your team",
        body: "Invite colleagues from your facility: everyone has their own account.",
      },
      help: {
        title: "Need help?",
        body: "This button replays this tour, or puts you in touch with the IMAFRIK team.",
      },
    },
    "equipe-cockpit": {
      welcome: {
        title: "The control tower",
        body: "It shows the state of the platform and what needs action. Here are the screens to know.",
      },
      alerts: {
        title: "What needs your attention",
        body: "Overdue examinations, radiologist files to review, examinations refused on arrival: each alert leads to the screen where you act.",
      },
      accounts: {
        title: "Accounts",
        body: "Review radiologist files, attach an account to an organisation, reset two-factor authentication.",
      },
      organisations: {
        title: "Organisations",
        body: "Clinics and radiology groups, their contracts and settings.",
      },
      training: {
        title: "Training",
        body: "Preview sample cases before they are published, and see who has practised on the accounts page.",
      },
      help: {
        title: "Need help?",
        body: "This button replays this tour at any time, and opens the training area.",
      },
    },
  },
};
