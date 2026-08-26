import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Приём событий читалки (см. lib/track.ts). Пишет в reading_events
// service-role ключом: RLS-политик на таблице нет, обычным клиентам она
// закрыта, а форму событий валидирует этот роут.
//
// user_id берётся из Supabase-сессии в cookies, а не из тела запроса —
// клиент не может назваться чужим пользователем. Если залогиненный читатель
// принёс anon_id, под которым раньше писал события анонимно, эта история
// дописывается его user_id — одним дешёвым идемпотентным update.

export const dynamic = "force-dynamic";

const TYPES = new Set([
  "chapter_open",
  "word_lookup",
  "par_translate",
  "show_all",
  "read_progress",
  "read_time",
]);
const ANON_RE = /^[a-z0-9-]{6,64}$/i;
const MAX_EVENTS = 100;
const MAX_META = 400;

type IncomingEvent = {
  type: string;
  book: string;
  chapter: number;
  meta?: Record<string, unknown>;
};

function validEvent(e: unknown): e is IncomingEvent {
  if (!e || typeof e !== "object") return false;
  const ev = e as IncomingEvent;
  return (
    typeof ev.type === "string" &&
    TYPES.has(ev.type) &&
    typeof ev.book === "string" &&
    ev.book.length > 0 &&
    ev.book.length <= 64 &&
    Number.isInteger(ev.chapter) &&
    ev.chapter >= 0 &&
    ev.chapter <= 10_000 &&
    (ev.meta === undefined ||
      (typeof ev.meta === "object" &&
        ev.meta !== null &&
        !Array.isArray(ev.meta) &&
        JSON.stringify(ev.meta).length <= MAX_META))
  );
}

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  // Аналитика опциональна: без ключей молча глотаем, читалке не мешаем.
  if (!url || !key) return new Response(null, { status: 204 });

  let body: { anon_id?: unknown; events?: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response(null, { status: 400 });
  }

  const anonId =
    typeof body.anon_id === "string" && ANON_RE.test(body.anon_id)
      ? body.anon_id
      : null;
  const events = Array.isArray(body.events)
    ? body.events.slice(0, MAX_EVENTS).filter(validEvent)
    : [];
  if (events.length === 0) return new Response(null, { status: 204 });

  const session = await createSupabaseServerClient();
  const userId = session
    ? ((await session.auth.getUser()).data.user?.id ?? null)
    : null;
  if (!userId && !anonId) return new Response(null, { status: 204 });

  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  await admin.from("reading_events").insert(
    events.map((e) => ({
      user_id: userId,
      anon_id: anonId,
      book_slug: e.book,
      chapter: e.chapter,
      type: e.type,
      meta: e.meta ?? {},
    })),
  );

  // Склейка анонимной истории с аккаунтом. Свежая пачка уже пришла с
  // user_id, поэтому update трогает только старые анонимные строки — после
  // первого прогона ему нечего делать.
  if (userId && anonId) {
    await admin
      .from("reading_events")
      .update({ user_id: userId })
      .eq("anon_id", anonId)
      .is("user_id", null);
  }

  return new Response(null, { status: 204 });
}
