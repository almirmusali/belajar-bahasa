import { createSupabaseServerClient } from "@/lib/supabase/server";
import { HomeHub } from "@/components/home-hub";
import { Landing } from "@/components/landing";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  // Без настроенного Supabase (анонимный режим) регистрации нет —
  // показываем сразу хаб, как раньше.
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return <Landing />;
  }
  return <HomeHub />;
}
