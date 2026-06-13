// Validate the generated TEI Lex-0 entries (data/pilot/tei-lex0/*.lex0.xml).
//
// This is a structural validator for the Lex-0 baseline shape, parallel to
// scripts/validate-tei-profile.mjs (which validates the *archival* profile and
// does NOT apply here). It checks well-formedness plus the Lex-0 element model:
// a lemma form/orth, a gramGrp or sense, no archival <cit type="source-entry">,
// @cert presence on the lemma orth, and the profile-version note. Full TEI
// Lex-0 RNG validation (jing/teitorelaxng against the DARIAH schema) is the
// remaining external step — see docs/TEI_LEX0_PILOT.md sec. 6.
//
// Usage: npm run validate-tei-lex0

import fs from "node:fs";
import path from "node:path";
import { generatedAt } from "./lib/provenance.mjs";

const root = process.cwd();
const dir = path.join(root, "data", "pilot", "tei-lex0");
const REPORT = path.join(dir, "..", "tei-lex0-review.json");
const PROFILE_VERSION = "tei-lex0-pilot-v0.1";

function wellFormed(xml, file, errors) {
  const stack = [];
  const tagRe = /<\/?([A-Za-z_][\w:.-]*)(?:\s[^<>]*)?(\/?)>/g;
  let m;
  while ((m = tagRe.exec(xml))) {
    const full = m[0];
    const name = m[1];
    if (full.startsWith("<?") || full.startsWith("<!")) continue;
    if (full.endsWith("/>")) continue;
    if (full.startsWith("</")) {
      const open = stack.pop();
      if (open !== name) { errors.push(`${file}: </${name}> does not match <${open || "none"}>`); return false; }
    } else {
      stack.push(name);
    }
  }
  if (stack.length) { errors.push(`${file}: unclosed <${stack[stack.length - 1]}>`); return false; }
  return true;
}

function main() {
  if (!fs.existsSync(dir)) {
    console.error(`${path.relative(root, dir)}: missing; run "npm run export-tei-lex0" first.`);
    process.exit(1);
  }
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".lex0.xml")).sort();
  const cases = [];
  let failed = 0;

  for (const file of files) {
    const rel = path.relative(root, path.join(dir, file));
    const xml = fs.readFileSync(path.join(dir, file), "utf8");
    const errors = [];
    wellFormed(xml, rel, errors);

    const check = (cond, msg) => { if (!cond) errors.push(`${rel}: ${msg}`); };
    check(xml.includes('xmlns="http://www.tei-c.org/ns/1.0"'), "missing TEI namespace");
    check(/<entry\b[^>]*xml:id=/.test(xml), "entry lacks xml:id");
    check(/<form type="lemma">[\s\S]*?<orth\b[^>]*notation="SLP1"/.test(xml), "missing lemma form/orth (SLP1)");
    check(/<orth\b[^>]*\bcert="/.test(xml), "lemma orth lacks @cert (evidence binding)");
    check(/<sense\b/.test(xml) || /<gramGrp>/.test(xml), "entry has neither sense nor gramGrp");
    check(!xml.includes('type="source-entry"'), "contains archival source-entry cit (not Lex-0 baseline)");
    check(xml.includes(`<note type="profile-version">${PROFILE_VERSION}</note>`), "missing/incorrect profile-version note");

    if (errors.length) failed += 1;
    cases.push({ file, ok: errors.length === 0, errors });
  }

  fs.writeFileSync(REPORT, `${JSON.stringify({
    schemaVersion: "1.0.0",
    license: "CC-BY-SA-4.0",
    generatedAt: generatedAt(),
    generatedBy: "npm run validate-tei-lex0",
    profileVersion: PROFILE_VERSION,
    note: "Structural Lex-0 baseline checks; full TEI Lex-0 RNG validation is external (see docs/TEI_LEX0_PILOT.md sec. 6).",
    total: cases.length,
    passed: cases.length - failed,
    failed,
    cases
  }, null, 2)}\n`);

  for (const c of cases) if (!c.ok) for (const e of c.errors) console.error(e);
  console.log(`TEI Lex-0: ${cases.length - failed}/${cases.length} entries pass structural baseline checks. Report: ${path.relative(root, REPORT)}`);
  if (failed) process.exit(1);
}

main();
