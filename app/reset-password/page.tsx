"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import {
  AuthShell,
  ErrorBox,
  Field,
  SubmitButton,
  SuccessBox,
} from "@/components/auth-form";
import { useLocale } from "@/lib/use-locale";
import { t } from "@/lib/i18n";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
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
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setPending(false);
      return;
    }
    setDone(true);
    setPending(false);
    setTimeout(() => router.push("/login"), 1500);
  }

  return (
    <>
      <SiteHeader />
      <AuthShell
        title={t(locale, "auth_reset_title")}
        subtitle={t(locale, "auth_reset_subtitle")}
      >
        {done ? (
          <SuccessBox>{t(locale, "auth_reset_done")}</SuccessBox>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
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
            <SubmitButton pending={pending}>
              {t(locale, "auth_reset_submit")}
            </SubmitButton>
          </form>
        )}
      </AuthShell>
    </>
  );
}
