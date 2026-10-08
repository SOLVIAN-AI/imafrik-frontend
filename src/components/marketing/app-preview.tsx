import { Wordmark } from "@/components/brand/brand";
import { marketingCopy } from "@/content/marketing";
import type { Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

/**
 * Lignes de la worklist reproduites dans l'aperçu.
 *
 * **Ce sont des données inventées, et elles doivent le rester.** Une
 * capture d'écran de production sur une page publique exposerait des
 * noms de patients ; même floutée, elle exposerait des noms
 * d'établissements et des volumes. L'aperçu est donc reconstruit en
 * HTML — ce qui a l'avantage d'être net à toutes les résolutions et de
 * suivre le thème.
 */
const ROWS = [
  {
    name: "KOFFI Ama",
    state: "toRead",
    tone: "wait",
    urgent: true,
    age: "8 min",
  },
  {
    name: "MENSAH Kodjo",
    state: "inProgress",
    tone: "progress",
    urgent: false,
    age: "47 min",
  },
  {
    name: "SOGLO Yawa",
    state: "toRead",
    tone: "wait",
    urgent: false,
    age: "1 h",
  },
  {
    name: "AGBEKO Selom",
    state: "reported",
    tone: "done",
    urgent: false,
    age: "3 h",
  },
  {
    name: "DOSSEH Afi",
    state: "assigned",
    tone: "wait",
    urgent: false,
    age: "2 h",
  },
] as const;

const TONES = {
  wait: "bg-surface-active text-tertiary",
  progress: "bg-progress-muted text-progress",
  done: "bg-done-muted text-done",
} as const;

/**
 * Aperçu de l'application.
 *
 * Le produit est une interface : la montrer vaut mieux que la décrire.
 * L'aperçu est légèrement incliné et débordant du cadre, posé sur un
 * halo — il donne le ton sans prétendre être une capture exhaustive, et
 * l'inclinaison décourage d'essayer d'en lire le détail.
 *
 * Ses libellés suivent la langue de la page : une illustration dans une
 * autre langue que le texte qui l'entoure se lirait comme une erreur.
 *
 * @param locale    Langue de la page.
 * @param className Classes de placement.
 */
export function AppPreview({
  locale,
  className,
}: {
  locale: Locale;
  className?: string;
}) {
  const t = marketingCopy(locale).appPreview;
  return (
    <div className={cn("relative", className)}>
      <div
        className="pointer-events-none absolute -inset-x-16 -top-10 bottom-0 blur-3xl"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 40%, var(--glow-accent), transparent 70%)",
        }}
        aria-hidden
      />

      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-border-default",
          "bg-surface-raised shadow-overlay",
        )}
        // Décoratif : l'aperçu ne porte aucune information qu'un lecteur
        // d'écran doive annoncer, le texte de la page la porte déjà.
        aria-hidden
      >
        {/* Barre de fenêtre : trois pastilles suffisent à dire
            « application », sans imiter un système d'exploitation
            particulier. */}
        <div className="flex h-9 items-center gap-1.5 border-b border-border-subtle bg-surface-sunken px-3.5">
          <span className="size-2 rounded-full bg-border-strong" />
          <span className="size-2 rounded-full bg-border-strong" />
          <span className="size-2 rounded-full bg-border-strong" />
          {/* Le logotype lui-même, pas le nom composé en texte : l'aperçu
              doit montrer l'application telle qu'elle est, marque comprise. */}
          <Wordmark title="" className="ml-3 h-2.5" />
          <span className="text-2xs text-tertiary">· {t.windowLabel}</span>
        </div>

        <div className="flex">
          <div className="hidden w-40 shrink-0 flex-col gap-1 border-r border-border-subtle p-3 sm:flex">
            {/* Comme la barre latérale réelle : le logotype en tête. */}
            <Wordmark title="" className="mb-2 h-3.5 self-start px-2" />
            <div className="flex h-7 items-center gap-2 rounded-md bg-accent-muted px-2">
              <span className="size-3 rounded-xs bg-accent/70" />
              <span className="h-1.5 w-14 rounded-full bg-accent/50" />
            </div>
            {[16, 20, 12].map((width, index) => (
              <div key={index} className="flex h-7 items-center gap-2 px-2">
                <span className="size-3 rounded-xs bg-border-default" />
                <span
                  className="h-1.5 rounded-full bg-border-default"
                  style={{ width: `${width * 4}px` }}
                />
              </div>
            ))}
          </div>

          <div className="min-w-0 flex-1">
            <div className="grid grid-cols-3 gap-3 border-b border-border-subtle p-3">
              {[
                { value: "3", label: t.metrics.toRead, tone: "text-accent" },
                { value: "2", label: t.metrics.urgent, tone: "text-urgent" },
                {
                  value: t.turnaroundValue,
                  label: t.metrics.turnaround,
                  short: t.metrics.turnaroundShort,
                  tone: "text-primary",
                },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-lg border border-border-subtle bg-surface-base px-3 py-2"
                >
                  <p className={cn("text-lg font-semibold", metric.tone)}>
                    {metric.value}
                  </p>
                  {/* Libellé court sur téléphone : trois tuiles d'un tiers
                      de 360 px ne laissent pas la place à « Délai moyen ». */}
                  <p className="label-eyebrow mt-0.5 truncate">
                    {"short" in metric ? (
                      <>
                        <span className="sm:hidden">{metric.short}</span>
                        <span className="hidden sm:inline">{metric.label}</span>
                      </>
                    ) : (
                      metric.label
                    )}
                  </p>
                </div>
              ))}
            </div>

            <ul>
              {ROWS.map((row, index) => (
                <li
                  key={row.name}
                  className={cn(
                    "flex items-center gap-3 border-b border-border-subtle px-3.5 py-2.5 last:border-b-0",
                    row.urgent && "rail-urgent",
                  )}
                >
                  <span className="w-32 truncate text-xs font-medium">
                    {row.name}
                  </span>
                  <span className="hidden w-28 truncate text-xs text-secondary sm:block">
                    {t.exams[index]}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-2xs font-medium",
                      TONES[row.tone],
                    )}
                  >
                    {t.states[row.state]}
                  </span>
                  <span className="ml-auto text-2xs text-tertiary tabular-nums">
                    {row.age}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
