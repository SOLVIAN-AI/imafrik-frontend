import type { guides as fr } from "@/i18n/messages/fr/help-guides";

/** Step-by-step help guides, in English. */
export const guides: typeof fr = {
  onboardClinic: {
    title: "Connect a new clinic",
    intro:
      "From creating the clinic to its first examination received, in about twenty minutes on the phone with it. No key file travels: the key is created on the clinic’s workstation, and a single-use code is enough to connect it.",
    sections: [
      {
        title: "Create the clinic, in the control tower",
        steps: [
          "Organisations, “New clinic”: enter the facility name, the city and the report language, which is also the language of the invitations.",
          "Enter its managers, at least one: they will send the examinations and manage the team. Choose who reads its examinations: its own radiologists, to be invited too, or the “IMAFRIK network radiologists”.",
          "Click “Create and invite the team”: each person receives a link by email and chooses their password, then the page opens. An invitation that was not sent can be retried at once.",
        ],
      },
      {
        title: "Prepare the workstation, before the appointment",
        steps: [
          "Have the clinic prepare a Windows 10 (version 1809 or later) or 11 computer, 64-bit, always on, on the devices’ network, with 100 GB free and a fixed IP address.",
          "Have Orthanc installed on it (orthanc-server.com, “Windows installer”, default options) and check that the firewall lets HTTPS out, port 443.",
          "Gateways, “Download the kit”, then “Copy the fingerprint”: keep this fingerprint. Pass the kit on to the clinic, by download or on a USB stick.",
        ],
      },
      {
        title: "Install the gateway, on the phone with the clinic",
        steps: [
          "On the workstation, check the kit: `certutil -hashfile kit-passerelle.zip SHA256` must show the fingerprint you copied. If it differs, do not install it and download it again.",
          "Have the file unblocked (right-click, “Properties”, “Unblock”), the kit extracted, then “INSTALLER.bat” run, accepting Windows’ permission request.",
          "If Windows reports an unknown publisher, as long as the kit is unsigned: “More info”, then “Run anyway”.",
          "Clinic page, “Connect a gateway”, “Issue a code”: read it out to the installer, who enters it. It is valid for 15 minutes and works only once.",
          "Under “Gateways”, the workstation shows “Awaiting approval”: check its name with the clinic, then click “Approve”.",
          "The installer activates the gateway and runs a real DICOM test. Have the local interface password written down: it is shown only once.",
        ],
      },
      {
        title: "Put into service",
        steps: [
          "On the imaging console, declare the destination given on the “IMAFRIK - gateway help” sheet on the Desktop: the workstation’s IP address, port 4242, AE Title IMAFRIK.",
          "Have an old examination sent, then check that it arrives in “Image flow” or on the clinic page. Each series leaves one minute after its last image.",
          "Check “Onboarding” on the clinic page: all its steps must be completed.",
        ],
      },
    ],
  },
  weasis: {
    title: "Read an examination in Weasis",
    intro:
      "Weasis, the free DICOM viewer from Geneva University Hospitals, installs on the computer and opens from the reading screen, alongside the viewer. It receives this examination only, with the same access as the viewer, without import, export or sending, and keeps its images on the computer until it is closed.",
    sections: [
      {
        title: "Install Weasis, once per computer",
        steps: [
          "Open the official download page, weasis.org/en/getting-started/download-dicom-viewer, or click “Download Weasis (official site)” in the reading screen help.",
          "Choose your system’s installer: Windows 10 or 11 (.msi), macOS (.pkg, Apple silicon or Intel) or Linux (.deb, .rpm). Weasis exists for neither tablets nor phones.",
          "Install it with the default options; on a managed computer, your IT department may need to do it. No other software is needed.",
        ],
      },
      {
        title: "Open an examination",
        steps: [
          "On the reading screen, below the images, click “Open in Weasis” (the screen icon, on a narrow screen).",
          "Accept the browser’s request to open Weasis; you can allow it permanently for this site.",
          "Weasis opens in an IMAFRIK profile, separate from your usual Weasis: it closes the examination it was showing, opens this one and downloads its images. The link is valid for five minutes and works once.",
          "Weasis opened from IMAFRIK imports nothing, no files, CDs or other images: drop no files or folders into it, so that another patient’s images are never mixed with the examination you read.",
          "Weasis only receives images: sound, documents (PDF), video and structured reports are viewed in the IMAFRIK viewer, and an examination without images does not open in Weasis.",
          "If nothing opens, the help appears: Weasis is probably not installed on this computer.",
        ],
      },
      {
        title: "After reading",
        steps: [
          "Write and sign the report in IMAFRIK: Weasis only displays the images.",
          "Close Weasis: it then deletes the downloaded images. After a crash, it deletes them when it next starts.",
          "You lose access to the examination, or you sign out: Weasis can no longer download any of its images within seconds.",
        ],
      },
      {
        title: "What the practice agreement requires",
        steps: [
          "Open Weasis on a computer with your own user session, used by you alone, and an encrypted disk.",
          "One examination at a time, and Weasis closed at the end of each read.",
          "No copies: no screenshots or photos of the screen, no printing, no copying of the temporary folder where Weasis keeps the images. Weasis opened from IMAFRIK offers no import, export or sending anyway.",
          "The access handed to Weasis is yours, for this examination: do not copy it or give it to any other software.",
          "Every opening is logged in your name and may be reviewed; a breach suspends your access (Article 9 of the agreement).",
        ],
      },
    ],
  },
};
