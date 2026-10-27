import type { pages as fr } from "@/i18n/messages/fr/help-pages";

/** Each screen’s help, by role, in English. */
export const pages: typeof fr = {
  radiologist: {
    worklist: {
      title: "To read",
      purpose:
        "Your group’s worklist: the examinations still to be reported, sorted by deadline. You see what you have claimed, what is free to claim and what a colleague is already reading.",
      steps: [
        "Check the indicators: “To claim”, “Unclaimed urgent”, “Overdue” and “Next deadline”.",
        "Filter by modality or clinic, click “Urgent only”, or search for a patient.",
        "Finish the “Claimed by you” section first, then pick from “To claim”, sorted by deadline.",
        "Click a row (or J, K then Enter) to open the examination, then click “Claim” on the reading screen.",
        "Keep the page open: the worklist refreshes automatically every 30 seconds and flags each new urgent examination.",
      ],
      terms: [
        "examen",
        "urgence",
        "delaiPromis",
        "priseEnCharge",
        "renseignementClinique",
      ],
    },
    myStudies: {
      title: "My examinations",
      purpose:
        "The examinations you have claimed that are still to be reported, sorted by deadline. You find them here without searching the worklist.",
      steps: [
        "Spot the most pressing ones: the “Deadline” column shows the time left, closest first.",
        "Click a row to reopen the examination on the reading screen and continue its report.",
        "Sign the report: the examination leaves this list and moves to your “Reports”.",
        "If the list is empty, claim an examination from the “To read” worklist.",
      ],
      terms: ["examen", "priseEnCharge", "delaiPromis", "signature"],
    },
    training: {
      title: "Training",
      purpose:
        "Real, anonymised examinations to read and report in the real reading screen, with no patient or clinic involved. Training is open to you even before your file is approved.",
      steps: [
        "Read “The workflow, as on a real examination” at the top of the page.",
        "Choose an exercise by its modality, body region and status: “To do”, “In progress” or “Signed”.",
        "Click “Start” to open a new exercise, or “Resume” to continue the one in progress.",
        "Click “Review” to reread a signed exercise, and its model answer when the card shows “Model answer available”.",
      ],
      terms: ["exercice", "priseEnCharge", "specimen", "corrige"],
    },
    trainingExercise: {
      title: "Training exercise",
      purpose:
        "An exercise in the real reading screen, on a real anonymised examination. Nothing you do here reaches a patient or a clinic: the signed exercise is sent to no one.",
      steps: [
        "Read the “Task” and the clinical information, then go through the images in the viewer.",
        "Click “Start the exercise”, then write the sections, using “Template” if needed.",
        "Click “Sign the exercise” and confirm: the text is then locked, like a real report.",
        "Click “Download the specimen PDF”, then compare your text with the “Model answer” when there is one.",
        "Add to it with “Add the addendum”, or click “Start the exercise again” to start from scratch.",
      ],
      terms: ["exercice", "viewer", "specimen", "corrige", "addendum"],
    },
    reports: {
      title: "Reports",
      purpose:
        "The reports you have signed. Each one opens as it was signed, with its PDF, its verification link and its addenda.",
      steps: [
        "Type a patient name, an ID or a modality in the search box.",
        "Click a row to open the report as it was signed.",
        "From the open report, download the PDF or add an addendum.",
        "Click “Next page” at the bottom of the list to see more reports.",
      ],
      terms: ["compteRendu", "signature", "addendum"],
    },
    report: {
      title: "Report",
      purpose:
        "A report as it was signed: it can no longer be edited. You can download its PDF and correct it with an addendum, dated, signed and visible to the clinic.",
      steps: [
        "Check the banner: “Signed by”, “Date signed” and the “Public verification” link.",
        "Click “Download PDF” to get the signed document.",
        "To correct it, write in “New addendum”, then click “Sign the addendum”.",
        "Enter your personal code to confirm: the addendum appears below the document, dated and signed.",
      ],
      terms: ["compteRendu", "addendum", "codePersonnel", "codeVerification"],
    },
    templates: {
      title: "Templates",
      purpose:
        "Report templates from your organisation and those provided by IMAFRIK. You read them here in full; they are applied and created on the reading screen.",
      steps: [
        "Search for a template by name or region, or filter by modality.",
        "Click a template to read its full text, exactly as it will be applied.",
        "On the reading screen, click “Template” to complete the sections that are still empty.",
        "To create one, click “Save as template” from a report in progress.",
        "Delete one of your organisation’s templates with “Delete”; those “Provided by IMAFRIK” cannot be deleted.",
      ],
      terms: ["modele", "organisation", "compteRendu"],
    },
    settings: {
      title: "Settings",
      purpose:
        "Your radiologist file, verified by the IMAFRIK team before your access to examinations is opened, what is applied when you sign, your profile and your account security.",
      steps: [
        "Under “Practice and documents”, save your practice, then upload your supporting document with “Choose a file” and “Send”.",
        "Under “Signature and stamp”, click “Draw” or “Upload”, then “Send for review”.",
        "Create your six-digit personal code with “Create the code”: it is requested at every signature and every addendum.",
        "Check your “Profile”; changing your name or registration number requires a new check by the IMAFRIK team.",
        "Enable “Two-factor authentication” if it is not on yet, and find the texts you accepted under “Agreements”.",
      ],
      terms: [
        "justificatif",
        "cachet",
        "codePersonnel",
        "doubleAuthentification",
        "engagement",
      ],
    },
    reading: {
      title: "Reading screen",
      purpose:
        "Where you read an examination and write its report: the images in the viewer on the left, the report on the right. Once signed, the report goes to the clinic and can no longer be edited.",
      steps: [
        "Read the “Clinical information”, then go through the images in the viewer; “Full screen” enlarges them.",
        "Click “Claim”: the examination is reserved for you until you sign it, or until “Return to pool”, which deletes the draft.",
        "Write the sections, using “Template” to fill those still empty; the text is saved automatically.",
        "Click “Sign”, check the flagged points, enter your personal code, then click “Sign and send”.",
        "Click “Next examination” to move on; to correct a signed report, click “Correct with an addendum”.",
      ],
      terms: [
        "viewer",
        "renseignementClinique",
        "priseEnCharge",
        "pool",
        "codePersonnel",
      ],
    },
  },
  clinic: {
    dashboard: {
      title: "Dashboard",
      purpose:
        "Your clinic’s starting point: signed reports to download, the latest examinations you sent, and activity over the last 30 days.",
      steps: [
        "Read the four figures: examinations sent, being read, reports ready, and the median turnaround over 30 days.",
        "Under “Reports to download”, click “Download PDF” to get a signed report.",
        "Click a patient’s name to read the full report before downloading it.",
        "Follow what you sent under “Latest examinations sent”: each status shows on the right, and “Urgent” marks an urgent examination.",
        "Click “Send an examination” to send new images, or “See all” to open the full list.",
      ],
      terms: ["compteRendu", "examen", "codeVerification", "urgence"],
    },
    send: {
      title: "Send an examination",
      purpose:
        "Send an examination from your browser without installing anything, for example one burnt on a CD. If your facility has the IMAFRIK gateway, examinations are sent automatically and this page lets you check they arrive.",
      steps: [
        "Drag the examination’s DICOM files into “Upload from this browser”, or click “Choose files”.",
        "For a CD, click “Choose a folder” and select the whole folder: the index and any files that are not images are set aside.",
        "Watch each file’s status (“Uploaded”, “Already received”, “Rejected”). The examination appears in your list within a minute.",
        "If you have a gateway, check the date shown after “Last examination received”.",
        "If an examination you sent does not appear, run the script named on screen on the gateway computer, then refer to the guide supplied at installation.",
      ],
      terms: ["examen", "dicom", "passerelle"],
    },
    studies: {
      title: "Examinations",
      purpose:
        "All the examinations your clinic has sent, with their status and the status of their report. This is where you find a specific case.",
      steps: [
        "Type a patient name, an ID or a modality in the search box, then press Enter.",
        "Read each examination’s status: “Waiting”, “Being read”, “Ready to download” or “Downloaded”. A red edge and “Urgent” mark urgent ones.",
        "In the “Report” column, look for documents marked “To download”.",
        "Click a row to open the examination page.",
        "Click “Refresh” to see the latest changes, or “Send” to send a new examination.",
      ],
      terms: ["examen", "compteRendu", "urgence"],
    },
    study: {
      title: "Examination page",
      purpose:
        "Everything about one examination: its images, reading progress and, once signed, its report. Until the report is signed, you can flag the examination as urgent and complete the clinical information.",
      steps: [
        "Follow the reading under “Progress”, from “Examination received” to “Report delivered”.",
        "If the examination cannot wait, tick “Urgent examination”. Nothing reaches the radiologist until you click “Save”.",
        "Describe the context and your question for the radiologist under “Clinical information”, then click “Save”.",
        "Click “Open images” to view the examination in the viewer.",
        "Once the report is signed, click “Download PDF”, or “Full document” to open it.",
      ],
      terms: [
        "urgence",
        "renseignementClinique",
        "delaiPromis",
        "viewer",
        "compteRendu",
      ],
    },
    reports: {
      title: "Reports",
      purpose:
        "Signed reports sent to your facility. Find a document by patient and download its PDF.",
      steps: [
        "Search by patient name, ID or modality, then press Enter.",
        "Look for “To download”: your clinic has not downloaded that report yet.",
        "Click “PDF” at the end of the row to download it. It then shows as “Downloaded”.",
        "Click a row to open the report, for example to download again a PDF you already have.",
      ],
      terms: ["compteRendu", "signature", "examen"],
    },
    report: {
      title: "Report",
      purpose:
        "The report exactly as the radiologist signed it. It can no longer be changed: any correction appears below it, dated and signed.",
      steps: [
        "Check the signer, the date signed and, when shown, their registration number at the top.",
        "Click “Download PDF” to get the signed document.",
        "Read the “Addenda” section below the text, if there is one: it holds corrections made after signing.",
        "Open the “Public verification” link: this is the page where a patient or a colleague checks that the document is authentic.",
      ],
      terms: ["compteRendu", "signature", "addendum", "codeVerification"],
    },
    team: {
      title: "Team",
      purpose:
        "The members of your facility who have access to IMAFRIK, with their role. Everyone has their own account, and this is where you invite or remove colleagues.",
      steps: [
        "Click “Invite”, then enter the person’s full name and email address.",
        "Choose their role: “Clinic” for staff, or “Radiologist”. A radiologist can only access examinations once their registration number has been verified.",
        "Click “Send invitation”: the person receives a link by email and chooses their own password.",
        "To remove a member, open the menu at the end of their row and choose “Remove from team”. Their access ends immediately.",
      ],
      terms: ["organisation", "habilitation"],
    },
    settings: {
      title: "Settings",
      purpose:
        "Your personal settings and your clinic’s. The key one is “Who reads your examinations”: every radiologist on the platform, or only those on your team. Each block is saved separately.",
      steps: [
        "Under “Profile” and “Language”, check your name, your position and the language of your screens, then click “Save” in each block.",
        "Under “Who reads your examinations”, choose “All radiologists on the platform” or “Our own radiologists only”, then click “Save”.",
        "With “Our own radiologists only”, make sure your radiologists also cover nights and weekends.",
        "To change your password, fill in the three fields and click “Change password”. Check that two-factor authentication shows “Enabled”.",
        "Under “Agreements”, click “Download my copy” to get the service agreement you accepted.",
      ],
      terms: ["pool", "priseEnCharge", "doubleAuthentification", "engagement"],
    },
  },
  admin: {
    cockpit: {
      title: "Control tower",
      purpose:
        "Shows the platform’s status right now: alerts, reading queues, turnaround commitments, network and operations. Each block leads to the screen with the details. Figures are calculated when the page opens: reload it to refresh them.",
      steps: [
        "Start with the alerts at the top of the page: those followed by an arrow open the screen where you can act.",
        "Read the four counters: “Awaiting reading”, “Overdue”, “Being read” and “Signed today”.",
        "In “Turnaround commitments”, check the share of urgent and routine examinations reported on time over thirty days.",
        "In “Network”, click a row, such as “Requests to handle”, to open the matching screen.",
        "In “Operations”, look for a failed or late task, then open “System” for details.",
      ],
      terms: ["delaiPromis", "urgence", "examen", "passerelle"],
    },
    analytics: {
      title: "Activity",
      purpose:
        "Analyses activity over a period: volumes received, reporting turnaround, the duration of each stage of an examination’s journey, arrival times and modalities, then the same figures by clinic and by radiologist.",
      steps: [
        "Choose the period at the top of the page: 7 d, 30 d, 90 d or 1 year.",
        "Keep “Whole network” or pick a clinic from the list to see its activity only.",
        "Read the period totals, then compare “Reporting turnaround” with the routine commitment line.",
        "In “Examination journey”, find the highlighted stage: it is the longest one.",
        "In “By clinic”, click a name to show that clinic only, and look for throughput values flagged in colour.",
      ],
      terms: ["delaiPromis", "urgence", "priseEnCharge", "passerelle", "pacs"],
    },
    flow: {
      title: "Image flow",
      purpose:
        "Follows the latest examinations received, from acquisition to report delivery, with their receiving throughput and the duration of each stage. Open it when a clinic reports a delay: you can see whether the cause is the link, the queue or the reading.",
      steps: [
        "Pick a clinic from the “Whole network” list to follow its examinations only.",
        "Read the summary: “Median throughput”, “Median transmission”, “Volume received” and “In queue”.",
        "Go through the list, most recent first: clinic, throughput, stage timeline, status and radiologist.",
        "Find the longest stage on the timeline using the legend: Transmission, Transfer, Queue, Reading, Delivery.",
        "Look for throughput values shown in colour: they flag a slow link between the gateway and the central PACS.",
      ],
      terms: ["examen", "passerelle", "pacs", "priseEnCharge", "compteRendu"],
    },
    organisations: {
      title: "Organisations",
      purpose:
        "Lists the platform’s clinics and radiology groups: members, examinations received over 30 days, last sent, PACS connection and status. This is where you create a clinic.",
      steps: [
        "Click “New clinic”, then enter the facility name, the city and the report language.",
        "Tick “Examinations open to the platform’s radiologists” if needed, then click “Create the clinic”: its page opens.",
        "Then click a clinic’s name to open its page and connect its gateway.",
        "Look for “PACS not connected” and any “Last sent” shown in colour, older than 24 hours: the gateway may have stopped.",
        "On a row, use the icons to invite someone or set the AI features, or click “Suspend” to cut off access for its members.",
      ],
      terms: ["organisation", "groupe", "pool", "contratService", "pacs"],
    },
    organisation: {
      title: "Clinic page",
      purpose:
        "Follows a clinic’s onboarding and its activity over thirty days. From here you connect its gateways with a code, set image retention, the report language and logo, and can end the contract.",
      steps: [
        "Follow “Onboarding”: the first step not yet completed is the one that calls for action.",
        "In “Connect a gateway”, click “Issue a code”: it is valid for 15 minutes, once only, and will not be shown again.",
        "Read the code out to the installer, or send it over an encrypted channel: they enter it in the installation kit, on the workstation.",
        "When the workstation shows “Awaiting approval” under “Gateways”, check it with the clinic, then click “Approve”.",
        "If needed, set the image retention, the report language and the watermark logo.",
      ],
      terms: [
        "passerelle",
        "codeEnrolement",
        "pool",
        "contratService",
        "compteRendu",
      ],
    },
    gateways: {
      title: "Gateways",
      purpose:
        "Overview of the gateways of every clinic: status, address, certificate, heartbeat. The screen also shows what prevents the server from enrolling, the task that applies trust to the PACS, and the installation kit.",
      steps: [
        "Read the banners at the top first: what the server is missing to enrol, then the alerts.",
        "Filter by status, for example “Awaiting approval”, to see the workstations waiting for a decision.",
        "Click “Approve” or “Reject” on the row, or the workstation name to open its page.",
        "In “Applying trust to the PACS”, check that the last cycle is “Up to date” or “Applied” and that nothing is waiting.",
        "Click “Download the kit” and share its SHA-256 fingerprint, to be compared before opening the archive.",
      ],
      terms: [
        "passerelle",
        "tacheHote",
        "confiancePacs",
        "certificat",
        "codeEnrolement",
      ],
    },
    gateway: {
      title: "Gateway page",
      purpose:
        "Details a gateway: its status explained, workstation, private network, lifecycle, heartbeat, certificates and history. Only the actions its status allows are offered.",
      steps: [
        "Read the status and its explanation at the top of the page: the allowed actions appear next to it.",
        "Before “Approve”, check with the clinic on the phone the workstation name, its MachineGuid, the enrolment address and that its node is online.",
        "For “Suspend”, “Reject” or “Revoke”, enter a reason of at least three characters, kept in the audit log.",
        "Click “Force renewal” so that the workstation creates a new key and certificate at its next heartbeat.",
        "Check “Heartbeat” and “Certificates”: series waiting to be sent, free disk space, expiry and state at the PACS.",
      ],
      terms: [
        "passerelle",
        "certificat",
        "reseauPrive",
        "aeTitle",
        "journalAudit",
      ],
    },
    accounts: {
      title: "Accounts",
      purpose:
        "Lists every account on the platform. Here you attach new sign-ups to an organisation, review radiologists’ supporting documents, signatures and stamps, check two-factor authentication and handle erasure requests.",
      steps: [
        "Use the “To review”, “Signature to review” and “Pending” filters, or search for an account by name or email.",
        "For an account “Not attached to any organisation”, click “Attach”, then choose the organisation and the role.",
        "Click “Review the file”, open the document, then choose “Accept and approve” or “Refuse” with a reason.",
        "Click “Signature to review” to compare the uploaded signature and stamp, then “Accept” or “Reject”.",
        "For a lost or replaced phone, verify the person’s identity through another channel, then click “Reset”.",
      ],
      terms: [
        "rattachement",
        "habilitation",
        "justificatif",
        "doubleAuthentification",
        "signature",
      ],
    },
    studies: {
      title: "Examinations",
      purpose:
        "Lists the examinations of the whole platform, across all organisations, to answer a clinic quickly. The patient’s name opens the images and the report in view-only mode, and every opening is logged.",
      steps: [
        "Search for an examination by patient, ID or modality in the search bar.",
        "Click “Open urgent cases” to see urgent examinations not yet reported, the most overdue first.",
        "Click the patient’s name to open the images and the report, without being able to write or sign.",
        "For an unsigned examination, click the assign button, choose a radiologist, then click “Assign”.",
        "To take it back from its holder, reopen the same window and click “Return to the queue”.",
      ],
      terms: ["examen", "attribution", "urgence", "priseEnCharge", "pool"],
    },
    requests: {
      title: "Incoming requests",
      purpose:
        "Gathers the requests sent through the website’s contact form, by facilities or radiologists. Each one is followed from “New” to “Converted” or “Dismissed”, with the team’s notes.",
      steps: [
        "Filter by requester, “Facilities” or “Radiologists”, and by follow-up stage: new requests are shown by default.",
        "Contact the requester by clicking their email address or phone number.",
        "For a radiologist, note the “Declared registration number”: it is checked before any access to examinations.",
        "To welcome a radiologist, click “Invite as radiologist” when the button is offered: the request moves to “Converted”.",
        "Choose the follow-up stage, add your notes, then click “Save”.",
      ],
      terms: ["numeroOrdre", "habilitation"],
    },
    billing: {
      title: "Billing",
      purpose:
        "A month’s procedures, by clinic and modality: examinations received as routine or urgent, and reports signed. It is the basis of each clinic’s invoice; an examination without a signed report shows up here before it is wrongly invoiced.",
      steps: [
        "Change the month with the arrows on either side of the month shown.",
        "Read the monthly totals: “Procedures received”, “Of which urgent” and “Reports signed”.",
        "Check the “Without a signed report” figure: once the month is closed, it is “to check before invoicing”.",
        "Go through each clinic’s table: by modality, “Routine”, “Urgent”, “Total” and “Signed”.",
        "Click “Export as CSV” to download the month’s lines.",
      ],
      terms: ["acte", "urgence", "compteRendu", "signature"],
    },
    system: {
      title: "System",
      purpose:
        "The platform’s technical status: dependencies, central PACS, and safety nets such as backups and restore drills. The screen is read-only: nothing is set here.",
      steps: [
        "Look at “Services” first: “Operational” if everything responds, “Degraded” if a dependency or a safety task fails.",
        "Check the “Central PACS”, the “Examinations stored” and the “Image volume” on the PACS disk.",
        "Go through the “Dependencies”: a red cross and a detail flag a service that is not responding.",
        "Under “Safety nets”, spot the red dot of a task that failed or whose latest run is too old.",
        "See the “Operations history” for recent runs across all tasks.",
      ],
      terms: ["pacs", "filetSecurite", "examen"],
    },
    audit: {
      title: "Audit log",
      purpose:
        "Every sensitive action, timestamped and attributed: an examination viewed, a report signed, a setting changed, a member added. It is the record to produce when someone asks who saw a file. Read-only: the log is written by the service, never from here.",
      steps: [
        "Read the entries, most recent first: date, action, author (“System” for an automatic action), organisation and resource.",
        "Pick an action in the “All actions” list to show only one kind of action, for example “Examination viewed”.",
        "Hover over a resource reference to see its full identifier.",
        "Click “Older entries” at the bottom of the page to go back through the log, 50 entries at a time.",
        "Click “Back to the most recent” to return to the start of the log.",
      ],
      terms: ["journalAudit", "organisation"],
    },
    controls: {
      title: "Platform settings",
      purpose:
        "Settings applied to the whole platform from the next page load: turnaround committed to clinics, maintenance banner, Tailscale connection and the private network’s access policy. Every change is recorded in the audit log.",
      steps: [
        "Set the “Turnaround committed to clinics” in minutes: “Urgent” between 5 and 720, “Routine” between 15 and 2,880.",
        "Type a “Maintenance banner” if needed, check its preview, then click “Save”.",
        "Under “Tailscale connection”, click “Test the connection” to check the OAuth client’s token and scopes.",
        "To “Save a connection” or replace it, enter the client ID, the secret and the code from your authenticator app.",
        "Under “Access policy”, click “Compare”; if it differs, “Push the versioned policy” with your code.",
      ],
      terms: [
        "delaiPromis",
        "reseauPrive",
        "passerelle",
        "doubleAuthentification",
        "journalAudit",
      ],
    },
    worklist: {
      title: "To read",
      purpose:
        "The whole platform’s worklist, read-only: examinations to claim and examinations being read, by deadline. The team monitors it without claiming anything.",
      steps: [
        "Read the indicators: “To claim”, “Unclaimed urgent”, “Overdue” and “Next deadline”.",
        "Narrow the worklist with the search, “Urgent only”, the modality chips or the “All clinics” list.",
        "Under “Being read”, find the examinations already claimed, with the radiologist’s name in the “Status” column.",
        "Open an examination with a click, or with j, k and Enter, to view it: you can neither claim nor sign it.",
        "Leave the screen open: the worklist refreshes every 30 seconds and flags each new urgent examination.",
      ],
      terms: ["consultation", "urgence", "delaiPromis", "priseEnCharge"],
    },
    reports: {
      title: "Reports",
      purpose:
        "Every report on the platform, across all clinics, drafts in progress included. Read-only: the team follows them and downloads signed PDFs, without writing or signing.",
      steps: [
        "Choose the status: “All”, “Being written”, “Signed” or “Delivered”.",
        "Search for a patient, an ID or a modality in the search bar.",
        "On each line, read the examination, the clinic, the radiologist writing or who signed, and the date signed.",
        "Open a draft to follow its writing on the reading screen, or a signed report to see its page.",
        "Click “PDF” to download a signed report without opening it.",
      ],
      terms: ["consultation", "compteRendu", "brouillon", "signature"],
    },
    report: {
      title: "Signed report",
      purpose:
        "A signed report, exactly as it was sent, with no editing controls. The team reads it, downloads it and can void it if it was signed by mistake; it can neither edit it nor add an addendum.",
      steps: [
        "Check “Signed by”, the registration number and the “Date signed” at the top.",
        "Read the report as it was signed, then its “Addenda” if there are any.",
        "Open the “Public verification” link to check the document as a third party would.",
        "Click “Download PDF” to get the signed document.",
        "For a mistake an addendum cannot fix, click “Void the report” and give a reason of at least 10 characters.",
      ],
      terms: [
        "compteRendu",
        "signature",
        "addendum",
        "annulation",
        "codeVerification",
      ],
    },
    templates: {
      title: "Templates",
      purpose:
        "Report templates from the whole platform, provided by IMAFRIK or created by organisations, shown in full. Read-only: the team reviews them but cannot delete them, as they belong to the organisations.",
      steps: [
        "Search for a template by name or region in the “Name, region…” field.",
        "Filter by modality with the chips; “All” shows them all again.",
        "Click a template in the list to read it in full, exactly as a report would look.",
        "Check where it comes from: “Provided by IMAFRIK”, or “Organisation” under the name of a template created by an organisation.",
      ],
      terms: ["consultation", "modele", "organisation", "compteRendu"],
    },
    training: {
      title: "Training",
      purpose:
        "Training exercises: real, anonymised examinations with no patient or clinic involved. The team also sees cases “Under review”, hidden from radiologists, to preview them and have them reviewed before publication.",
      steps: [
        "Browse the cards: modality, region, title, indication and image source of each case.",
        "Spot the cases “Under review”: visible to the IMAFRIK team only, until a radiologist has reviewed the clinical context.",
        "Click “Preview” to open a case under review on the reading screen, without an exercise.",
        "On each card, check “Context reviewed by” and the image source, with “View the source”.",
        "On a published case, click “Start” to do the exercise yourself, as a radiologist would.",
      ],
      terms: ["exercice", "specimen", "priseEnCharge"],
    },
    trainingExercise: {
      title: "Case preview",
      purpose:
        "A training case on the real reading screen. While under review, it opens as a preview: images, clinical information and task, with no exercise, writing or signing.",
      steps: [
        "Read the “Preview” banner: the case is under review, and the exercise will open once the case is published.",
        "Scroll through the case’s images in the viewer, on the left, or switch to “Full screen”.",
        "Read the “Clinical information” and the “Task” shown above the report.",
        "Go back to the list of cases with the back arrow.",
        "On a published case, click “Start the exercise” to do it yourself: nothing reaches a patient.",
      ],
      terms: ["exercice", "viewer", "renseignementClinique"],
    },
    reading: {
      title: "Reading screen",
      purpose:
        "Read-only view of an examination: images, clinical information and the report as it stands, drafts included. The team can neither claim, write nor sign; every opening is logged in its name in the audit log.",
      steps: [
        "View the images in the viewer, on the left; “Full screen” enlarges them.",
        "Read the “Clinical information” sent by the clinic, above the report.",
        "For a draft, read the “Unsigned draft” banner: the screen follows the writing and refreshes by itself.",
        "If the pane shows “Report in preparation”, wait for the radiologist to sign: nothing is written here.",
        "For a report signed by mistake, click “Void the report” and give the reason.",
      ],
      terms: [
        "consultation",
        "viewer",
        "brouillon",
        "renseignementClinique",
        "annulation",
      ],
    },
    settings: {
      title: "Settings",
      purpose:
        "The IMAFRIK administrator’s account: profile, language, password and two-factor authentication. Platform-wide settings are made under “Platform settings”.",
      steps: [
        "Correct your “Full name” and “Title” if needed, then click “Save”.",
        "Choose the “Language” of your screens, the service’s messages and your emails, then save.",
        "Change your password with “Change password”: you will be signed out on your other devices.",
        "Check that “Two-factor authentication” is “Enabled”; if not, click “Enable”.",
      ],
      terms: ["doubleAuthentification", "organisation"],
    },
  },
};
