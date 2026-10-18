// Small-class abbreviation register (H6419) — shared library.
//
// The register artifact is data/abbrev/small-class-register.json: the 2006
// "small classes" scheme (Gasūns, EURALEX XII, pp. 773–778, §2.3) as SKOS-shaped
// concepts, each concept's meaning grounded in the csl-atlas abbreviation census
// (H6409, data/abbrev/abbrev_census.json, read cross-repo, never re-scanned).
//
// SKOS shape follows the W3C SKOS Recommendation (skos:Concept / skos:notation /
// skos:prefLabel / skos:altLabel / skos:inScheme over a skos:ConceptScheme, with
// the 2006 letter-length bands as skos:Collections) in a JSKOS-style JSON-LD
// context (notation as @set, prefLabel/altLabel as @language), per gbv/jskos.

import fs from "node:fs";

export const REGISTER_PATH = "data/abbrev/small-class-register.json";
export const CENSUS_DEFAULT = "../csl-atlas/data/abbrev/abbrev_census.json";

// v1 bands are the 2006 §2.3 letter-length rows as printed; the v2 bands
// (H6447) are the measured-residue classes added beyond the scheme-as-printed
// (MG verdicts 10-10-2026), under the same census-grounding rules.
export const BANDS = [
  "2006-1", "2006-2", "2006-3", "2006-4",
  "v2-gender-features", "v2-work-titles", "v2-authors-editors",
];

// External grounding palette for unresolved forms (H6447): the four grammars
// of the 2006 paper's own reference list. Editions live in the register's
// provenance.extensionV2.externalGroundingSources.
export const EXTERNAL_SOURCES = ["Whitney 1879", "Macdonell 1916", "Stenzler", "Knauer"];

export const CANARY_LABELS = ["V.", "c.", "P.", "S.", "N.", "M.", "f."];

// Comparison key for "same meaning", mirroring csl-atlas
// scripts/build_abbrev_census.py expansion_key(): strip inline tags, collapse
// whitespace, NFC-normalize, drop trailing periods, casefold. JS toLowerCase()
// matches Python casefold() on every character occurring in the census legend
// corpus (no ß / İ / ligature-with-case-mapping surprises); a divergence would
// under-bind, never over-claim, and the validator pins key existence against
// the payload either way.
export function expansionKey(expansion) {
  const stripped = String(expansion ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return stripped.normalize("NFC").replace(/\.+$/, "").toLowerCase();
}

export function loadRegister(root = process.cwd()) {
  return JSON.parse(fs.readFileSync(`${root}/${REGISTER_PATH}`, "utf8"));
}

export function loadCensus(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

// Index the census collision matrix: label -> [{ expansion, expansionKey,
// categories, dicts }] — the collision universe the measurement runs over.
export function collisionIndex(census) {
  const index = new Map();
  for (const row of census.collisionMatrix) {
    index.set(row.label, row.senses.map(s => ({
      expansion: s.expansion,
      expansionKey: expansionKey(s.expansion),
      categories: s.categories,
      dicts: s.dicts,
    })));
  }
  return index;
}

// expansion-key -> concept uri, from the register's attestedKeys. The register
// validation guarantees these key sets are disjoint across concepts.
export function keyToConcept(register) {
  const map = new Map();
  for (const concept of register.concepts) {
    for (const key of concept.attestedKeys) {
      map.set(key, concept.uri);
    }
  }
  return map;
}
