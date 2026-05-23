"use client";

import { Download } from "lucide-react";
import { useInstallPrompt } from "@/lib/use-install-prompt";
import { useLocale } from "@/lib/use-locale";
import { t } from "@/lib/i18n";

export function InstallButton() {
  const { canInstall, installed, prompt } = useInstallPrompt();
  const { locale } = useLocale();

  if (installed || !canInstall) return null;

  return (
    <button
      type="button"
      onClick={() => prompt()}
      title={t(locale, "install_install")}
      aria-label={t(locale, "install_install")}
      className="inline-flex h-7 items-center gap-1.5 rounded-md border border-primary/40 bg-primary/5 px-2.5 text-xs font-medium text-primary transition hover:bg-primary/10"
    >
      <Download className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{t(locale, "install_install")}</span>
    </button>
  );
}
