// Full Monier-Williams TEI Lex-0 + OntoLex export (H7105).
//
// Extends the 250-case pilot (scripts/export-tei-lex0.mjs,
// scripts/export-ontolex.mjs) from data/pilot/neutral-model.json to the complete
// csl-orig v02/mw/mw.txt (286 560 records). The pool pipeline is chunked and
// resumable: each chunk is a self-contained TEI Lex-0 document and an OntoLex
// JSON-LD/Turtle chunk, validated before the next chunk starts. The first invalid
// chunk stops the run (generator defects are fixed, outputs are never patched).
//
// Design decisions (recorded in data/full-mw/manifest.json):
//   * deterministic source order, chunks bounded by --chunk-size;
//   * full MW only: no PWG/PWK join, no optional dictionaries, no RDF publication;
//   * OntoLex source records carry csl:rawSha256 + csl:rawLength instead of
//     duplicating the 48 MB raw corpus into every JSON-LD document;
//   * outputs live outside the repo by default (--out) because the full corpus is
//     hundreds of MB; only the manifest/reports are committed.
//
// Usage:
//   node scripts/build-full-mw.mjs --csl-orig ../csl-orig --out /tmp/csl-full-mw
//   node scripts/build-full-mw.mjs --max-entries 2000 --out /tmp/csl-smoke
//
// Environmental requirement: xmllint (libxml2) for the official RNG gate, or run
// scripts/validate-tei-lex0-full.py separately with lxml.

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { extractMwSenses } from "./lib/mw-senses.mjs";
import { extractLabeledSources } from "./lib/citations.mjs";
import { evidenceClass } from "./lib/evidence.mjs";
import { entryXml, safeCaseId, PROFILE_VERSION } from "./export-tei-lex0.mjs";
import { jsonldFor, turtleFor } from "./export-ontolex.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RNG = path.join(root, "data", "schema", "TEILex0-v0.9.4.rng");
const PROFILE = "tei-lex0-full-mw-v0.1";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  const arg = process.argv[i];
  if (!arg.startsWith("--")) continue;
  const key = arg.slice(2);
  const next = process.argv[i + 1];
  if (next && !next.startsWith("--")) { args.set(key, next); i += 1; }
  else args.set(key, "true");
}

const chunkSize = Math.max(1, Number.parseInt(args.get("chunk-size") || "500", 10));
const maxEntries = Math.max(0, Number.parseInt(args.get("max-entries") || "0", 10));
const stride = Math.max(1, Number.parseInt(args.get("stride") || "1", 10));
const outDir = path.resolve(args.get("out") || path.join(root, "data", "full-mw", "build"));
const cslOrig = path.resolve(args.get("csl-orig") || path.join(root, "..", "csl-orig"));
const sourcePath = path.basename(cslOrig).toLowerCase() === "v02"
  ? path.join(cslOrig, "mw", "mw.txt")
  : path.join(cslOrig, "v02", "mw", "mw.txt");

const teiDir = path.join(outDir, "tei-lex0");
const ontolexDir = path.join(outDir, "ontolex");
const stateDir = path.join(outDir, "chunks");
const progressFile = path.join(outDir, "progress.log");
const manifestFile = path.join(outDir, "manifest.json");
const lossFile = path.join(outDir, "loss-report.json");
const runFile = path.join(outDir, "run-report.json");

const startedAt = new Date();
const startedMs = Date.now();

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function pad(n, width = 5) {
  return String(n).padStart(width, "0");
}

function parseHeader(line) {
  const m = line.match(/^<L>([^<]*)<pc>([^<]*)<k1>([^<]*)<k2>([^<\n]*?)(?:<h>([^<]*))?(?:<e>([^<\n]*))?$/);
  if (!m) return { L: null, pc: null, k1: null, k2: null, h: null, e: null };
  return { L: m[1] || null, pc: m[2] || null, k1: m[3] || null, k2: m[4] || null, h: m[5] || null, e: m[6] || null };
}

