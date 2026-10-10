// Validate the small-class abbreviation register (data/abbrev/small-class-register.json).
//
// Two layers:
//   1. structural — the register's own contract: unique concept URIs and
//      notations (SKOS convention: a notation identifies exactly one concept
//      within its scheme), disjoint attestedKeys across concepts, at most one
//      prefLabel per language (SKOS S14), band membership consistent between
//      concept.smallClass and the band collection's member list, unresolved
//      forms carry a reason and a paper quote, canary exhibits pin their
//      census polysemy.
//   2. census-grounded (default when the census payload is resolvable) — every
//      evidence row must exist verbatim in the csl-atlas abbreviation census
//      (H6409 payload, read cross-repo, never re-scanned), every attestedKey
//      must occur in the payload's legend layer, the pinned census
//      generatedAt/corpusCommit must match the payload, and no concept may
//      carry a key the payload does not evidence (the handoff's fail
//      condition).
//
// Usage:
//   npm run validate-small-class-register            # structural + census
//   node scripts/validate-small-class-register.mjs --census <path>
//   node scripts/validate-small-class-register.mjs --no-census
//
// Exit 0 = valid; exit 1 = errors listed.

import fs from "node:fs";
import path from "node:path";
import {
  REGISTER_PATH, CENSUS_DEFAULT, BANDS, CANARY_LABELS,
  expansionKey, loadRegister, loadCensus, collisionIndex, keyToConcept,
} from "./lib/small-class-register.mjs";

const root = process.cwd();
const args = process.argv.slice(2);

function resolveCensus() {
  const flag = args.indexOf("--census");
  if (flag !== -1 && args[flag + 1]) return path.resolve(args[flag + 1]);
  if (process.env.CENSUS_PATH) return path.resolve(process.env.CENSUS_PATH);
  return path.resolve(root, CENSUS_DEFAULT);
}

const errors = [];
const err = (msg) => errors.push(msg);

function main() {
  const register = loadRegister(root);

  // --- scheme-level shape -------------------------------------------------
  if (!Array.isArray(register.concepts) || register.concepts.length === 0) {
    err("register.concepts must be a non-empty array");
    return finish(register, null);
  }
  const schemeUri = register.uri;
  const conceptUris = new Map();
  const notationOwner = new Map();
  for (const concept of register.concepts) {
    if (conceptUris.has(concept.uri)) err(`duplicate concept uri: ${concept.uri}`);
    conceptUris.set(concept.uri, concept);
    for (const n of concept.notation ?? []) {
      if (notationOwner.has(n)) err(`notation ${JSON.stringify(n)} claimed by both ${notationOwner.get(n)} and ${concept.uri} (SKOS: a notation identifies one concept within its scheme)`);
      else notationOwner.set(n, concept.uri);
    }
    if (!concept.prefLabel || typeof concept.prefLabel !== "object") err(`${concept.uri}: prefLabel must be a language map`);
    else {
      const langs = Object.keys(concept.prefLabel);
      if (langs.length === 0) err(`${concept.uri}: prefLabel must carry at least one language`);
      for (const v of Object.values(concept.prefLabel)) {
        if (Array.isArray(v)) err(`${concept.uri}: prefLabel values must be single strings (SKOS S14: at most one prefLabel per language)`);
      }
    }
    if (!Array.isArray(concept.attestedKeys) || concept.attestedKeys.length === 0) {
      err(`${concept.uri}: attestedKeys must be a non-empty array`);
    }
    if (!BANDS.some(b => concept.smallClass?.endsWith(b))) {
      err(`${concept.uri}: smallClass must be one of the 2006 bands (${BANDS.join(", ")})`);
    }
    for (const alt of concept.altForm ?? []) {
      if (notationOwner.has(alt.notation)) err(`altForm notation ${JSON.stringify(alt.notation)} (${concept.uri}) collides with ${notationOwner.get(alt.notation)}`);
      else notationOwner.set(alt.notation, `${concept.uri} (altForm)`);
      if (!BANDS.some(b => alt.smallClass?.endsWith(b))) err(`${concept.uri}: altForm ${alt.notation} has no 2006 band`);
      if (!alt.source) err(`${concept.uri}: altForm ${alt.notation} must carry a source citation`);
      if (typeof alt.censusLegends !== "number") err(`${concept.uri}: altForm ${alt.notation} must declare censusLegends (0 when unattested)`);
    }
  }
  const keyOwner = new Map();
  for (const concept of register.concepts) {
    for (const key of concept.attestedKeys ?? []) {
      if (keyOwner.has(key)) err(`attestedKey ${JSON.stringify(key)} claimed by both ${keyOwner.get(key)} and ${concept.uri} — binding must be unambiguous`);
      else keyOwner.set(key, concept.uri);
    }
  }

  // --- collections: SKOS member lists agree with concept.smallClass -------
  const bandUriToId = new Map(BANDS.map(b => [`${schemeUri}#${b}`, b]));
  const bandMembers = new Map();
  for (const band of register.collections ?? []) {
    const id = bandUriToId.get(band.uri);
    if (!id) { err(`unknown band collection uri: ${band.uri}`); continue; }
    if (!band.paperQuote?.en) err(`${band.uri}: band collection must quote the source scheme (paperQuote)`);
    for (const member of band.member ?? []) {
      if (!conceptUris.has(member)) err(`${band.uri}: member ${member} is not a register concept`);
      bandMembers.set(member, id);
    }
  }
  for (const concept of register.concepts) {
    const declared = [...bandUriToId.entries()].find(([uri]) => uri === concept.smallClass)?.[1];
    const listed = bandMembers.get(concept.uri);
    if (declared && listed && declared !== listed) {
      err(`${concept.uri}: smallClass says band ${declared} but its band collection lists it under ${listed}`);
    }
    if (declared && !listed) {
      err(`${concept.uri}: not listed in the member list of its band collection ${concept.smallClass}`);
    }
  }

  // --- unresolved forms ----------------------------------------------------
  for (const form of register.unresolvedForms ?? []) {
    if (notationOwner.has(form.notation)) err(`unresolvedForm ${JSON.stringify(form.notation)} collides with concept notation of ${notationOwner.get(form.notation)}`);
    if (!form.reason?.en) err(`unresolvedForm ${JSON.stringify(form.notation)} must state why it is unresolved`);
    if (!form.paperQuote?.en) err(`unresolvedForm ${JSON.stringify(form.notation)} must cite the source scheme`);
  }

  // --- canary exhibits -----------------------------------------------------
  const canary = register.canaryExhibits ?? [];
  if (JSON.stringify(canary.map(c => c.label)) !== JSON.stringify(CANARY_LABELS)) {
    err(`canaryExhibits must cover exactly ${CANARY_LABELS.join(" ")}`);
  }
  for (const exhibit of canary) {
    if (typeof exhibit.censusPolysemy !== "number") err(`canary ${exhibit.label}: censusPolysemy must be a number`);
    if (!exhibit.paperRole?.en) err(`canary ${exhibit.label}: paperRole must cite the 2006 exhibit`);
  }

  // --- census-grounded layer ----------------------------------------------
  let census = null;
  if (!args.includes("--no-census")) {
    const censusPath = resolveCensus();
    if (!fs.existsSync(censusPath)) {
      console.error(`census payload not found at ${censusPath} — pass --census <path> or --no-census`);
      process.exit(1);
    }
    census = loadCensus(censusPath);
    validateAgainstCensus(register, census);
  }

  return finish(register, census);
}

