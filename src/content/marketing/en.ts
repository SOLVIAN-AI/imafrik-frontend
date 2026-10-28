import { LANGUAGE_SWITCH_LABEL } from "@/content/marketing/language-switch";
import type { MarketingCopy } from "@/content/marketing/types";

/**
 * Public website copy, in English.
 *
 * British spelling, the usage of anglophone West Africa (Ghana, Nigeria,
 * Liberia, Sierra Leone, The Gambia). Typographic apostrophes and quotes
 * throughout, as in the French version.
 */
export const en: MarketingCopy = {
  meta: {
    homeTitle: "IMAFRIK · Teleradiology for Africa",
    homeDescription:
      "Your imaging reports the same day. A software gateway on one of your computers, and your radiographers keep working exactly as they do today.",
    securityTitle: "Security and compliance",
    securityDescription:
      "Encryption, per-facility isolation, access logging, European hosting, reversibility: IMAFRIK’s safeguards for health data.",
    contactTitle: "Request a demo",
    contactDescription:
      "Thirty minutes to see the full journey of an examination, from submission to the signed report.",
    verifyTitle: "Report verification",
    verifyDescription:
      "Check the authenticity of an IMAFRIK report using the code printed on the document.",
  },
  languageSwitch: { label: LANGUAGE_SWITCH_LABEL.en },
  nav: {
    links: [
      { href: "/#fonctionnement", label: "How it works" },
      { href: "/#profils", label: "Clinics & radiologists" },
      { href: "/securite", label: "Security" },
      { href: "/#tarifs", label: "Pricing" },
    ],
    signIn: "Sign in",
    demoShort: "Demo",
    demoLong: "Request a demo",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    home: "IMAFRIK home",
  },
  footer: {
    tagline:
      "Teleradiology for Africa. Your examinations read by radiologists whose right to practise is verified, with no equipment to buy.",
    columns: [
      {
        title: "Product",
        links: [
          { href: "/#fonctionnement", label: "How it works" },
          { href: "/#profils", label: "For clinics" },
          { href: "/#profils", label: "For radiologists" },
          { href: "/#tarifs", label: "Pricing" },
        ],
      },
      {
        title: "Trust",
        links: [
          { href: "/securite", label: "Security and compliance" },
          { href: "/confidentialite", label: "Privacy" },
          { href: "/cgu", label: "Terms of use" },
          { href: "/mentions-legales", label: "Legal notice" },
          { href: "/credits", label: "Image credits" },
        ],
      },
      {
        title: "Contact",
        links: [
          { href: "/contact", label: "Request a demo" },
          { href: "/connexion", label: "Sign in to my account" },
        ],
      },
    ],
    publisher: "IMAFRIK is a service published in Lomé, Togo.",
    hosting: "Images hosted in the European Union, encrypted at rest.",
  },
  hero: {
    badge: "Teleradiology for Africa",
    title: {
      before: "Your imaging reports, ",
      highlight: "the same day",
      after: ".",
    },
    lead: "A software gateway on a computer in your facility: your radiographers send examinations to it just as they would to any other destination on your network. A licensed radiologist reads them remotely and signs the report.",
    primaryCta: "Request a demo",
    secondaryCta: "See our security commitments",
    commitmentsTitle: "Our turnaround commitments",
    commitments: [
      { value: "2 h", label: "Routine examination" },
      { value: "30 min", label: "Emergency" },
      { value: "24/7", label: "Nights and weekends included" },
    ],
    commitmentsNote:
      "Turnaround times are set in the contract and run from receipt of the examination.",
  },
  heroViewer: {
    label:
      "The IMAFRIK viewer scrolls through the sagittal slices of a real brain MRI, from the midline towards the right hemisphere.",
    toolbar: "Viewer tools",
    modality: "MRI · Brain",
    sequence: "T2 3D",
    plane: "Sagittal",
    slice: "Im {current} / {total}",
    thickness: "Th. 1.0 mm",
    realSlice: "Real slice",
    anterior: "A",
    posterior: "P",
    play: "Play the slice scroll",
    pause: "Pause the slice scroll",
    worklist: {
      title: "Reading worklist",
      rows: [
        { exam: "MRI · Brain", deadline: "22 min left", urgent: true },
        { exam: "CT · Chest", deadline: "1 h 40 left", urgent: false },
      ],
      urgent: "Urgent",
    },
    signed: {
      title: "Report signed",
      detail: "Personal code verified, document locked",
      verify: "Verifiable online",
    },
    credit:
      "Real slices: MRI from the ReMIND collection (Juvekar et al., 2023), The Cancer Imaging Archive, CC BY 4.0. Framing: IMAFRIK.",
    creditLink: "Image credits",
  },
  proofs: {
    label: "Service safeguards",
    items: [
      "Mutual DICOM TLS",
      "Two-factor authentication for everyone",
      "Signature protected by a personal code",
      "Named audit trail",
      "Hosted in the European Union",
      "100% of the fee to the radiologist",
    ],
  },
  product: {
    eyebrow: "The product",
    title: "One platform, two portals",
    lead: "The radiologist reads and signs; the facility follows its examinations and collects its reports. Here is the application as it is.",
    tabsLabel: "Application screens",
    screens: [
      {
        tab: "Reading worklist",
        audience: "Radiologist",
        text: "Examinations from every facility in the group, sorted by deadline. Emergencies rise to the top, and every deadline can be read at a glance.",
        alt: "The radiologist’s reading worklist: examinations to claim, flagged emergencies and the deadline of each examination.",
      },
      {
        tab: "Signed report",
        audience: "Radiologist",
        text: "Signed by a named doctor, with their registration number, and locked as soon as it is signed. Its verification code lets anyone check that it is authentic.",
        alt: "A signed report: signatory, registration number, signing date, public verification link and the sections of the report.",
      },
      {
        tab: "Dashboard",
        audience: "Facility",
        text: "Examinations sent, readings in progress, reports ready to download: the answer to the morning’s question, on a single screen.",
        alt: "A clinic’s dashboard: examinations sent, readings in progress, reports ready and the latest examinations sent.",
      },
    ],
    note: "Screenshots of demo mode: patients, doctors, facilities and figures are fictitious.",
  },
  journey: {
    eyebrow: "The journey",
    title: "From the clinic’s scanner to the signed report",
    lead: "Follow one examination, from the Kara polyclinic to the radiologist who reads it in Lomé. Nothing travels but the examination.",
    steps: [
      {
        title: "The gateway receives",
        detail:
          "The scanner sends the examination to the clinic’s computer, like any destination on its network. The gateway accepts it at once, even when the connection is down.",
      },
      {
        title: "The examination travels",
        detail:
          "As soon as the link allows, it leaves compressed and encrypted for the platform. The radiologist receives it wherever they are.",
      },
      {
        title: "A radiologist reads",
        detail:
          "The examination enters their list, urgent ones first. Images and report side by side: they scroll through the slices, measure and write.",
      },
      {
        title: "The report comes back",
        detail:
          "Signed and locked, it is available to the clinic at once, as a PDF. Its printed code lets anyone check online that it is authentic.",
      },
    ],
    scene: {
      clinic: "Kara polyclinic",
      gateway: "IMAFRIK gateway",
      received: "{count} slices received",
      offline: "Accepted, even offline",
      route: "Kara → Lomé · 380 km",
      compressed: "Compressed",
      encrypted: "Encrypted",
      worklist: "To read",
      byDeadline: "by deadline",
      urgent: "Urgent",
      deadline: "22 min left",
      exam: "CT · Chest",
      otherRows: [
        { name: "TETTEH Kossi", exam: "MR · Knee", deadline: "1 h 15 left" },
        { name: "BOKO Essi", exam: "MG · Breast", deadline: "3 h 40 left" },
      ],
      patient: "KOFFI Ama",
      radiologist: "Dr Adjo Kponton · Lomé",
      indicationLabel: "Indication",
      findingsLabel: "Findings",
      conclusionLabel: "Conclusion",
      conclusion: "27 mm left pulmonary nodule. Follow-up CT advised.",
      saved: "Saved",
      sign: "Sign",
      signed: "Signed",
      reportTitle: "Chest CT report",
      signedOn: "Signed on 21 October 2026",
      delivered: "Delivered to the clinic",
      verify: "Verifiable online",
    },
    credit:
      "CT slices: LIDC-IDRI, The Cancer Imaging Archive, CC BY 3.0 licence. Patients, doctor and facilities are fictitious.",
    creditLink: "Image source",
  },
  howItWorks: {
    eyebrow: "How it works",
    title: "Three steps, no change to the way you work",
    lead: "Between acquisition and the signed report, the only wait is the radiologist’s reading time.",
    steps: [
      {
        title: "The gateway receives",
        detail:
          "Your modalities send the examination to a computer in your facility, just as they would to any other destination on your internal network. It is accepted immediately, even if the connection is down.",
        note: "Software to install, no equipment to buy",
      },
      {
        title: "A radiologist reads",
        detail:
          "The examination is sent to the platform, compressed and encrypted, as soon as the connection allows. It joins a worklist, where emergencies move to the top.",
        note: "Images and report side by side",
      },
      {
        title: "The report is signed",
        detail:
          "Signed by a named radiologist, locked, and delivered to your facility. A printed code lets anyone check its authenticity online.",
        note: "PDF available immediately",
      },
    ],
    uploadNote:
      "No gateway yet, or an examination on a CD? Files can be uploaded from a web browser, with nothing to install.",
  },
  audiences: {
    eyebrow: "Two professions",
    title: "One service, seen from both sides",
    lead: "A clinic and a radiologist do not expect the same thing from a platform. Each has a dedicated portal.",
    clinics: {
      eyebrow: "For clinics",
      title: "A radiology service, without a radiologist on site",
      points: [
        "Software gateway installed on one of your computers, with no equipment to buy",
        "Nothing to administer: no server, no licence, no backups",
        "Your examinations remain viewable on site, even when the Internet is down",
        "Every examination you send tracked through to the signed report",
        "Cover at night, at weekends and during holidays",
      ],
      cta: "Request a demo",
    },
    radiologists: {
      eyebrow: "For radiologists",
      title: "Read from wherever you are, with a tool that keeps up",
      points: [
        "Shared worklist, with emergencies flagged",
        "Images and report on a split screen",
        "Templates by modality and anatomical region",
        "Named signature, report locked once signed",
        "Read from any computer, with nothing to install",
      ],
      cta: "Join the network",
    },
  },
  securityTeaser: {
    eyebrow: "Security",
    title: "Health data, treated as such",
    lead: "Each of these safeguards is enforced by the architecture of the service, not promised by a checkbox.",
    guarantees: [
      {
        title: "Encrypted end to end",
        detail:
          "Between the gateway and our servers, examinations travel over an encrypted private network using mutual DICOM TLS: each facility proves its identity with its own certificate, and the imaging port cannot be reached from the Internet.",
      },
      {
        title: "Two-factor authentication for everyone",
        detail:
          "Radiologists, facility managers, the IMAFRIK team: every account confirms its sign-in with a one-time code. A stolen password is not enough.",
      },
      {
        title: "Signed with a personal code",
        detail:
          "Every report and every addendum is signed with the radiologist’s six-digit code. Once signed, the document is locked.",
      },
      {
        title: "Named audit trail",
        detail:
          "Opening the images, signing, downloading: every action is time-stamped and attributed to a named person, in a log that no one can alter from the application.",
      },
      {
        title: "Isolation by the database",
        detail:
          "Each facility sees only its own examinations. Isolation is enforced by the database itself: a bug in the application code is not enough to bypass it.",
      },
      {
        title: "Hosted in the European Union",
        detail:
          "Images, reports and backups, encrypted at rest. Retention period set in the contract, full export on request.",
      },
    ],
    more: "Full details of our security and compliance commitments",
  },
  pricing: {
    eyebrow: "Pricing",
    title: "A subscription, and a fee per examination.",
    lead: "IMAFRIK charges for two things only: a monthly subscription, and a technical fee for each examination, at the routine or urgent rate. Amounts in CFA francs, excluding tax.",
    plansTitle: "Monthly subscription",
    plans: {
      essential: "Essential",
      pro: "Pro",
      facility: "Facility",
    },
    price: "{amount} FCFA",
    priceFrom: "from {amount} FCFA",
    priceUnit: "excl. tax, per month",
    feesTitle: "Technical fee per examination",
    feesLead:
      "It covers the processing of the examination by the platform: receipt, storage, provision and delivery of the report.",
    feesColumns: { exam: "Examination", normal: "Routine", urgent: "Urgent" },
    exams: {
      radiography: "Radiography",
      complexRadiography: "Complex radiography",
      hysterosalpingography: "Hysterosalpingography",
      ct: "CT",
      complexCt: "Complex CT",
      mri: "MRI",
    },
    feesNote:
      "Amounts in FCFA excluding tax, charged for each examination whose report has been delivered.",
    radiologistFeeTitle: "Radiologists’ fees",
    radiologistFeeText:
      "The radiologist’s fee belongs to them in full. It is paid to them through a payment institution licensed by the BCEAO: IMAFRIK never collects it and takes no commission.",
    radiologistFeeFigure: "100%",
    radiologistFeeFigureLabel: "of the fee goes to the radiologist",
    includedTitle: "Included in every contract",
    included: [
      "Gateway installation and monitoring",
      "Storage and archiving of examinations",
      "Clinic portal with access for your whole team",
      "Signed reports, PDF and online verification",
      "Support with connecting your modalities",
    ],
    noCommitment: "No minimum volume is required from your facility.",
    quoteTitle: "Choose your plan",
    quoteText:
      "Tell us your monthly volume and your modalities, and we will suggest the right plan and send you a written quote. The Facility plan is priced on quotation.",
    quoteCta: "Request a quote",
  },
  faq: {
    eyebrow: "Questions",
    title: "Questions we are asked before signing",
    lead: "The questions of a facility director, a technician or a radiologist, with straight answers, including the limits of the service.",
    contact: "Another question? Write to us",
    entries: [
      {
        question: "Do we need to change our set-up?",
        answer:
          "No. The gateway is software that we install on a computer in your facility; your modalities send examinations to it just as they would to any other destination on your internal network. If you already have a PACS, it stays in place.",
      },
      {
        question: "What computer does the gateway need?",
        answer:
          "An office computer running Windows 10 or later, with around a hundred gigabytes of free disk space: the gateway keeps a copy of the examinations on site. There is only one requirement, but it is firm: the computer must stay switched on, otherwise examinations are not sent. A dedicated computer is better than a shared one that is switched off at night. We recommend enabling disk encryption (BitLocker), and we help you set it up during installation.",
      },
      {
        question: "What happens during an Internet or power cut?",
        answer:
          "The examination is accepted regardless: the gateway stores it and forwards it as soon as the connection returns. Your images remain viewable on site during the outage. That is precisely what the gateway is for: an acquisition console, by contrast, does not keep transfers that fail.",
      },
      {
        question: "Who signs the report, and who is responsible for it?",
        answer:
          "A named radiologist, whose right to practise the IMAFRIK team has verified before giving them access to any examination; their name appears on the document. Responsibility for the interpretation lies with them, just as it would for an examination read on site. IMAFRIK ensures transmission and traceability.",
      },
      {
        question: "Who creates accounts, and how are radiologists admitted?",
        answer:
          "Your facility’s managers create the accounts for its team from their portal. A radiologist who wishes to read for the network applies through the contact form, then uploads their proof of practice. The IMAFRIK team reviews it: until this is done, no examinations are accessible to them, even if a clinic has invited them.",
      },
      {
        question: "Where are our patients’ images stored?",
        answer:
          "On the gateway in your facility, and on our servers in the European Union, encrypted. They remain the property of your facility, which receives a full export on request. How long they are kept on our servers is set in the contract.",
      },
      {
        question: "How long does it take to get started?",
        answer:
          "Installation of the gateway and connection of your modalities are scheduled with your technician. Uploading from a web browser, however, is available as soon as your account is created: you can send your first examination straight away.",
      },
      {
        question: "Can we try before committing?",
        answer:
          "Yes. The demo uses test examinations, with no patient data at all. Your first real examinations can be handled under a trial agreement before the contract is signed.",
      },
      {
        question: "Is the platform available in English?",
        answer:
          "Yes. The clinic and radiologist portals are fully available in English: each user chooses their language in their settings, and account emails are sent in English too. Reports, including the signed PDF and its verification page, are issued in the language agreed with your facility, French or English.",
      },
    ],
  },
  finalCta: {
    title: {
      before: "Let’s see what it would look like ",
      highlight: "for you",
      after: ".",
    },
    text: "Thirty minutes is enough: you tell us about your set-up and your volume, and we show you the full journey of an examination, from submission to the signed report.",
    primary: "Request a demo",
    secondary: "I already have an account",
  },
  securityPage: {
    eyebrow: "Security",
    title: "What we guarantee for your data",
    lead: "When your facility entrusts its patients’ examinations to a third party, its own responsibility is at stake. This page sets out exactly what happens to an image from the moment it leaves your console until the moment it is deleted.",
    chapters: [
      {
        title: "In transit",
        detail:
          "Between the clinic and the platform, examinations travel over an encrypted private network; the portal is accessible only over HTTPS. Between our services, traffic stays inside the server, and everything that leaves it (database, storage) is encrypted. No examination crosses the Internet in clear text.",
      },
      {
        title: "At rest",
        detail:
          "Images and reports are encrypted at rest in dedicated object storage, separate from the database; backups are encrypted before they leave the server. Access to one does not give access to the other.",
      },
      {
        title: "Isolation",
        detail:
          "Each organisation sees only its own examinations. Isolation is enforced by the database itself, on every request, not by the application code alone: a bug in the application code is not enough to bypass it.",
      },
      {
        title: "Traceability",
        detail:
          "Accepting an examination for reading, viewing its images, signing, adding an addendum, each download of the report: every action is time-stamped and attributed to a named person, in a log that nobody can modify from the application.",
      },
      {
        title: "Hosting",
        detail:
          "Images, reports, database and backups are hosted in the European Union; the deployment process verifies where storage is located. The location is stated in the contract and does not change without a contract amendment.",
      },
      {
        title: "Retention",
        detail:
          "How long images are kept is set in the contract, for each facility: at the end of that period, they are removed from our servers and each deletion is logged. Without a set period, nothing is deleted automatically. Signed reports are kept for twenty years in locked storage: no one can alter or delete them. Encrypted backups expire no later than twelve months after they are made.",
      },
      {
        title: "Reversibility",
        detail:
          "At any time, on request, your facility receives an export of its examinations and reports: DICOM images, signed PDFs, and a manifest of checksums to verify their integrity. Your data belongs to you.",
      },
      {
        title: "Incidents",
        detail:
          "In the event of a data breach, your facility is informed without undue delay, with the nature of the incident, the data concerned and the measures taken.",
      },
    ],
    obligationsTitle: "Your obligations and ours",
    obligations: [
      "Your facility remains the controller of its patients’ data; IMAFRIK acts as a processor, on your instructions and within the scope defined in the contract. This allocation of roles, the security measures and the list of sub-processors are set out in a data processing agreement attached to every proposal.",
      "No examination is used for any purpose other than producing the requested report: no model training, no identifiable statistics, and no disclosure to any third party not provided for in the contract.",
    ],
  },
  contactPage: {
    eyebrow: "Contact",
    title: "Let’s talk about your set-up",
    lead: "Thirty minutes is enough: you describe your set-up and your volume, and we show you the full journey of an examination, from acquisition to the signed report.",
    emailHint: "We will call you back to arrange a time.",
    location: "Lomé, Togo",
    testDataNotice:
      "The demo uses test examinations. Please do not send us any patient data until a contract and its data processing agreement have been signed.",
    sentTitle: "Request sent",
    sentText:
      "Thank you, {name}. We will get back to you at {email} to suggest a time.",
    sentTextRadiologist:
      "Thank you, {name}. The IMAFRIK team will get back to you at {email}. You will then upload your proof of practice: access to examinations opens once it has been verified.",
    requester: {
      legend: "I am",
      clinic: "A healthcare facility",
      clinicDetail:
        "Clinic, hospital or imaging centre: you would like your examinations to be read.",
      radiologist: "A radiologist",
      radiologistDetail:
        "You would like to read examinations for the network. Your right to practise is verified before any access.",
    },
    fields: {
      name: "Full name",
      role: "Job title",
      rolePlaceholder: "Director, radiographer, radiologist…",
      organization: "Facility",
      organizationRadiologist: "Where you practise",
      licenseNumber: "Registration number",
      licenseNumberHint:
        "If you are registered with the medical council, your registration number, as it will appear below your signature. Otherwise, leave this field blank.",
      email: "Email address",
      phone: "Phone",
      optional: "Optional.",
      volume: "Estimated monthly volume",
      modalities: "Modalities",
      message: "Message",
      messagePlaceholder:
        "Your modalities, your current turnaround times, the difficulties you face today…",
    },
    volumes: [
      "Fewer than 50 examinations a month",
      "50 to 200 examinations a month",
      "200 to 500 examinations a month",
      "More than 500 examinations a month",
      "I don’t know yet",
    ],
    modalityOptions: ["CT", "MRI", "X-ray (CR/DX)", "Ultrasound (US)"],
    submit: "Send request",
    errors: {
      requesterKind:
        "Please say whether you are writing for a healthcare facility or as a radiologist.",
      name: "Please enter your name.",
      organization: "Please enter the name of your facility.",
      licenseNumber: "The registration number is 50 characters at most.",
      email: "Please enter a valid email address.",
      rateLimited:
        "Too many requests from this connection. Please try again in an hour, or email us at contact@imafrik.tech",
      unavailable:
        "The form is not available at the moment. Please email us at contact@imafrik.tech",
      generic:
        "Your request could not be sent. Please try again, or email us at contact@imafrik.tech",
    },
  },
  verifyPage: {
    validTitle: "Authentic document",
    voidedTitle: "Document voided",
    voidedText:
      "This report was voided on {date} by the IMAFRIK team: it must not be used. Ask the facility that performed the examination for the current report.",
    validText:
      "This code matches a report signed on the IMAFRIK platform. To protect the patient, only the initial of their name is shown; neither their full identity nor the content of the report is displayed.",
    signedBy: "Signed by",
    license: "Registration no. {number}",
    signedAt: "Date signed",
    exam: "Examination",
    patient: "Patient {initial}",
    addendaOne:
      "An addendum has been added to this report since it was signed. Please ask the facility that gave you the document for the text.",
    addendaMany:
      "{count} addenda have been added to this report since it was signed. Please ask the facility that gave you the document for the text.",
    invalidTitle: "Unknown code",
    invalidText:
      "No signed report matches this code. Check that the address is complete; the most reliable way is to scan the QR code on the document. If the address is complete, the document did not come from IMAFRIK.",
    submittedCode: "Code submitted: {code}",
    report: "Report a suspicious document",
    unavailableTitle: "Verification temporarily unavailable",
    unavailableText:
      "The verification service is not responding at the moment. This says nothing about whether the document is authentic: please try again in a few minutes. If the problem persists, write to us at {email}.",
    retry: "Try again",
  },
  hashCheck: {
    title: "Check a PDF file",
    text: "Did you receive this report as a PDF? Choose the file: its fingerprint is computed on your computer and compared with the one recorded at the time of signing. The file is not sent anywhere.",
    choose: "Choose the PDF file…",
    match: "File intact: identical to the signed document.",
    mismatch:
      "This file differs from the signed document: it has been modified, or it is not the right file.",
    expected: "Recorded fingerprint: {hash}",
  },
  credits: {
    metaTitle: "Image credits",
    metaDescription:
      "Sources and licences of the medical images on the IMAFRIK website: real slices published under an open licence, no generated images.",
    eyebrow: "Credits",
    title: "Image credits",
    lead: "The medical images on this website are real imaging slices, published under an open licence by the teams who acquired them. None is generated by artificial intelligence, and none has its anatomy retouched.",
    labels: {
      images: "On this website",
      collection: "Source",
      license: "Licence",
      modifications: "Changes",
    },
    uses: {
      remind:
        "Home page: the viewer in the opening section (scrolling sagittal slices), the radiologists card in the “Two professions” section, the “Security” section and the closing call to action.",
      eay131: "Home page: the facilities card, “Two professions” section.",
      lidc: "Animated journey of an examination, in preview.",
    },
    modifications: {
      duotone:
        "Pixels made square, outside of the patient set to the background or framing within the field of view, windowing, monotonic compression of bone and light smoothing (CT only), colour map in the IMAFRIK palette, fade at the edge of the field of view, vignetting, cropping and enlargement. Nothing is added to or removed from inside the patient.",
      cine: "Slices reformatted in the sagittal plane (1 mm volume), one every 2 mm from the midline towards the right hemisphere, common window, greyscale, fade at the edge of the field of view, cropping, enlargement and assembly into a video.",
      lidc: "Lung window, cropping and reduction.",
    },
    idcTitle: "Distribution",
    idcText:
      "The ReMIND and EAY131 slices are distributed by Imaging Data Commons, of the National Cancer Institute (Fedorov et al., RadioGraphics, 2023). The slices chosen avoid the documented lesions of each examination, and no face is recognisable.",
    productTitle: "Application screenshots",
    productText:
      "The application screens shown on the home page are screenshots of IMAFRIK’s demo mode: the patients, doctors, facilities and figures they display are fictitious.",
    noAi: "No image on this website is generated by artificial intelligence.",
  },
  legal: {
    translationNotice:
      "This English translation is provided for convenience. In the event of any discrepancy, the French version prevails.",
    updatedAt: "Last updated: {date}",
  },
};
