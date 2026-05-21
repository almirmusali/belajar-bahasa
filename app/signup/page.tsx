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

export default function SignupPage() {
  const { locale } = useLocale();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email"));
    const password = String(fd.get("password"));
    const confirm = String(fd.get("confirm"));
    if (password !== confirm) {
      setError(t(locale, "auth_password_mismatch"));
      setPending(false);
      return;
    }
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError(t(locale, "auth_not_configured"));
      setPending(false);
      return;
    }
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setPending(false);
      return;
    }
    setSuccess(t(locale, "auth_signup_check_email"));
    setPending(false);
  }

  return (
    <>
      <SiteHeader />
      <AuthShell
        title={t(locale, "auth_signup_title")}
        subtitle={t(locale, "auth_signup_subtitle")}
        footer={
          <FooterLink
            prompt={t(locale, "auth_already_have_account")}
            href="/login"
            label={t(locale, "auth_login_link")}
          />
        }
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <Field
            name="email"
            type="email"
            autoComplete="email"
            label={t(locale, "auth_email")}
          />
          <Field
            name="password"
            type="password"
            autoComplete="new-password"
            label={t(locale, "auth_password")}
            hint={t(locale, "auth_password_min")}
          />
          <Field
            name="confirm"
            type="password"
            autoComplete="new-password"
            label={t(locale, "auth_password_confirm")}
          />
          {error && <ErrorBox>{error}</ErrorBox>}
          {success && <SuccessBox>{success}</SuccessBox>}
          {!success && (
            <SubmitButton pending={pending}>
              {t(locale, "auth_signup_submit")}
            </SubmitButton>
          )}
        </form>
      </AuthShell>
    </>
  );
}
