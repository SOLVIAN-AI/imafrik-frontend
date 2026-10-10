import type { Locale } from "@/lib/i18n/locale";

/**
 * Textes des écrans d'entrée : connexion et mot de passe oublié.
 *
 * Ces deux écrans font le pont entre le site public et l'application ; ils
 * suivent la langue choisie sur le site (`resolveLocale`). Les écrans qui
 * suivent la connexion sont en français, comme l'application.
 */
export interface AuthCopy {
  brand: {
    titleBefore: string;
    titleHighlight: string;
    lead: string;
    /** Dans l'ordre : délais, signature, traçabilité. */
    proofPoints: { title: string; detail: string }[];
    publisher: string;
  };
  signIn: {
    metaTitle: string;
    title: string;
    subtitle: string;
    email: string;
    emailPlaceholder: string;
    password: string;
    showPassword: string;
    hidePassword: string;
    forgot: string;
    submit: string;
    noAccountTitle: string;
    noAccountText: string;
    requestAccess: string;
    inactivityNotice: string;
    errors: {
      missing: string;
      invalid: string;
      linkExpired: string;
      linkInvalid: string;
      tooMany: string;
      /** Essais suspendus par la limitation du serveur, pour tant de minutes. */
      locked: (minutes: number) => string;
      unavailable: string;
    };
  };
  forgot: {
    metaTitle: string;
    title: string;
    subtitle: string;
    email: string;
    submit: string;
    back: string;
    sentTitle: string;
    /** `{email}` est remplacé. */
    sentText: string;
    sentHint: string;
  };
}

const fr: AuthCopy = {
  brand: {
    titleBefore: "La téléradiologie,",
    titleHighlight: "sans le délai.",
    lead: "Vos examens sont lus par des radiologues disponibles, où qu’ils soient. Votre patient reste dans votre établissement.",
    proofPoints: [
      {
        title: "Des délais tenus par contrat",
        detail: "Deux heures en routine, trente minutes pour une urgence.",
      },
      {
        title: "Une signature nommée",
        detail:
          "Chaque compte-rendu porte le nom et le numéro d’ordre de son auteur.",
      },
      {
        title: "Images chiffrées, accès tracés",
        detail: "Chaque consultation d’examen est enregistrée et attribuable.",
      },
    ],
    publisher: "IMAFRIK est un service édité par SOLVIAN AI LLC, Lomé, Togo.",
  },
  signIn: {
    metaTitle: "Connexion",
    title: "Connexion",
    subtitle: "Accédez à vos examens et à vos comptes-rendus.",
    email: "Adresse électronique",
    emailPlaceholder: "prenom.nom@etablissement.tg",
    password: "Mot de passe",
    showPassword: "Afficher le mot de passe",
    hidePassword: "Masquer le mot de passe",
    forgot: "Mot de passe oublié ?",
    submit: "Se connecter",
    noAccountTitle: "Pas encore de compte ?",
    noAccountText: "L’accès se fait sur invitation.",
    requestAccess: "Demander un accès",
    inactivityNotice:
      "Session fermée après une période d’inactivité, pour protéger les examens. Vos comptes-rendus sont enregistrés.",
    errors: {
      missing: "Renseignez votre adresse et votre mot de passe.",
      invalid: "Adresse ou mot de passe incorrect.",
      linkExpired: "Ce lien a expiré. Demandez-en un nouveau.",
      linkInvalid: "Ce lien n’est pas valide. Demandez-en un nouveau.",
      tooMany:
        "Trop de tentatives de connexion. Patientez quelques minutes avant de réessayer.",
      locked: (minutes: number) =>
        `Trop de tentatives de connexion. Par sécurité, les essais sont suspendus : réessayez dans ${minutes} minute${minutes > 1 ? "s" : ""}.`,
      unavailable:
        "Le service d’authentification ne répond pas. Réessayez dans un instant.",
    },
  },
  forgot: {
    metaTitle: "Mot de passe oublié",
    title: "Mot de passe oublié",
    subtitle:
      "Indiquez l’adresse de votre compte : vous recevrez un lien pour en choisir un nouveau.",
    email: "Adresse électronique",
    submit: "Envoyer le lien",
    back: "Retour à la connexion",
    sentTitle: "Vérifiez vos courriels",
    sentText:
      "Si un compte existe pour {email}, un lien de réinitialisation vient d’y être envoyé. Il expire dans 24 heures.",
    sentHint:
      "Rien reçu au bout de quelques minutes ? Vérifiez les indésirables, puis réessayez.",
  },
};

const en: AuthCopy = {
  brand: {
    titleBefore: "Teleradiology,",
    titleHighlight: "without the wait.",
    lead: "Your examinations are read by available radiologists, wherever they are. Your patient stays in your facility.",
    proofPoints: [
      {
        title: "Turnaround times guaranteed by contract",
        detail:
          "Two hours for routine examinations, thirty minutes for urgent ones.",
      },
      {
        title: "A named signature",
        detail:
          "Every report bears the name and registration number of the radiologist who signed it.",
      },
      {
        title: "Encrypted images, logged access",
        detail:
          "Every time an examination is opened, the access is recorded and attributed to a named user.",
      },
    ],
    publisher: "IMAFRIK is a service published by SOLVIAN AI LLC, Lomé, Togo.",
  },
  signIn: {
    metaTitle: "Sign in",
    title: "Sign in",
    subtitle: "Access your examinations and reports.",
    email: "Email address",
    emailPlaceholder: "firstname.lastname@facility.com",
    password: "Password",
    showPassword: "Show password",
    hidePassword: "Hide password",
    forgot: "Forgotten your password?",
    submit: "Sign in",
    noAccountTitle: "No account yet?",
    noAccountText: "Access is by invitation.",
    requestAccess: "Request access",
    inactivityNotice:
      "You were signed out after a period of inactivity, to protect patient examinations. Your reports have been saved.",
    errors: {
      missing: "Please enter your email address and password.",
      invalid: "Incorrect email address or password.",
      linkExpired: "This link has expired. Please request a new one.",
      linkInvalid: "This link is not valid. Please request a new one.",
      tooMany:
        "Too many sign-in attempts. Please wait a few minutes before trying again.",
      locked: (minutes: number) =>
        `Too many sign-in attempts. For your security, sign-in is paused: please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
      unavailable:
        "The authentication service is not responding. Please try again in a moment.",
    },
  },
  forgot: {
    metaTitle: "Forgotten password",
    title: "Forgotten password",
    subtitle:
      "Enter the email address for your account and we will send you a link to choose a new password.",
    email: "Email address",
    submit: "Send link",
    back: "Back to sign in",
    sentTitle: "Check your email",
    sentText:
      "If an account exists for {email}, a password reset link has just been sent to it. The link expires in 24 hours.",
    sentHint:
      "Nothing received after a few minutes? Check your spam folder, then try again.",
  },
};

const COPY: Record<Locale, AuthCopy> = { fr, en };

/**
 * Textes des écrans d'entrée dans une langue.
 *
 * @param locale Langue résolue pour la requête.
 */
export function authCopy(locale: Locale): AuthCopy {
  return COPY[locale];
}
