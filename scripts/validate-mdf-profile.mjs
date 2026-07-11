import fs from "node:fs";
import path from "node:path";
import { generatedAt } from "./lib/provenance.mjs";

// MDF marker-profile validation, parallel to validate-tei-profile.mjs and
// validate-ontolex-profile.mjs. It checks that every exported `.mdf` record is a
// well-formed MDF field block using only the profile's marker inventory, that the
// per-phenomenon content promised by docs/MDF_EXPORT_MAPPING.md is present, and
// that every `lossy` adequacy call is made visible with a `\nt` model-loss marker
// (never silently flattened). This is machine/profile validation, not a human
// philological review.

const root = process.cwd();
const errors = [];
const warnings = [];
const PROFILE_VERSION = "mdf-export-profile-v0.1";
const VALIDATION_SCOPE = "full-mdf-marker-profile";

function safeCaseId(id) {
  return id.replace(/:/g, "-");
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function writeJson(relativePath, value) {
  const file = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function check(condition, message, bucket = errors) {
  if (!condition) bucket.push(message);
}

function entryType(model) {
  if (model.phenomena?.includes("root")) return "verbal-root";
  if (model.phenomena?.includes("compound")) return "compound";
  if (model.phenomena?.includes("continuation")) return "continuation";
  return model.forms?.[0]?.type || "lemma";
}

// Parse an MDF record into an ordered list of { marker, value } fields.
function parseFields(text) {
  const fields = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const m = line.match(/^\\(\w+)(?:\s+(.*))?$/);
    if (!m) { fields.push({ marker: null, raw: line }); continue; }
    fields.push({ marker: m[1], value: (m[2] || "").trim() });
  }
  return fields;
}

function validateProfileSchema() {
  const relative = "data/schema/mdf-export-profile.json";
  const file = path.join(root, relative);
  check(fs.existsSync(file), `${relative}: missing MDF marker-profile schema`);
  if (!fs.existsSync(file)) return { allowedMarkers: new Set(), fieldOrder: [] };

  const schema = readJson(relative);
  check(schema.profile === PROFILE_VERSION, `${relative}: profile version mismatch`);
  check(schema.validationScope === VALIDATION_SCOPE, `${relative}: validation scope mismatch`);
  check(schema.recordStart === "\\lx", `${relative}: recordStart must be \\lx`);
  check(schema.modelLossMarker === "\\nt", `${relative}: modelLossMarker must be \\nt`);
  check(Array.isArray(schema.markers) && schema.markers.length > 0, `${relative}: missing marker inventory`);
  for (const required of ["\\lx", "\\ps", "\\ge", "\\bb", "\\cf", "\\nt", "\\hm", "\\lc"]) {
    check(schema.markers.includes(required), `${relative}: marker inventory missing ${required}`);
  }
  check(Array.isArray(schema.fieldOrder) && schema.fieldOrder.length > 0, `${relative}: missing fieldOrder`);
  check(
    (schema.fieldOrder || []).every(mk => (schema.markers || []).includes(mk)),
    `${relative}: fieldOrder contains a marker outside the marker inventory`
  );
  // Allowed marker names (without the leading backslash) for per-record checks.
  return {
    allowedMarkers: new Set((schema.markers || []).map(mk => mk.replace(/^\\/, ""))),
    fieldOrder: (schema.fieldOrder || []).map(mk => mk.replace(/^\\/, ""))
  };
}

// Check the record's field sequence against the profile's canonical relative
// order (App. B: identity -> grammar -> sense block -> etymology -> relation/
// bibliography -> structural/note fields). Marker pairs that legitimately
// alternate across repeats (\sn/\ge within a sense block, \lf/\le across
// multiple compound components) share one order key; any other marker
// repeating in a run (\cf, \bb, \nt) is also a same-key repeat. A field is out
// of order only when its key is strictly *less* than the highest key already
// seen.
function fieldOrderViolations(markers, fieldOrder) {
  const senseKey = Math.min(fieldOrder.indexOf("sn"), fieldOrder.indexOf("ge"));
  const lexFuncKey = Math.min(fieldOrder.indexOf("lf"), fieldOrder.indexOf("le"));
  const keyOf = marker => {
    if (marker === "sn" || marker === "ge") return senseKey;
    if (marker === "lf" || marker === "le") return lexFuncKey;
    const idx = fieldOrder.indexOf(marker);
    return idx === -1 ? null : idx; // unknown markers are reported separately; skip here
  };
  const violations = [];
  let maxKeySeen = -1;
  for (const marker of markers) {
    const key = keyOf(marker);
    if (key === null) continue;
    if (key < maxKeySeen) violations.push(marker);
    else maxKeySeen = Math.max(maxKeySeen, key);
  }
  return violations;
}

function validateCase(model, reviewIds, allowedMarkers, fieldOrder) {
  const stem = safeCaseId(model.id);
  const relative = `data/pilot/mdf/${stem}.mdf`;
  const file = path.join(root, relative);
  const caseErrors = [];
  const caseWarnings = [];
  const caseCheck = (condition, message) => check(condition, `${relative}: ${message}`, caseErrors);
  const caseWarn = (condition, message) => check(condition, `${relative}: ${message}`, caseWarnings);

  caseCheck(fs.existsSync(file), "missing MDF file");
  if (!fs.existsSync(file)) {
    return { id: model.id, key: model.key, status: "fail", errors: caseErrors, warnings: caseWarnings };
  }

  const text = fs.readFileSync(file, "utf8");
  const fields = parseFields(text);
  const markers = fields.map(f => f.marker);
  const byMarker = marker => fields.filter(f => f.marker === marker);
  const expectedReview = reviewIds.has(model.id) ? "validated-slice" : "full-machine-review";

  // Structure: a record is a block of MDF fields beginning with \lx; every line is
  // a recognised marker from the profile inventory (no stray/unknown markers).
  caseCheck(markers[0] === "lx", "record must begin with \\lx");
  caseCheck(!fields.some(f => f.marker === null), "record contains a non-marker line");
  const unknown = [...new Set(markers.filter(m => m && !allowedMarkers.has(m)))];
  caseCheck(unknown.length === 0, `record uses markers outside the profile inventory: ${unknown.join(", ")}`);

  // Field order: the record's markers must follow the profile's canonical
  // relative order (App. B). Checked here, once, over the full marker sequence
  // rather than per-field, since it is a whole-record property.
  const orderViolations = [...new Set(fieldOrderViolations(markers.filter(Boolean), fieldOrder))];
  caseCheck(orderViolations.length === 0, `record violates the canonical field order at: ${orderViolations.join(", ")}`);

  // Headword identity.
  const lx = byMarker("lx")[0]?.value;
  const expectedHeadword = model.forms?.[0]?.orth || model.key;
  caseCheck(lx === expectedHeadword, `\\lx expected ${expectedHeadword}, found ${lx || "none"}`);

  // MW is a retrieval dictionary with no examples — the example fields must stay
  // empty (an expected empty, not missing data).
  caseCheck(byMarker("xv").length === 0 && byMarker("xn").length === 0, "MW record must not populate \\xv / \\xn example fields");

  // Senses: at least one \ge when the model has senses; multi-sense records carry
  // \sn numbering (one per sense) plus the inferred-numbering note.
  const senseCount = (model.senses || []).filter(s => s.def).length;
  const geCount = byMarker("ge").length;
  const snCount = byMarker("sn").length;
  if (senseCount > 0) caseCheck(geCount >= 1, "model has senses but record has no \\ge gloss");
  if (senseCount > 1) {
    caseCheck(snCount === senseCount, `expected ${senseCount} \\sn markers for prose senses, found ${snCount}`);
    caseCheck(geCount === senseCount, `expected ${senseCount} \\ge glosses, found ${geCount}`);
    caseCheck(/\\nt sense-numbering: inferred/.test(text), "multi-sense record lacks the inferred-numbering note");
  } else {
    caseCheck(snCount === 0, "monosemous record must omit \\sn per MDF convention");
  }

  // Meta note carries the profile version, scope, review status and source pointer.
  const meta = byMarker("nt").map(f => f.value).find(v => v.startsWith("meta:")) || "";
  caseCheck(meta.includes(`profile=${PROFILE_VERSION}`), "meta note missing profile version");
  caseCheck(meta.includes(`scope=${VALIDATION_SCOPE}`), "meta note missing validation scope");
  caseCheck(meta.includes(`review=${expectedReview}`), `meta note review status expected ${expectedReview}`);
  caseCheck(meta.includes(`entry-type=${entryType(model)}`), `meta note entry-type expected ${entryType(model)}`);
  caseCheck(meta.includes(`L=${model.records?.mw?.L}`), "meta note missing MW L source pointer");

  // Lossy-adequacy phenomena must each be made visible with a \nt model-loss marker
  // (docs/MDF_EXPORT_MAPPING.md: the flattening is never silent).
  const lossNotes = byMarker("nt").map(f => f.value).filter(v => v.startsWith("model-loss:"));
  // The MDF profile is MW-focused, so the hedge marker is required only when the
  // MW witness itself carries the L. hedge — not merely when the (cross-dictionary)
  // hedge phenomenon flag is set (e.g. the hedge lives only in PWG/PWK/AP90).
  const mwHasHedge = (model.citations || []).some(c => c.dictionary === "mw" && (c.type === "generic-lexicographer-hedge" || c.source === "L."));
  if (mwHasHedge) {
    caseCheck(byMarker("bb").some(f => f.value === "L."), "MW-hedge case must preserve the L. hedge as \\bb L.");
    caseCheck(lossNotes.some(v => /generic-lexicographer hedge/.test(v)), "MW-hedge case lacks its \\nt model-loss marker");
  }
  if (model.phenomena?.includes("root")) {
    caseCheck(lossNotes.some(v => /root\/derivation/.test(v)), "root case lacks its \\nt model-loss marker");
  }
  if (model.phenomena?.includes("compound")) {
    const decomp = model.relations?.find(rel => rel.type === "lexical-decomposition");
    if (decomp?.components?.length) {
      // Compound decomposition is typed via \lf Compound + \le (App. D), not
      // flattened to \cf, so it is `partial` adequacy and carries no model-loss
      // note (only lossy phenomena require one).
      const lfCount = byMarker("lf").filter(f => f.value === "Compound").length;
      caseCheck(lfCount >= 1, "compound case with components lacks \\lf Compound");
      caseCheck(byMarker("le").length === lfCount, "\\lf Compound / \\le pair count mismatch");
    }
  }
  if (model.phenomena?.includes("continuation")) {
    caseCheck(lossNotes.some(v => /continuation record/.test(v)), "continuation case lacks its \\nt model-loss marker");
  }

  // Homonym: when MW's raw carries <h>, the record must surface it as \hm.
  const hasHom = /<h>\d+/.test(model.records?.mw?.raw || "");
  caseWarn(!hasHom || byMarker("hm").length === 1, "MW record has a homonym number but the MDF record has no \\hm");

  return {
    id: model.id,
    key: model.key,
    status: caseErrors.length ? "fail" : "pass",
    reviewStatus: expectedReview,
    profileVersion: PROFILE_VERSION,
    validationScope: VALIDATION_SCOPE,
    entryType: entryType(model),
    fieldCount: fields.length,
    senseCount,
    modelLossMarkers: lossNotes.length,
    markersUsed: [...new Set(markers.filter(Boolean))],
    phenomena: model.phenomena || [],
    errors: caseErrors,
    warnings: caseWarnings
  };
}

const { allowedMarkers, fieldOrder } = validateProfileSchema();

const models = readJson("data/pilot/neutral-model.json");
const review = readJson("data/pilot/review-cases.json");
const reviewIds = new Set(review.items.map(item => item.id));

check(models.length >= 50, `expected at least 50 neutral models, found ${models.length}`);
check(review.items.length === 15, `expected 15 initial review cases, found ${review.items.length}`);

const items = models.map(model => validateCase(model, reviewIds, allowedMarkers, fieldOrder));
for (const item of items) {
  errors.push(...item.errors);
  warnings.push(...item.warnings);
}

const report = {
  generatedAt: generatedAt(),
  generator: "scripts/validate-mdf-profile.mjs",
  profileVersion: PROFILE_VERSION,
  validationScope: VALIDATION_SCOPE,
  markerProfile: "data/schema/mdf-export-profile.json",
  reviewType: "machine-review",
  caveat: "This is full machine review and project MDF marker-profile validation, not a human philological review.",
  totals: {
    cases: items.length,
    passed: items.filter(item => item.status === "pass").length,
    failed: items.filter(item => item.status === "fail").length,
    warnings: warnings.length,
    modelLossMarkers: items.reduce((s, i) => s + (i.modelLossMarkers || 0), 0)
  },
  items
};

writeJson("data/pilot/mdf-review.json", report);
writeJson("src/data/pilot/mdf-review.json", report);

if (errors.length) {
  console.error(`MDF marker-profile validation failed with ${errors.length} problem(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`MDF marker-profile validation passed: ${items.length} records; ${warnings.length} warning(s).`);
