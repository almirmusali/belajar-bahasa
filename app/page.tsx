export default function Home() {
  return (
    <main className="container mx-auto flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <span className="rounded-full border px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
        Bahasa Indonesia
      </span>
      <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-6xl">
        Belajar Bahasa
      </h1>
      <p className="max-w-xl text-balance text-lg text-muted-foreground">
        Платформа для изучения индонезийского языка. Контент скоро появится —
        сейчас здесь только заготовка проекта.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
        <span className="rounded-md bg-secondary px-3 py-1.5">Next.js 15</span>
        <span className="rounded-md bg-secondary px-3 py-1.5">Tailwind</span>
        <span className="rounded-md bg-secondary px-3 py-1.5">shadcn-ready</span>
        <span className="rounded-md bg-secondary px-3 py-1.5">v0-ready</span>
      </div>
    </main>
  );
}
