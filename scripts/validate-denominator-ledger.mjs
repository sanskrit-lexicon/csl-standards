// Validate the denominator-ledger fixture against data/schema/denominator-ledger.schema.json.
//
// The canon rule is "no percentage without its base" (docs/CITATION_MASS_CANON.md §1):
// every published percentage must name the row it is a percentage of, and the
// percentage must be recomputable from the ledger's own values. JSON Schema
// carries the per-row shape (required fields, enums, patterns); this validator
// additionally enforces the cross-row invariants JSON Schema cannot express:
//
//   1. measure_id unique across rows;
//   2. pct_of_base present => pct_kind present (and vice versa); the base is
//      carried per kind: share_of_base requires base_id resolving to another
//      row, covered_over_value carries its base in-row (covered_works/value);
//   3. the percentage recomputes from the ledger's own values within rounding
//      (0.05);
//   4. share_of_base must not be self-referential (base_id != measure_id).
//
// Usage:
//   npm run validate-denominator-ledger
//   node scripts/validate-denominator-ledger.mjs [--fixture <path>] [--schema <path>]
//
// Exit 0 = valid; exit 1 = errors listed.

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const args = process.argv.slice(2);

function flagValue(name, fallback) {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] ? path.resolve(root, args[i + 1]) : path.resolve(root, fallback);
}

const FIXTURE_PATH = flagValue("--fixture", "data/pilot/denominator-ledger.fixture.json");
const SCHEMA_PATH = flagValue("--schema", "data/schema/denominator-ledger.schema.json");

const errors = [];
const err = (msg) => errors.push(msg);
const round1 = (x) => Math.round(x * 10) / 10;

const REQUIRED = ["measure_id", "label", "value", "unit", "source_file", "source_field", "provenance"];
const ID_RE = /^[a-z][a-z0-9_]*$/;

function main() {
  let schema;
  let fixture;
  try {
    schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"));
  } catch (e) {
    err(`cannot read schema ${SCHEMA_PATH}: ${e.message}`);
    return finish();
  }
  try {
    fixture = JSON.parse(fs.readFileSync(FIXTURE_PATH, "utf8"));
  } catch (e) {
    err(`cannot read fixture ${FIXTURE_PATH}: ${e.message}`);
    return finish();
  }

  const prop = schema.definitions?.measure?.properties ?? {};
  const PCT_KINDS = new Set(prop.pct_kind?.enum ?? []);
  const PROVENANCE = new Set(prop.provenance?.enum ?? []);
  if (PCT_KINDS.size === 0 || PROVENANCE.size === 0) {
    err("schema is missing the pct_kind/provenance enums the validator enforces");
  }

  if (!Array.isArray(fixture) || fixture.length === 0) {
    err("fixture must be a non-empty array of ledger rows");
    return finish();
  }

  const byId = new Map();
  for (const row of fixture) {
    if (typeof row.measure_id === "string") {
      if (byId.has(row.measure_id)) err(`duplicate measure_id: ${row.measure_id}`);
      byId.set(row.measure_id, row);
    }
  }

  const allowedKeys = new Set(Object.keys(prop));
  for (const [index, row] of fixture.entries()) {
    const where = `row ${index}${row.measure_id ? ` (${row.measure_id})` : ""}`;
    for (const key of Object.keys(row)) {
      if (!allowedKeys.has(key)) err(`${where}: unknown property "${key}" (schema has additionalProperties: false)`);
    }
    for (const key of REQUIRED) {
      if (row[key] === undefined || row[key] === null || row[key] === "") err(`${where}: missing required field "${key}"`);
    }
    if (row.measure_id !== undefined && !ID_RE.test(row.measure_id)) err(`${where}: measure_id must be snake_case`);
    if (row.value !== undefined && !(typeof row.value === "number" && row.value >= 0 && Number.isFinite(row.value))) {
      err(`${where}: value must be a finite number >= 0`);
    }
    if (row.covered_works !== undefined && !(Number.isInteger(row.covered_works) && row.covered_works >= 0)) {
      err(`${where}: covered_works must be an integer >= 0`);
    }
    if (row.pct_of_base !== undefined && !(typeof row.pct_of_base === "number" && row.pct_of_base >= 0 && row.pct_of_base <= 100)) {
      err(`${where}: pct_of_base must be a number in [0, 100]`);
    }
    if (row.provenance !== undefined && !PROVENANCE.has(row.provenance)) {
      err(`${where}: provenance "${row.provenance}" not in schema enum`);
    }

    const hasPct = row.pct_of_base !== undefined;
    const hasKind = row.pct_kind !== undefined;
    if (hasPct !== hasKind) err(`${where}: pct_of_base and pct_kind must be present together`);
    if (hasPct && !PCT_KINDS.has(row.pct_kind)) err(`${where}: pct_kind "${row.pct_kind}" not in schema enum`);

    if (hasPct) {
      if (row.pct_kind === "share_of_base") {
        if (row.base_id === undefined) {
          err(`${where}: pct_of_base without base_id — no percentage without its base`);
          continue;
        }
        if (row.base_id === row.measure_id) err(`${where}: base_id must not be self-referential`);
        const base = byId.get(row.base_id);
        if (!base) {
          err(`${where}: base_id "${row.base_id}" does not resolve to any row`);
          continue;
        }
        const recomputed = round1((row.value / base.value) * 100);
        if (Math.abs(recomputed - row.pct_of_base) > 0.05) {
          err(`${where}: pct_of_base ${row.pct_of_base} != ${recomputed} (value/base_id.value)`);
        }
      } else if (row.pct_kind === "covered_over_value") {
        if (row.covered_works === undefined) {
          err(`${where}: covered_over_value requires covered_works`);
        } else {
          const recomputed = round1((row.covered_works / row.value) * 100);
          if (Math.abs(recomputed - row.pct_of_base) > 0.05) {
            err(`${where}: pct_of_base ${row.pct_of_base} != ${recomputed} (covered_works/value)`);
          }
        }
      }
    }
  }

  finish();
}

function finish() {
  if (errors.length > 0) {
    console.error(`denominator-ledger fixture: ${errors.length} error(s)`);
    for (const message of errors) console.error(`  - ${message}`);
    process.exit(1);
  }
  console.log("denominator-ledger fixture: valid");
}

main();
