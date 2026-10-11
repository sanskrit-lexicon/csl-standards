// SHACL-profile validation for the small-class register's Turtle export (H6448).
//
// Three layers, following the validate-ontolex-profile.mjs lane:
//   1. shapes file — data/schema/small-class-register.shacl.ttl must exist and
//      carry the profile's required constraint markers (the profile's own
//      contract: S14 uniqueLang, typed notations, the two band-consistency
//      sparql directions, notation uniqueness, grounding palette);
//   2. data currency — data/abbrev/small-class-register.ttl must byte-equal
//      the deterministic serialization of the CURRENT register JSON, so the
//      shapes apply to what is actually shipped, never to a stale image;
//   3. constraint enforcement — the profile's three headline contracts
//      (notation uniqueness within the scheme, at most one prefLabel per
//      language, band-membership consistency both directions) re-checked in
//      JS over the register, the register being the authority
//      (scripts/validate-small-class-register.mjs checks the full contract).
//
// When a real SHACL engine is importable (pySHACL), it is executed against
// data + shapes and its verdict is required; without an engine the run is
// structural (recorded in the output line, never silently assumed).
//
// Usage: npm run validate-small-class-register-shacl
// Exit 0 = valid; exit 1 = violations listed.

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { serializeRegister, OUTPUT_PATH } from "./export-small-class-register-ttl.mjs";
import { loadRegister, BANDS } from "./lib/small-class-register.mjs";

const SHAPES_PATH = "data/schema/small-class-register.shacl.ttl";
const PROFILE_VERSION = "small-class-shacl-profile-v1";
const VALIDATION_SCOPE = "full-small-class-shacl-profile";

const root = process.cwd();
const errors = [];
const err = (msg) => errors.push(msg);

function validateShapesFile(shapes) {
  for (const prefix of ["@prefix sh:", "@prefix skos:", "@prefix dct:", "@prefix xsd:", "@prefix scr:"]) {
    if (!shapes.includes(prefix)) err(`${SHAPES_PATH}: missing ${prefix}`);
  }
  for (const shape of [
    "scr:ConceptSchemeShape", "scr:BandCollectionShape", "scr:ConceptShape",
    "scr:UnresolvedFormShape", "scr:ExternalGroundingShape", "scr:CanaryExhibitShape",
  ]) {
    if (!shapes.includes(shape)) err(`${SHAPES_PATH}: missing ${shape}`);
  }
  for (const required of [
    PROFILE_VERSION, VALIDATION_SCOPE,
    "sh:uniqueLang", // SKOS S14: at most one prefLabel per language tag
    "sh:datatype scr:AbbreviationNotation", // typed skos:notation literals
    "FILTER (STR($this) < STR(?other))", // notation uniqueness within the scheme
    "FILTER NOT EXISTS { ?band skos:member $this }", // band consistency, concept direction
    "FILTER (?band != $this)", // band consistency, collection direction
    "sh:in ( \"Whitney 1879\" \"Macdonell 1916\" \"Stenzler\" \"Knauer\" )", // grounding palette
  ]) {
    if (!shapes.includes(required)) err(`${SHAPES_PATH}: missing required constraint marker ${JSON.stringify(required)}`);
  }
}

function validateDataCurrency(register, ttl) {
  const expected = serializeRegister(register);
  if (ttl !== expected) {
    err(`${OUTPUT_PATH}: stale or hand-edited — does not byte-equal the deterministic serialization of the current ${"data/abbrev/small-class-register.json"} (re-run npm run export-small-class-register-ttl)`);
  }
}

