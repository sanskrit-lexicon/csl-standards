import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

// Machine proxy for the FLEx / Lexique Pro LIFT consumer contract
// (H2811 /export-consumer-smoke). Does **not** launch FLEx or Lexique —
// it asserts the emit + import shape that makes multi-ref bibliography
// visible under the same one-same-label-field-per-entry rule H722
// measured on MDF, and that the fragments merge into one importable
// lexicon + .lift-ranges sidecar. Schema-green alone is never enough.

const root = process.cwd();
const fragmentDir = path.join(root, "data", "pilot", "lift");
const lexiconDir = path.join(root, "data", "pilot", "lift-lexicon");
const modelCount = JSON.parse(
  fs.readFileSync(path.join(root, "data", "pilot", "neutral-model.json"), "utf8")
).length;
const errors = [];
const notes = [];

function check(condition, message) {
  if (!condition) errors.push(message);
}

function sourceNotes(text) {
  return [...text.matchAll(/<note type="source">\s*<form[^>]*>\s*<text>([^<]*)<\/text>/g)].map(
    (m) => m[1]
  );
}

check(fs.existsSync(fragmentDir), `missing LIFT fragment dir: ${fragmentDir}`);
const files = fs.existsSync(fragmentDir)
  ? fs.readdirSync(fragmentDir).filter((f) => f.endsWith(".lift")).sort()
  : [];
check(
  files.length === modelCount,
  `expected ${modelCount} pilot .lift files (neutral-model.json count), found ${files.length}`
);

let multiSource = 0;
let joinedSource = 0;
let hedgeToken = 0;
let etymSrc = 0;
let multiCompound = 0;

for (const file of files) {
  const text = fs.readFileSync(path.join(fragmentDir, file), "utf8");
  const sources = sourceNotes(text);
  if (sources.length > 1) multiSource += 1;
  if (sources.some((v) => v.includes("; "))) joinedSource += 1;
  if (sources.some((v) => v === "L." || v.startsWith("L.; "))) hedgeToken += 1;
  if (/<etymology[^>]*\ssource=/.test(text)) etymSrc += 1;
  if ((text.match(/<relation type="Compound"/g) || []).length > 1) multiCompound += 1;
  check(
    sources.length <= 1,
    `${file}: consumer-display requires ≤1 <note type="source"> (found ${sources.length})`
  );
}

const apPath = path.join(fragmentDir, "mw-pwg-pwk-Ap.lift");
const diraPath = path.join(fragmentDir, "mw-pwg-pwk-DIratA.lift");
const dihPath = path.join(fragmentDir, "mw-pwg-pwk-dih.lift");
const viPath = path.join(fragmentDir, "mw-pwg-pwk-vi.lift");

if (fs.existsSync(apPath)) {
  const sources = sourceNotes(fs.readFileSync(apPath, "utf8"));
  check(sources.length === 1, "Ap fixture: expected exactly one <note type=\"source\">");
  check(
    sources[0]?.includes("AV. ix, 5, 22") &&
      sources[0]?.includes("Kathās.") &&
      sources[0]?.includes("; "),
    "Ap fixture: joined source note must keep all multi-ref values on the single visible note"
  );
  notes.push(`Ap source = ${sources[0]}`);
} else {
  errors.push("missing Ap pilot fixture mw-pwg-pwk-Ap.lift");
}

if (fs.existsSync(diraPath)) {
  const text = fs.readFileSync(diraPath, "utf8");
  const refs = [...text.matchAll(/<relation type="Compound" ref="([^"]+)"/g)].map((m) => m[1]);
  check(refs.includes("DIra") && refs.includes("tA"), "DIratA fixture: expected Compound refs DIra and tA");
  check(
    refs.length >= 2,
    "DIratA fixture: LIFT keeps multiple <relation type=\"Compound\"> (unlike stacked MDF \\lf)"
  );
  notes.push(`DIratA Compound refs = ${refs.join(", ")}`);
} else {
  errors.push("missing DIratA pilot fixture mw-pwg-pwk-DIratA.lift");
}

