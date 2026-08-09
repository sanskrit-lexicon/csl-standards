import fs from "node:fs";
import path from "node:path";

// Machine proxy for the Lexique Pro real-consumer display contract
// (H722 smoke + H1499 join + H2087 hedge residual). Does **not** launch
// Lexique Pro — it asserts the emit shape that makes multi-ref / multi-
// component data visible under Lexique's known "one same-label field per
// entry" display rule. Schema-green alone is never enough (FINDINGS export
// class; skill /export-consumer-smoke).

const root = process.cwd();
const mdfDir = path.join(root, "data", "pilot", "mdf");
const modelCount = JSON.parse(fs.readFileSync(path.join(root, "data", "pilot", "neutral-model.json"), "utf8")).length;
const errors = [];
const notes = [];

function check(condition, message) {
  if (!condition) errors.push(message);
}

function parseFields(text) {
  const fields = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const m = line.match(/^\\(\w+)(?:\s+(.*))?$/);
    if (!m) continue;
    fields.push({ marker: m[1], value: (m[2] || "").trim() });
  }
  return fields;
}

function byMarker(fields, marker) {
  return fields.filter(f => f.marker === marker);
}

check(fs.existsSync(mdfDir), `missing MDF pilot dir: ${mdfDir}`);
const files = fs.existsSync(mdfDir)
  ? fs.readdirSync(mdfDir).filter(f => f.endsWith(".mdf")).sort()
  : [];
check(files.length === modelCount, `expected ${modelCount} pilot .mdf files (neutral-model.json count), found ${files.length}`);

let multiBb = 0;
let multiLf = 0;
let joinedBb = 0;
let joinedLe = 0;
let esCount = 0;
let hedgeTokenCount = 0;

for (const file of files) {
  const text = fs.readFileSync(path.join(mdfDir, file), "utf8");
  const fields = parseFields(text);
  const bbs = byMarker(fields, "bb");
  const lfs = byMarker(fields, "lf").filter(f => f.value === "Compound");
  const les = byMarker(fields, "le");
  const es = byMarker(fields, "es");

  if (bbs.length > 1) multiBb += 1;
  if (lfs.length > 1) multiLf += 1;
  if (bbs.some(f => f.value.includes("; "))) joinedBb += 1;
  if (les.some(f => f.value.includes(" + "))) joinedLe += 1;
  if (es.length) esCount += 1;
  if (bbs.some(f => f.value === "L." || f.value.startsWith("L.; "))) hedgeTokenCount += 1;

  check(bbs.length <= 1, `${file}: consumer-display requires ≤1 \\bb (found ${bbs.length})`);
  check(lfs.length <= 1, `${file}: consumer-display requires ≤1 \\lf Compound (found ${lfs.length})`);
  if (lfs.length === 1) {
    check(les.length === 1, `${file}: \\lf Compound must have exactly one joined \\le`);
  }
}

// Pilot fixtures named by H722/H1499/H2087 as the multi-ref / multi-component cases.
const apPath = path.join(mdfDir, "mw-pwg-pwk-Ap.mdf");
const diraPath = path.join(mdfDir, "mw-pwg-pwk-DIratA.mdf");
const dihPath = path.join(mdfDir, "mw-pwg-pwk-dih.mdf");

if (fs.existsSync(apPath)) {
  const ap = parseFields(fs.readFileSync(apPath, "utf8"));
  const bb = byMarker(ap, "bb");
  check(bb.length === 1, "Ap fixture: expected exactly one \\bb line");
  check(
    bb[0]?.value.includes("AV. ix, 5, 22") && bb[0]?.value.includes("Kathās.") && bb[0]?.value.includes("; "),
    "Ap fixture: joined \\bb must keep all multi-ref values on the single visible line"
  );
  notes.push(`Ap \\bb = ${bb[0]?.value}`);
} else {
  errors.push("missing Ap pilot fixture mw-pwg-pwk-Ap.mdf");
}

if (fs.existsSync(diraPath)) {
  const dira = parseFields(fs.readFileSync(diraPath, "utf8"));
  const lf = byMarker(dira, "lf");
  const le = byMarker(dira, "le");
  check(lf.length === 1 && lf[0]?.value === "Compound", "DIratA fixture: expected one \\lf Compound");
  check(le.length === 1 && le[0]?.value === "DIra + tA", "DIratA fixture: expected joined \\le DIra + tA");
  notes.push(`DIratA \\le = ${le[0]?.value}`);
} else {
  errors.push("missing DIratA pilot fixture mw-pwg-pwk-DIratA.mdf");
}

if (fs.existsSync(dihPath)) {
  const dih = parseFields(fs.readFileSync(dihPath, "utf8"));
  const bb = byMarker(dih, "bb");
  check(bb.length === 1, "dih fixture (hedge+named): expected exactly one \\bb line after H2087");
  check(
    bb[0]?.value.startsWith("L.; ") && bb[0]?.value.includes("Dhātup."),
    "dih fixture: L. hedge must lead a single joined \\bb so named refs stay Lexique-visible"
  );
  notes.push(`dih \\bb = ${bb[0]?.value}`);
} else {
  errors.push("missing dih pilot fixture mw-pwg-pwk-dih.mdf");
}

// Residual: \\es is still emitted (correct MDF) but display-dead in Lexique Pro.
// Do not "fix" by dropping the field — document only.
check(esCount >= 1, "expected some pilot records to still emit \\es (residual consumer no-render, not an emit drop)");
notes.push(`residual \\es still emitted on ${esCount}/${modelCount} records (Lexique display-dead; keep emitting)`);
notes.push(`census: multiBb=${multiBb} multiLf=${multiLf} joinedBb=${joinedBb} joinedLe=${joinedLe} hedgeToken=${hedgeTokenCount}`);

if (errors.length) {
  console.error(`MDF consumer-display smoke FAILED (${errors.length}):`);
  for (const e of errors) console.error(`- ${e}`);
  process.exit(1);
}

console.log("MDF consumer-display smoke PASSED (Lexique one-field-per-label contract on emit shape).");
for (const n of notes) console.log(`- ${n}`);
