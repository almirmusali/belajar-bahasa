"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import {
  AuthShell,
  ErrorBox,
  Field,
  FooterLink,
  SubmitButton,
  SuccessBox,
} from "@/components/auth-form";
import { useLocale } from "@/lib/use-locale";
import { t } from "@/lib/i18n";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const { locale } = useLocale();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email"));
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError(t(locale, "auth_not_configured"));
      setPending(false);
      return;
    }
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password`,
    });
    if (error) {
      setError(error.message);
      setPending(false);
      return;
    }
    setDone(true);
    setPending(false);
  }

  return (
    <>
      <SiteHeader />
      <AuthShell
        title={t(locale, "auth_forgot_title")}
        subtitle={t(locale, "auth_forgot_subtitle")}
        footer={
          <FooterLink
            prompt={t(locale, "auth_already_have_account")}
            href="/login"
            label={t(locale, "auth_login_link")}
          />
        }
      >
        {done ? (
          <SuccessBox>{t(locale, "auth_forgot_sent")}</SuccessBox>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <Field
              name="email"
              type="email"
              autoComplete="email"
              label={t(locale, "auth_email")}
            />
            {error && <ErrorBox>{error}</ErrorBox>}
            <SubmitButton pending={pending}>
              {t(locale, "auth_forgot_submit")}
            </SubmitButton>
          </form>
        )}
      </AuthShell>
    </>
  );
}
