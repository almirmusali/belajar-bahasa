// Удаляет все MP3 в одной языковой папке bucket "audio" в Supabase.
// Запуск: node scripts/wipe-audio-lang.mjs id
// (затем нужно перезапустить generate-audio.mjs)

import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  try {
    const env = fs.readFileSync(".env.local", "utf8");
    for (const line of env.split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {}
}
loadEnv();

const arg = process.argv[2];
if (!arg) {
  console.error("Usage: node scripts/wipe-audio-lang.mjs <id|en|ru|all>");
  process.exit(1);
}
const langs = arg === "all" ? ["id", "en", "ru"] : [arg];

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

let grandTotal = 0;
for (const lang of langs) {
  let totalDeleted = 0;
  while (true) {
    const { data: files, error } = await sb.storage.from("audio").list(lang, {
      limit: 1000,
    });
    if (error) {
      console.error(error);
      process.exit(1);
    }
    if (!files || files.length === 0) break;

    const paths = files.map((f) => `${lang}/${f.name}`);
    const { error: delErr } = await sb.storage.from("audio").remove(paths);
    if (delErr) {
      console.error(delErr);
      process.exit(1);
    }
    totalDeleted += files.length;
    console.log(`  ${lang}: deleted batch ${files.length}, total ${totalDeleted}`);
    if (files.length < 1000) break;
  }
  grandTotal += totalDeleted;
  console.log(`Wiped ${totalDeleted} files from audio/${lang}/`);
}

console.log(`\nTotal wiped: ${grandTotal} files`);
