import type { glossary as fr } from "@/i18n/messages/fr/help-glossary";

/** Help glossary, in English: every platform term defined once. */
export const glossary: typeof fr = {
  addendum: {
    term: "Addendum",
    definition:
      "A correction added to a report that has already been signed. The signed text is never changed: the addendum is appended, dated and signed with the personal code, and the clinic sees it.",
  },
  acte: {
    term: "Procedure",
    definition:
      "An examination received whose report is signed, counted towards the clinic’s invoice for the month it arrived. Urgent examinations are billed at the urgent rate.",
  },
  consultation: {
    term: "Read-only view",
    definition:
      "The IMAFRIK team’s read-only access to the radiologists’ screens (worklist, drafts, reports, images) and, in the clinics’ view, to a clinic manager’s screens. The team views without claiming, writing or signing, and every opening is logged.",
  },
  vueCliniques: {
    term: "Clinics’ view",
    definition:
      "A clinic manager’s screens, opened by the IMAFRIK team with that clinic’s data and the same figures. View-only: no sending, no invitations, no clinical information, and a downloaded PDF is not delivered. Each opening is recorded in the audit log.",
  },
  groupeModalites: {
    term: "Modality group",
    definition:
      "Examinations sorted by equipment: Radiography (HSG included), Mammography, Ultrasound, CT, MRI, Other. Examination lists filter by group; it is also what a radiologist reads.",
  },
  dureeLecture: {
    term: "Reading time",
    definition:
      "Time between the start of an examination’s reading and the signature of its report, as a median. Pick-up runs from assignment to the start of reading.",
  },
  filetSecurite: {
    term: "Safety net",
    definition:
      "A scheduled task that protects the platform: encrypted backup, restore drill, PACS reconciliation, data retention and server monitoring. The System screen shows its latest run.",
  },
  formuleAbonnement: {
    term: "Subscription plan",
    definition:
      "The clinic’s monthly subscription: Essentiel, Pro or Établissement, on quotation. The IMAFRIK team sets it according to the agreement; without it, the statement has neither subscription nor total.",
  },
  aeTitle: {
    term: "AE Title",
    definition:
      "The DICOM name of an imaging device or software, sixteen characters at most. Each gateway receives its own at enrolment, and the IMAFRIK PACS only accepts its transfers from that gateway’s address.",
  },
  annulation: {
    term: "Voided report",
    definition:
      "A signed report withdrawn for an error an addendum cannot fix, such as text written on the wrong examination. It is archived as is, public verification shows it as voided, and the examination returns to the worklist for a real reading.",
  },
  anteriorite: {
    term: "Prior examination",
    definition:
      "An earlier examination of the same patient, at the same clinic. The clinic’s manager, or the IMAFRIK team, can share it with the radiologist reading an examination: images and signed report, read-only. Nothing is shared by default, and every share is logged.",
  },
  attribution: {
    term: "Assignment",
    definition:
      "Reserving an examination for a specific radiologist, by the clinic’s manager or, for network radiologists, by the IMAFRIK team, or automatically on arrival by an assignment rule. Only they can see it and take it on; they are notified by email, without any patient data.",
  },
  brouillon: {
    term: "Draft",
    definition:
      "A report being written, saved by the platform; a copy is also kept on the device. The clinic only ever sees the signed report, never the draft.",
  },
  corrige: {
    term: "Model answer",
    definition:
      "The reference report for a training exercise, written or approved by a radiologist, with the expected points. It appears once the exercise is signed, when one exists.",
  },
  numeroOrdre: {
    term: "Registration number",
    definition:
      "The radiologist’s registration number with the Medical Council. It is part of the file the IMAFRIK team reviews, and is printed below their signature.",
  },
  rattachement: {
    term: "Membership",
    definition:
      "The link between an account and an organisation, with a role. An account with no membership sees no examination.",
  },
  responsable: {
    term: "Manager",
    definition:
      "A member of a clinic: they send its examinations, assign them to its radiologists, share priors and manage the team, inviting and removing managers and radiologists. A clinic always keeps one: the last one cannot be removed.",
  },
  cachet: {
    term: "Stamp",
    definition:
      "An image of the radiologist’s stamp, uploaded by them and checked by the IMAFRIK team before it is printed at the foot of their reports. Optional.",
  },
  certificat: {
    term: "Certificate",
    definition:
      "A gateway’s digital identity, valid for 90 days and renewed by the workstation itself. The key that goes with it is created on the workstation and never leaves it.",
  },
  codeEnrolement: {
    term: "Enrolment code",
    definition:
      "A single-use code, valid for 15 minutes, issued by the IMAFRIK team to connect a clinic’s workstation. It is entered in the installation kit and replaces any key file.",
  },
  codePersonnel: {
    term: "Personal code",
    definition:
      "A six-digit code of the radiologist’s own, asked for at every signature and every addendum. Five wrong attempts in a row lock it for fifteen minutes. Nobody else knows it, not even the IMAFRIK team.",
  },
  codeVerification: {
    term: "Verification code",
    definition:
      "A code printed on every PDF report. A patient or a colleague can enter it on imafrik.tech to make sure the document is genuine.",
  },
  compteRendu: {
    term: "Report",
    definition:
      "The medical document written and signed by the radiologist after reading an examination. Once signed, it is sent to the clinic and can no longer be changed: it is completed by an addendum.",
  },
  confiancePacs: {
    term: "PACS trust",
    definition:
      "The list of certificates and AE Titles the IMAFRIK PACS accepts. It is written by the host task from the decisions made in the control tower, never by hand.",
  },
  contratService: {
    term: "Service contract",
    definition:
      "The link between a clinic and a radiology group. It allows the group’s radiologists to read the clinic’s examinations when the clinic is open to the pool.",
  },
  delaiPromis: {
    term: "Promised turnaround",
    definition:
      "The time between receiving an examination and signing its report that IMAFRIK commits to: 30 minutes for an urgent one and 2 hours for routine, unless the team has set otherwise.",
  },
  delaiMedian: {
    term: "Median turnaround",
    definition:
      "The time within which half the examinations are reported. Unlike the mean, which a single very long examination pulls up, one exceptional case does not distort it.",
  },
  centile90: {
    term: "90th percentile",
    definition:
      "The time within which nine examinations out of ten are reported: it shows the longest waits without stopping at the single worst case.",
  },
  dicom: {
    term: "DICOM",
    definition:
      "The standard format and protocol for medical images. The clinic’s devices send their examinations in DICOM to the gateway, which forwards them to the IMAFRIK PACS.",
  },
  doubleAuthentification: {
    term: "Two-factor authentication",
    definition:
      "A second check at sign-in: a six-digit code shown by an authenticator app on your phone. Required for every account.",
  },
  empreinte: {
    term: "Fingerprint",
    definition:
      "A 64-character string calculated from a file (SHA-256): changing a single byte changes it entirely. Comparing the kit’s fingerprint on the workstation with the one in the control tower proves it is intact.",
  },
  engagement: {
    term: "Agreements",
    definition:
      "The radiologist’s contract and the facility’s agreement, accepted online, dated and kept. Settings show the version accepted.",
  },
  examen: {
    term: "Examination",
    definition:
      "All the images of a patient taken during the same visit (an X-ray, a CT scan, an MRI), sent by the clinic to be read. It often contains several series.",
  },
  exercice: {
    term: "Exercise",
    definition:
      "A case in the training area, read like a real examination but with no real patient and no medical value. Its report is compared with a model answer reviewed by a radiologist.",
  },
  forfaitTechnique: {
    term: "Technical fee",
    definition:
      "The amount IMAFRIK charges the clinic for each procedure, depending on its examination type, at the normal or urgent rate. It is separate from the radiologist’s fee.",
  },
  groupe: {
    term: "Radiology group",
    definition:
      "An organisation that brings radiologists together. Linked to clinics by service contracts, it reads the examinations they open to the pool.",
  },
  habilitation: {
    term: "Approval",
    definition:
      "The IMAFRIK team’s check of a radiologist’s right to practise, based on their supporting document. Without a valid approval, they see no examination.",
  },
  horsGrille: {
    term: "Outside the fee schedule",
    definition:
      "A procedure in a modality missing from the technical fee schedule, such as ultrasound or mammography: it is counted, with no fee billed.",
  },
  honoraire: {
    term: "Fee",
    definition:
      "The radiologist’s pay for reading an examination. Its amount is agreed between the clinic and the radiologist and goes to them in full: IMAFRIK takes no commission on it.",
  },
  journalAudit: {
    term: "Audit log",
    definition:
      "A record of sensitive actions (opening an examination, signing, changing access…), with who did them and when. It can be neither changed nor erased.",
  },
  justificatif: {
    term: "Supporting document",
    definition:
      "A document uploaded by the radiologist to prove their right to practise. The IMAFRIK team reviews it, accepts or rejects it, and sets the date it expires.",
  },
  listeUrgence: {
    term: "Urgent list",
    definition:
      "The radiologists a clinic, or the IMAFRIK team, allows to take an urgent examination without waiting for it to be assigned, in the modalities they read. They are emailed; the first to take it gets it, and it disappears for the others.",
  },
  modele: {
    term: "Template",
    definition:
      "A reusable report outline (structure, standard sentences) that a radiologist applies in the editor instead of rewriting everything.",
  },
  modalitesLues: {
    term: "Modalities read",
    definition:
      "What a radiologist reads: radiography (HSG included), mammography, ultrasound, CT, MRI, other. Set by the clinic for its radiologists, or by the IMAFRIK team, they limit what can be assigned to them and the urgent examinations they see.",
  },
  moisClos: {
    term: "Closed month",
    definition:
      "A month whose billing the IMAFRIK team has frozen. Its statement no longer changes, even if a priority changes, a report is voided or a plan is modified.",
  },
  organisation: {
    term: "Organisation",
    definition:
      "A clinic, a radiology group or the IMAFRIK team. The same account can belong to several organisations and switch between them.",
  },
  pacs: {
    term: "PACS",
    definition:
      "The server that receives and stores medical images. The IMAFRIK PACS receives the examinations sent by the gateways and shows them in the viewer.",
  },
  passerelle: {
    term: "Gateway",
    definition:
      "Software installed on a clinic workstation. It receives the images from the devices and sends them, encrypted, to the IMAFRIK PACS. It is installed with the installation kit and an enrolment code.",
  },
  planning: {
    term: "Weekly schedule",
    definition:
      "Duty slots set by the clinic’s manager, or the IMAFRIK team: which radiologist, which days, which hours, nights included. An arriving examination goes to the only on-duty radiologist who can read it; if there are several, the manager chooses.",
  },
  pool: {
    term: "IMAFRIK network (pool)",
    definition:
      "The radiologists of the groups under contract with a clinic open to the network. The IMAFRIK team assigns them that clinic’s examinations; each one only sees what is entrusted to them.",
  },
  priseEnCharge: {
    term: "Taking on",
    definition:
      "The action by which a radiologist starts reading an examination assigned to them, or takes an urgent examination from their urgent list. Until they sign, they can return it: the examination is to assign again.",
  },
  renseignementClinique: {
    term: "Clinical information",
    definition:
      "The reason for the examination and useful information passed on by the clinic to the radiologist: symptoms, history, the question asked.",
  },
  regleAttribution: {
    term: "Assignment rule",
    definition:
      "Instruction set in advance by the clinic’s manager, or the IMAFRIK team: a radiologist for each modality, then the weekly schedule. When an examination arrives, it gives it to the planned radiologist if they can read it. It never takes back an examination already assigned.",
  },
  reseauPrive: {
    term: "Private network",
    definition:
      "An encrypted link (Tailscale) between a clinic’s gateway and the IMAFRIK server. Images never travel in clear over the internet.",
  },
  serie: {
    term: "Series",
    definition:
      "A run of images acquired in one go during an examination, such as an MRI sequence or a CT reconstruction.",
  },
  signature: {
    term: "Signature",
    definition:
      "The radiologist’s validation of the report, with their personal code. It freezes the text, produces the PDF and sends it to the clinic.",
  },
  specimen: {
    term: "Specimen",
    definition:
      "The PDF of a training exercise, marked as such and with no medical value. It never carries the radiologist’s handwritten signature.",
  },
  tacheHote: {
    term: "Host task",
    definition:
      "A server program that applies to the PACS the trust decided in the control tower, every 15 seconds. It refuses to write an inconsistent state rather than cut off a clinic.",
  },
  urgence: {
    term: "Urgent",
    definition:
      "An examination flagged as urgent by the clinic. Its deadline is closer than a routine one, which moves it up the worklist, and its report must be signed within the promised turnaround for urgent examinations.",
  },
  urgenceNonPrise: {
    term: "Unclaimed urgent examination",
    definition:
      "An urgent examination that no radiologist has started reading 10 minutes after it was flagged, assigned or not. The clinic’s managers and the IMAFRIK team are emailed, once, and the control tower shows it in red.",
  },
  viewer: {
    term: "Viewer",
    definition:
      "The medical image display built into IMAFRIK: scrolling through slices, windowing, measurements and reconstructions.",
  },
};
