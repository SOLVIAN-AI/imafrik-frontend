import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { authCopy } from "@/content/auth";
import { requestLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: authCopy(await requestLocale()).forgot.metaTitle };
}

/** Demande de réinitialisation du mot de passe, dans la langue choisie. */
export default async function ForgotPasswordPage() {
  return <ForgotPasswordForm locale={await requestLocale()} />;
}
