import fs from "node:fs";
import path from "node:path";
import { generatedAt } from "./lib/provenance.mjs";
import { extractLabeledSources } from "./lib/citations.mjs";

const root = process.cwd();
const errors = [];
const warnings = [];
const PROFILE_VERSION = "ontolex-frac-profile-v0.1";
const VALIDATION_SCOPE = "full-ontolex-shacl-profile";

function safeCaseId(id) {
  return id.replace(/:/g, "-");
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function writeJson(relativePath, value) {
  const file = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function check(condition, message, bucket = errors) {
  if (!condition) bucket.push(message);
}

function asArray(value) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function validateShaclShapes() {
  const relative = "data/schema/ontolex-frac-profile.shacl.ttl";
  const file = path.join(root, relative);
  check(fs.existsSync(file), `${relative}: missing SHACL profile`);
  if (!fs.existsSync(file)) return;

  const shapes = fs.readFileSync(file, "utf8");
  for (const prefix of ["@prefix sh:", "@prefix ontolex:", "@prefix lexicog:", "@prefix frac:", "@prefix prov:", "@prefix csl:"]) {
    check(shapes.includes(prefix), `${relative}: missing ${prefix}`);
  }
  for (const shape of ["csl:LexicalEntryShape", "csl:SourceRecordShape", "csl:AttestationShape", "csl:LexicographicResourceShape", "csl:LexicographicEntryShape", "csl:ContinuationRelationShape", "csl:LineageRelationShape"]) {
    check(shapes.includes(shape), `${relative}: missing ${shape}`);
  }
  for (const required of [PROFILE_VERSION, VALIDATION_SCOPE, "ontolex:canonicalForm", "frac:attestation", "prov:wasDerivedFrom", "csl:evidenceClass"]) {
    check(shapes.includes(required), `${relative}: missing required shape marker ${required}`);
  }
}

function nodeTypes(node) {
  return asArray(node?.["@type"]);
}

function validateCase(model, reviewIds) {
  const stem = safeCaseId(model.id);
  const jsonRelative = `data/pilot/ontolex/${stem}.json`;
  const ttlRelative = `data/pilot/rdf/${stem}.ttl`;
  const jsonFile = path.join(root, jsonRelative);
  const ttlFile = path.join(root, ttlRelative);
  const caseErrors = [];
  const caseWarnings = [];
  const caseCheck = (condition, message) => check(condition, `${jsonRelative}: ${message}`, caseErrors);
  const caseWarn = (condition, message) => check(condition, `${jsonRelative}: ${message}`, caseWarnings);

  caseCheck(fs.existsSync(jsonFile), "missing OntoLex JSON-LD file");
  caseCheck(fs.existsSync(ttlFile), `missing RDF/Turtle mirror ${ttlRelative}`);
  if (!fs.existsSync(jsonFile) || !fs.existsSync(ttlFile)) {
    return {id: model.id, key: model.key, status: "fail", errors: caseErrors, warnings: caseWarnings};
  }

  const doc = readJson(jsonRelative);
  const graph = doc["@graph"] || [];
  const context = doc["@context"] || {};
  const ttl = fs.readFileSync(ttlFile, "utf8");
  const expectedStatus = reviewIds.has(model.id) ? "validated-slice" : "full-machine-review";

  for (const prefix of ["ontolex", "lexicog", "decomp", "frac", "prov", "dct", "rdf", "rdfs", "skos", "csl"]) {
    caseCheck(Boolean(context[prefix]), `missing ${prefix} context`);
  }
  caseCheck(graph.length >= 5, "graph is too small to be beyond a stub");

  const entry = graph.find(node => nodeTypes(node).includes("ontolex:LexicalEntry"));
  caseCheck(Boolean(entry), "missing ontolex:LexicalEntry");
  if (!entry) {
    return {id: model.id, key: model.key, status: "fail", errors: caseErrors, warnings: caseWarnings};
  }

  // Multi-resource (OntoLex-Lexicog): per source dictionary that has senses, a
  // lexicog:LexicographicResource containing a lexicog:Entry that describes the
  // lemma. (The lemma node itself is ontolex:LexicalEntry.) A sense-less stub
  // legitimately has neither.
  const hasSenses = graph.some(node => node["@type"] === "ontolex:LexicalSense");
  const lexEntries = graph.filter(node => nodeTypes(node).includes("lexicog:Entry"));
  const lexResources = graph.filter(node => nodeTypes(node).includes("lexicog:LexicographicResource"));
  caseCheck(!hasSenses || lexEntries.length > 0, "entry has senses but no lexicog:Entry (multi-resource view)");
  caseCheck(!hasSenses || lexResources.length > 0, "entry has senses but no lexicog:LexicographicResource");
  for (const lexEntry of lexEntries) {
    caseCheck(lexEntry["lexicog:describes"]?.["@id"] === entry["@id"],
      `lexicog:Entry ${lexEntry["@id"]} does not describe the lexical entry`);
  }
  for (const resource of lexResources) {
    caseCheck(Boolean(resource["lexicog:entry"]?.["@id"]),
      `lexicog:LexicographicResource ${resource["@id"]} has no lexicog:entry`);
  }
  caseCheck(Boolean(entry["ontolex:canonicalForm"]?.["@id"]), "missing canonical form link");
  caseCheck(entry["csl:profileVersion"] === PROFILE_VERSION, "profile version mismatch");
  caseCheck(entry["csl:validationScope"] === VALIDATION_SCOPE, "validation scope mismatch");
  caseCheck(entry["csl:reviewStatus"] === expectedStatus, `review status expected ${expectedStatus}, found ${entry["csl:reviewStatus"] || "none"}`);
  caseCheck(entry["csl:caseId"] === model.id, "case id mismatch");
  caseCheck(entry["csl:key"] === model.key, "key mismatch");

  const form = graph.find(node => node["@id"] === entry["ontolex:canonicalForm"]["@id"]);
  caseCheck(Boolean(form), "canonical form node missing");
  caseCheck(nodeTypes(form).includes("ontolex:Form"), "canonical node is not an ontolex:Form");
  caseCheck(Boolean(form?.["ontolex:writtenRep"]?.["@value"]), "canonical writtenRep missing");

  const sourceRecords = graph.filter(node => node["@type"] === "csl:SourceRecord");
  // The tri-dict backbone (mw/pwg/pwk) is always present; an optional fourth
  // dictionary (ap90) adds a source record when attached, so >= 3, not exactly 3.
  caseCheck(sourceRecords.length >= 3, `expected at least 3 source records, found ${sourceRecords.length}`);
  for (const dict of ["mw", "pwg", "pwk"]) {
    const record = sourceRecords.find(node => node["csl:dictionary"] === dict);
    caseCheck(Boolean(record), `missing source record for ${dict}`);
    caseCheck(Boolean(record?.["rdf:value"]), `source record for ${dict} lacks raw value`);
    caseCheck(String(record?.["csl:recordNumber"] || "") === String(model.records?.[dict]?.L || ""), `source record number mismatch for ${dict}`);
  }
  // Any extra (fourth-dictionary) source record must still be well-formed.
  for (const record of sourceRecords.filter(n => !["mw", "pwg", "pwk"].includes(n["csl:dictionary"]))) {
    caseCheck(Boolean(record["csl:dictionary"]), `extra source record ${record["@id"]} lacks a dictionary`);
    caseCheck(Boolean(record["rdf:value"]), `extra source record ${record["@id"]} lacks raw value`);
  }

  // Each lexical sense carries at least one definition and a source dictionary, and
  // points back at its entry (mirrors csl:LexicalSenseShape in the SHACL profile).
  const senseNodes = graph.filter(node => node["@type"] === "ontolex:LexicalSense");
  for (const sense of senseNodes) {
    const defs = [].concat(sense["skos:definition"] || []).filter(d => d && d["@value"]);
    caseCheck(defs.length > 0, `sense ${sense["@id"]} lacks a skos:definition`);
    caseCheck(Boolean(sense["csl:sourceDictionary"]), `sense ${sense["@id"]} lacks csl:sourceDictionary`);
    caseCheck(Boolean(sense["ontolex:isSenseOf"]?.["@id"]), `sense ${sense["@id"]} lacks ontolex:isSenseOf`);
  }

  // An attestation may attest the entry (entry-level evidence) or a specific
  // sense (sense-level citation linkage); both targets live in this graph.
  const senseIds = new Set(senseNodes.map(node => node["@id"]));
  const attestTargets = new Set([entry["@id"], ...senseIds]);
  const EVIDENCE_CLASSES = ["textual", "hedge", "kosha", "editorial"];
  const attestations = graph.filter(node => node["@type"] === "frac:Attestation");
  caseCheck(attestations.length > 0, "expected at least one FrAC attestation");
  for (const attestation of attestations) {
    const target = attestation["frac:attests"]?.["@id"];
    caseCheck(Boolean(target), `attestation ${attestation["@id"]} lacks attests link`);
    caseCheck(attestTargets.has(target), `attestation ${attestation["@id"]} attests neither the entry nor one of its senses`);
    caseCheck(Boolean(attestation["prov:wasDerivedFrom"]?.["@id"]), `attestation ${attestation["@id"]} lacks provenance link`);
    caseCheck(Boolean(attestation["csl:evidenceType"]), `attestation ${attestation["@id"]} lacks evidence type`);
    // csl: evidence-class extension: every attestation is sub-typed, and a
    // coordinate-bearing one carries both a work and a parsed range.
    caseCheck(EVIDENCE_CLASSES.includes(attestation["csl:evidenceClass"]),
      `attestation ${attestation["@id"]} has missing/invalid csl:evidenceClass (${attestation["csl:evidenceClass"] || "none"})`);
    caseCheck(!attestation["csl:citedRange"] || Boolean(attestation["csl:citedWork"]),
      `attestation ${attestation["@id"]} has a citedRange without a citedWork`);
  }

  if (model.phenomena.includes("hedge")) {
    caseCheck(
      attestations.some(node => node["csl:evidenceType"] === "generic-lexicographer-hedge"),
      "missing generic lexicographer hedge attestation"
    );
  }
  if (model.phenomena.includes("root")) {
    caseCheck(graph.some(node => node["@type"] === "csl:RootRelation"), "missing root relation");
  }
  if (model.phenomena.includes("compound")) {
    caseCheck(graph.some(node => node["@type"] === "decomp:ComponentList"), "missing decomp component list");
  }
  if (model.phenomena.includes("continuation")) {
    const cont = graph.find(node => node["@type"] === "csl:ContinuationRelation");
    caseCheck(Boolean(cont), "missing continuation relation");
    caseCheck(!cont || ["recovered", "conjectured", "unresolved"].includes(cont["csl:recoveryStatus"]),
      `continuation relation has missing/invalid csl:recoveryStatus (${cont?.["csl:recoveryStatus"] || "none"})`);
  }

  // Source-collapse lineage (§4a): when PWG names sources that PWK abridges or MW
  // does not fully carry, the graph must hold a well-formed csl:LineageRelation.
  const lsN = dict => extractLabeledSources(model.records?.[dict]?.raw || "", {max: 9999}).length;
  const pwgN = lsN("pwg"), pwkN = lsN("pwk"), mwN = lsN("mw");
  const lineages = graph.filter(node => node["@type"] === "csl:LineageRelation");
  caseCheck(!(pwgN > 0 && pwkN < pwgN) || lineages.some(l => l["csl:lineageTo"] === "pwk"),
    "missing PWG→PWK abridgement lineage relation");
  caseCheck(!(pwgN > 0 && mwN < pwgN) || lineages.some(l => l["csl:lineageTo"] === "mw"),
    "missing PWG→MW recomposition lineage relation");
  for (const lineage of lineages) {
    caseCheck(lineage["csl:relatesEntry"]?.["@id"] === entry["@id"], `lineage ${lineage["@id"]} does not relate the entry`);
    caseCheck(["abridgement", "recomposition"].includes(lineage["csl:transition"]), `lineage ${lineage["@id"]} has an invalid transition`);
    caseCheck(Number.isInteger(lineage["csl:droppedCitationCount"]), `lineage ${lineage["@id"]} lacks a dropped-citation count`);
  }

  for (const prefix of ["@prefix ontolex:", "@prefix lexicog:", "@prefix frac:", "@prefix prov:", "@prefix rdf:", "@prefix csl:"]) {
    caseCheck(ttl.includes(prefix), `${ttlRelative}: missing ${prefix}`);
  }
  caseCheck(ttl.includes(`<${entry["@id"]}> a ontolex:LexicalEntry`), `${ttlRelative}: missing entry type triple`);
  caseCheck(!hasSenses || ttl.includes("a lexicog:Entry"), `${ttlRelative}: missing lexicog:Entry triple`);
  caseCheck(!hasSenses || ttl.includes("a lexicog:LexicographicResource"), `${ttlRelative}: missing lexicog:LexicographicResource triple`);
  caseCheck(ttl.includes(`csl:profileVersion "${PROFILE_VERSION}"`), `${ttlRelative}: missing profile version triple`);
  caseCheck(ttl.includes(`csl:validationScope "${VALIDATION_SCOPE}"`), `${ttlRelative}: missing validation scope triple`);
  caseCheck(ttl.includes("frac:Attestation"), `${ttlRelative}: missing FrAC attestation triples`);
  caseCheck(!attestations.length || ttl.includes("csl:evidenceClass"), `${ttlRelative}: missing csl:evidenceClass triples`);
  caseCheck(!lineages.length || ttl.includes("a csl:LineageRelation"), `${ttlRelative}: missing csl:LineageRelation triples`);
  caseCheck((ttl.match(/a csl:SourceRecord/g) || []).length >= 3, `${ttlRelative}: expected at least 3 csl:SourceRecord triples`);
  caseWarn(ttl.includes("ontolex:sense") || !entry["ontolex:sense"]?.length, `${ttlRelative}: JSON-LD senses are not mirrored in Turtle`);

  return {
    id: model.id,
    key: model.key,
    status: caseErrors.length ? "fail" : "pass",
    reviewStatus: entry["csl:reviewStatus"],
    profileVersion: entry["csl:profileVersion"],
    validationScope: entry["csl:validationScope"],
    graphNodes: graph.length,
    sourceRecords: sourceRecords.length,
    attestations: attestations.length,
    evidenceClasses: attestations.reduce((acc, a) => {
      const c = a["csl:evidenceClass"]; if (c) acc[c] = (acc[c] || 0) + 1; return acc;
    }, {}),
    phenomena: model.phenomena || [],
    errors: caseErrors,
    warnings: caseWarnings
  };
}

validateShaclShapes();

const models = readJson("data/pilot/neutral-model.json");
const review = readJson("data/pilot/review-cases.json");
const reviewIds = new Set(review.items.map(item => item.id));

check(models.length >= 50, `expected at least 50 neutral models, found ${models.length}`);
check(review.items.length === 15, `expected 15 initial review cases, found ${review.items.length}`);

const items = models.map(model => validateCase(model, reviewIds));
for (const item of items) {
  errors.push(...item.errors);
  warnings.push(...item.warnings);
}

const report = {
  generatedAt: generatedAt(),
  generator: "scripts/validate-ontolex-profile.mjs",
  profileVersion: PROFILE_VERSION,
  validationScope: VALIDATION_SCOPE,
  shaclProfile: "data/schema/ontolex-frac-profile.shacl.ttl",
  reviewType: "machine-review",
  caveat: "This is full machine review and project SHACL/profile validation, not a human philological review.",
  totals: {
    cases: items.length,
    passed: items.filter(item => item.status === "pass").length,
    failed: items.filter(item => item.status === "fail").length,
    warnings: warnings.length
  },
  items
};

writeJson("data/pilot/ontolex-review.json", report);
writeJson("src/data/pilot/ontolex-review.json", report);

if (errors.length) {
  console.error(`OntoLex/FrAC SHACL/profile validation failed with ${errors.length} problem(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`OntoLex/FrAC SHACL/profile validation passed: ${items.length} JSON-LD graphs and Turtle RDF files; ${warnings.length} warning(s).`);
