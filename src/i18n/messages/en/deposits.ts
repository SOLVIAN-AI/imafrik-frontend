import type { AppMessages } from "@/i18n/messages/fr";

/** Uploading a ZIP archive of images from the browser, in English. */
export const deposits: AppMessages["deposits"] = {
  metaTitle: "Image uploads",
  title: "Image uploads",
  description: (clinic: string) =>
    `ZIP archives sent from the browser · ${clinic}`,
  teamDescription:
    "ZIP archives uploaded by the clinics, or by the team on their behalf",
  clinicViewDescription: (clinic: string) =>
    `The clinic’s ZIP archives, and uploading on its behalf · ${clinic}`,
  depositAction: "Upload images",
  demoAction: "Uploading an archive",
  demoCancel: "Cancelling an upload",

  uploader: {
    section: "Upload a ZIP archive",
    sectionTip:
      "The archive is sent in pieces. After a cut, the upload resumes at the exact byte: nothing already received is sent again.",
    dropTitle: "Drop a ZIP archive here",
    dropDetail: (max: string) =>
      `The DICOM export of an examination or a CD, compressed as ZIP. ${max} at most per archive.`,
    choose: "Choose an archive",
    chooseMany: "One or several archives: they are sent one after the other.",
    honestTitle: "A connection is still needed while sending",
    honest:
      "If it drops, the upload stops, then resumes on its own where it left off as soon as the network is back.",
    honestClosed: (hours: number) =>
      `Page closed or computer switched off? Choose the same file again within ${hours} hours: the upload resumes where it was, even from another computer.`,
    limits: "What the service accepts",
    limitsTip: (archive: string, files: string, file: string) =>
      `${archive} and ${files} at most per archive, ${file} per image. Only DICOM files are kept; the others are listed in the report.`,
    demoNotice:
      "Demonstration: the upload is simulated, nothing leaves this computer.",
    onBehalf: (clinic: string) =>
      `Upload on behalf of ${clinic}, recorded under your name in the audit log.`,
    chooseClinicFirst:
      "First choose the clinic on whose behalf you are uploading.",
    clinicClosed:
      "Clinic suspended or contract ended: it no longer accepts uploads.",
    checking: "Preparing the upload…",
    resuming: (percent: number) => `Resuming the upload at ${percent}%`,
    percent: (percent: number) => `${percent}%`,
    of: (sent: string, total: string) => `${sent} of ${total}`,
    rate: (rate: string) => `${rate}/s`,
    measuring: "Measuring speed…",
    remaining: (duration: string) => `about ${duration} left`,
    underAMinute: "less than a minute",
    offline:
      "Connection lost. The upload will resume on its own when the network is back.",
    paused: "Paused",
    received: "Archive received. Check in progress: the report follows.",
    cancelled: "Upload cancelled: what had been received is erased.",
    pause: "Pause",
    resume: "Resume",
    cancel: "Cancel upload",
    remove: "Remove from the list",
    report: "See the report",
    refused: {
      not_zip: "This file is not a ZIP archive.",
      too_large: (max: string) =>
        `Archive too large: ${max} at most. Split it into several archives.`,
      empty: "This file is empty.",
    },
    refusedStatus: (status: number) =>
      `Upload refused by the service (code ${status}).`,
    tokenRefused:
      "Your session can no longer upload: reload the page, then choose the file again.",
    unavailable: "Upload unavailable for now.",
    leaving:
      "An upload is in progress. If you leave the page, it stops; it will resume when you choose the same file again.",
  },

  list: {
    title: "My uploads",
    teamTitle: "Uploads",
    clinicViewTitle: "The clinic’s uploads",
    columns: {
      date: "Uploaded on",
      file: "Archive",
      clinic: "Clinic",
      author: "By",
      state: "State",
      result: "Result",
    },
    tips: {
      state:
        "Sending: the archive has not fully arrived. Checking: it has arrived and its images are being verified. Integrated: the report is ready. Refused: the whole archive was set aside. Abandoned: upload cancelled, or no new byte for 72 hours.",
      result:
        "Examinations and images sent, and files ignored. The report gives the detail.",
    },
    teamAuthor: "IMAFRIK team",
    empty: "No uploads yet",
    emptyDetail: "The archives you upload appear here, with their report.",
    teamEmpty: "No uploads in the network",
    clinicViewEmpty: "No uploads for this clinic",
    limited: "The 500 most recent uploads.",
    received: (received: string, total: string) => `${received} of ${total}`,
    interrupted: (date: string) =>
      `Interrupted. Choose this file again before ${date} to resume.`,
    waiting: "Archive check in progress",
    result: (studies: number, instances: number) =>
      `${studies === 1 ? "1 examination" : `${studies} examinations`} · ${
        instances === 1 ? "1 image" : `${instances} images`
      }`,
    ignored: (count: number) =>
      count === 1 ? "1 file ignored" : `${count} files ignored`,
    resume: "Resume",
    resumeLabel: (file: string) => `Resume uploading ${file}`,
    cancel: "Cancel",
    cancelLabel: (file: string) => `Cancel uploading ${file}`,
    cancelConfirm: (file: string) =>
      `Cancel uploading “${file}”? What has been received will be erased.`,
    cancelled: "Upload cancelled",
    keep: "Keep the upload",
    open: "Report",
    openLabel: (file: string) => `Report of upload ${file}`,
  },

  states: {
    uploading: "Sending",
    processing: "Checking",
    done: "Integrated",
    refused: "Refused",
    abandoned: "Abandoned",
  },

  statuses: {
    uploading: "Upload in progress, or interrupted",
    received: "Archive received, waiting to be checked",
    processing: "Check in progress",
    done: "Report ready",
    refused: "Archive refused",
    cancelled: "Upload cancelled",
    expired: "Upload abandoned (no byte received for 72 hours)",
  },

  refusals: {
    not_a_zip: {
      title: "This file is not a readable ZIP archive",
      action:
        "Create the archive again: right-click the exported folder, “Send to”, “Compressed (zipped) folder”.",
    },
    split_archive: {
      title: "Archive in several parts",
      action: "Send a single-part archive, or several separate archives.",
    },
    too_many_files: {
      title: "Too many files in the archive",
      action:
        "10,000 files at most: split the export into several archives, one examination per archive for instance.",
    },
    too_large_uncompressed: {
      title: "Archive too large once decompressed",
      action:
        "8 GB decompressed at most: split the export into several archives.",
    },
    suspicious_compression: {
      title: "Abnormal compression ratio",
      action:
        "The archive decompresses far beyond what an image allows: it was set aside for safety. Create it again from the image folder.",
    },
    unsafe_path: {
      title: "Archive set aside for safety",
      action:
        "It contains a path leading out of its folder, or a link. Create it again from the image folder exported by the console.",
    },
    empty_archive: {
      title: "Empty archive",
      action: "Check that the compressed folder does contain the images.",
    },
    clinic_inactive: {
      title: "Clinic suspended",
      action:
        "Uploads will resume with the clinic’s activity. Contact the IMAFRIK team.",
    },
    pacs_unavailable: {
      title: "The image server did not answer for 72 hours",
      action:
        "The IMAFRIK team has been alerted. Upload the archive again: images already received will not be counted twice.",
    },
    processing_failed: {
      title: "The archive check failed",
      action:
        "The IMAFRIK team has been alerted. Upload the archive again in a few hours.",
    },
  },

  reasons: {
    other_clinic: {
      label: "Another clinic’s examination",
      detail:
        "This examination already belongs to another clinic, or is arriving through another clinic’s gateway: nothing of it was sent.",
    },
    not_dicom: {
      label: "Not a DICOM image",
      detail:
        "Document, ordinary picture, or DICOM file without its file header (Part 10).",
    },
    invalid_dicom: {
      label: "Incomplete DICOM",
      detail:
        "An essential identifier (examination, series or image) is missing, or they do not match.",
    },
    corrupt: {
      label: "Corrupted file",
      detail:
        "Damaged data in the archive, or a truncated image. Export the examination again from the console.",
    },
    encrypted: {
      label: "Encrypted file",
      detail:
        "Password-protected in the archive. Create the archive again without a password.",
    },
    pacs_refused: {
      label: "Refused by the image server",
      detail: "The image server could not read this DICOM file.",
    },
    too_large: {
      label: "File too large",
      detail: "More than 512 MB for a single image.",
    },
    suspicious_compression: {
      label: "Abnormal compression ratio",
      detail:
        "The file decompresses far beyond what an image allows: set aside for safety.",
    },
    unsupported_compression: {
      label: "Unsupported compression",
      detail:
        "Create the archive again with the usual compression (Windows “Compressed folder”).",
    },
    nested_archive: {
      label: "Archive inside the archive",
      detail: "An archive is not opened: decompress it first.",
    },
    dicomdir: {
      label: "CD index",
      detail: "The DICOMDIR file describes the CD; it contains no image.",
    },
    system_file: {
      label: "System file",
      detail:
        "Added to the archive by Windows or macOS, unrelated to the examination.",
    },
  },

  report: {
    back: "Image uploads",
    teamBack: "Uploads",
    title: (file: string) => `Upload ${file}`,
    meta: (date: string, author: string, size: string) =>
      `Uploaded on ${date} by ${author} · ${size}`,
    entries: (count: number) =>
      count === 1 ? "1 file in the archive" : `${count} files in the archive`,
    summary: "Result",
    figures: {
      studies: "Examinations",
      series: "Series",
      instances: "Images sent",
      duplicates: "Duplicates",
      ignored: "Files ignored",
    },
    tips: {
      studies:
        "Examinations with at least one image sent. They arrive in “Examinations”, “to assign”, about a minute after the check.",
      series: "Series of the examinations sent.",
      instances: "Images that entered the platform through this upload.",
      duplicates:
        "Images present twice in the archive, or already received by IMAFRIK: sent once, never counted twice.",
      ignored: "Files of the archive set aside: their reason is given below.",
    },
    studiesSection: "Examinations found in the archive",
    columns: {
      patient: "Patient",
      modality: "Modality",
      date: "Examination date",
      series: "Series",
      images: "Images",
      duplicates: "Duplicates",
      state: "Integration",
    },
    integrated: "Integrated",
    open: "Open the examination",
    pending: "Being integrated",
    pendingTip:
      "The examination appears about a minute after its last image, once the image server considers it complete.",
    refusedStudy: "Not sent",
    unknownPatient: "Patient to come",
    ignoredSection: "Files ignored",
    ignoredCount: (count: number) =>
      count === 1 ? "1 file" : `${count} files`,
    showFiles: (count: number) =>
      count === 1 ? "See the file" : `See the ${count} files`,
    listedOnly: (shown: number, total: number) =>
      `${shown} files named out of ${total} ignored.`,
    noneIgnored: "No file ignored: everything in the archive was kept.",
    refusedTitle: "Archive refused",
    uploadingTitle: "Upload interrupted",
    uploadingDetail: (received: string, total: string, date: string) =>
      `${received} received out of ${total}. Choose the same file again in “Image uploads” before ${date}: the upload will resume there.`,
    processingTitle: "Check in progress",
    processingDetail:
      "The archive has arrived. Its images are being verified then sent: this page updates on its own.",
    abandonedTitle: "Upload abandoned",
    abandonedDetail:
      "What had been received is erased. Upload the archive again to send it.",
    nothingAccepted: "No image was kept: see why in the files ignored.",
  },

  chooseClinic: "Clinic",
  chooseClinicPlaceholder: "Choose a clinic",
};
