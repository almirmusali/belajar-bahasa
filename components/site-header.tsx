import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="inline-block h-5 w-5 rounded-sm bg-primary" />
          <span>Belajar Bahasa</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Уроки</Link>
          <Link href="/vocab" className="hover:text-foreground">Словарь</Link>
          <a
            href="https://github.com/almirmusali/belajar-bahasa"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}
