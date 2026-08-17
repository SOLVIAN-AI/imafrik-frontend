import { cn } from "@/lib/utils";

/**
 * Marque IMAFRIK.
 *
 * Une coupe axiale stylisée : le cadre d'une image, traversé d'une
 * diagonale et ponctué d'un foyer. Assez abstrait pour rester net à
 * 20 px, assez spécifique pour ne pas ressembler au logo d'un outil de
 * gestion de tâches.
 *
 * Le dégradé du trait suit l'accent bleu ciel. Il n'est pas décoratif :
 * c'est le seul endroit de l'interface où la marque s'exprime, tout le
 * reste étant neutre.
 */
export function Mark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-6 shrink-0", className)}
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="imafrik-mark" x1="4" y1="20" x2="20" y2="4">
          <stop offset="0%" stopColor="var(--color-accent-500)" />
          <stop offset="100%" stopColor="var(--color-accent-300)" />
        </linearGradient>
      </defs>
      <rect
        x="2.75"
        y="2.75"
        width="18.5"
        height="18.5"
        rx="5.5"
        className="stroke-border-strong"
        strokeWidth="1.5"
      />
      <path
        d="M6.5 17.5 17.5 6.5"
        stroke="url(#imafrik-mark)"
        strokeWidth="2.25"
        strokeLinecap="round"
      />
      <circle cx="8.75" cy="8.75" r="1.75" fill="url(#imafrik-mark)" />
    </svg>
  );
}

/**
 * Marque accompagnée du nom, posée sur un halo.
 *
 * Le halo — un dégradé radial très dilué — donne une source lumineuse
 * implicite en haut de la navigation. Sans lui, une interface sombre
 * n'est qu'un aplat noir ; avec lui, elle paraît éclairée.
 */
export function BrandLockup() {
  return (
    <div className="relative flex h-14 shrink-0 items-center gap-2.5 px-4">
      <div
        className="pointer-events-none absolute -top-8 left-0 h-24 w-40 rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(closest-side, var(--glow-accent), transparent)",
        }}
        aria-hidden
      />
      <Mark />
      <span className="relative text-[0.9375rem] font-semibold tracking-[-0.01em]">
        IMAFRIK
      </span>
    </div>
  );
}
