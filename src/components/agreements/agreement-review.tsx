"use client";

import { CheckCircle2, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useLocale, useMessages } from "@/i18n/client";
import { acceptAgreement } from "@/lib/actions/agreements";
import {
  type Block,
  type Inline,
  parseAgreementMarkdown,
} from "@/lib/agreement-markdown";
import {
  type AgreementDocument,
  type AgreementView,
  SIGNATORY_CAPACITY_MAX_LENGTH,
  agreementPdfHref,
} from "@/lib/agreements";
import { formatDate, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Fragments de texte, avec leur mise en valeur. */
function Inlines({ inlines }: { inlines: readonly Inline[] }) {
  return inlines.map((inline, index) => {
    if (inline.strong) return <strong key={index}>{inline.text}</strong>;
    if (inline.em) return <em key={index}>{inline.text}</em>;
    return <React.Fragment key={index}>{inline.text}</React.Fragment>;
  });
}

/**
 * Un bloc du texte.
 *
 * Le titre du document est déjà celui de l'écran : les titres du texte
 * descendent d'un niveau, pour garder une hiérarchie lisible par un
 * lecteur d'écran.
 */
function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "heading": {
      if (block.level === 1) {
        return (
          <h2 className="text-base font-semibold text-primary">
            <Inlines inlines={block.inlines} />
          </h2>
        );
      }
      return block.level === 2 ? (
        <h3 className="mt-2 text-sm font-semibold text-primary">
          <Inlines inlines={block.inlines} />
        </h3>
      ) : (
        <h4 className="text-sm font-medium text-primary">
          <Inlines inlines={block.inlines} />
        </h4>
      );
    }
    case "paragraph":
      return (
        <p>
          <Inlines inlines={block.inlines} />
        </p>
      );
    case "list": {
      const List = block.ordered ? "ol" : "ul";
      return (
        <List
          className={cn(
            "flex flex-col gap-1 pl-5",
            block.ordered ? "list-decimal" : "list-disc",
          )}
        >
          {block.items.map((item, index) => (
            <li key={index}>
              <Inlines inlines={item} />
            </li>
          ))}
        </List>
      );
    }
    case "table":
      return (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                {block.header.map((cell, index) => (
                  <th
                    key={index}
                    scope="col"
                    className="border-b border-border-subtle px-2 py-1.5 text-left font-medium text-primary"
                  >
                    <Inlines inlines={cell} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, index) => (
                    <td
                      key={index}
                      className="border-b border-border-subtle px-2 py-1.5 tabular-nums"
                    >
                      <Inlines inlines={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

/**
 * Le texte d'un engagement, dans un cadre défilant.
 *
 * Le cadre est focalisable : on doit pouvoir le faire défiler au clavier,
 * et un lecteur d'écran l'annonce par le titre du document.
 *
 * @param document Texte reçu du service.
 */
export function AgreementText({ document }: { document: AgreementDocument }) {
  const t = useMessages().agreements.review;
  const locale = useLocale();
  const blocks = React.useMemo(
    () => parseAgreementMarkdown(document.bodyMarkdown),
    [document.bodyMarkdown],
  );
  const effective = formatDate(
    new Date(`${document.effectiveDate}T00:00:00Z`),
    locale,
  );

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-tertiary">
        {t.version(document.version, effective)}
      </p>
      {!document.authoritative && (
        <p className="rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-xs text-secondary">
          {t.translationNotice}
        </p>
      )}
      <section
        tabIndex={0}
        aria-label={t.documentLabel(document.title)}
        lang={document.locale}
        className="flex max-h-[26rem] flex-col gap-3 overflow-y-auto rounded-xl border border-border-subtle bg-surface-raised px-4 py-4 text-sm leading-relaxed text-secondary outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {blocks.map((block, index) => (
          <BlockView key={index} block={block} />
        ))}
      </section>
    </div>
  );
}

/** Lien de téléchargement du PDF d'un engagement. */
function DownloadLink({ view }: { view: AgreementView }) {
  const t = useMessages().agreements.review;
  return (
    <Button variant="secondary" size="sm" asChild className="self-start">
      <a href={agreementPdfHref(view.status.kind)} download>
        <Download />
        {view.status.acceptedAt ? t.downloadAccepted : t.download}
      </a>
    </Button>
  );
}

/**
 * Le texte, et ce qu'il faut cocher ou remplir pour l'accepter.
 *
 * Les champs ne sont pas contrôlés : ils vivent dans le formulaire qui
 * les englobe (l'étape de mise en service, ou l'écran `/engagements`),
 * qui les lit à la validation par {@link useAcceptAgreement}. La case
 * d'acceptation est requise : le navigateur refuse d'envoyer le
 * formulaire sans elle.
 *
 * Déjà accepté, l'engagement s'affiche avec sa date, son signataire et
 * l'exemplaire à télécharger.
 *
 * @param view Engagement et texte en vigueur.
 */
export function AgreementFields({ view }: { view: AgreementView }) {
  const t = useMessages().agreements.review;
  const locale = useLocale();
  const { status, document } = view;
  const isClinic = status.kind === "clinic_agreement";

  return (
    <div className="flex flex-col gap-5">
      <AgreementText document={document} />
      <DownloadLink view={view} />

      {status.acceptedAt ? (
        <p className="flex items-start gap-2 text-sm text-primary">
          <CheckCircle2
            className="mt-0.5 size-4 shrink-0 text-accent"
            aria-hidden
          />
          {t.acceptedOn(
            formatDateTime(status.acceptedAt, locale),
            status.acceptedBy,
          )}
        </p>
      ) : !status.canAccept ? (
        <p role="status" className="text-sm text-secondary">
          {t.cannotAccept}
        </p>
      ) : (
        <>
          {isClinic && (
            <Field
              id="signatoryCapacity"
              label={t.capacityLabel}
              hint={t.capacityHint}
            >
              <Input
                id="signatoryCapacity"
                name="signatoryCapacity"
                className="h-10"
                maxLength={SIGNATORY_CAPACITY_MAX_LENGTH}
                autoComplete="organization-title"
                aria-describedby="signatoryCapacity-description"
                required
              />
            </Field>
          )}
          {isClinic && (
            <label className="flex cursor-pointer items-start gap-2.5 text-sm text-primary">
              <input
                type="checkbox"
                name="declaresAuthority"
                required
                className="mt-0.5 size-4 shrink-0 accent-accent"
              />
              <span>{t.authorityLabel}</span>
            </label>
          )}
          <label className="flex cursor-pointer items-start gap-2.5 text-sm font-medium text-primary">
            <input
              type="checkbox"
              name="accept"
              required
              className="mt-0.5 size-4 shrink-0 accent-accent"
            />
            <span>
              {isClinic
                ? t.acceptClinic(status.version)
                : t.acceptRadiologist(status.version)}
            </span>
          </label>
          <p className="text-2xs text-tertiary">{t.proofNote}</p>
        </>
      )}
    </div>
  );
}

/**
 * Envoie l'acceptation saisie dans un formulaire.
 *
 * Un texte changé entre l'affichage et le clic (409) n'est pas une
 * erreur de l'utilisateur : l'écran se relit sur la version en vigueur,
 * et on le lui dit.
 *
 * @returns Une fonction qui accepte l'engagement à partir des champs du
 *          formulaire, et dit si l'acceptation a été enregistrée.
 */
export function useAcceptAgreement() {
  const router = useRouter();
  const t = useMessages().agreements.review;
  return async (view: AgreementView, form: FormData): Promise<boolean> => {
    if (view.status.acceptedAt) return true;
    const result = await acceptAgreement({
      kind: view.status.kind,
      version: view.status.version,
      sha256: view.status.sha256,
      ...(view.status.kind === "clinic_agreement"
        ? {
            signatoryCapacity: String(form.get("signatoryCapacity") ?? ""),
            declaresAuthority: form.get("declaresAuthority") === "on",
          }
        : {}),
    });
    if (result.ok) {
      toast.success(t.accepted);
      return true;
    }
    if (result.status === 409) {
      toast.error(t.changed);
      router.refresh();
    } else {
      toast.error(result.error);
    }
    return false;
  };
}

/**
 * Un engagement à accepter, avec son propre bouton : l'écran
 * `/engagements`, hors du parcours de mise en service.
 *
 * @param view       Engagement et texte en vigueur.
 * @param onAccepted Appelé une fois l'acceptation enregistrée.
 */
export function AgreementForm({
  view,
  onAccepted,
}: {
  view: AgreementView;
  onAccepted: () => void;
}) {
  const t = useMessages().agreements.review;
  const accept = useAcceptAgreement();
  const [pending, startTransition] = React.useTransition();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        startTransition(async () => {
          if (await accept(view, form)) onAccepted();
        });
      }}
      className="flex flex-col gap-6"
    >
      <h2 className="text-lg font-semibold">{view.document.title}</h2>
      <AgreementFields view={view} />
      {view.status.canAccept && !view.status.acceptedAt && (
        <div className="flex justify-end border-t border-border-subtle pt-6">
          <Button type="submit" size="lg" loading={pending} className="h-10">
            {t.submit}
          </Button>
        </div>
      )}
    </form>
  );
}
