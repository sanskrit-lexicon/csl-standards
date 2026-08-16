import fs from "node:fs";
import path from "node:path";

// Merge the per-case LIFT fragments into one importable lexicon + .lift-ranges
// sidecar. FLEx / Lexique Pro refuse a directory of single-entry fragments
// (docs/LIFT_EXPORT_MAPPING.md stress point). Derived from committed
// fragments so CI does not need a csl-orig sibling.

const root = process.cwd();
const fragmentDir = path.join(root, "data", "pilot", "lift");
const outDir = path.join(root, "data", "pilot", "lift-lexicon");
const LIFT_VERSION = "0.13";

function xmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function extractEntry(text) {
  const m = text.match(/<entry\b[\s\S]*?<\/entry>/);
  return m ? m[0] : null;
}

function collect(re, text, into) {
  for (const m of text.matchAll(re)) into.add(m[1]);
}

const files = fs.existsSync(fragmentDir)
  ? fs.readdirSync(fragmentDir).filter((f) => f.endsWith(".lift")).sort()
  : [];

const entries = [];
const ids = new Set();
const grammaticalInfo = new Set();
const relationTypes = new Set();
const noteTypes = new Set();
const errors = [];

for (const file of files) {
  const text = fs.readFileSync(path.join(fragmentDir, file), "utf8");
  const entry = extractEntry(text);
  if (!entry) {
    errors.push(`${file}: no <entry>`);
    continue;
  }
  const id = entry.match(/<entry\b[^>]*\sid="([^"]+)"/)?.[1];
  if (!id) {
    errors.push(`${file}: <entry> missing id`);
    continue;
  }
  if (ids.has(id)) errors.push(`${file}: duplicate entry id ${id}`);
  ids.add(id);
  entries.push(entry);
  collect(/<grammatical-info value="([^"]*)"/g, entry, grammaticalInfo);
  collect(/<relation type="([^"]*)"/g, entry, relationTypes);
  collect(/<note type="([^"]*)"/g, entry, noteTypes);
}

if (errors.length) {
  console.error(`LIFT lexicon merge FAILED (${errors.length}):`);
  for (const e of errors) console.error(`- ${e}`);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

const lexicon = [
  `<?xml version="1.0" encoding="UTF-8"?>`,
  `<lift version="${LIFT_VERSION}" producer="csl-standards/merge-lift-lexicon.mjs">`,
  ...entries.flatMap((e) => e.split("\n").map((line) => (line.length ? `  ${line}` : line))),
  `</lift>`,
  ``,
].join("\n");

function rangeBlock(id, values, labelLang = "en") {
  const elements = [...values].sort().map((value) => {
    const safe = xmlEscape(value);
    return [
      `    <range-element id="${safe}">`,
      `      <label>`,
      `        <form lang="${labelLang}"><text>${safe}</text></form>`,
      `      </label>`,
      `      <abbrev>`,
      `        <form lang="${labelLang}"><text>${safe}</text></form>`,
      `      </abbrev>`,
      `    </range-element>`,
    ].join("\n");
  });
  return [`  <range id="${id}">`, ...elements, `  </range>`].join("\n");
}

const ranges = [
  `<?xml version="1.0" encoding="UTF-8"?>`,
  `<lift-ranges>`,
  rangeBlock("grammatical-info", grammaticalInfo),
  rangeBlock("lexical-relation", relationTypes),
  rangeBlock("note-type", noteTypes),
  `</lift-ranges>`,
  ``,
].join("\n");

const lexiconPath = path.join(outDir, "cdsl-pilot.lift");
const rangesPath = path.join(outDir, "cdsl-pilot.lift-ranges");
fs.writeFileSync(lexiconPath, lexicon, "utf8");
fs.writeFileSync(rangesPath, ranges, "utf8");

console.log(
  `Merged ${entries.length} LIFT entries → ${path.relative(root, lexiconPath)}`
);
console.log(
  `Ranges: grammatical-info=${grammaticalInfo.size} lexical-relation=${relationTypes.size} note-type=${noteTypes.size} → ${path.relative(root, rangesPath)}`
);
