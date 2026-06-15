// Generate the paper's data-driven figures as reproducible SVG, straight from
// the analysis artifact (docs/PAPER_OUTLINE.md Figures 1, 2, 5). No charting
// dependency: deterministic SVG strings, so the figures are byte-stable and
// regenerate with the corpus.
//
// Usage: npm run build-figures  ->  data/pilot/figures/*.svg
// Figures 3 (root modeling) and 4 (compound split) are conceptual diagrams and
// remain hand-authored.

import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const OUT = path.resolve(root, "data/pilot/figures");

const FONT = "font-family=\"Helvetica, Arial, sans-serif\"";
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Status / cause colours (consistent across figures).
const C = {
  clean: "#1a7f37", partial: "#d4a017", lossy: "#b42318",
  bar: "#1f4f78", barLight: "#8db4d8", grid: "#d8dee4", text: "#24292f", muted: "#5f6b7a"
};

function svg(width, height, body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" ${FONT}>
<rect width="${width}" height="${height}" fill="#ffffff"/>
${body}
</svg>
`;
}

function title(x, y, text, size = 16) {
  return `<text x="${x}" y="${y}" font-size="${size}" font-weight="700" fill="${C.text}">${esc(text)}</text>`;
}
function caption(x, y, text, size = 12) {
  return `<text x="${x}" y="${y}" font-size="${size}" fill="${C.muted}">${esc(text)}</text>`;
}

// ── Figure 1: three-view architecture (CDSL → neutral model → TEI/OntoLex) ──
function figureArchitecture() {
  const W = 760, H = 300;
  const box = (x, y, w, h, label, sub, fill = "#edf5fb", stroke = C.barLight) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>` +
    `<text x="${x + w / 2}" y="${y + (sub ? 26 : h / 2 + 5)}" font-size="14" font-weight="700" fill="${C.text}" text-anchor="middle">${esc(label)}</text>` +
    (sub ? `<text x="${x + w / 2}" y="${y + 46}" font-size="11" fill="${C.muted}" text-anchor="middle">${esc(sub)}</text>` : "");
  const arrow = (x1, x2, y) =>
    `<line x1="${x1}" y1="${y}" x2="${x2 - 8}" y2="${y}" stroke="${C.muted}" stroke-width="2"/>` +
    `<polygon points="${x2},${y} ${x2 - 9},${y - 5} ${x2 - 9},${y + 5}" fill="${C.muted}"/>`;
  const body = [
    title(24, 34, "Figure 1 — Three-view interoperability architecture"),
    caption(24, 54, "CDSL source records pass through one neutral model into two complementary standard profiles."),
    box(24, 90, 150, 80, "CDSL", "MW · PWG · PWK raw"),
    arrow(174, 250, 130),
    box(250, 90, 170, 80, "Neutral model", "senses · citations · relations", "#fff7df", "#ebc169"),
    arrow(420, 500, 110),
    arrow(420, 500, 150),
    box(500, 60, 236, 64, "TEI", "archival profile + Lex-0 baseline"),
    box(500, 150, 236, 64, "OntoLex / FrAC", "Lexicog multi-resource graph"),
    caption(250, 200, "Loss reports record what each mapping cannot carry.")
  ].join("\n");
  return svg(W, H, body);
}

// ── Figure 2: evidence collapse — named citations by dictionary ──
function figureEvidence(a) {
  const byDict = a.crossDictionary.citations.byDictionary;
  const uncited = a.crossDictionary.phenomena["mw-uncited-pwg-cited"];
  const cases = a.crossDictionary.cases;
  const rows = [["PWG", byDict.pwg], ["PWK", byDict.pwk], ["MW", byDict.mw]];
  const max = Math.max(...rows.map(r => r[1]));
  const W = 760, H = 300, x0 = 80, barW = 560, top = 96, rowH = 56;
  const bars = rows.map(([label, n], i) => {
    const y = top + i * rowH;
    const w = Math.round((n / max) * barW);
    return `<text x="${x0 - 12}" y="${y + 22}" font-size="13" font-weight="700" fill="${C.text}" text-anchor="end">${label}</text>` +
      `<rect x="${x0}" y="${y}" width="${w}" height="32" rx="3" fill="${C.bar}"/>` +
      `<text x="${x0 + w + 8}" y="${y + 22}" font-size="13" fill="${C.text}">${n}</text>`;
  }).join("\n");
  const body = [
    title(24, 34, "Figure 2 — Evidence collapse across the MW–PWG–PWK lineage"),
    caption(24, 54, `Named source citations carried per dictionary (${cases} lemmas). PWG's apparatus is far richer than MW's or PWK's.`),
    bars,
    caption(x0, top + 3 * rowH + 14, `In ${uncited} of ${cases} lemmas (${Math.round(uncited / cases * 100)}%) MW carries no citation where PWG names a source.`)
  ].join("\n");
  return svg(W, H, body);
}

