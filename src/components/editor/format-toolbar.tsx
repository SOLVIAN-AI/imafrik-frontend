"use client";

import { useEditorState, type Editor } from "@tiptap/react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Heading3,
  Highlighter,
  IndentDecrease,
  IndentIncrease,
  Italic,
  List,
  ListOrdered,
  Omega,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Table,
  Underline as UnderlineIcon,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import * as React from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";

/**
 * Raccourci affiché dans les infobulles : ⌘ sur Mac, Ctrl ailleurs.
 *
 * Connu seulement après l'hydratation ; avant, « Ctrl » — le serveur ne
 * sait pas sur quel système on est, et l'infobulle n'est de toute façon
 * pas visible au premier rendu.
 */
function useShortcutLabel() {
  const hydrated = useHydrated();
  const mac = hydrated && /Mac|iPhone|iPad/.test(navigator.platform);
  return (keys: string) => (mac ? `⌘${keys}` : `Ctrl+${keys}`);
}

/**
 * Un bouton de la barre de mise en forme.
 *
 * Il reflète l'état de la sélection : si le curseur est dans du gras, le
 * bouton est enfoncé. Sans ce retour, on ne sait pas ce qu'on va obtenir
 * avant de cliquer.
 */
function ToolButton({
  icon: Icon,
  label,
  shortcut,
  active = false,
  disabled,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  shortcut?: string;
  active?: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      // mousedown plutôt que click : cliquer déplacerait d'abord le focus
      // hors du texte, et la sélection serait perdue avant la commande.
      onMouseDown={(event) => {
        event.preventDefault();
        onClick();
      }}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={shortcut ? `${label} (${shortcut})` : label}
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-md",
        "transition-colors duration-75",
        "disabled:pointer-events-none disabled:opacity-35",
        active
          ? "bg-accent-muted text-accent"
          : "text-secondary hover:bg-surface-hover hover:text-primary",
      )}
    >
      <Icon className="size-4" aria-hidden />
    </button>
  );
}

/** Séparateur entre deux groupes de commandes. */
function Divider() {
  return (
    <span className="mx-1 h-5 w-px shrink-0 bg-border-default" aria-hidden />
  );
}

/** Bouton d'ouverture d'un menu de la barre. */
const MenuTrigger = React.forwardRef<
  HTMLButtonElement,
  {
    icon: LucideIcon;
    label: string;
    active?: boolean;
    disabled: boolean;
  } & React.ComponentProps<"button">
>(function MenuTrigger(
  { icon: Icon, label, active = false, disabled, className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      aria-label={label}
      title={label}
      // Le menu ne doit pas voler le focus du texte à l'ouverture.
      onMouseDown={(event) => event.preventDefault()}
      className={cn(
        "flex h-8 shrink-0 items-center gap-0.5 rounded-md px-1.5",
        "transition-colors duration-75",
        "disabled:pointer-events-none disabled:opacity-35",
        "data-[state=open]:bg-surface-active",
        active
          ? "bg-accent-muted text-accent"
          : "text-secondary hover:bg-surface-hover hover:text-primary",
        className,
      )}
      {...props}
    >
      <Icon className="size-4" aria-hidden />
      <ChevronDown className="size-3 opacity-60" aria-hidden />
    </button>
  );
});

/** Alignements proposés, avec leur icône. */
const ALIGNMENTS = [
  { value: "left", label: "Aligner à gauche", icon: AlignLeft },
  { value: "center", label: "Centrer", icon: AlignCenter },
  { value: "right", label: "Aligner à droite", icon: AlignRight },
  { value: "justify", label: "Justifier", icon: AlignJustify },
] as const;

/**
 * Caractères qu'un compte-rendu demande et qu'un clavier français
 * n'offre pas — ou à grand-peine.
 */
const SYMBOLS = [
  ["±", "plus ou moins"],
  ["×", "multiplié par (dimensions)"],
  ["°", "degré"],
  ["µ", "micro"],
  ["²", "au carré"],
  ["³", "au cube"],
  ["≤", "inférieur ou égal"],
  ["≥", "supérieur ou égal"],
  ["<", "inférieur"],
  [">", "supérieur"],
  ["≈", "environ"],
  ["→", "évolue vers"],
  ["↑", "augmentation"],
  ["↓", "diminution"],
  ["Ø", "diamètre"],
  ["‰", "pour mille"],
] as const;

