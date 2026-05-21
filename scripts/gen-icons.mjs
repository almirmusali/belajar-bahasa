import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.join(process.cwd(), "public");
await mkdir(ROOT, { recursive: true });

const RED = "#dc2626"; // tailwind red-600, близко к --primary

function makeSvg({ size, masked = false, char = "B" }) {
  const inner = masked ? Math.round(size * 0.8) : size;
  const offset = Math.round((size - inner) / 2);
  const radius = masked ? 0 : Math.round(inner * 0.22);
  const fontSize = Math.round(inner * 0.62);
  const bg = masked ? "#0a0a0a" : "transparent";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="100%" height="100%" fill="${bg}"/>
  <rect x="${offset}" y="${offset}" width="${inner}" height="${inner}" rx="${radius}" ry="${radius}" fill="${RED}"/>
  <text x="50%" y="50%"
        font-family="Inter, SF Pro Display, Helvetica, Arial, sans-serif"
        font-size="${fontSize}" font-weight="800"
        fill="#ffffff" text-anchor="middle" dominant-baseline="central">${char}</text>
</svg>`;
}

async function render(name, size, opts = {}) {
  const svg = makeSvg({ size, ...opts });
  const out = path.join(ROOT, name);
  await sharp(Buffer.from(svg)).png().toFile(out);
  console.log(`✓ ${name} (${size}x${size})`);
}

await render("icon-192.png", 192);
await render("icon-512.png", 512);
await render("icon-maskable-512.png", 512, { masked: true });
await render("apple-icon.png", 180);
await render("apple-icon-1024.png", 1024);

// Также пишем исходный SVG как master-копию
await writeFile(path.join(ROOT, "icon.svg"), makeSvg({ size: 512 }), "utf8");
console.log("✓ icon.svg (master)");
