"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import {
  AuthShell,
  ErrorBox,
  Field,
  FooterLink,
  SubmitButton,
} from "@/components/auth-form";
import { useLocale } from "@/lib/use-locale";
import { t } from "@/lib/i18n";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError(t(locale, "auth_not_configured"));
      setPending(false);
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
    });
    if (error) {
      setError(error.message);
      setPending(false);
      return;
    }
    router.push("/account");
    router.refresh();
  }

  return (
    <>
      <SiteHeader />
      <AuthShell
        title={t(locale, "auth_login_title")}
        subtitle={t(locale, "auth_login_subtitle")}
        footer={
          <FooterLink
            prompt={t(locale, "auth_no_account")}
            href="/signup"
            label={t(locale, "auth_signup_link")}
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
            autoComplete="current-password"
            label={t(locale, "auth_password")}
          />
          <div className="text-right text-xs">
            <Link
              href="/forgot-password"
              className="text-muted-foreground hover:text-foreground"
            >
              {t(locale, "auth_forgot")}
            </Link>
          </div>
          {error && <ErrorBox>{error}</ErrorBox>}
          <SubmitButton pending={pending}>
            {t(locale, "auth_login_submit")}
          </SubmitButton>
        </form>
      </AuthShell>
    </>
  );
}
