import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Админка поведения читателей. Доступ — по списку email'ов в ADMIN_EMAILS
// (через запятую): проверка здесь, в layout, закрывает и список, и карточки.
// Чужому показываем 404, а не «доступ запрещён»: страницы, о которой не
// знаешь, как будто нет.
//
// RLS-акробатики нет намеренно: данные читаются service-role ключом в RSC,
// ключ не покидает сервер, а этот гейт — единственная дверь.

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const supabase = await createSupabaseServerClient();
  const email = supabase
    ? ((await supabase.auth.getUser()).data.user?.email ?? null)
    : null;

  if (!email || !admins.includes(email.toLowerCase())) notFound();

  return (
    <>
      <SiteHeader />
      <main className="container mx-auto max-w-4xl px-4 pt-8 pb-[calc(2rem+env(safe-area-inset-bottom))]">
        {children}
      </main>
    </>
  );
}
