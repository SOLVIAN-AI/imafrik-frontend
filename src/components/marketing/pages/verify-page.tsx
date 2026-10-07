import {
  CalendarCheck,
  FileCheck2,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PdfHashCheck } from "@/components/marketing/pdf-hash-check";
import { fill, marketingCopy } from "@/content/marketing";
import { verifyReport } from "@/lib/data/verification";
import { formatDate, formatDateTime } from "@/lib/format";
import type { Locale } from "@/lib/i18n/locale";
import { localizePath } from "@/lib/i18n/routes";

/**
 * Vérification publique d’un compte-rendu signé.
 *
 * **Ce que la page montre, et surtout ce qu’elle ne montre pas.** Elle
 * atteste qu’un document existe, qui l’a signé et quand, et rien d’autre.
 * Du patient, seule l’initiale du nom ; ni identifiant, ni contenu du
 * compte-rendu : le code est imprimé sur un document qui circule, il peut
 * être lu par n’importe qui.
 *
 * Elle sert au médecin traitant, à l’assurance ou au patient qui veut
 * s’assurer qu’un document n’a pas été fabriqué. Sans elle, un
 * compte-rendu PDF est un fichier que tout le monde peut imiter.
 *
 * Rendue côté serveur : la vérification ne doit pas dépendre de
 * l’exécution de script chez celui qui vérifie. Elle appellera
 * `GET /verify/{verify_token}`, qui existe déjà côté API.
 *
 * @param token  Code lu sur le document.
 * @param locale Langue de la page.
 */
export async function VerifyPage({
  token,
  locale,
}: {
  token: string;
  locale: Locale;
}) {
  const t = marketingCopy(locale).verifyPage;
  const attestation = await verifyReport(token);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-20 text-center md:py-28">
      {attestation ? (
        <>
          <span
            className="flex size-14 items-center justify-center rounded-2xl bg-done-muted ring-1 ring-done/25 ring-inset"
            aria-hidden
          >
            <ShieldCheck className="size-6 text-done" />
          </span>
          <h1 className="mt-6 text-2xl font-semibold">{t.validTitle}</h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-secondary">
            {t.validText}
          </p>

          <dl className="mt-10 w-full divide-y divide-border-subtle overflow-hidden rounded-2xl border border-border-subtle bg-surface-raised text-left">
            <Row
              icon={Stethoscope}
              label={t.signedBy}
              value={attestation.radiologist}
              detail={
                attestation.licenseNumber
                  ? fill(t.license, { number: attestation.licenseNumber })
                  : undefined
              }
            />
            <Row
              icon={CalendarCheck}
              label={t.signedAt}
              value={formatDateTime(attestation.signedAt, locale)}
            />
            <Row
              icon={FileCheck2}
              label={t.exam}
              value={[
                attestation.modality ?? "—",
                attestation.studyDate
                  ? formatDate(attestation.studyDate, locale)
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
              detail={[
                attestation.clinic,
                attestation.patientInitial
                  ? fill(t.patient, { initial: attestation.patientInitial })
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            />
          </dl>

          {attestation.addendaCount > 0 && (
            <p className="mt-4 text-xs text-secondary">
              {attestation.addendaCount === 1
                ? t.addendaOne
                : fill(t.addendaMany, { count: attestation.addendaCount })}
            </p>
          )}

          {attestation.sha256 && (
            <PdfHashCheck expected={attestation.sha256} locale={locale} />
          )}
        </>
      ) : (
        <>
          <span
            className="flex size-14 items-center justify-center rounded-2xl bg-urgent-muted ring-1 ring-urgent/25 ring-inset"
            aria-hidden
          >
            <ShieldCheck className="size-6 text-urgent" />
          </span>
          <h1 className="mt-6 text-2xl font-semibold">{t.invalidTitle}</h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-secondary">
            {t.invalidText}
          </p>
          <p className="mt-6 font-mono text-2xs text-tertiary">
            {fill(t.submittedCode, { code: token })}
          </p>
          <Button variant="secondary" size="sm" className="mt-8" asChild>
            <Link href={localizePath("/contact", locale)}>{t.report}</Link>
          </Button>
        </>
      )}
    </div>
  );
}

/** Une ligne du certificat. */
function Row({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="flex items-start gap-3 px-5 py-4">
      <Icon className="mt-0.5 size-4 shrink-0 text-tertiary" />
      <div className="min-w-0">
        <dt className="label-eyebrow">{label}</dt>
        <dd className="mt-1 text-sm font-medium">{value}</dd>
        {detail && <dd className="mt-0.5 text-xs text-tertiary">{detail}</dd>}
      </div>
    </div>
  );
}
