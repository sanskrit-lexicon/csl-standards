// Validate the full-MW export (H7105): per-chunk official TEI Lex-0 RNG result
// + OntoLex profile checks over every exported document. Exits on the first
// failing case (the build already stops on the first invalid chunk; this is the
// independent post-run gate).
//
// Usage: node scripts/validate-full-mw.mjs --build /tmp/csl-full-mw

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  const arg = process.argv[i];
  if (!arg.startsWith("--")) continue;
  const key = arg.slice(2);
  const next = process.argv[i + 1];
  if (next && !next.startsWith("--")) { args.set(key, next); i += 1; }
  else args.set(key, "true");
}
const buildDir = path.resolve(args.get("build") || path.join("data", "full-mw", "build"));
const manifest = JSON.parse(fs.readFileSync(path.join(buildDir, "manifest.json"), "utf8"));
const reportFile = path.join(buildDir, "validation-report.json");

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function checkOntolex(doc) {
  const errors = [];
  const graph = doc["@graph"] || [];
  const context = doc["@context"] || {};
  for (const p of ["ontolex", "lexicog", "frac", "prov", "dct", "rdf", "rdfs", "skos", "csl"]) {
    if (!context[p]) errors.push(`missing ${p} context`);
  }
  const entry = graph.find(n => n["@type"] === "ontolex:LexicalEntry" || (Array.isArray(n["@type"]) && n["@type"].includes("ontolex:LexicalEntry")));
  if (!entry) return [...errors, "missing ontolex:LexicalEntry"];
  if (!entry["ontolex:canonicalForm"]?.["@id"]) errors.push("missing canonical form link");
  if (entry["csl:profileVersion"] !== "ontolex-frac-profile-v0.1") errors.push("profile version mismatch");
  const form = graph.find(n => n["@id"] === entry["ontolex:canonicalForm"]?.["@id"]);
  if (!form) errors.push("canonical form node missing");
  const records = graph.filter(n => n["@type"] === "csl:SourceRecord");
  const mw = records.find(n => n["csl:dictionary"] === "mw");
  if (!mw) errors.push("missing mw source record");
  if (!mw?.["csl:rawSha256"] && !mw?.["rdf:value"]) errors.push("mw source record lacks raw value/hash");
  for (const sense of graph.filter(n => n["@type"] === "ontolex:LexicalSense")) {
    const defs = [].concat(sense["skos:definition"] || []).filter(d => d?.["@value"]);
    if (!defs.length) errors.push(`sense ${sense["@id"]} lacks skos:definition`);
    if (!sense["csl:sourceDictionary"]) errors.push(`sense ${sense["@id"]} lacks csl:sourceDictionary`);
    if (!sense["ontolex:isSenseOf"]?.["@id"]) errors.push(`sense ${sense["@id"]} lacks ontolex:isSenseOf`);
  }
  const senseIds = new Set(graph.filter(n => n["@type"] === "ontolex:LexicalSense").map(n => n["@id"]));
  for (const att of graph.filter(n => n["@type"] === "frac:Attestation")) {
    if (!att["frac:attests"]?.["@id"]) errors.push(`attestation ${att["@id"]} lacks attests`);
    if (![entry["@id"], ...senseIds].includes(att["frac:attests"]?.["@id"])) errors.push(`attestation ${att["@id"]} attests neither entry nor sense`);
    if (!att["prov:wasDerivedFrom"]?.["@id"]) errors.push(`attestation ${att["@id"]} lacks provenance`);
    if (!att["csl:evidenceClass"]) errors.push(`attestation ${att["@id"]} lacks evidenceClass`);
  }
  return errors;
}

let teiChunks = 0, teiEntries = 0, ontolexEntries = 0, ontolexChunks = 0;
const failures = [];
for (const chunk of manifest.chunks) {
  const teiFile = path.join(buildDir, chunk.tei.file);
  const ontoFile = path.join(buildDir, chunk.ontolex.file);
  const tei = fs.readFileSync(teiFile);
  if (sha256(tei) !== chunk.tei.sha256) failures.push(`${chunk.chunkId}: TEI sha256 mismatch`);
  if (!chunk.teiValidation?.ok) failures.push(`${chunk.chunkId}: TEI RNG not green (${JSON.stringify(chunk.teiValidation)})`);
  const onto = fs.readFileSync(ontoFile, "utf8");
  if (sha256(onto) !== chunk.ontolex.sha256) failures.push(`${chunk.chunkId}: OntoLex sha256 mismatch`);
  const docs = JSON.parse(onto);
  if (docs.length !== chunk.entries) failures.push(`${chunk.chunkId}: ${docs.length} OntoLex docs != ${chunk.entries} entries`);
  for (const doc of docs) {
    const errors = checkOntolex(doc);
    if (errors.length) { failures.push(`${chunk.chunkId} ${doc["@id"]}: ${errors.slice(0, 3).join("; ")}`); break; }
  }
  teiChunks += 1;
  teiEntries += chunk.entries;
  ontolexChunks += 1;
  ontolexEntries += docs.length;
  if (failures.length) break;
}

const report = {
  generatedAt: new Date().toISOString(),
  generator: "scripts/validate-full-mw.mjs",
  sourceManifest: path.basename(path.join(buildDir, "manifest.json")),
  schema: {
    "tei-lex0": "TEI Lex-0 v0.9.4 (DARIAH-ERIC/lexicalresources)",
    validator: "xmllint --relaxng or lxml RelaxNG (per-chunk result recorded by the build)",
    ontolex: "ontolex-frac-profile-v0.1 (full-MW adaptation: MW-only source record; raw hash instead of duplicated raw text)"
  },
  totals: {
    chunks: manifest.chunks.length,
    teiChunks,
    ontolexChunks,
    teiEntries,
    ontolexEntries,
    failures: failures.length
  },
  failures,
  verdict: failures.length ? "FAIL" : "PASS"
};
fs.writeFileSync(reportFile, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Full-MW validation: TEI ${teiChunks}/${manifest.chunks.length} chunks, ${teiEntries} entries; OntoLex ${ontolexEntries} entries; ${failures.length} failure(s). Report: ${reportFile}`);
if (failures.length) process.exit(1);