function compactWord(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function grammarOf(raw) {
  const m = String(raw || "").match(/<ab>(cl\.|m\.|f\.|n\.|ind\.|adj\.)<\/ab>/);
  if (!m) return null;
  const code = m[1];
  return { "m.": "masculine", "f.": "feminine", "n.": "neuter", "ind.": "indeclinable", "adj.": "adjective" }[code] || code;
}

function phenomenaFor(raw, header) {
  const phenomena = [];
  if (/<ls\b[^>]*>L\.<\/ls>/.test(raw)) phenomena.push("hedge");
  if (/<info\b[^>]*verb="genuineroot"/.test(raw)) phenomena.push("root");
  if (header.e?.startsWith("3") || /[—–]/.test(header.k2 || "")) phenomena.push("compound");
  if (header.e?.startsWith("1A")) phenomena.push("continuation");
  if (/<hom>/.test(raw)) phenomena.push("homophone");
  return phenomena;
}

function modelFor(raw, header, lineNumber) {
  const phenomena = phenomenaFor(raw, header);
  const key = compactWord(header.k1 || header.k2) || `L${header.L}`;
  const id = `mw:L${header.L || lineNumber}`;
  const senses = extractMwSenses(raw, phenomena);
  const seen = new Set();
  const citations = [];
  for (const c of extractLabeledSources(raw, { max: 12 })) {
    if (seen.has(c.source)) continue;
    seen.add(c.source);
    citations.push({ source: c.source, type: c.type, dictionary: "mw", ...(c.inheritedFrom ? { inheritedFrom: c.inheritedFrom } : {}) });
  }
  const relations = [];
  const whitney = raw.match(/<info whitneyroots="([^"]+)"\/>/)?.[1];
  if (whitney) relations.push({ type: "whitney-root-association", target: whitney });
  if (phenomena.includes("compound")) {
    const parts = String(header.k2 || "").split(/[—–-]/).map(p => p.trim()).filter(Boolean);
    relations.push({ type: "lexical-decomposition", components: parts.length > 1 ? parts : [] });
  }
  if (phenomena.includes("continuation")) relations.push({ type: "adjacency-continuation-parent", eCode: header.e || "" });

  return {
    id,
    key,
    phenomena,
    fullMw: true,
    records: {
      mw: { L: header.L, line: lineNumber, pc: header.pc, raw }
    },
    forms: [{
      orth: key,
      type: phenomena.includes("root") ? "verbal-root" : phenomena.includes("compound") ? "compound" : phenomena.includes("continuation") ? "continuation" : "lemma",
      grammar: grammarOf(raw),
      ...(phenomena.includes("root") ? { verbClass: raw.match(/<info verb="genuineroot" cp="([^"]+)"\/>/)?.[1] || null } : {})
    }],
    senses,
    citations,
    relations,
    loss: []
  };
}

function chunkTeiDocument(models, chunkId) {
  // A chunk is one Lex-0 body: the repeated <entry> elements are admitted by
  // model.entryPart.top in the pinned v0.9.4 RNG.
  const headerPrefix = `<?xml version="1.0" encoding="UTF-8"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0" xml:id="${chunkId}" type="lex-0">
  <teiHeader>
    <fileDesc>
      <titleStmt>
        <title>CDSL TEI Lex-0 full Monier-Williams export: ${chunkId}</title>
        <respStmt xml:id="source"><resp>headword, grammar, and citations as printed</resp><name>CDSL Monier-Williams 1899</name></respStmt>
        <respStmt xml:id="machine"><resp>derived classification and gloss extraction</resp><name>scripts/build-full-mw.mjs</name></respStmt>
      </titleStmt>
      <publicationStmt>
        <publisher>CSL Standards</publisher>
        <availability><licence target="https://creativecommons.org/licenses/by-sa/4.0/">CC-BY-SA-4.0</licence></availability>
      </publicationStmt>
      <sourceDesc>
        <listBibl type="dictionaries">
          <head>Derived from csl-orig v02/mw/mw.txt for the full TEI Lex-0 export.</head>
          <bibl xml:id="dict-mw"><abbr>MW</abbr> <title>Monier-Williams Sanskrit-English Dictionary (1899)</title></bibl>
        </listBibl>
      </sourceDesc>
    </fileDesc>
    <encodingDesc>
      <projectDesc><p>${PROFILE}; DARIAH TEI Lex-0 baseline element model. Per-statement epistemic status is carried in @cert/@resp.</p></projectDesc>
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
`;
  const body = models.map(model => entryXml(model).split("\n").map(line => `      ${line}`).join("\n")).join("\n");
  return `${headerPrefix}${body}
    </body>
  </text>
</TEI>
`;
}

function validateOntolexDocument(doc, model) {
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
  if (entry["csl:caseId"] !== model.id) errors.push("case id mismatch");
  if (entry["csl:key"] !== model.key) errors.push("key mismatch");
  const form = graph.find(n => n["@id"] === entry["ontolex:canonicalForm"]?.["@id"]);
  if (!form) errors.push("canonical form node missing");
  const records = graph.filter(n => n["@type"] === "csl:SourceRecord");
  const mw = records.find(n => n["csl:dictionary"] === "mw");
  if (!mw) errors.push("missing mw source record");
  if (String(mw?.["csl:recordNumber"] || "") !== String(model.records.mw.L || "")) errors.push("mw record number mismatch");
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

async function countRecords(file) {
  const rl = readline.createInterface({ input: fs.createReadStream(file), crlfDelay: Infinity });
  let total = 0;
  for await (const line of rl) if (line.startsWith("<L>")) total += 1;
  return total;
}

async function readDoneState() {
  const done = new Map();
  if (!fs.existsSync(stateDir)) return done;
  for (const name of fs.readdirSync(stateDir)) {
    if (!name.endsWith(".done.json")) continue;
    try {
      const data = JSON.parse(fs.readFileSync(path.join(stateDir, name), "utf8"));
      done.set(data.chunkId, data);
    } catch {}
  }
  return done;
}

function validateTeiChunk(file) {
  const hasXmllint = spawnSync("sh", ["-c", "command -v xmllint"], { encoding: "utf8" }).status === 0;
  if (hasXmllint) {
    const run = spawnSync("xmllint", ["--noout", "--relaxng", RNG, file], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
    return { ok: run.status === 0, validator: "xmllint", errors: String(run.stderr || "").split("\n").filter(Boolean).slice(0, 20) };
  }
  const py = spawnSync("python3", [path.join(root, "scripts", "validate-tei-rng.py"), RNG, file], {
    encoding: "utf8", maxBuffer: 64 * 1024 * 1024, env: { ...process.env }
  });
  if (py.status === 0) return { ok: true, validator: "lxml" };
  if (py.status === 2) return { ok: true, skipped: true, reason: "no xmllint and no lxml; install one to gate TEI chunks" };
  return { ok: false, validator: "lxml", errors: String(py.stderr || "").split("\n").filter(Boolean).slice(0, 20) };
}

function aggregateLoss(doneState, totalRecords, exportedEntries) {
  const loss = {
    generatedAt: new Date().toISOString(),
    source: path.relative(root, sourcePath),
    totalRecords,
    exportedEntries,
    coverage: {
      percent: totalRecords ? Number(((exportedEntries / totalRecords) * 100).toFixed(3)) : 0,
      basis: "records exported / <L> records in csl-orig v02/mw/mw.txt"
    },
    targets: {
      "tei-lex0": { entries: 0, files: 0, entriesWithoutSense: 0 },
      ontolex: { entries: 0, files: 0, entriesWithoutAttestation: 0, rawValueOmitted: 0 }
    },
    phenomena: {},
    citations: { total: 0, hedge: 0, named: 0, byEvidenceClass: {} },
    senses: { total: 0, crossReference: 0 },
    notes: [
      "Full MW only: PWG/PWK and optional dictionaries are out of scope for H7105.",
      "OnteLex carries csl:rawSha256/csl:rawLength instead of duplicating the raw record; the raw corpus is the manifest-pinned csl-orig source.",
      "An MW entry with no extracted gloss is exported as a sense-status stub, not invented content.",
      "An entry with no cited source has zero FrAC attestations; this is an upstream absence, not a model gap."
    ]
  };
  const bump = (obj, key) => { obj[key] = (obj[key] || 0) + 1; };
  for (const data of doneState.values()) {
    if (data.firstL == null) continue;
    loss.targets["tei-lex0"].entries += data.entries;
    loss.targets["tei-lex0"].files += 1;
    loss.targets["tei-lex0"].entriesWithoutSense += data.withoutSense;
    loss.targets.ontolex.entries += data.entries;
    loss.targets.ontolex.files += 1;
    loss.targets.ontolex.entriesWithoutAttestation += data.withoutAttestation;
    loss.targets.ontolex.rawValueOmitted += data.entries;
    for (const [k, v] of Object.entries(data.phenomena || {})) loss.phenomena[k] = (loss.phenomena[k] || 0) + v;
    loss.citations.total += data.citations.total;
    loss.citations.hedge += data.citations.hedge;
    loss.citations.named += data.citations.named;
    for (const [k, v] of Object.entries(data.evidenceClasses || {})) {
      loss.citations.byEvidenceClass[k] = (loss.citations.byEvidenceClass[k] || 0) + v;
    }
    loss.senses.total += data.senses.total;
    loss.senses.crossReference += data.senses.crossReference;
  }
  return loss;
}

async function main() {
  if (!fs.existsSync(sourcePath)) throw new Error(`source missing: ${sourcePath}`);
  for (const dir of [outDir, teiDir, ontolexDir, stateDir]) await fsp.mkdir(dir, { recursive: true });
  if (!fs.existsSync(progressFile)) await fsp.writeFile(progressFile, "", "utf8");

  const totalRecords = await countRecords(sourcePath);
  const sourceHash = sha256(await fsp.readFile(sourcePath));
  const doneState = await readDoneState();
  const doneChunks = new Set(doneState.keys());
  let exported = [...doneState.values()].reduce((n, d) => n + d.entries, 0);
  let chunkNo = 0;
  let chunk = [];
  let chunkCounts = null;
  let processed = 0;
  let stopped = false;

  const flush = async () => {
    if (!chunk.length) return;
    chunkNo += 1;
    const chunkId = `chunk-${pad(chunkNo)}`;
    if (doneChunks.has(chunkId)) {
      chunk = [];
      chunkCounts = null;
      return;
    }
    const teiFile = path.join(teiDir, `${chunkId}.lex0.xml`);
    const ontoFile = path.join(ontolexDir, `${chunkId}.ontolex.json`);
    const ttlFile = path.join(ontolexDir, `${chunkId}.ttl`);
    const writeTtl = args.get("ttl") === "true";
    const tei = chunkTeiDocument(chunk, chunkId);
    const docs = chunk.map(model => jsonldFor(model, { mw: model.records.mw.raw }, false, { includeRaw: false }));
    for (let i = 0; i < docs.length; i += 1) {
      const errors = validateOntolexDocument(docs[i], chunk[i]);
      if (errors.length) throw new Error(`${chunkId} ontolex entry ${chunk[i].id}: ${errors.slice(0, 5).join("; ")}`);
    }
    await fsp.writeFile(teiFile, tei, "utf8");
    const ontoText = `${JSON.stringify(docs)}\n`;
    await fsp.writeFile(ontoFile, ontoText, "utf8");
    if (writeTtl) await fsp.writeFile(ttlFile, docs.map(doc => turtleFor(doc)).join("\n"), "utf8");
    const teiCheck = validateTeiChunk(teiFile);
    const counts = chunkCounts;
    const done = {
      chunkId,
      firstL: chunk[0].records.mw.L,
      lastL: chunk[chunk.length - 1].records.mw.L,
      entries: chunk.length,
      withoutSense: counts.withoutSense,
      withoutAttestation: counts.withoutAttestation,
      phenomena: counts.phenomena,
      citations: counts.citations,
      evidenceClasses: counts.evidenceClasses,
      senses: counts.senses,
      tei: { file: path.relative(outDir, teiFile), bytes: Buffer.byteLength(tei), sha256: sha256(tei) },
      ontolex: { file: path.relative(outDir, ontoFile), bytes: Buffer.byteLength(ontoText), sha256: sha256(ontoText) },
      ...(writeTtl ? { ttl: { file: path.relative(outDir, ttlFile), bytes: (await fsp.stat(ttlFile)).size } } : {}),
      teiValidation: teiCheck
    };
    await fsp.writeFile(path.join(stateDir, `${chunkId}.done.json`), `${JSON.stringify(done, null, 2)}\n`, "utf8");
    doneState.set(chunkId, done);
    exported += chunk.length;
    const line = `${new Date().toISOString()} ${chunkId} entries=${chunk.length} firstL=${done.firstL} lastL=${done.lastL} cumulative=${exported}${teiCheck.skipped ? " tei-gate=SKIPPED(no-validator)" : " tei-gate=" + (teiCheck.ok ? "PASS:" + teiCheck.validator : "FAIL")}\n`;
    await fsp.appendFile(progressFile, line, "utf8");
    process.stderr.write(line);
    if (!teiCheck.ok) {
      stopped = true;
      throw new Error(`${chunkId} TEI Lex-0 RNG failed: ${(teiCheck.errors || []).join(" | ")}`);
    }
    chunk = [];
    chunkCounts = null;
  };

  const rl = readline.createInterface({ input: fs.createReadStream(sourcePath), crlfDelay: Infinity });
  let current = null;
  let lineNo = 0;
  for await (const line of rl) {
    lineNo += 1;
    if (line.startsWith("<L>")) {
      if (current) {
        processed += 1;
        const take = stride === 1 || (processed - 1) % stride === 0;
        if (take && (!maxEntries || exported + chunk.length < maxEntries)) {
          const raw = current.lines.join("\n").trim();
          const header = parseHeader(current.lines[0] || "");
          const model = modelFor(raw, header, current.line);
          chunk.push(model);
          if (!chunkCounts) chunkCounts = { withoutSense: 0, withoutAttestation: 0, phenomena: {}, citations: { total: 0, hedge: 0, named: 0 }, evidenceClasses: {}, senses: { total: 0, crossReference: 0 } };
          if (!model.senses.length) chunkCounts.withoutSense += 1;
          if (!model.citations.length) chunkCounts.withoutAttestation += 1;
          for (const p of model.phenomena) chunkCounts.phenomena[p] = (chunkCounts.phenomena[p] || 0) + 1;
          for (const c of model.citations) {
            chunkCounts.citations.total += 1;
            if (c.type === "generic-lexicographer-hedge") chunkCounts.citations.hedge += 1;
            else chunkCounts.citations.named += 1;
            const cls = evidenceClass(c.source, c.type);
            chunkCounts.evidenceClasses[cls] = (chunkCounts.evidenceClasses[cls] || 0) + 1;
          }
          chunkCounts.senses.total += model.senses.length;
          chunkCounts.senses.crossReference += model.senses.filter(s => s.kind === "cross-reference").length;
          if (chunk.length >= chunkSize) await flush();
        }
        if (maxEntries && exported + chunk.length >= maxEntries) { stopped = true; rl.close(); break; }
      }
      current = { line: lineNo, lines: [line] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (!stopped && current) {
    processed += 1;
    const take = stride === 1 || (processed - 1) % stride === 0;
    if (take && (!maxEntries || exported + chunk.length < maxEntries)) {
      const raw = current.lines.join("\n").trim();
      const header = parseHeader(current.lines[0] || "");
      const model = modelFor(raw, header, current.line);
      chunk.push(model);
      if (!chunkCounts) chunkCounts = { withoutSense: 0, withoutAttestation: 0, phenomena: {}, citations: { total: 0, hedge: 0, named: 0 }, evidenceClasses: {}, senses: { total: 0, crossReference: 0 } };
      if (!model.senses.length) chunkCounts.withoutSense += 1;
      if (!model.citations.length) chunkCounts.withoutAttestation += 1;
      for (const p of model.phenomena) chunkCounts.phenomena[p] = (chunkCounts.phenomena[p] || 0) + 1;
      for (const c of model.citations) {
        chunkCounts.citations.total += 1;
        if (c.type === "generic-lexicographer-hedge") chunkCounts.citations.hedge += 1;
        else chunkCounts.citations.named += 1;
        const cls = evidenceClass(c.source, c.type);
        chunkCounts.evidenceClasses[cls] = (chunkCounts.evidenceClasses[cls] || 0) + 1;
      }
      chunkCounts.senses.total += model.senses.length;
      chunkCounts.senses.crossReference += model.senses.filter(s => s.kind === "cross-reference").length;
    }
  }
  await flush();

  const runtimeSeconds = Number(((Date.now() - startedMs) / 1000).toFixed(3));
  const mem = process.memoryUsage();
  const manifest = {
    generator: "scripts/build-full-mw.mjs",
    profile: PROFILE,
    generatedAt: new Date().toISOString(),
    source: {
      path: path.relative(root, sourcePath),
      bytes: (await fsp.stat(sourcePath)).size,
      sha256: sourceHash,
      records: totalRecords
    },
    configuration: { chunkSize, maxEntries, stride, cslOrig: path.relative(root, cslOrig) },
    coverage: {
      exportedEntries: exported,
      totalRecords,
      percent: totalRecords ? Number(((exported / totalRecords) * 100).toFixed(3)) : 0,
      full: exported === totalRecords
    },
    targets: {
      "tei-lex0": { profile: PROFILE, schema: "TEI Lex-0 v0.9.4", directory: path.relative(outDir, teiDir), chunks: doneState.size, entries: exported },
      ontolex: { profile: "ontolex-frac-profile-v0.1", directory: path.relative(outDir, ontolexDir), chunks: doneState.size, entries: exported }
    },
    chunks: [...doneState.values()].sort((a, b) => a.chunkId.localeCompare(b.chunkId)),
    runtime: { seconds: runtimeSeconds, startedAt: startedAt.toISOString(), finishedAt: new Date().toISOString() },
    memory: { rssBytes: mem.rss, heapUsedBytes: mem.heapUsed, heapTotalBytes: mem.heapTotal, maxRssBytes: process.resourceUsage().maxRSS * 1024 },
    reproducible: {
      command: "node scripts/build-full-mw.mjs --csl-orig ../csl-orig --out <dir>",
      ordering: "csl-orig source order, one deterministic chunk per --chunk-size records",
      resume: "rerun the same command; chunks with a .done.json are skipped"
    }
  };
  await fsp.writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await fsp.writeFile(lossFile, `${JSON.stringify(aggregateLoss(doneState, totalRecords, exported), null, 2)}\n`, "utf8");
  await fsp.writeFile(runFile, `${JSON.stringify({ manifest: path.basename(manifestFile), loss: path.basename(lossFile), runtimeSeconds, memory: manifest.memory, coverage: manifest.coverage }, null, 2)}\n`, "utf8");
  console.log(`Full-MW export: ${exported}/${totalRecords} records (${manifest.coverage.percent}%), ${doneState.size} chunks, ${runtimeSeconds}s`);
}

main().catch(error => {
  console.error(error.stack || error);
  process.exit(1);
});
