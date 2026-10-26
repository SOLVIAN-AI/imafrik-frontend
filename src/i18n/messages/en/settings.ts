import type { AppMessages } from "@/i18n/messages/fr";

/** User settings, in English. */
export const settings: AppMessages["settings"] = {
  title: "Settings",
  profile: {
    title: "Profile",
    descriptionRadiologist:
      "Printed on the reports you will sign. Reports already signed are not changed.",
    descriptionStaff:
      "Your identity within the facility. It appears in the examination access log.",
    fullName: "Full name",
    titleField: "Title",
    titleHintRadiologist:
      "Printed before your name, for example “Dr” or “Prof”.",
    titleHintStaff: "Your position in the facility.",
    license: "Registration number",
    licenseHint:
      "Printed below your signature. The IMAFRIK team verifies it before giving access to examinations.",
    licenseChangeWarning:
      "A new number has to be verified again by the IMAFRIK team. Until then, you will no longer have access to examinations.",
    licenseChangeConfirm: {
      title: "Change your registration number?",
      description: (previous: string, next: string) =>
        next
          ? `Number ${previous} will be replaced by ${next}. The IMAFRIK team will have to verify the new number: until then, you will no longer have access to examinations, and those you have claimed may be passed to a colleague.`
          : `Number ${previous} will be removed from your profile. Without a registration number, you will no longer have access to examinations.`,
      submit: "Save and request verification",
    },
    identityChangeConfirm: {
      title: "Change your signing identity?",
      description:
        "Your name and title are printed under every report you sign, together with your registration number. The IMAFRIK team will have to verify this change: until then, you will no longer have access to examinations, and those you have claimed may be passed to a colleague.",
    },
    saved: "Profile saved.",
    nameRequired: "Your name is required",
  },
  language: {
    title: "Language",
    description:
      "Used for your screens, the service’s messages and the emails you receive.",
    saved: "Language saved.",
    unknown: "Unknown language.",
    reportsNote:
      "PDF reports use each clinic’s report language, as set in its contract.",
  },
  pool: {
    title: "Who reads your examinations",
    description:
      "The setting applies immediately; an examination already taken on by a radiologist stays with them.",
    poolTitle: "All radiologists on the platform",
    poolDetail:
      "Your examinations join the shared worklist. The first available radiologist takes them on.",
    ownTitle: "Our own radiologists only",
    ownDetail:
      "Only the radiologists you have invited to your team can see your examinations. Nobody else.",
    ownWarning:
      "No radiologist on the platform will be able to read your examinations, including at night and at weekends. Make sure your own radiologists cover these periods.",
    saved: "Setting saved.",
  },
  password: {
    title: "Password",
    description: "You will be signed out on all your other devices.",
    submit: "Change password",
    newPassword: "New password",
    confirmation: "Confirm password",
    changed: "Password changed.",
    rules: {
      length: "At least twelve characters",
      uppercase: "One capital letter",
      digitOrSymbol: "One number or symbol",
      tooLong: (max: number) => `No more than ${max} characters`,
    },
    refused: (rule: string) => `Password rejected: ${rule.toLowerCase()}.`,
    mismatch: "The two entries do not match.",
    weak: "This password was rejected: choose a longer one that differs from your previous password.",
    failed: "The password could not be changed. The link may have expired.",
    demoAction: "Changing your password",
    secondFactorFirst:
      "Your account is protected by two-factor authentication: enter your code first, then change the password.",
    currentPassword: "Current password",
    currentRequired: "Please enter your current password.",
    currentInvalid: "Your current password is incorrect.",
    tooManyAttempts:
      "Too many attempts. Please wait a few minutes before trying again.",
    unavailable:
      "The authentication service is not responding. Please try again in a moment.",
    linkRequired:
      "This link can no longer be used to choose a password. Please request a new one from “Forgotten password”.",
  },
  profileDemoAction: "Saving your profile",
  signing: {
    title: "Signature and stamp",
    description:
      "Your signature and stamp are applied to every report you sign, after you enter your personal code. Reports already signed keep those on their PDF.",
    demoAction: "Saving a signature or stamp",
    optional: "Optional",
    kinds: { signature: "Handwritten signature", stamp: "Stamp" },
    none: {
      signature: "No signature saved.",
      stamp: "No stamp saved.",
    },
    noneDetail:
      "Optional: without an image, the report carries your name, your registration number and its verification code.",
    inUse: {
      signature: "Printed on your reports",
      stamp: "Printed on your reports",
    },
    legacy: "Set by the IMAFRIK team",
    pending: "Being reviewed by the IMAFRIK team",
    pendingDetail: (hasAccepted: boolean) =>
      hasAccepted
        ? "The current image is still used until it is accepted."
        : "It will be printed once accepted.",
    rejected: "Not accepted by the IMAFRIK team",
    rejectedReason: (reason: string) => `Reason: ${reason}`,
    previewAlt: {
      signature: "Your signature",
      stamp: "Your stamp",
    },
    pendingAlt: {
      signature: "Your new signature, being reviewed",
      stamp: "Your new stamp, being reviewed",
    },
    draw: "Draw",
    import: "Upload",
    formats:
      "PNG or JPEG, 2 MB at most. On a white background: white is made transparent.",
    stampHint: "The stamp must show your name and registration number.",
    errors: {
      badType: "Upload a PNG or JPEG image.",
      tooLarge: "This file exceeds 2 MB.",
      unreadable: "This file could not be read.",
    },
    sent: {
      signature:
        "Signature sent: the IMAFRIK team reviews it before it is printed.",
      stamp: "Stamp sent: the IMAFRIK team reviews it before it is printed.",
    },
    submit: {
      drawTitle: "Draw your signature",
      importTitle: {
        signature: "Upload your signature",
        stamp: "Upload your stamp",
      },
      description:
        "The IMAFRIK team reviews the image before it is printed. Until then, the current image is still used.",
      preview: "Chosen image",
      send: "Send for review",
    },
    pad: {
      label: "Signature area: sign with a mouse, a stylus or your finger",
      hint: "Sign inside the frame with a mouse, a stylus or your finger.",
      clear: "Clear",
      undo: "Undo last stroke",
      problems: {
        empty: "Draw your signature inside the frame.",
        tooShort:
          "This stroke is too quick for a signature: take your time to sign.",
        tooSmall: "This stroke is too small: use the whole frame to sign.",
      },
      alternative:
        "Cannot draw on screen? Upload a photo or a scan of your signature.",
    },
    pin: {
      title: "Personal code",
      set: "Set",
      notSet: "To be created",
      setDetail: "Requested at every signature and every addendum.",
      notSetDetail:
        "Required to sign. Create it here, or in the window of your next signature.",
      lockedDetail: (time: string) =>
        `Locked after five errors, until ${time}.`,
      define: "Create the code",
      change: "Change the code",
      forgotten:
        "Forgotten your code? Ask the IMAFRIK team to erase it, then create a new one. The team never chooses it for you.",
      label: "Personal code",
      hint: "Six digits.",
      newLabel: "New code",
      confirmLabel: "Confirmation",
      currentLabel: "Current code",
      createTitle: "Create your personal code",
      createDetail:
        "Six digits, requested at every signature and every addendum. Avoid sequences (123456) and repeated digits.",
      problems: {
        format: "The code has six digits.",
        trivial: "This code is too easy to guess: choose another one.",
        mismatch: "The two entries of the code do not match.",
      },
      locked: (time: string) =>
        `Code locked after five errors. Try again at ${time}.`,
      dialog: {
        createTitle: "Create your personal code",
        changeTitle: "Change your personal code",
        createDescription:
          "You will be asked for it at every signature and every addendum. Share it with no one, not even the IMAFRIK team.",
        changeDescription:
          "Enter your current code, then the new one, twice. Five errors on the current code lock it for fifteen minutes.",
        created: "Personal code created.",
        changed: "Personal code changed.",
      },
      demoAction: "Setting the personal code",
    },
  },
  mfa: {
    title: "Two-factor authentication",
    description:
      "A one-time code, in addition to your password, every time you sign in.",
    active: "Enabled",
    required: "Required for your role",
    recommended: "Recommended, not enabled",
    activeDetail:
      "Lost or changed your phone? Contact the IMAFRIK team, who will reset your access after verifying your identity.",
    inactiveDetail:
      "A stolen password is no longer enough to open your account. Once it is enabled, a code is requested every time you sign in.",
    enable: "Enable",
  },
};
