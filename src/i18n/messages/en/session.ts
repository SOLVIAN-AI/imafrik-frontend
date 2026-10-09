import type { AppMessages } from "@/i18n/messages/fr";

/** Texts for the "session" area, in English. */
export const session: AppMessages["session"] = {
  mfa: {
    title: "Two-factor authentication",
    enrollIntro:
      "Your account gives access to medical examinations, so it is protected by a one-time code in addition to your password. Setting it up takes a minute and only needs to be done once.",
    verifyIntro: "Enter the six-digit code shown in your authenticator app.",
    steps: {
      install:
        "Install an authenticator app on your phone: Google Authenticator, Microsoft Authenticator or 2FAS.",
      scan: "Scan the QR code that will appear.",
      enterCode: "Enter the six-digit code the app displays.",
    },
    setUp: "Set up my authenticator app",
    codeLabel: "Six-digit code",
    verify: "Verify",
    noSmartphone: "No smartphone?",
    lostPhone: "Lost or changed your phone?",
    support:
      "Contact the IMAFRIK team: once they have verified your identity, they will reset your access and you can set up a new device.",
    qrAlt: "QR code to scan with your authenticator app",
    cannotScan: "Unable to scan it? Enter this key:",
    copyKey: "Copy key",
    factorName: "Authenticator app",
    errors: {
      demo: "Two-factor authentication is not available in the demo.",
      serviceDown:
        "The authentication service is not responding. Please try again.",
      alreadyEnrolled:
        "An authenticator app is already linked to this account. To change phones, contact the IMAFRIK team.",
      enrollFailed: "Setup could not be started. Please try again.",
      codeFormat: "The code must have six digits.",
      unknownFactor: "Unknown authentication factor.",
      tooManyAttempts:
        "Too many attempts. Please wait a minute before trying again.",
      wrongCode:
        "Incorrect or expired code. Enter the code currently shown in your app.",
      notApplied: "The verification did not go through. Please try again.",
    },
  },
  newPassword: {
    title: "New password",
    description: "You will be signed out on all your other devices.",
    password: "New password",
    confirmation: "Confirm password",
    mismatch: "The two entries do not match.",
    submit: "Save password",
  },
  invitation: {
    metaTitle: "Invitation",
    eyebrow: "Invitation",
    welcome: (organization: string) => `Welcome to ${organization}`,
    intro:
      "Your IMAFRIK account is ready. Check who invited you below, then choose your password.",
    detailsLabel: "Your invitation",
    role: "Role",
    city: "City",
    invitedBy: "Invited by",
    sentOn: "Sent on",
    roleNames: {
      clinic_staff: "Facility staff",
      radiologist: "Radiologist",
      platform_admin: "IMAFRIK team",
    },
    roleDetails: {
      clinic_staff:
        "You send your facility’s examinations and collect the signed reports.",
      radiologist:
        "You read and sign the examinations entrusted to the group, under your name and registration number.",
      platform_admin:
        "You administer the platform: connected facilities, accounts and operations.",
    },
    organizationKinds: {
      clinic: "Healthcare facility",
      radiology_group: "Radiology group",
    },
    notExpectedBefore:
      "Were you not expecting this invitation? Close this page and email us at ",
    notExpectedAfter: ".",
    stepsLabel: "Getting started",
    steps: {
      password: "Password",
      mfa: "Two-factor authentication",
      onboarding: "First steps",
    },
    passwordTitle: "Choose your password",
    nextMfa:
      "Next, you will set up two-factor authentication, which your role requires.",
    nextOnboarding: "Next, a few steps to get to know your workspace.",
    submit: "Save and continue",
  },
  inactivity: {
    title: "Your session is about to close",
    detailBefore: (minutes: number) =>
      `There has been no activity for almost ${minutes} minutes. To protect the examinations on screen, you will be signed out in `,
    seconds: (seconds: number) => `${seconds} s`,
    detailAfter: ". Your reports have been saved.",
    signOutNow: "Sign out now",
    staySignedIn: "Stay signed in",
  },
  membership: {
    unknown: "Unknown membership.",
    switchRefused: "The organisation switch was refused.",
  },
  pending: {
    metaTitle: "Account pending",
    eyebrow: "Pending",
    title: "Your account does not have access to any portal yet",
    notLinked:
      "You are signed in, but your account is not linked to any active facility or radiology group.",
    nextSteps: (email: string) =>
      `If you have just submitted your application, it is being reviewed. If you were already using IMAFRIK, your facility may have removed your access: please get in touch with them, or write to us at ${email}.`,
    otherOrganizations:
      "Your active organisation is no longer available, but you can continue in one of your other organisations.",
    openOrganization: (name: string) => `Continue in ${name}`,
    resuming: "Updating your access…",
  },
  serviceUnavailable: {
    eyebrow: "Service interruption",
    title: "Service temporarily unavailable",
    detail:
      "IMAFRIK is not responding at the moment. Your data has not been lost: please try again in a few minutes.",
  },
  appError: {
    title: "This screen could not be displayed",
    detail:
      "The service did not respond as expected. These errors are usually temporary, so please try again in a moment.",
    reference: (digest: string) => `Reference: ${digest}`,
  },
  configuration: {
    metaTitle: "Configuration required",
    title: "This deployment is not configured",
    lead: "Rather than show demo data at a production address, the service is refusing to serve any pages.",
    footer:
      "Add them to the deployment’s environment variables, then redeploy.",
    purposes: {
      supabase: "authentication and reading memberships",
      api: "examinations, reports and viewer tokens",
      viewer: "displaying images on the reading screen",
      viewerIsolation:
        "must be served from a different origin from the site, so that it shares neither its cookies nor its storage",
      siteUrl: "links in emails and the report verification link",
      siteUrlDurable:
        "must be the permanent site address, over https, not a preview address: it appears in the verification links of documents already issued",
      backupSecret: (minLength: number) =>
        `encryption of draft backups stored on the device (at least ${minLength} characters)`,
    },
  },
  statusScreen: {
    error: (code: string) => `Error ${code}`,
    backHome: "Back to home",
  },
};
