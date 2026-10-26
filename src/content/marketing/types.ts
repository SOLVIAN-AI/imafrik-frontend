/**
 * Forme des textes du site public.
 *
 * Chaque langue fournit un objet de ce type : une entrée oubliée dans une
 * traduction est une erreur de compilation, pas une phrase manquante
 * découverte en ligne. Les liens sont donnés par leur adresse française de
 * référence ; les composants les traduisent (`localizePath`).
 */

import type { ExamTypeId, PlanId } from "@/content/marketing/pricing";

/** Un lien de navigation. */
export interface LinkCopy {
  /** Adresse française de référence, ancre comprise. */
  href: string;
  label: string;
}

/** Un titre dont une partie est mise en valeur par le dégradé de marque. */
export interface HighlightedTitle {
  before: string;
  highlight: string;
  after: string;
}

/** Une carte : titre et texte. */
export interface CardCopy {
  title: string;
  detail: string;
}

export interface MarketingCopy {
  meta: {
    homeTitle: string;
    homeDescription: string;
    securityTitle: string;
    securityDescription: string;
    contactTitle: string;
    contactDescription: string;
    verifyTitle: string;
    verifyDescription: string;
  };
  languageSwitch: {
    /** Libellé accessible du sélecteur. */
    label: string;
  };
  nav: {
    links: LinkCopy[];
    signIn: string;
    demoShort: string;
    demoLong: string;
    openMenu: string;
    closeMenu: string;
    home: string;
  };
  footer: {
    tagline: string;
    columns: { title: string; links: LinkCopy[] }[];
    publisher: string;
    hosting: string;
  };
  /** Illustration de l'application, sur l'accueil. */
  appPreview: {
    windowLabel: string;
    metrics: {
      toRead: string;
      urgent: string;
      turnaround: string;
      turnaroundShort: string;
    };
    /** Valeur affichée du délai moyen. */
    turnaroundValue: string;
    states: {
      toRead: string;
      inProgress: string;
      reported: string;
      assigned: string;
    };
    /** Examen de chaque ligne, dans l'ordre des lignes (5). */
    exams: string[];
  };
  hero: {
    badge: string;
    title: HighlightedTitle;
    lead: string;
    primaryCta: string;
    secondaryCta: string;
    commitmentsTitle: string;
    commitments: { value: string; label: string }[];
    commitmentsNote: string;
  };
  /** Le parcours d'un examen, animé (components/marketing/journey). */
  journey: {
    eyebrow: string;
    title: string;
    lead: string;
    steps: CardCopy[];
    scene: {
      clinic: string;
      gateway: string;
      received: string;
      offline: string;
      route: string;
      compressed: string;
      encrypted: string;
      worklist: string;
      byDeadline: string;
      urgent: string;
      deadline: string;
      exam: string;
      otherRows: { name: string; exam: string; deadline: string }[];
      patient: string;
      radiologist: string;
      indicationLabel: string;
      findingsLabel: string;
      conclusionLabel: string;
      conclusion: string;
      saved: string;
      sign: string;
      signed: string;
      reportTitle: string;
      signedOn: string;
      delivered: string;
      verify: string;
    };
    credit: string;
    creditLink: string;
  };
  howItWorks: {
    eyebrow: string;
    title: string;
    lead: string;
    steps: (CardCopy & { note: string })[];
    uploadNote: string;
  };
  audiences: {
    eyebrow: string;
    title: string;
    lead: string;
    clinics: { eyebrow: string; title: string; points: string[]; cta: string };
    radiologists: {
      eyebrow: string;
      title: string;
      points: string[];
      cta: string;
    };
  };
  securityTeaser: {
    eyebrow: string;
    title: string;
    lead: string;
    guarantees: CardCopy[];
    more: string;
  };
  pricing: {
    eyebrow: string;
    title: string;
    lead: string;
    plansTitle: string;
    /** Nom de chaque formule ; les montants sont dans `pricing.ts`. */
    plans: Record<PlanId, string>;
    /** Prix fixe, `{amount}` déjà mis en forme. */
    price: string;
    /** Prix plancher d'une formule sur devis, `{amount}` déjà mis en forme. */
    priceFrom: string;
    priceUnit: string;
    feesTitle: string;
    feesLead: string;
    feesColumns: { exam: string; normal: string; urgent: string };
    /** Libellé de chaque type d'examen de la grille. */
    exams: Record<ExamTypeId, string>;
    feesNote: string;
    radiologistFeeTitle: string;
    radiologistFeeText: string;
    includedTitle: string;
    included: string[];
    noCommitment: string;
    quoteTitle: string;
    quoteText: string;
    quoteCta: string;
  };
  faq: {
    eyebrow: string;
    title: string;
    entries: { question: string; answer: string }[];
  };
  finalCta: {
    title: HighlightedTitle;
    text: string;
    primary: string;
    secondary: string;
  };
  securityPage: {
    eyebrow: string;
    title: string;
    lead: string;
    /** Dans l'ordre : transit, repos, cloisonnement, traçabilité, hébergement, conservation, réversibilité, incidents. */
    chapters: CardCopy[];
    obligationsTitle: string;
    obligations: string[];
  };
  contactPage: {
    eyebrow: string;
    title: string;
    lead: string;
    emailHint: string;
    location: string;
    testDataNotice: string;
    sentTitle: string;
    /** `{name}` et `{email}` sont remplacés. */
    sentText: string;
    /** Variante pour un radiologue ; `{name}` et `{email}` sont remplacés. */
    sentTextRadiologist: string;
    /** Choix « Je suis », obligatoire. */
    requester: {
      legend: string;
      clinic: string;
      clinicDetail: string;
      radiologist: string;
      radiologistDetail: string;
    };
    fields: {
      name: string;
      role: string;
      rolePlaceholder: string;
      organization: string;
      /** Établissement, pour un radiologue : facultatif. */
      organizationRadiologist: string;
      licenseNumber: string;
      licenseNumberHint: string;
      email: string;
      phone: string;
      optional: string;
      volume: string;
      modalities: string;
      message: string;
      messagePlaceholder: string;
    };
    volumes: string[];
    modalityOptions: string[];
    submit: string;
    errors: {
      requesterKind: string;
      name: string;
      organization: string;
      licenseNumber: string;
      email: string;
      rateLimited: string;
      unavailable: string;
      generic: string;
    };
  };
  verifyPage: {
    validTitle: string;
    /** Document annulé par l'équipe IMAFRIK. */
    voidedTitle: string;
    /** Avec `{date}`, la date de l'annulation. */
    voidedText: string;
    validText: string;
    signedBy: string;
    /** `{number}` est remplacé. */
    license: string;
    signedAt: string;
    exam: string;
    /** `{initial}` est remplacé. */
    patient: string;
    /** `{count}` est remplacé ; `addendaOne` au singulier. */
    addendaOne: string;
    addendaMany: string;
    invalidTitle: string;
    invalidText: string;
    submittedCode: string;
    report: string;
    /**
     * Service de vérification injoignable. Distinct de « code inconnu » :
     * une panne ne dit rien de l'authenticité du document.
     * `{email}` est remplacé.
     */
    unavailableTitle: string;
    unavailableText: string;
    retry: string;
  };
  hashCheck: {
    title: string;
    text: string;
    choose: string;
    match: string;
    mismatch: string;
    expected: string;
  };
  legal: {
    /** Avertissement des traductions de documents juridiques ; vide en français. */
    translationNotice: string;
    updatedAt: string;
  };
}
