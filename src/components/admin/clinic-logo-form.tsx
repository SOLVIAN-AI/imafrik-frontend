"use client";

import { ImageUp, Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useMessages } from "@/i18n/client";
import { removeClinicLogo, setClinicLogo } from "@/lib/actions/control";
import { CLINIC_LOGO_MAX_BYTES, CLINIC_LOGO_TYPES } from "@/lib/clinic-logo";
import type { ClinicLogo } from "@/lib/data/control";

/**
 * Lit un fichier et en rend le contenu en base64, sans l'en-tête `data:`.
 *
 * @param file Fichier choisi.
 */
function readBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("lecture"));
    reader.onload = () => {
      const value = typeof reader.result === "string" ? reader.result : "";
      resolve(value.slice(value.indexOf(",") + 1));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Logo qu'une clinique imprime en filigrane de ses comptes-rendus.
 *
 * L'équipe IMAFRIK le pose à la mise en service, comme la langue des
 * comptes-rendus : il fait partie de l'identité du document. L'aperçu
 * montre le logo tel que le service l'a gardé ; le PDF l'imprime pâle et
 * légèrement flouté, derrière le texte. Le fichier est vérifié ici (type,
 * taille) avant l'envoi, puis relu par le service, qui fait foi.
 *
 * @param clinicId Clinique.
 * @param logo     Logo actuel, ou `null`.
 */
export function ClinicLogoForm({
  clinicId,
  logo,
}: {
  clinicId: string;
  logo: ClinicLogo | null;
}) {
  const t = useMessages();
  const text = t.admin.clinicLogo;
  const input = React.useRef<HTMLInputElement>(null);
  const [pending, startTransition] = React.useTransition();

  const upload = (file: File) => {
    if (!(CLINIC_LOGO_TYPES as readonly string[]).includes(file.type)) {
      toast.error(text.badType);
      return;
    }
    if (file.size > CLINIC_LOGO_MAX_BYTES) {
      toast.error(text.tooLarge);
      return;
    }
    startTransition(async () => {
      let content: string;
      try {
        content = await readBase64(file);
      } catch {
        toast.error(text.unreadable);
        return;
      }
      const result = await setClinicLogo(clinicId, content);
      if (result.ok) toast.success(text.saved);
      else toast.error(result.error);
    });
  };

  const remove = () => {
    startTransition(async () => {
      const result = await removeClinicLogo(clinicId);
      if (result.ok) toast.success(text.removed);
      else toast.error(result.error);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs leading-relaxed text-tertiary">
        {text.explanation}
      </p>
      {logo && (
        // Fond clair : c'est ainsi que le logo se lira sur le papier.
        <div className="flex h-32 items-center justify-center rounded-lg border border-border-subtle bg-white p-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- donnée embarquée, sans optimisation possible */}
          <img
            src={logo.src}
            alt={text.preview}
            width={logo.width}
            height={logo.height}
            className="max-h-full w-auto max-w-full object-contain"
          />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={input}
          type="file"
          accept={CLINIC_LOGO_TYPES.join(",")}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            // Le même fichier doit pouvoir être choisi deux fois de suite.
            event.target.value = "";
            if (file) upload(file);
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="secondary"
          loading={pending}
          onClick={() => input.current?.click()}
        >
          <ImageUp />
          {logo ? text.replace : text.choose}
        </Button>
        {logo && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={remove}
          >
            <Trash2 />
            {text.remove}
          </Button>
        )}
      </div>
      <p className="text-2xs text-tertiary">{text.formats}</p>
    </div>
  );
}