// ── Figure 5: loss distribution — target × status, and by cause ──
function figureLossDistribution(a) {
  const tbs = a.lossReports.targetByStatus;
  const targets = ["tei", "ontolex", "neutral"];
  const statuses = ["clean", "partial", "lossy"];
  const total = t => statuses.reduce((s, k) => s + (tbs[t][k] || 0), 0);
  const maxTotal = Math.max(...targets.map(total));
  const W = 760, H = 420, x0 = 90, barW = 560, top = 100, rowH = 46;

  const stacked = targets.map((t, i) => {
    const y = top + i * rowH;
    let cx = x0;
    const segs = statuses.map(st => {
      const n = tbs[t][st] || 0;
      const w = Math.round((n / maxTotal) * barW);
      const seg = n > 0
        ? `<rect x="${cx}" y="${y}" width="${w}" height="28" fill="${C[st]}"/>` +
          (w > 24 ? `<text x="${cx + w / 2}" y="${y + 19}" font-size="11" fill="#fff" text-anchor="middle">${n}</text>` : "")
        : "";
      cx += w;
      return seg;
    }).join("");
    return `<text x="${x0 - 12}" y="${y + 19}" font-size="13" font-weight="700" fill="${C.text}" text-anchor="end">${t.toUpperCase()}</text>${segs}`;
  }).join("\n");

  const legend = statuses.map((st, i) =>
    `<rect x="${x0 + i * 130}" y="${top + 3 * rowH + 6}" width="12" height="12" fill="${C[st]}"/>` +
    `<text x="${x0 + i * 130 + 18}" y="${top + 3 * rowH + 16}" font-size="12" fill="${C.text}">${st}</text>`
  ).join("\n");

  // by-cause mini panel
  const causes = Object.entries(a.lossReports.byFailureClassification).sort((p, q) => q[1] - p[1]);
  const cMax = Math.max(...causes.map(c => c[1]));
  const cTop = top + 3 * rowH + 64, cRowH = 26;
  const causeBars = causes.map(([k, n], i) => {
    const y = cTop + i * cRowH;
    const w = Math.round((n / cMax) * 360);
    return `<text x="${x0 + 150}" y="${y + 13}" font-size="11" fill="${C.text}" text-anchor="end">${esc(k)}</text>` +
      `<rect x="${x0 + 158}" y="${y + 2}" width="${w}" height="14" rx="2" fill="${C.barLight}"/>` +
      `<text x="${x0 + 158 + w + 6}" y="${y + 13}" font-size="11" fill="${C.muted}">${n}</text>`;
  }).join("\n");

  const body = [
    title(24, 34, "Figure 5 — How TEI and OntoLex fail"),
    caption(24, 54, `${a.lossReports.total} loss reports. TEI is never lossy for the Western cases; OntoLex is never clean; the neutral lineage lane is the most lossy.`),
    title(24, 86, "Target × status", 13),
    stacked, legend,
    title(24, cTop - 10, "By cause", 13),
    causeBars
  ].join("\n");
  return svg(W, H, body);
}

async function main() {
  const a = JSON.parse(await fs.readFile(path.resolve(root, "data/pilot/loss-analysis.json"), "utf8"));
  await fs.mkdir(OUT, { recursive: true });
  const figures = [
    ["figure-1-architecture.svg", figureArchitecture()],
    ["figure-2-evidence-collapse.svg", figureEvidence(a)],
    ["figure-5-loss-distribution.svg", figureLossDistribution(a)]
  ];
  for (const [name, content] of figures) {
    await fs.writeFile(path.join(OUT, name), content, "utf8");
  }
  console.log(`Wrote ${figures.length} figures to ${path.relative(root, OUT)} (Figures 3, 4 remain hand-authored).`);
}

main().catch(error => { console.error(error); process.exit(1); });
