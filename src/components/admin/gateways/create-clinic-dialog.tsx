"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { useLocale, useMessages } from "@/i18n/client";
import { createClinic } from "@/lib/actions/gateways";
import { LOCALES, LOCALE_NAMES } from "@/lib/i18n/locale";

/** Groupe de radiologie qui peut lire pour le pool. */
export interface RadiologyGroupOption {
  id: string;
  name: string;
}

/**
 * Création d'une clinique, depuis la liste des organisations.
 *
 * La clinique existe dès la validation ; sa fiche s'ouvre aussitôt, sur
 * le geste suivant : émettre le code qui raccordera sa passerelle. Aucun
 * AE Title n'est saisi : chaque passerelle reçoit le sien à son
 * enrôlement, et il ne s'affiche nulle part.
 *
 * Ouverte au pool, une clinique a besoin d'un groupe de radiologie qui
 * lise ses examens : le contrat de service est créé avec lui. S'il n'y en
 * a qu'un, il est choisi d'office.
 *
 * @param groups Groupes de radiologie actifs.
 */
export function CreateClinicDialog({
  groups,
}: {
  groups: RadiologyGroupOption[];
}) {
  const t = useMessages();
  const text = t.gateways.createClinic;
  const locale = useLocale();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [city, setCity] = React.useState("");
  const [language, setLanguage] = React.useState<string>(locale);
  const [openToPool, setOpenToPool] = React.useState(groups.length > 0);
  const [groupId, setGroupId] = React.useState(groups[0]?.id ?? "");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const reset = () => {
    setName("");
    setCity("");
    setLanguage(locale);
    setOpenToPool(groups.length > 0);
    setGroupId(groups[0]?.id ?? "");
    setError(null);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createClinic({
        name,
        city,
        reportLanguage: language,
        openToPool,
        radiologyGroupId: openToPool ? groupId || null : null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(text.done(name.trim()));
      setOpen(false);
      reset();
      router.push(`/admin/organisations/${result.data.id}`);
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus aria-hidden />
          {text.open}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        {/* Bornes vérifiées par l'action, avec ses messages : pas de
            bulle native du navigateur, dans une autre langue. */}
        <form onSubmit={submit} noValidate>
          <DialogHeader>
            <DialogTitle>{text.title}</DialogTitle>
            <DialogDescription>{text.description}</DialogDescription>
          </DialogHeader>

          <div className="flex max-h-[60dvh] flex-col gap-4 overflow-y-auto px-5 pb-5">
            <Field id="clinic-name" label={text.name} hint={text.nameHint}>
              <Input
                id="clinic-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={200}
                required
                autoComplete="organization"
                autoFocus
                className="h-9"
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="clinic-city" label={text.city}>
                <Input
                  id="clinic-city"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  maxLength={100}
                  autoComplete="address-level2"
                  className="h-9"
                />
              </Field>
              <Field id="clinic-language" label={text.language}>
                <Select
                  id="clinic-language"
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  className="h-9"
                >
                  {LOCALES.map((option) => (
                    <option key={option} value={option}>
                      {LOCALE_NAMES[option]}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <label className="flex cursor-pointer items-start gap-2.5 text-xs">
              <input
                type="checkbox"
                checked={openToPool}
                disabled={groups.length === 0}
                onChange={(event) => setOpenToPool(event.target.checked)}
                className="mt-0.5 size-4 shrink-0 accent-accent"
              />
              <span>
                <span className="block font-medium">{text.pool}</span>
                <span className="mt-0.5 block text-tertiary">
                  {groups.length === 0 ? text.noGroup : text.poolHint}
                </span>
              </span>
            </label>

            {openToPool && groups.length > 1 && (
              <Field id="clinic-group" label={text.group} hint={text.groupHint}>
                <Select
                  id="clinic-group"
                  value={groupId}
                  onChange={(event) => setGroupId(event.target.value)}
                  className="h-9"
                >
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </Select>
              </Field>
            )}

            {error && (
              <p role="alert" className="text-xs text-urgent">
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => {
                setOpen(false);
                reset();
              }}
            >
              {t.common.actions.cancel}
            </Button>
            <Button type="submit" size="sm" loading={pending}>
              {text.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
