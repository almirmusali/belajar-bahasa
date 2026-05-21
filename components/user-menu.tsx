"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon } from "lucide-react";
import { useUser } from "@/lib/use-user";
import { useLocale } from "@/lib/use-locale";
import { t } from "@/lib/i18n";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function UserMenu() {
  const { user, loading, configured } = useUser();
  const { locale } = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Если Supabase не настроен — не показываем UI авторизации вовсе
  if (!configured) return null;
  if (loading) return <div className="h-7 w-7 animate-pulse rounded-md bg-secondary" />;

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-md border px-3 py-1 text-sm hover:bg-secondary"
      >
        {t(locale, "nav_login")}
      </Link>
    );
  }

  const initial = (user.email ?? "?").charAt(0).toUpperCase();

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground hover:opacity-90"
        title={user.email ?? ""}
      >
        {initial}
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-40 mt-1.5 w-56 overflow-hidden rounded-md border bg-card shadow-lg">
            <div className="border-b px-3 py-2 text-xs text-muted-foreground">
              {user.email}
            </div>
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary"
            >
              <UserIcon className="h-4 w-4" />
              {t(locale, "nav_account")}
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-secondary"
            >
              <LogOut className="h-4 w-4" />
              {t(locale, "nav_logout")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
