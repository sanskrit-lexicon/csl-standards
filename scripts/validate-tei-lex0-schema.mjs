// Validate the generated TEI Lex-0 entries (data/pilot/tei-lex0/*.lex0.xml)
// against the official TEI Lex-0 schema (bcdh/tei-lex-0), pinned at v0.9.5
// (data/schema/TEILex0-v0.9.5.rng, see its .PROVENANCE.md).
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
const RNG = path.join(root, "data", "schema", "TEILex0-v0.9.5.rng");
const REPORT = path.join(dir, "..", "tei-lex0-schema-review.json");
const SCHEMA_VERSION = "TEI Lex-0 v0.9.5 (bcdh/tei-lex-0)";

// H6196 witness ruling (A70 note §7): the seven SKD entries whose Dhātupāṭha
// commentary witness keeps <bibl> inside <note type="commentary"> — a shape the
// official v0.9.5 RNG rejects (note content admits no <bibl>; upstream
// bcdh/tei-lex-0 issue #300). Per §7's rule the rejections are recorded
// verbatim, never conformed away: they strengthen G4's proposal. Each file
// must STILL fail, and fail with exactly the bibl-in-note rejection — a pass
// or a different rejection is a broken witness, not a green build.
const EXPECTED_WITNESS_REJECTIONS = new Map([
  "skd-BarBa.lex0.xml",
  "skd-Baza.lex0.xml",
  "skd-DrAGa.lex0.xml",
  "skd-GiRa.lex0.xml",
  "skd-garjja.lex0.xml",
  "skd-sarjja.lex0.xml",
  "skd-stamBa.lex0.xml",
].map(f => [f, "note has extra content: bibl"]));

// Negative control (H6196): a document in the generator's own shape, minus the
// now-required entry/@type, MUST be rejected by the pinned RNG. A run where it
// validates is a broken pin, not a success. Header mirrors a real export
// (skd-apa.lex0.xml) so the ONLY violation is the dropped @type.
const NEGATIVE_CONTROL = `<?xml version="1.0" encoding="UTF-8"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0" xml:id="csl-lex0-negative-control" type="lex-0">
  <teiHeader>
    <fileDesc>
      <titleStmt>
        <title>CDSL TEI Lex-0 entry: negative control</title>
        <respStmt xml:id="source"><resp>headword, grammar, and citations as printed</resp><name>CDSL source dictionary</name></respStmt>
        <respStmt xml:id="machine"><resp>derived classification and gloss extraction</resp><name>scripts/export-tei-lex0.mjs</name></respStmt>
      </titleStmt>
      <publicationStmt>
        <publisher>CSL Standards</publisher>
        <availability><licence target="https://creativecommons.org/licenses/by-sa/4.0/">CC-BY-SA-4.0</licence></availability>
      </publicationStmt>
      <sourceDesc>
        <listBibl type="dictionaries">
          <head>Derived from CDSL source records for the TEI Lex-0 baseline pilot.</head>
          <bibl type="named-source" subtype="evidence" source="#dict-skd" cert="high"><abbr>SKD</abbr></bibl>
        </listBibl>
      </sourceDesc>
    </fileDesc>
    <encodingDesc>
      <projectDesc><p>H6196 negative control: deliberately nonconforming (entry without @type).</p></projectDesc>
    </encodingDesc>
    <profileDesc>
      <langUsage>
        <language ident="sa" role="sourceLanguage">Sanskrit (lemmata, citations, authorities)</language>
        <language ident="en" role="targetLanguage">English (definitions and editorial notes)</language>
      </langUsage>
    </profileDesc>
  </teiHeader>
  <text>
    <body>
      <entry xml:id="nc-entry" xml:lang="sa">
        <form type="lemma">
          <orth notation="SLP1" xml:lang="sa-Latn-x-SLP1" cert="high" resp="#source">apa</orth>
        </form>
        <gramGrp>
          <gram type="pos" norm="indeclinable" cert="high" resp="#machine">indeclinable</gram>
        </gramGrp>
      </entry>
    </body>
  </text>
</TEI>
`;

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
    const expectedWitness = EXPECTED_WITNESS_REJECTIONS.get(file);
    if (!ok && !expectedWitness) failed += 1;
    cases.push({
      file, ok,
      ...(expectedWitness ? { expectedWitnessRejection: true } : {}),
      errors
    });
  }

  // Witness verdicts are part of the gate: a witness that passes (or fails with
  // any other error than its recorded rejection line) breaks the ruling.
  const witnessCases = [];
  for (const [file, verdictLine] of EXPECTED_WITNESS_REJECTIONS) {
    const c = cases.find(k => k.file === file);
    if (!c) {
      console.error(`witness ${file}: missing from the pilot corpus — the G4 witness set is broken`);
      process.exit(1);
    }
    const held = !c.ok && c.errors.some(e => e.includes(verdictLine));
    if (!held) {
      console.error(`witness ${file}: expected rejection "${verdictLine}" did not hold — re-record the §7 ruling (H6196)`);
      process.exit(1);
    }
    witnessCases.push({ file, verdictLine, observed: c.errors.filter(e => e.includes(verdictLine)) });
  }

  // Negative control: the pinned RNG must reject the deliberately broken shape.
  const ncFile = path.join(root, "data", "pilot", "tei-lex0-negative-control.tmp.xml");
  fs.writeFileSync(ncFile, NEGATIVE_CONTROL);
  let negativeControl;
  try {
    const nc = spawnSync("xmllint", ["--noout", "--relaxng", RNG, ncFile], {
      cwd: root, encoding: "utf8", maxBuffer: 1024 * 1024 * 16
    });
    if (nc.status === 0) {
      console.error("negative control PASSED the pinned RNG — the pin is broken, refusing to report success");
      process.exit(1);
    }
    negativeControl = {
      rejected: true,
      error: String(nc.stderr || "").split("\n").map(l => l.trim()).filter(Boolean)[0] || "rejected"
    };
  } finally {
    fs.unlinkSync(ncFile);
  }

  fs.writeFileSync(REPORT, `${JSON.stringify({
    schemaVersion: "1.0.0",
    license: "CC-BY-SA-4.0",
    generatedAt: generatedAt(),
    generatedBy: "npm run validate-tei-lex0-schema",
    schema: SCHEMA_VERSION,
    schemaSource: "https://lex-0.org/schema/lex-0.rng (bcdh/tei-lex-0 tag v0.9.5)",
    schemaSha256: sha256(RNG),
    schematronChecked: false,
    note: "Official TEI Lex-0 RNG validation via xmllint --relaxng. Embedded Schematron rules are not executed by libxml2 (documented limitation). Failures are generator defects: fix scripts/export-tei-lex0.mjs, not the outputs. The seven G4 commentary witnesses are expected rejections under the H6196 §7 ruling (recorded verbatim, never conformed away); the negative control must keep failing (a pin that passes it is broken).",
    total: cases.length,
    passed: cases.filter(c => c.ok).length,
    failed,
    witnessRejections: witnessCases,
    witnessRejections: witnessCases,
    negativeControl,
    cases
  }, null, 2)}\n`);

  for (const c of cases) if (!c.ok && !EXPECTED_WITNESS_REJECTIONS.has(c.file)) for (const e of c.errors) console.error(e);
  console.log(`TEI Lex-0 schema (${SCHEMA_VERSION}): ${cases.filter(c => c.ok).length}/${cases.length} entries valid; ${witnessCases.length} G4 witnesses rejected as recorded (§7 ruling, H6196); negative control rejected — pin live. Report: ${path.relative(root, REPORT)}`);
  if (failed) process.exit(1);
}

main();
