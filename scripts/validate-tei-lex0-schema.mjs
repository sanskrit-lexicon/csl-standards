// Validate the generated TEI Lex-0 entries (data/pilot/tei-lex0/*.lex0.xml)
// against the OFFICIAL DARIAH TEI Lex-0 schema, pinned at v0.9.4
// (data/schema/TEILex0-v0.9.4.rng, see its .PROVENANCE.md).
//
// Distinct from scripts/validate-tei-lex0.mjs, which checks the project's
// structural baseline shape; this script applies the upstream grammar itself
// via xmllint --relaxng (libxml2, preinstalled on macOS and ubuntu-latest CI
// runners — no Java toolchain needed, unlike the ODD-compile path in
// validate-external-profiles).
//
// Report: data/pilot/tei-lex0-schema-review.json — totals + per-file errors.
// Exits 1 when any file fails: failures are generator defects by contract
// (fix scripts/export-tei-lex0.mjs, never the outputs).
//
// Known limitation: the pinned RNG embeds ISO Schematron <pattern> blocks that
// xmllint does not execute; the RelaxNG grammar is fully applied. This is
// recorded in the report as schematronChecked: false (never a silent skip).
//
// Usage: npm run validate-tei-lex0-schema

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { generatedAt } from "./lib/provenance.mjs";

const root = process.cwd();
const dir = path.join(root, "data", "pilot", "tei-lex0");
const RNG = path.join(root, "data", "schema", "TEILex0-v0.9.4.rng");
const REPORT = path.join(dir, "..", "tei-lex0-schema-review.json");
const SCHEMA_VERSION = "TEI Lex-0 v0.9.4 (DARIAH-ERIC/lexicalresources)";

function sha256(file) {
  return createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function main() {
  if (!fs.existsSync(RNG)) {
    console.error(`pinned schema missing: ${path.relative(root, RNG)}`);
    process.exit(1);
  }
  if (!fs.existsSync(dir)) {
    console.error(`${path.relative(root, dir)}: missing; run "npm run export-tei-lex0" first.`);
    process.exit(1);
  }
  const xmllint = spawnSync("which", ["xmllint"], { encoding: "utf8" });
  if (xmllint.status !== 0) {
    // Fail loudly — a skipped check in CI would fake a green build.
    console.error("xmllint not found on PATH; install libxml2 (brew install libxml2 / apt-get install libxml2-utils).");
    process.exit(1);
  }

  // Every pilot file: the generated entries (*.lex0.xml) plus the hand-authored
  // exemplar (*.lex0.tei.xml) — both must satisfy the official grammar.
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith(".lex0.xml") || f.endsWith(".lex0.tei.xml"))
    .sort();
  const cases = [];
  let failed = 0;

  for (const file of files) {
    const rel = path.relative(root, path.join(dir, file));
    const run = spawnSync("xmllint", ["--noout", "--relaxng", RNG, path.join(dir, file)], {
      cwd: root, encoding: "utf8", maxBuffer: 1024 * 1024 * 16
    });
    const ok = run.status === 0;
    const errors = ok ? [] : String(run.stderr || "").split("\n").map(l => l.trim()).filter(Boolean);
    if (!ok) failed += 1;
    cases.push({ file, ok, errors });
  }

  fs.writeFileSync(REPORT, `${JSON.stringify({
    schemaVersion: "1.0.0",
    license: "CC-BY-SA-4.0",
    generatedAt: generatedAt(),
    generatedBy: "npm run validate-tei-lex0-schema",
    schema: SCHEMA_VERSION,
    schemaSource: "https://github.com/DARIAH-ERIC/lexicalresources/blob/v0.9.4/Schemas/TEILex0/out/TEILex0.rng",
    schemaSha256: sha256(RNG),
    schematronChecked: false,
    note: "Official TEI Lex-0 RNG validation via xmllint --relaxng. Embedded Schematron rules are not executed by libxml2 (documented limitation). Failures are generator defects: fix scripts/export-tei-lex0.mjs, not the outputs.",
    total: cases.length,
    passed: cases.length - failed,
    failed,
    cases
  }, null, 2)}\n`);

  for (const c of cases) if (!c.ok) for (const e of c.errors) console.error(e);
  console.log(`TEI Lex-0 schema (${SCHEMA_VERSION}): ${cases.length - failed}/${cases.length} entries valid. Report: ${path.relative(root, REPORT)}`);
  if (failed) process.exit(1);
}

main();