function validateContract(register) {
  const found = [];
  // notation uniqueness within the scheme (+ unresolved forms never colliding)
  const owner = new Map();
  const claim = (notation, who) => {
    if (owner.has(notation)) found.push(`notation ${JSON.stringify(notation)} claimed by both ${owner.get(notation)} and ${who} (SKOS: a notation identifies one concept within its scheme)`);
    else owner.set(notation, who);
  };
  for (const concept of register.concepts) {
    for (const n of concept.notation ?? []) claim(n, concept.uri);
    for (const alt of concept.altForm ?? []) claim(alt.notation, `${concept.uri} (altForm)`);
  }
  for (const form of register.unresolvedForms ?? []) claim(form.notation, `${form.uri ?? form.notation} (unresolved)`);

  // at most one prefLabel per language (SKOS S14)
  for (const concept of register.concepts) {
    for (const [lang, v] of Object.entries(concept.prefLabel ?? {})) {
      if (Array.isArray(v)) found.push(`${concept.uri}: prefLabel.${lang} must be a single string (SKOS S14)`);
    }
  }

  // band-membership consistency, both directions
  const listed = new Map();
  for (const band of register.collections ?? []) {
    for (const member of band.member ?? []) listed.set(member, band.uri);
  }
  for (const concept of register.concepts) {
    const declared = concept.smallClass;
    if (!BANDS.some(b => declared?.endsWith(b))) {
      found.push(`${concept.uri}: smallClass must be one of the register bands`);
      continue;
    }
    if (!listed.has(concept.uri)) {
      found.push(`${concept.uri}: not listed in the member list of its band collection ${declared}`);
    } else if (listed.get(concept.uri) !== declared) {
      found.push(`${concept.uri}: smallClass says band ${declared} but its band collection lists it under ${listed.get(concept.uri)}`);
    }
  }
  for (const [member, bandUri] of listed) {
    if (!register.concepts.some(c => c.uri === member)) {
      found.push(`${bandUri}: member ${member} is not a register concept`);
    }
  }
  return found;
}

function runEngine(shapesFile, dataFile) {
  const probe = spawnSync("python3", ["-c", "import pyshacl, rdflib"], {encoding: "utf8"});
  if (probe.status !== 0) return {engine: null};
  // pyshacl API, not the CLI: the CLI's flag prefix-matching (--data ->
  // --data-file-format) silently validates the wrong graph (0 focus nodes,
  // Conforms: True). The API call pins data/shapes explicitly.
  const script = [
    "import sys",
    "from rdflib import Graph",
    "from pyshacl import validate",
    `conforms, _, _ = validate(`,
    `    data_graph=Graph().parse(${JSON.stringify(dataFile)}, format="turtle"),`,
    `    shacl_graph=Graph().parse(${JSON.stringify(shapesFile)}, format="turtle"),`,
    `    inference="none", advanced=True)`,
    `print("CONFORMS:", conforms)`,
    "sys.exit(0 if conforms else 1)",
  ].join("\n");
  const run = spawnSync("python3", ["-c", script], {encoding: "utf8"});
  return {engine: "pyshacl", status: run.status, conforms: run.status === 0, stdout: run.stdout, stderr: run.stderr};
}

function main() {
  const shapesFile = path.join(root, SHAPES_PATH);
  const dataFile = path.join(root, OUTPUT_PATH);
  if (!fs.existsSync(shapesFile)) err(`${SHAPES_PATH}: missing SHACL profile`);
  if (!fs.existsSync(dataFile)) err(`${OUTPUT_PATH}: missing Turtle export (run npm run export-small-class-register-ttl)`);

  const register = loadRegister(root);
  if (fs.existsSync(shapesFile)) validateShapesFile(fs.readFileSync(shapesFile, "utf8"));
  if (fs.existsSync(dataFile)) validateDataCurrency(register, fs.readFileSync(dataFile, "utf8"));
  errors.push(...validateContract(register));

  const engine = fs.existsSync(shapesFile) && fs.existsSync(dataFile) ? runEngine(shapesFile, dataFile) : {engine: null};
  if (engine.engine && !engine.conforms) {
    err(`pyshacl engine reported constraint violations (exit ${engine.status}) — see below`);
    console.error(engine.stdout || engine.stderr);
  }

  if (errors.length) {
    console.error(`small-class register SHACL profile INVALID — ${errors.length} error(s):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  const engineNote = engine.engine
    ? `, engine ${engine.engine} conforms=True`
    : ", structural mode (no SHACL engine importable; shapes checked as markers + contract enforced in JS)";
  console.log(`small-class register SHACL profile OK — ${PROFILE_VERSION} / ${VALIDATION_SCOPE}: ${register.concepts.length} concepts, ${(register.collections ?? []).length} band collections${engineNote}`);
  process.exit(0);
}

// Seeded-violation entry point for the suite's negative tests: the profile's
// three headline contracts must reject a mutated register (fail-closed proof —
// SHACL green on a known-bad fixture is the handoff's named Fail condition).
export { validateContract };

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
