import fs from "node:fs";
import path from "node:path";
import type {
  Drill,
  ParticlesData,
  RootsData,
  Track,
  Unit,
} from "./express-types";

// Серверный слой: читает data/express с диска. Клиентские компоненты
// импортируют типы из lib/express-types.ts, а данные получают пропсами.

const DIR = path.join(process.cwd(), "data", "express");
const UNITS_DIR = path.join(DIR, "units");

function readJson<T>(file: string): T | undefined {
  if (!fs.existsSync(file)) return undefined;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return undefined;
  }
}

export function getParticles(): ParticlesData {
  return (
    readJson<ParticlesData>(path.join(DIR, "particles.json")) ?? {
      particles: [],
      ru_bridge_table: [],
      chunks: [],
      minimal_pairs: [],
    }
  );
}

export function getRoots(): RootsData {
  return (
    readJson<RootsData>(path.join(DIR, "roots.json")) ?? {
      roots: [],
      register_pairs: [],
      in_pairs: [],
      men_rules: [],
      ktsp: [],
    }
  );
}

export function getUnits(): Unit[] {
  if (!fs.existsSync(UNITS_DIR)) return [];
  return fs
    .readdirSync(UNITS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => readJson<Unit>(path.join(UNITS_DIR, f)))
    .filter((u): u is Unit => Boolean(u))
    .sort((a, b) => a.order - b.order);
}

export function getUnit(id: string): Unit | undefined {
  return getUnits().find((u) => u.id.toLowerCase() === id.toLowerCase());
}

export function getUnitsByTrack(track: Track): Unit[] {
  return getUnits().filter((u) => u.track === track);
}

export function getAllDrills(): Drill[] {
  return getUnits().flatMap((u) => u.drills);
}

// Все индонезийские фразы модуля — для озвучки и для проверки, что каждая
// строка, которую увидит ученик, имеет пару в public/audio/id.
export function collectIndonesianTexts(): string[] {
  const out = new Set<string>();
  const add = (s?: string | null) => {
    const v = (s ?? "").trim();
    if (v) out.add(v);
  };

  const p = getParticles();
  for (const particle of p.particles) {
    for (const fn of particle.functions) for (const ex of fn.examples) add(ex.id);
    for (const err of particle.common_errors) add(err.right);
  }
  for (const c of p.chunks) add(c.id);
  for (const pair of p.minimal_pairs) for (const v of pair.variants) add(v.id);
  for (const row of p.ru_bridge_table) add(row.id);

  const r = getRoots();
  for (const root of r.roots) {
    for (const f of root.family) {
      add(f.form);
      add(f.example_id);
    }
  }
  for (const pair of [...r.register_pairs, ...r.in_pairs]) {
    add(pair.baku);
    add(pair.colloquial.split(" / ")[0]);
  }

  for (const u of getUnits()) {
    for (const d of u.drills) {
      add(d.audio);
      if (d.type !== "men_drill" && d.type !== "root_expand") add(d.answer);
      for (const f of d.fields ?? []) if (d.type === "register_swap") add(f.answer);
    }
  }
  return [...out];
}
