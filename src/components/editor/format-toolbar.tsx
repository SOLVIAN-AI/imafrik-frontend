"use client";

import type { Editor } from "@tiptap/react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  List,
  Underline as UnderlineIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Un bouton de la barre de mise en forme.
 *
 * Il reflète l'état de la sélection : si le curseur est dans du gras, le
 * bouton est enfoncé. Sans ce retour, on ne sait pas ce qu'on va obtenir
 * avant de cliquer.
 */
function FormatButton({
  icon: Icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      // onMouseDown plutôt que onClick : cliquer déplacerait d'abord le
      // focus hors du texte, et la sélection serait perdue avant que la
      // commande ne s'applique.
      onMouseDown={(event) => {
        event.preventDefault();
        onClick();
      }}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        "flex size-7 items-center justify-center rounded-md",
        "transition-colors duration-75",
        "disabled:pointer-events-none disabled:opacity-35",
        active
          ? "bg-accent-muted text-accent"
          : "text-secondary hover:bg-surface-hover hover:text-primary",
      )}
    >
      <Icon className="size-3.5" aria-hidden />
    </button>
  );
}

/** Séparateur entre deux groupes de commandes. */
function Divider() {
  return <span className="mx-1 h-4 w-px bg-border-default" aria-hidden />;
}

/**
 * Barre de mise en forme du compte-rendu.
 *
 * Fixe en haut du volet plutôt que flottante au-dessus de la sélection.
 * Une barre contextuelle est élégante en démonstration, mais elle bouge —
 * et quelqu'un qui met en forme des dizaines de paragraphes par jour
 * gagne à trouver ses outils toujours au même endroit.
 *
 * Elle agit sur la **section qui a le focus**. Quand aucune n'est active,
 * les commandes sont désactivées plutôt que masquées : une barre qui
 * disparaît puis réapparaît fait sauter la mise en page.
 *
 * Le jeu est volontairement court — gras, italique, souligné, alignement,
 * liste. Un compte-rendu médical est un document normalisé, pas une mise
 * en page libre ; offrir des polices et des couleurs inviterait à des
 * documents hétérogènes là où l'uniformité fait la lisibilité.
 */
export function FormatToolbar({
  editor,
  children,
}: {
  editor: Editor | null;
  children?: React.ReactNode;
}) {
  const disabled = !editor;
  const isActive = (name: string, attrs?: Record<string, unknown>) =>
    editor?.isActive(name, attrs) ?? false;

  return (
    <div
      className={cn(
        "flex h-11 shrink-0 items-center gap-0.5 border-b border-border-subtle px-3",
        "bg-surface-raised/60 backdrop-blur-sm",
      )}
      role="toolbar"
      aria-label="Mise en forme"
    >
      <FormatButton
        icon={Bold}
        label="Gras"
        active={isActive("bold")}
        disabled={disabled}
        onClick={() => editor?.chain().focus().toggleBold().run()}
      />
      <FormatButton
        icon={Italic}
        label="Italique"
        active={isActive("italic")}
        disabled={disabled}
        onClick={() => editor?.chain().focus().toggleItalic().run()}
      />
      <FormatButton
        icon={UnderlineIcon}
        label="Souligné"
        active={isActive("underline")}
        disabled={disabled}
        onClick={() => editor?.chain().focus().toggleUnderline().run()}
      />

      <Divider />

      <FormatButton
        icon={AlignLeft}
        label="Aligner à gauche"
        active={isActive({ textAlign: "left" } as never)}
        disabled={disabled}
        onClick={() => editor?.chain().focus().setTextAlign("left").run()}
      />
      <FormatButton
        icon={AlignCenter}
        label="Centrer"
        active={isActive({ textAlign: "center" } as never)}
        disabled={disabled}
        onClick={() => editor?.chain().focus().setTextAlign("center").run()}
      />
      <FormatButton
        icon={AlignRight}
        label="Aligner à droite"
        active={isActive({ textAlign: "right" } as never)}
        disabled={disabled}
        onClick={() => editor?.chain().focus().setTextAlign("right").run()}
      />
      <FormatButton
        icon={AlignJustify}
        label="Justifier"
        active={isActive({ textAlign: "justify" } as never)}
        disabled={disabled}
        onClick={() => editor?.chain().focus().setTextAlign("justify").run()}
      />

      <Divider />

      <FormatButton
        icon={List}
        label="Liste à puces"
        active={isActive("bulletList")}
        disabled={disabled}
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
      />

      <div className="ml-auto flex items-center gap-2">{children}</div>
    </div>
  );
}
