"use client";

import { BookmarkPlus, FileStack } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import {
  EMPTY_REPORT_SECTIONS,
  isReportBlank,
  isSectionEmpty,
  type ReportLayout,
  type ReportSections,
  type SectionKey,
  sectionsForLayout,
  sectionsOf,
  toFreeLayout,
  toStructuredLayout,
} from "@/components/editor/sections";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, Input } from "@/components/ui/input";
import { useMessages } from "@/i18n/client";
import { createTemplate } from "@/lib/actions/templates";
import type { ReportTemplate } from "@/lib/data/templates";

/**
 * Applique un modèle au compte-rendu en cours.
 *
 * **Seules les sections vides sont remplies.** Un modèle complète, il
 * n'écrase jamais : une indication déjà dictée, une mesure déjà notée
 * restent en place. C'est ce qui permet d'appliquer un modèle à
 * n'importe quel moment de la rédaction sans risque.
 *
 * **Un modèle retient sa mise en page.** Appliqué à un compte-rendu
 * encore vierge, il y mène : un modèle en feuille blanche ouvre une
 * feuille blanche. Sur un texte déjà commencé dans l'autre mise en page,
 * c'est le modèle qui s'adapte, converti sans perte (`toFreeLayout`,
 * `toStructuredLayout`) : le choix du radiologue, et son texte, ne
 * changent jamais en silence.
 *
 * @param templates Modèles proposés — ceux de la modalité de l'examen.
 * @param sections  Contenu actuel.
 * @param layout    Mise en page actuelle.
 * @param titles    Intitulés des rubriques, dans la langue du compte-rendu.
 * @param onApply   Reçoit les sections et la mise en page après application.
 */
export function TemplatePicker({
  templates,
  sections,
  layout,
  titles,
  onApply,
}: {
  templates: ReportTemplate[];
  sections: ReportSections;
  layout: ReportLayout;
  titles: Record<SectionKey, string>;
  onApply: (next: ReportSections, layout: ReportLayout) => void;
}) {
  const t = useMessages();
  const labels = t.reading.templates;
  if (templates.length === 0) return null;

  const apply = (template: ReportTemplate) => {
    let target = layout;
    let source = template.sections;
    let base = sections;
    if (template.layout !== layout) {
      if (isReportBlank(sections, layout)) {
        target = template.layout;
        base = EMPTY_REPORT_SECTIONS;
      } else {
        source =
          template.layout === "free"
            ? toStructuredLayout(template.sections)
            : toFreeLayout(template.sections, titles);
      }
    }
    const next = { ...base };
    let filled = 0;
    for (const { key } of sectionsOf(target)) {
      if (isSectionEmpty(next[key]) && !isSectionEmpty(source[key])) {
        next[key] = source[key];
        filled += 1;
      }
    }
    onApply(next, target);
    const name = t.reading.layout.inSentence;
    toast.success(
      template.layout === layout
        ? filled > 0
          ? labels.applied(filled)
          : labels.nothingApplied
        : target === template.layout
          ? labels.adopted(name[target])
          : labels.converted(name[layout]),
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" data-tour="templates">
          <FileStack />
          {labels.picker}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>{labels.pickerLabel}</DropdownMenuLabel>
        {templates.map((template) => (
          <DropdownMenuItem key={template.id} onSelect={() => apply(template)}>
            <span className="min-w-0 flex-1 truncate">{template.name}</span>
            {template.layout === "free" && (
              <span
                className="shrink-0 text-2xs text-tertiary"
                title={labels.layoutOf(t.reading.layout.names.free)}
              >
                {t.reading.layout.names.free}
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Enregistre le compte-rendu en cours comme modèle de l'organisation.
 *
 * C'est le moment naturel de créer un modèle : on vient d'écrire un texte
 * « normal » qu'on réécrira demain. Le modèle est partagé avec les
 * collègues de l'organisation active.
 */
export function SaveAsTemplate({
  sections,
  layout,
  modality,
  bodyPart,
}: {
  sections: ReportSections;
  /** Mise en page du compte-rendu : le modèle la retient. */
  layout: ReportLayout;
  modality: string;
  bodyPart: string | null;
}) {
  const t = useMessages();
  const labels = t.reading.templates;
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <BookmarkPlus />
          {labels.saveAs}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            startTransition(async () => {
              const result = await createTemplate(
                {
                  name: String(form.get("name") ?? ""),
                  modality: String(form.get("modality") ?? ""),
                  bodyPart: String(form.get("bodyPart") ?? ""),
                },
                sectionsForLayout(sections, layout),
                layout,
              );
              if (!result.ok) {
                toast.error(result.error);
                return;
              }
              toast.success(labels.saved);
              setOpen(false);
            });
          }}
        >
          <DialogHeader>
            <DialogTitle>{labels.saveAs}</DialogTitle>
            <DialogDescription>{labels.saveAsDescription}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 px-5 pb-5">
            <Field id="template-name" label={labels.name}>
              <Input
                id="template-name"
                name="name"
                required
                maxLength={200}
                placeholder={labels.namePlaceholder}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field id="template-modality" label={labels.modality}>
                <Input
                  id="template-modality"
                  name="modality"
                  defaultValue={modality === "—" ? "" : modality}
                  maxLength={16}
                />
              </Field>
              <Field id="template-body" label={labels.region}>
                <Input
                  id="template-body"
                  name="bodyPart"
                  defaultValue={bodyPart ?? ""}
                  maxLength={100}
                />
              </Field>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              {t.common.actions.cancel}
            </Button>
            <Button type="submit" size="sm" loading={pending}>
              {t.common.actions.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
