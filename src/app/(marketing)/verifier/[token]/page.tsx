import { CalendarCheck, FileCheck2, ShieldCheck, Stethoscope } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { findDemoReport } from "@/lib/demo/reports";
import { findDemoStudy } from "@/lib/demo/studies";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Vérification d’un compte-rendu",
  description:
    "Vérifiez l’authenticité d’un compte-rendu IMAFRIK à partir du code figurant sur le document.",
  // La page est publique mais ne doit pas être indexée : chaque adresse
  // contient un code, et un moteur qui les collecterait rendrait
  // vérifiables des documents au hasard.
  robots: { index: false, follow: false },
};

/**
 * Vérification publique d’un compte-rendu signé.
 *
 * **Ce que la page montre, et surtout ce qu’elle ne montre pas.** Elle
 * atteste qu’un document existe, qui l’a signé et quand — rien d’autre.
 * Ni nom de patient, ni identifiant, ni contenu du compte-rendu : le
 * code est imprimé sur un document qui circule, il peut être lu par
 * n’importe qui.
 *
 * Elle sert au médecin traitant, à l’assurance ou au patient qui veut
 * s’assurer qu’un document n’a pas été fabriqué. Sans elle, un
 * compte-rendu PDF est un fichier que tout le monde peut imiter.
 *
 * Rendue côté serveur : la vérification ne doit pas dépendre de
 * l’exécution de script chez celui qui vérifie. Elle appellera
 * `GET /verify/{verify_token}`, qui existe déjà côté API.
 */
export default async function VerifyPage({
  params,
}: PageProps<"/verifier/[token]">) {
  const { token } = await params;

  // À remplacer par l’appel API. La comparaison est faite sans tenir
  // compte de la casse ni des tirets : le code est recopié à la main
  // depuis un papier, souvent mal.
  const normalized = token.replaceAll("-", "").toUpperCase();
  const report = [findDemoReport("r-4815"), findDemoReport("r-4809")].find(
    (candidate) =>
      candidate?.verifyToken.replaceAll("-", "").toUpperCase() === normalized,
  );
  const study = report ? findDemoStudy(report.studyId) : undefined;

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-20 text-center md:py-28">
      {report && study ? (
        <>
          <span
            className="flex size-14 items-center justify-center rounded-2xl bg-done-muted ring-1 ring-done/25 ring-inset"
            aria-hidden
          >
            <ShieldCheck className="size-6 text-done" />
          </span>
          <h1 className="mt-6 text-2xl font-semibold">Document authentique</h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-secondary">
            Ce code correspond à un compte-rendu signé sur la plateforme
            IMAFRIK. Aucune donnée du patient n’est communiquée sur cette page.
          </p>

          <dl className="mt-10 w-full divide-y divide-border-subtle overflow-hidden rounded-2xl border border-border-subtle bg-surface-raised text-left">
            <Row
              icon={Stethoscope}
              label="Signé par"
              value={report.signedBy}
              detail={report.signerTitle}
            />
            <Row
              icon={CalendarCheck}
              label="Date de signature"
              value={formatDateTime(report.signedAt)}
            />
            <Row
              icon={FileCheck2}
              label="Examen"
              value={`${study.modality} · ${study.bodyPart ?? "—"}`}
              detail={study.clinic}
            />
          </dl>

          <p className="mt-6 font-mono text-2xs text-tertiary">
            Code vérifié : {report.verifyToken}
          </p>
        </>
      ) : (
        <>
          <span
            className="flex size-14 items-center justify-center rounded-2xl bg-urgent-muted ring-1 ring-urgent/25 ring-inset"
            aria-hidden
          >
            <ShieldCheck className="size-6 text-urgent" />
          </span>
          <h1 className="mt-6 text-2xl font-semibold">Code inconnu</h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-secondary">
            Aucun compte-rendu ne correspond à ce code. Vérifiez la saisie —
            les caractères se recopient mal depuis un document imprimé. Si le
            code est correct, le document ne provient pas d’IMAFRIK.
          </p>
          <p className="mt-6 font-mono text-2xs text-tertiary">
            Code soumis : {token}
          </p>
          <Button variant="secondary" size="sm" className="mt-8" asChild>
            <Link href="/contact">Signaler un document suspect</Link>
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
