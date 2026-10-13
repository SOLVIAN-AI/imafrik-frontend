"use client";

import { Sparkles } from "lucide-react";
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
} from "@/components/ui/dialog";
import { useMessages } from "@/i18n/client";
import {
  readAiFeatures,
  setAiFeatures,
  type AiFeatures,
} from "@/lib/actions/control";

/**
 * Fonctions d'IA d'une organisation : le réglage de l'équipe IMAFRIK.
 *
 * Une organisation n'a d'IA que si on la lui active ici, fonction par
 * fonction. L'état est lu à l'ouverture : il doit être celui du moment où
 * l'on décide, pas celui du chargement de la liste.
 *
 * Seule la relecture existe aujourd'hui. L'état de la dictée est conservé
 * tel quel à l'enregistrement, sans être proposé : un interrupteur pour
 * une fonction qui n'existe pas serait une promesse.
 *
 * @param organizationId   Organisation.
 * @param organizationName Son nom, pour l'intitulé du bouton.
 */
export function AiFeaturesDialog({
  organizationId,
  organizationName,
}: {
  organizationId: string;
  organizationName: string;
}) {
  const t = useMessages();
  const text = t.admin.aiFeatures;
  const [open, setOpen] = React.useState(false);
  const [current, setCurrent] = React.useState<AiFeatures | null>(null);
  const [review, setReview] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const show = () => {
    setOpen(true);
    setCurrent(null);
    setFailed(false);
    startTransition(async () => {
      const result = await readAiFeatures(organizationId);
      if (result.ok) {
        setCurrent(result.data);
        setReview(result.data.review);
      } else {
        setFailed(true);
      }
    });
  };

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (!current) return;
    startTransition(async () => {
      const result = await setAiFeatures(organizationId, {
        review,
        dictation: current.dictation,
      });
      if (result.ok) {
        toast.success(text.saved);
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label={text.open(organizationName)}
        onClick={show}
      >
        <Sparkles />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={save} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>{text.open(organizationName)}</DialogTitle>
              <DialogDescription>{text.explanation}</DialogDescription>
            </DialogHeader>

            {failed ? (
              <p className="px-5 text-xs text-urgent" role="alert">
                {text.loadFailed}
              </p>
            ) : (
              <label className="flex cursor-pointer items-start gap-3 px-5">
                <input
                  type="checkbox"
                  checked={review}
                  disabled={!current}
                  onChange={(event) => setReview(event.target.checked)}
                  className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]"
                />
                <span>
                  <span className="block text-sm font-medium">
                    {text.review}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-tertiary">
                    {text.reviewHint}
                  </span>
                </span>
              </label>
            )}

            <DialogFooter>
              <Button
                type="submit"
                size="sm"
                loading={pending}
                disabled={!current || review === current.review}
              >
                {t.common.actions.save}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
