import {
  CalendarClock,
  CircleCheck,
  CircleMinus,
  Eye,
  Inbox,
  Laptop,
  type LucideIcon,
  MessageSquareText,
  Smartphone,
  Tablet,
} from "lucide-react";

import type { AppMessages } from "@/i18n";
import type { IdeaDevice, IdeaStatus } from "@/lib/ideas";
import { cn } from "@/lib/utils";

/**
 * Pièces communes d’une idée : son état, son contexte, la réponse de
 * l’équipe. Sans état ni requête : les écrans de l’auteur et de l’équipe
 * IMAFRIK les rendent au serveur comme au navigateur.
 */

/**
 * Teinte et pictogramme de chaque état : deux signaux, jamais un seul. Le
 * vert de « livrée » est celui de « rendu », la sarcelle marque ce qui
 * est prévu, l’ambre ce qui est en cours d’étude ; jamais de bleu.
 */
const STATUS_STYLES: Record<IdeaStatus, { tone: string; icon: LucideIcon }> = {
  received: { tone: "bg-surface-active text-secondary", icon: Inbox },
  under_review: { tone: "bg-progress-muted text-progress", icon: Eye },
  planned: { tone: "bg-accent-muted text-accent", icon: CalendarClock },
  shipped: { tone: "bg-done-muted text-done", icon: CircleCheck },
  declined: {
    tone: "border border-border-default text-secondary",
    icon: CircleMinus,
  },
};

/** L’état d’une idée, en pastille. */
export function IdeaStatusBadge({
  status,
  label,
  className,
}: {
  status: IdeaStatus;
  label: string;
  className?: string;
}) {
  const { tone, icon: Icon } = STATUS_STYLES[status];
  return (
    <span
      data-idea-status={status}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-medium whitespace-nowrap",
        tone,
        className,
      )}
    >
      <Icon className="size-3" aria-hidden />
      {label}
    </span>
  );
}

/** Une étiquette discrète : catégorie, gain, rôle. */
export function IdeaTag({
  icon: Icon,
  children,
}: {
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-border-subtle px-2 py-0.5 text-2xs text-secondary">
      {Icon && <Icon className="size-3 shrink-0" aria-hidden />}
      <span className="truncate">{children}</span>
    </span>
  );
}

const DEVICE_ICONS: Record<IdeaDevice, LucideIcon> = {
  desktop: Laptop,
  tablet: Tablet,
  phone: Smartphone,
};

/**
 * Le contexte d’une idée, en clair : l’écran, la version, l’appareil.
 *
 * @param screenName Nom de l’écran, d’après l’aide du rôle de l’auteur.
 */
export function IdeaContext({
  screenName,
  version,
  device,
  t,
}: {
  screenName: string | null;
  version: string | null;
  device: IdeaDevice | null;
  t: AppMessages;
}) {
  const text = t.ideas.form;
  const DeviceIcon = device ? DEVICE_ICONS[device] : null;
  const parts = [
    screenName ? text.contextScreen(screenName) : null,
    version ? text.contextVersion(version) : null,
  ].filter(Boolean);
  if (parts.length === 0 && !device) {
    return <span className="text-tertiary">{t.ideas.inbox.noContext}</span>;
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
      {parts.join(" · ")}
      {device && DeviceIcon && (
        <span className="inline-flex items-center gap-1">
          {parts.length > 0 && <span aria-hidden>·</span>}
          <DeviceIcon className="size-3 text-tertiary" aria-hidden />
          {t.ideas.devices[device]}
        </span>
      )}
    </span>
  );
}

/** La réponse de l’équipe IMAFRIK, telle que l’auteur la lit. */
export function IdeaResponse({
  title,
  response,
  footer,
}: {
  title: string;
  response: string;
  footer?: React.ReactNode;
}) {
  return (
    <div className="mt-3 rounded-lg border border-accent/25 bg-accent-muted/40 px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-2xs font-medium text-accent">
        <MessageSquareText className="size-3.5" aria-hidden />
        {title}
      </p>
      <p className="mt-1 text-xs break-words whitespace-pre-wrap text-primary">
        {response}
      </p>
      {footer && <div className="mt-1 text-2xs text-tertiary">{footer}</div>}
    </div>
  );
}
