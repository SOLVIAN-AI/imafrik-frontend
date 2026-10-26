import { CircleHelp } from "lucide-react";
import Link from "next/link";

import { Wordmark } from "@/components/brand/brand";
import { HtmlLang } from "@/components/i18n/html-lang";
import { MAIN_CONTENT_ID, SkipLink } from "@/components/layout/skip-link";
import { SessionProvider } from "@/components/providers/session-provider";
import { getMessages } from "@/i18n/server";
import { requireSession } from "@/lib/session/server";

/**
 * Disposition de l'écran des engagements.
 *
 * Hors du portail, comme la mise en service : tant qu'un engagement en
 * vigueur n'est pas accepté, le service refuse les opérations du portail,
 * et lui montrer sa navigation serait l'inviter à des écrans qui
 * échoueraient. Reste la marque, le texte à lire, et l'aide.
 */
export default async function AgreementsLayout({ children }: LayoutProps<"/">) {
  const session = await requireSession();
  const { t } = await getMessages();

  return (
    <SessionProvider session={session}>
      <HtmlLang lang={session.locale} />
      <div className="relative flex min-h-dvh flex-col overflow-x-clip bg-surface-base">
        <SkipLink label={t.common.skipToContent} />
        <header className="relative flex h-16 shrink-0 items-center gap-6 border-b border-border-subtle px-4 sm:px-6">
          <Link href="/" className="flex min-h-6 shrink-0 items-center gap-2.5">
            <Wordmark className="h-5" />
          </Link>
          <Link
            href="/contact"
            className="-mr-2 ml-auto flex min-h-9 min-w-9 shrink-0 items-center justify-center gap-1.5 rounded-lg px-2 text-xs text-tertiary transition-colors hover:text-accent"
          >
            <CircleHelp className="size-3.5" aria-hidden />
            <span className="hidden sm:inline">{t.onboarding.help}</span>
          </Link>
        </header>
        <main
          id={MAIN_CONTENT_ID}
          tabIndex={-1}
          className="relative mx-auto w-full max-w-2xl flex-1 px-4 py-12 outline-none sm:px-6 md:py-16"
        >
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}
