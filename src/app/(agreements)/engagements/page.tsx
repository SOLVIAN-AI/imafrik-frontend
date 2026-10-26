import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PendingAgreements } from "@/components/agreements/pending-agreements";
import { getMessages } from "@/i18n/server";
import { getPendingAgreementViews } from "@/lib/data/agreements";
import { homeFor } from "@/lib/navigation";
import { requireSession } from "@/lib/session/server";

/** Titre de l'onglet, dans la langue de l'utilisateur ; page non indexée. */
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getMessages();
  return {
    title: t.agreements.page.metaTitle,
    robots: { index: false, follow: false },
  };
}

/**
 * Les engagements en vigueur que le compte n'a pas encore acceptés.
 *
 * La disposition de l'application y envoie dès qu'il en reste un : une
 * nouvelle version publiée, ou une convention que l'établissement n'a
 * pas encore signée. Quand il n'en reste plus, l'écran renvoie au
 * portail ; il ne s'affiche donc jamais vide.
 *
 * Une panne du service n'est pas lue comme « rien à accepter » : elle
 * lève, et l'écran d'erreur propose de réessayer. Lire « rien » et
 * renvoyer au portail, dont la garde tolère la panne, ferait au mieux
 * un aller-retour inutile.
 */
export default async function AgreementsPage() {
  const session = await requireSession();
  const { t, locale } = await getMessages();
  const views = await getPendingAgreementViews(locale);
  if (views.length === 0) redirect(homeFor(session.active.role));

  return (
    <div className="animate-[rise-in_300ms_var(--ease-out-quart)]">
      <h1 className="text-2xl font-semibold">{t.agreements.page.title}</h1>
      <p className="mt-1.5 text-sm text-tertiary">{t.agreements.page.lead}</p>
      <div className="mt-10">
        <PendingAgreements views={views} />
      </div>
    </div>
  );
}