/**
 * Barre de mise en forme du compte-rendu.
 *
 * Fixe en haut du volet plutôt que flottante au-dessus de la sélection :
 * quelqu'un qui met en forme des dizaines de paragraphes par jour gagne
 * à trouver ses outils toujours au même endroit.
 *
 * Elle agit sur la **section qui a le focus**. Sans section active, les
 * commandes sont désactivées plutôt que masquées : une barre qui
 * disparaît puis réapparaît fait sauter la mise en page.
 *
 * L'état des boutons est lu par `useEditorState`, qui ne fait rendre la
 * barre que lorsque cet état change — et non à chaque frappe.
 *
 * Tout ce qu'elle propose est conservé par le PDF signé : voir
 * `sectionExtensions`.
 *
 * @param editor   Section active, ou `null`.
 * @param children Témoins et commandes de l'éditeur, alignés à droite.
 */
export function FormatToolbar({
  editor,
  children,
}: {
  editor: Editor | null;
  children?: React.ReactNode;
}) {
  const shortcut = useShortcutLabel();
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => {
      if (!current) return null;
      return {
        bold: current.isActive("bold"),
        italic: current.isActive("italic"),
        underline: current.isActive("underline"),
        strike: current.isActive("strike"),
        highlight: current.isActive("highlight"),
        superscript: current.isActive("superscript"),
        subscript: current.isActive("subscript"),
        heading: current.isActive("heading", { level: 3 }),
        bulletList: current.isActive("bulletList"),
        orderedList: current.isActive("orderedList"),
        table: current.isActive("table"),
        align:
          ALIGNMENTS.find((entry) =>
            current.isActive({ textAlign: entry.value }),
          )?.value ?? "left",
        canUndo: current.can().undo(),
        canRedo: current.can().redo(),
        canSink: current.can().sinkListItem("listItem"),
        canLift: current.can().liftListItem("listItem"),
      };
    },
  });

  const disabled = !editor || !state;
  const chain = () => editor!.chain().focus();
  const AlignIcon =
    ALIGNMENTS.find((entry) => entry.value === state?.align)?.icon ?? AlignLeft;

  return (
    <div
      className={cn(
        // Téléphone : la barre défile, plutôt que d'écraser ses boutons
        // sous la taille d'une cible tactile. Au-delà, elle passe sur deux
        // lignes quand le volet est étroit : un outil hors champ, à droite
        // d'une barre qui défile, est un outil que personne ne trouve.
        "flex min-h-12 shrink-0 items-center gap-0.5 overflow-x-auto border-b border-border-subtle px-2 py-1.5",
        "sm:flex-wrap sm:overflow-visible sm:px-3",
        "bg-surface-raised/60 backdrop-blur-sm",
      )}
      role="toolbar"
      aria-label="Mise en forme"
    >
      <ToolButton
        icon={Undo2}
        label="Annuler"
        shortcut={shortcut("Z")}
        disabled={disabled || !state.canUndo}
        onClick={() => chain().undo().run()}
      />
      <ToolButton
        icon={Redo2}
        label="Rétablir"
        shortcut={shortcut("⇧Z")}
        disabled={disabled || !state.canRedo}
        onClick={() => chain().redo().run()}
      />

      <Divider />

      <ToolButton
        icon={Heading3}
        label="Sous-titre"
        shortcut={shortcut("Alt+3")}
        active={state?.heading}
        disabled={disabled}
        onClick={() => chain().toggleHeading({ level: 3 }).run()}
      />

      <Divider />

      <ToolButton
        icon={Bold}
        label="Gras"
        shortcut={shortcut("B")}
        active={state?.bold}
        disabled={disabled}
        onClick={() => chain().toggleBold().run()}
      />
      <ToolButton
        icon={Italic}
        label="Italique"
        shortcut={shortcut("I")}
        active={state?.italic}
        disabled={disabled}
        onClick={() => chain().toggleItalic().run()}
      />
      <ToolButton
        icon={UnderlineIcon}
        label="Souligné"
        shortcut={shortcut("U")}
        active={state?.underline}
        disabled={disabled}
        onClick={() => chain().toggleUnderline().run()}
      />
      <ToolButton
        icon={Strikethrough}
        label="Barré"
        shortcut={shortcut("⇧S")}
        active={state?.strike}
        disabled={disabled}
        onClick={() => chain().toggleStrike().run()}
      />
      <ToolButton
        icon={Highlighter}
        label="Surligner"
        shortcut={shortcut("⇧H")}
        active={state?.highlight}
        disabled={disabled}
        onClick={() => chain().toggleHighlight().run()}
      />

      <Divider />

      <ToolButton
        icon={SuperscriptIcon}
        label="Exposant (cm², mm³)"
        shortcut={shortcut(".")}
        active={state?.superscript}
        disabled={disabled}
        onClick={() => chain().toggleSuperscript().run()}
      />
      <ToolButton
        icon={SubscriptIcon}
        label="Indice"
        shortcut={shortcut(",")}
        active={state?.subscript}
        disabled={disabled}
        onClick={() => chain().toggleSubscript().run()}
      />

      <Divider />

      <ToolButton
        icon={List}
        label="Liste à puces"
        shortcut={shortcut("⇧8")}
        active={state?.bulletList}
        disabled={disabled}
        onClick={() => chain().toggleBulletList().run()}
      />
      <ToolButton
        icon={ListOrdered}
        label="Liste numérotée"
        shortcut={shortcut("⇧7")}
        active={state?.orderedList}
        disabled={disabled}
        onClick={() => chain().toggleOrderedList().run()}
      />
      <ToolButton
        icon={IndentDecrease}
        label="Diminuer le retrait"
        shortcut="⇧Tab"
        disabled={disabled || !state.canLift}
        onClick={() => chain().liftListItem("listItem").run()}
      />
      <ToolButton
        icon={IndentIncrease}
        label="Augmenter le retrait"
        shortcut="Tab"
        disabled={disabled || !state.canSink}
        onClick={() => chain().sinkListItem("listItem").run()}
      />

      <Divider />

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <MenuTrigger
            icon={AlignIcon}
            label="Alignement"
            disabled={disabled}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          onCloseAutoFocus={(event) => event.preventDefault()}
        >
          {ALIGNMENTS.map((entry) => (
            <DropdownMenuItem
              key={entry.value}
              onSelect={() => chain().setTextAlign(entry.value).run()}
              className={cn(state?.align === entry.value && "text-accent")}
            >
              <entry.icon className="size-3.5" aria-hidden />
              {entry.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <MenuTrigger
            icon={Table}
            label="Tableau"
            active={state?.table}
            disabled={disabled}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-60"
          onCloseAutoFocus={(event) => event.preventDefault()}
        >
          {state?.table ? (
            <>
              <DropdownMenuLabel>Tableau</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => chain().addRowAfter().run()}>
                Ajouter une ligne dessous
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => chain().addColumnAfter().run()}>
                Ajouter une colonne à droite
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => chain().toggleHeaderRow().run()}
              >
                Ligne d’en-tête
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => chain().deleteRow().run()}>
                Supprimer la ligne
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => chain().deleteColumn().run()}>
                Supprimer la colonne
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-urgent"
                onSelect={() => chain().deleteTable().run()}
              >
                Supprimer le tableau
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuLabel>Insérer un tableau</DropdownMenuLabel>
              {[
                [2, 2, "2 × 2 : valeur et mesure"],
                [3, 3, "3 × 3 : lésions et dimensions"],
                [4, 3, "4 × 3 : suivi comparatif"],
              ].map(([rows, cols, label]) => (
                <DropdownMenuItem
                  key={String(label)}
                  onSelect={() =>
                    chain()
                      .insertTable({
                        rows: Number(rows),
                        cols: Number(cols),
                        withHeaderRow: true,
                      })
                      .run()
                  }
                >
                  {label}
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <MenuTrigger
            icon={Omega}
            label="Caractères spéciaux"
            disabled={disabled}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-56 p-2"
          onCloseAutoFocus={(event) => event.preventDefault()}
        >
          <DropdownMenuLabel>Insérer un signe</DropdownMenuLabel>
          <div className="grid grid-cols-4 gap-1">
            {SYMBOLS.map(([symbol, label]) => (
              <DropdownMenuItem
                key={symbol}
                title={label}
                aria-label={label}
                onSelect={() => chain().insertContent(symbol).run()}
                className="flex h-10 items-center justify-center text-base"
              >
                {symbol}
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <ToolButton
        icon={RemoveFormatting}
        label="Effacer la mise en forme"
        disabled={disabled}
        onClick={() => chain().unsetAllMarks().clearNodes().run()}
      />

      <div className="ml-auto flex shrink-0 items-center gap-1 pl-3">
        {children}
      </div>
    </div>
  );
}
