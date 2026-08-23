// Мини-рендерер markdown для приложения книги (словарь, грамматика).
// Полноценная библиотека тут не нужна: источник наш собственный файл,
// а из разметки в нём встречаются только заголовки, таблицы, цитаты,
// абзацы и выделения.

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const inline = (s: string) =>
  escapeHtml(s)
    .replace(/`([^`]+)`/g, '<code class="rounded bg-secondary px-1 py-0.5 text-[0.9em]">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");

const cells = (row: string) =>
  row
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());

export function renderMarkdown(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let para: string[] = [];
  let quote: string[] = [];

  const flushPara = () => {
    if (!para.length) return;
    out.push(`<p>${inline(para.join(" "))}</p>`);
    para = [];
  };
  const flushQuote = () => {
    if (!quote.length) return;
    out.push(
      `<blockquote class="border-l-2 border-primary/40 pl-4 italic text-muted-foreground">${inline(
        quote.join(" "),
      )}</blockquote>`,
    );
    quote = [];
  };
  const flush = () => {
    flushPara();
    flushQuote();
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      flush();
      continue;
    }
    if (/^---+$/.test(line)) {
      flush();
      out.push('<hr class="my-8 border-t" />');
      continue;
    }

    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      flush();
      const level = h[1].length;
      const size = ["text-2xl", "text-xl", "text-lg", "text-base"][level - 1];
      out.push(
        `<h${level} class="mt-8 ${size} font-semibold tracking-tight">${inline(h[2])}</h${level}>`,
      );
      continue;
    }

    // Таблица: строка с | и следом разделитель |---|---|
    if (line.startsWith("|") && /^\|[\s:|-]+\|$/.test(lines[i + 1]?.trim() ?? "")) {
      flush();
      const head = cells(line);
      i++;
      const rows: string[][] = [];
      while (lines[i + 1]?.trim().startsWith("|")) {
        rows.push(cells(lines[++i].trim()));
      }
      out.push(
        `<div class="my-4 overflow-x-auto"><table class="w-full border-collapse text-sm">` +
          `<thead><tr>${head
            .map(
              (c) =>
                `<th class="border-b px-3 py-2 text-left font-semibold">${inline(c)}</th>`,
            )
            .join("")}</tr></thead><tbody>${rows
            .map(
              (r) =>
                `<tr class="align-top">${r
                  .map((c) => `<td class="border-b px-3 py-2">${inline(c)}</td>`)
                  .join("")}</tr>`,
            )
            .join("")}</tbody></table></div>`,
      );
      continue;
    }

    if (line.startsWith(">")) {
      flushPara();
      quote.push(line.replace(/^>\s?/, ""));
      continue;
    }

    flushQuote();
    para.push(line);
  }
  flush();
  return out.join("\n");
}
