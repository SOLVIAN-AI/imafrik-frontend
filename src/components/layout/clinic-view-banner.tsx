"use client";

import { ArrowLeft, Building2, Eye } from "lucide-react";
import Link from "next/link";

import { useClinicView } from "@/components/providers/clinic-view-provider";
import { Button } from "@/components/ui/button";
import { useMessages } from "@/i18n/client";

/**
 * Bandeau de la vue des cliniques, en tête de chacun de ses écrans.
 *
 * Il ne quitte pas l'écran : l'équipe IMAFRIK y voit exactement ce que
 * voit le responsable d'une clinique, et doit savoir à chaque instant
 * qu'elle regarde **chez quelqu'un d'autre**, en lecture seule. La
 * fiche de la clinique, où vivent les gestes de l'équipe (liste
 * d'urgence, formule, règles), et le retour à la console restent à un
 * clic.
 *
 * Teinte d'accent, pas d'alerte : rien ne va mal, on consulte.
 */
export function ClinicViewBanner() {
  const consultation = useClinicView();
  const t = useMessages().clinicView.banner;
  if (!consultation) return null;

  return (
    <section
      aria-label={t.region}
      data-testid="clinic-view-banner"
      className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-accent/25 bg-accent-muted px-4 py-2 sm:px-6"
    >
      <Eye className="size-4 shrink-0 text-accent" aria-hidden />
      <div className="min-w-0 flex-[1_1_14rem]">
        <p className="truncate text-xs font-medium text-primary">
          {t.title(consultation.name)}
          {consultation.city && (
            <span className="font-normal text-secondary">
              {" "}
              · {consultation.city}
            </span>
          )}
        </p>
        <p className="text-2xs text-secondary">
          {consultation.isActive ? t.detail : t.suspended}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/admin/organisations/${consultation.clinicId}`}>
            <Building2 aria-hidden />
            {t.sheet}
          </Link>
        </Button>
        <Button asChild variant="secondary" size="sm">
          <Link href="/admin">
            <ArrowLeft aria-hidden />
            {t.back}
          </Link>
        </Button>
      </div>
    </section>
  );
}