function validateAgainstCensus(register, census) {
  // legend index: expansion-key -> Set(labels); label -> legend rows
  const legendsByLabel = new Map();
  const keys = new Map();
  for (const [label, slot] of Object.entries(census.labelTable)) {
    legendsByLabel.set(label, slot.legends ?? []);
    for (const row of slot.legends ?? []) {
      const k = expansionKey(row.expansion);
      if (!keys.has(k)) keys.set(k, new Set());
      keys.get(k).add(label);
    }
  }

  // the pinned census identity must be the payload we are checking against
  const pin = register.provenance?.census;
  if (!pin || pin.generatedAt !== census.generatedAt) {
    err(`provenance.census.generatedAt (${pin?.generatedAt}) does not match the payload (${census.generatedAt})`);
  }
  if (pin && pin.corpusCommit !== census.provenance?.corpusCommit) {
    err(`provenance.census.corpusCommit does not match the payload`);
  }

  for (const concept of register.concepts) {
    for (const key of concept.attestedKeys ?? []) {
      if (!keys.has(key)) {
        err(`${concept.uri}: attestedKey ${JSON.stringify(key)} does not occur in the census legend layer (a sense the census does not evidence)`);
      }
    }
    for (const ev of concept.evidence ?? []) {
      const rows = legendsByLabel.get(ev.label) ?? [];
      const hit = rows.some(r => r.expansion === ev.expansion && (concept.attestedKeys ?? []).includes(expansionKey(ev.expansion)));
      if (!hit) {
        err(`${concept.uri}: evidence row (${ev.label}, ${JSON.stringify(ev.expansion)}) is not a legend row of the census under the concept's own attestedKeys`);
      }
    }
  }

  for (const form of register.unresolvedForms ?? []) {
    if (form.censusConflict) continue; // declared contradiction, form IS attested
    if (legendsByLabel.has(form.notation)) {
      err(`unresolvedForm ${JSON.stringify(form.notation)} claims "unattested" but the census carries a legend for it — resolve or declare censusConflict`);
    }
  }
  for (const form of register.unresolvedForms ?? []) {
    if (form.censusConflict && !legendsByLabel.has(form.notation)) {
      err(`unresolvedForm ${JSON.stringify(form.notation)} declares censusConflict but the census carries no legend for it`);
    }
  }

  for (const exhibit of register.canaryExhibits ?? []) {
    const row = census.collisionMatrix.find(r => r.label === exhibit.label);
    if (!row) { err(`canary ${exhibit.label}: no collisionMatrix row in the census`); continue; }
    if (row.polysemy !== exhibit.censusPolysemy) {
      err(`canary ${exhibit.label}: censusPolysemy ${exhibit.censusPolysemy} != census row polysemy ${row.polysemy} (numbers must be verbatim)`);
    }
  }

  // altForm censusLegends claims must match the payload
  for (const concept of register.concepts) {
    for (const alt of concept.altForm ?? []) {
      const n = (legendsByLabel.get(alt.notation) ?? []).length;
      if (n !== alt.censusLegends) {
        err(`${concept.uri}: altForm ${alt.notation} claims censusLegends=${alt.censusLegends}, census has ${n}`);
      }
    }
  }
}

function finish(register, census) {
  if (errors.length) {
    console.error(`small-class register INVALID — ${errors.length} error(s):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  const censusNote = census
    ? `, census-grounded against ${register.provenance.census.repo} ${register.provenance.census.file} (generatedAt ${register.provenance.census.generatedAt})`
    : ", structural checks only (--no-census)";
  console.log(`small-class register OK — ${register.concepts.length} concepts, ${(register.unresolvedForms ?? []).length} unresolved forms, ${(register.canaryExhibits ?? []).length} canary exhibits${censusNote}`);
  process.exit(0);
}

main();
