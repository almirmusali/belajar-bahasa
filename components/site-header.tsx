"use client";

import Link from "next/link";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { UserMenu } from "@/components/user-menu";
import { InstallButton } from "@/components/install-button";
import { useLocale } from "@/lib/use-locale";
import { t } from "@/lib/i18n";

export function SiteHeader() {
  const { locale } = useLocale();
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="inline-block h-5 w-5 rounded-sm bg-primary" />
          <span>Belajar Bahasa</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm text-muted-foreground sm:gap-4">
          <Link href="/" className="hover:text-foreground">
            {t(locale, "nav_lessons")}
          </Link>
          <Link href="/vocab" className="hover:text-foreground">
            {t(locale, "nav_vocab")}
          </Link>
          <InstallButton />
          <LocaleSwitcher />
          <UserMenu />
        </nav>
      </div>
    </header>
  );
}