if (fs.existsSync(dihPath)) {
  const sources = sourceNotes(fs.readFileSync(dihPath, "utf8"));
  check(sources.length === 1, "dih fixture (hedge+named): expected exactly one source note after H2811");
  check(
    sources[0]?.startsWith("L.; ") && sources[0]?.includes("Dhātup."),
    "dih fixture: L. hedge must lead a single joined source note so named refs stay consumer-visible"
  );
  notes.push(`dih source = ${sources[0]}`);
} else {
  errors.push("missing dih pilot fixture mw-pwg-pwk-dih.lift");
}

if (fs.existsSync(viPath)) {
  const text = fs.readFileSync(viPath, "utf8");
  check(
    /<etymology type="proto" source="Lat.">/.test(text),
    "vi fixture: expected <etymology source=\"Lat.\"> (LIFT analogue of MDF \\es; keep emitting)"
  );
  notes.push("vi etymology source=Lat. still emitted (Lexique display-dead analogue of \\es; keep)");
} else {
  errors.push("missing vi pilot fixture mw-pwg-pwk-vi.lift");
}

check(etymSrc >= 1, "expected some pilot records to still emit <etymology source=…> (residual consumer no-render, not an emit drop)");
notes.push(`residual etymology@source still emitted on ${etymSrc}/${modelCount} records`);
notes.push(
  `census: multiSource=${multiSource} joinedSource=${joinedSource} hedgeToken=${hedgeToken} multiCompound=${multiCompound}`
);

const merge = spawnSync(process.execPath, [path.join("scripts", "merge-lift-lexicon.mjs")], {
  cwd: root,
  encoding: "utf8",
});
if (merge.status !== 0) {
  errors.push(`merge-lift-lexicon exited ${merge.status}: ${(merge.stderr || merge.stdout || "").trim()}`);
} else {
  notes.push((merge.stdout || "").trim().split("\n").join(" | "));
}

const lexiconPath = path.join(lexiconDir, "cdsl-pilot.lift");
const rangesPath = path.join(lexiconDir, "cdsl-pilot.lift-ranges");
if (fs.existsSync(lexiconPath)) {
  const buf = fs.readFileSync(lexiconPath);
  check(!(buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf), "merged lexicon must be UTF-8 without BOM");
  const text = buf.toString("utf8");
  check(text.startsWith("<?xml"), "merged lexicon must start with an XML declaration");
  check(/<lift version="0\.13"/.test(text), "merged lexicon must be LIFT 0.13");
  const entryCount = (text.match(/<entry\b/g) || []).length;
  check(entryCount === modelCount, `merged lexicon expected ${modelCount} <entry>, found ${entryCount}`);
  check((text.match(/<lift\b/g) || []).length === 1, "merged lexicon must have exactly one <lift> root");
} else {
  errors.push(`missing merged lexicon ${lexiconPath}`);
}

if (fs.existsSync(rangesPath)) {
  const ranges = fs.readFileSync(rangesPath, "utf8");
  check(/<range id="grammatical-info">/.test(ranges), "lift-ranges missing grammatical-info");
  check(/<range id="lexical-relation">/.test(ranges), "lift-ranges missing lexical-relation");
  check(/<range id="note-type">/.test(ranges), "lift-ranges missing note-type");
  check(/<range-element id="Compound">/.test(ranges), "lift-ranges lexical-relation missing Compound");
  check(/<range-element id="cf">/.test(ranges), "lift-ranges lexical-relation missing cf");
  check(/<range-element id="source">/.test(ranges), "lift-ranges note-type missing source");
} else {
  errors.push(`missing lift-ranges sidecar ${rangesPath}`);
}

if (errors.length) {
  console.error(`LIFT consumer-display smoke FAILED (${errors.length}):`);
  for (const e of errors) console.error(`- ${e}`);
  process.exit(1);
}

console.log("LIFT consumer-display smoke PASSED (one-source-note + importable merged lexicon).");
for (const n of notes) console.log(`- ${n}`);
