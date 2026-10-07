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
  languageSwitch: { label: "Website language" },
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
      "Teleradiology for Africa. Your examinations read by registered radiologists, with no equipment to buy.",
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
    publisher: "IMAFRIK is a service published by SOLVIAN AI LLC, Lomé, Togo.",
    hosting: "Images hosted in the European Union, encrypted at rest.",
  },
  hero: {
    badge: "Teleradiology for Africa",
    title: {
      before: "Your imaging reports, ",
      highlight: "the same day",
      after: ".",
    },
    lead: "We install a gateway on a computer in your facility. Your radiographers send examinations to it just as they would to any other destination on your internal network. A radiologist reads them remotely and signs the report.",
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
  howItWorks: {
    eyebrow: "How it works",
    title: "Three steps, nothing to install on your workstations",
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
    eyebrow: "Trust",
    title: "Health data, treated as such",
    lead: "Security is not an option you switch on: it is built into the architecture of the service.",
    guarantees: [
      {
        title: "Nothing in clear text on the Internet",
        detail:
          "Images travel encrypted from the gateway to our servers, over a private network, and stay encrypted in storage.",
      },
      {
        title: "Isolation between facilities",
        detail:
          "Isolation is enforced by the database, not only by the interface: a bug in the application code is not enough to bypass it.",
      },
      {
        title: "Complete access log",
        detail:
          "Each time an examination is opened, the access is recorded, time-stamped and attributed to a named person.",
      },
      {
        title: "European hosting",
        detail:
          "Storage in the European Union. Retention period set in the contract, full export on request.",
      },
    ],
    more: "Full details of our security and compliance commitments",
  },
  pricing: {
    eyebrow: "Pricing",
    title: "Per examination, no subscription.",
    lead: "You pay for the examinations we read. The unit price depends on the modality and the turnaround you choose; it is fixed in the contract and does not change during the year.",
    includedTitle: "Included in every contract",
    included: [
      "Gateway installation and monitoring",
      "Storage and archiving of examinations",
      "Clinic portal with access for your whole team",
      "Signed reports, PDF and online verification",
      "Support with connecting your modalities",
    ],
    noCommitment: "No minimum volume is required from your facility.",
    quoteTitle: "Get a price list",
    quoteText:
      "Tell us your monthly volume and your modalities, and we will send you a written quote.",
    quoteCta: "Request a quote",
  },
  faq: {
    eyebrow: "Questions",
    title: "Questions we are asked before signing",
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
          "A named radiologist, registered with a professional medical council, whose registration number appears on the document. Responsibility for the interpretation lies with them, just as it would for an examination read on site. IMAFRIK ensures transmission and traceability.",
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
          "This website is. The clinic and radiologist portals, and the reports themselves, are in French today; English versions are planned. If your facility works in English, let us know when you get in touch and we will discuss the timeline with you.",
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
          "How long images are kept is set in the contract, for each facility. At the end of that period, they are removed from our servers and each deletion is logged; the encrypted backups that contained them expire no later than twelve months afterwards.",
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
    fields: {
      name: "Full name",
      role: "Job title",
      rolePlaceholder: "Director, radiographer, radiologist…",
      organization: "Facility",
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
      name: "Please enter your name.",
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
  legal: {
    translationNotice:
      "This English translation is provided for convenience. In the event of any discrepancy, the French version prevails.",
    updatedAt: "Last updated: {date}",
  },
};
