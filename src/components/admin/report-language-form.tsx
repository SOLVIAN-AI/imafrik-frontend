"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useMessages } from "@/i18n/client";
import { setClinicReportLanguage } from "@/lib/actions/control";
import { LOCALE_NAMES, LOCALES, type Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

/**
 * Langue des comptes-rendus d'une clinique, telle que son contrat la
 * prévoit.
 *
 * Distincte de la langue de chaque utilisateur : un radiologue
 * francophone peut lire pour une clinique anglophone, et c'est la
 * clinique — ses patients, ses correspondants — qui reçoit le document.
 * Le changement ne vaut que pour les comptes-rendus signés ensuite ; il
 * est tracé dans le journal d'audit.
 *
 * Chaque langue s'affiche dans sa propre langue (« Français »,
 * « English ») : c'est ainsi qu'on la reconnaît.
 *
 * @param clinicId Clinique.
 * @param language Langue actuelle des comptes-rendus.
 */
export function ReportLanguageForm({
  clinicId,
  language,
}: {
  clinicId: string;
  language: Locale;
}) {
  const t = useMessages();
  const text = t.admin.reportLanguage;
  const [value, setValue] = React.useState<Locale>(language);
  const [pending, startTransition] = React.useTransition();
  const dirty = value !== language;

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await setClinicReportLanguage(clinicId, value);
      if (result.ok) toast.success(text.saved);
      else toast.error(result.error);
    });
  };

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <p className="text-xs leading-relaxed text-tertiary">
        {text.explanation}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <fieldset className="flex flex-wrap gap-2">
          <legend className="sr-only">{text.title}</legend>
          {LOCALES.map((locale) => {
            const selected = value === locale;
            return (
              <label
                key={locale}
                lang={locale}
                className={cn(
                  "flex h-8 cursor-pointer items-center gap-2 rounded-full border px-3 text-xs transition-colors duration-100",
                  selected
                    ? "border-accent/40 bg-accent-muted font-medium"
                    : "border-border-subtle text-secondary hover:bg-surface-hover",
                )}
              >
                <input
                  type="radio"
                  name="report-language"
                  value={locale}
                  checked={selected}
                  onChange={() => setValue(locale)}
                  className="size-3.5 shrink-0 accent-[var(--accent)]"
                />
                {LOCALE_NAMES[locale]}
              </label>
            );
          })}
        </fieldset>
        <Button
          type="submit"
          size="sm"
          variant="secondary"
          loading={pending}
          disabled={!dirty}
          className="ml-auto"
        >
          {t.common.actions.save}
        </Button>
      </div>
    </form>
  );
}
