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
    licenseStatus: {
      verified: "Verified by IMAFRIK",
      pending: "Being verified",
      missing: "Not provided",
    },
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
  },
  profileDemoAction: "Saving your profile",
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
