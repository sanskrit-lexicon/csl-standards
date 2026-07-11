import fs from "node:fs";
import path from "node:path";
import { generatedAt } from "./lib/provenance.mjs";

// LIFT entry-profile validation, parallel to validate-mdf-profile.mjs. It checks
// that every exported `.lift` fragment is a well-formed single-entry LIFT document
// (root <lift>, one <entry>, only elements from the profile inventory), that the
// per-phenomenon content promised by docs/LIFT_EXPORT_MAPPING.md is present, and
// that every `lossy` adequacy call carries a <note type="model-loss"> (never
// silently dropped by the format switch from MDF's \nt). Structural/profile
// validation only — not a full LIFT 0.13 RelaxNG conformance check and not a
// human philological review.

const root = process.cwd();
const errors = [];
const warnings = [];
const PROFILE_VERSION = "lift-export-profile-v0.1";
const VALIDATION_SCOPE = "full-lift-entry-profile";

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

// Lightweight tag scan — deliberately not a full XML parser (no dependency added
// for a fragment this constrained): finds every opening tag with its attributes
// and every element's text content by simple regex, sufficient to check the
// profile's own element/attribute contract.
function scanTags(text) {
  const tags = [];
  const re = /<([a-zA-Z-]+)((?:\s+[a-zA-Z-]+="[^"]*")*)\s*\/?>/g;
  let m;
  while ((m = re.exec(text))) {
    const attrs = {};
    for (const am of m[2].matchAll(/([a-zA-Z-]+)="([^"]*)"/g)) attrs[am[1]] = am[2];
    tags.push({ name: m[1], attrs, selfClosing: m[0].endsWith("/>") });
  }
  return tags;
}

function textOf(source, openTagRegex) {
  const m = source.match(openTagRegex);
  return m ? m[1].trim() : null;
}

function validateProfileSchema() {
  const relative = "data/schema/lift-export-profile.json";
  const file = path.join(root, relative);
  check(fs.existsSync(file), `${relative}: missing LIFT entry-profile schema`);
  if (!fs.existsSync(file)) return new Set();

  const schema = readJson(relative);
  check(schema.profile === PROFILE_VERSION, `${relative}: profile version mismatch`);
  check(schema.validationScope === VALIDATION_SCOPE, `${relative}: validation scope mismatch`);
  check(schema.rootElement === "lift", `${relative}: rootElement must be lift`);
  check(schema.entryElement === "entry", `${relative}: entryElement must be entry`);
  check(schema.modelLossNoteType === "model-loss", `${relative}: modelLossNoteType must be model-loss`);
  check(Array.isArray(schema.elements) && schema.elements.length > 0, `${relative}: missing element inventory`);
  for (const required of ["entry", "lexical-unit", "sense", "gloss", "relation", "note", "form", "text"]) {
    check(schema.elements.includes(required), `${relative}: element inventory missing ${required}`);
  }
  return new Set(schema.elements || []);
}

function validateCase(model, reviewIds, allowedElements) {
  const stem = safeCaseId(model.id);
  const relative = `data/pilot/lift/${stem}.lift`;
  const file = path.join(root, relative);
  const caseErrors = [];
  const caseWarnings = [];
  const caseCheck = (condition, message) => check(condition, `${relative}: ${message}`, caseErrors);
  const caseWarn = (condition, message) => check(condition, `${relative}: ${message}`, caseWarnings);

  caseCheck(fs.existsSync(file), "missing LIFT file");
  if (!fs.existsSync(file)) {
    return { id: model.id, key: model.key, status: "fail", errors: caseErrors, warnings: caseWarnings };
  }

  const text = fs.readFileSync(file, "utf8");
  caseCheck(text.startsWith("<?xml"), "file must start with an XML declaration");
  caseCheck(/<lift version="[^"]+"[^>]*>[\s\S]*<\/lift>\s*$/.test(text), "root element must be a single <lift>...</lift> document");

  const entryMatch = text.match(/<entry\s+([^>]*)>([\s\S]*)<\/entry>/);
  caseCheck(!!entryMatch, "document must contain exactly one <entry>");
  if (!entryMatch) {
    return { id: model.id, key: model.key, status: "fail", errors: caseErrors, warnings: caseWarnings };
  }
  caseCheck((text.match(/<entry\s/g) || []).length === 1, "document must contain exactly one <entry> (found more than one)");

  const tags = scanTags(text);
  const unknown = [...new Set(tags.map(t => t.name).filter(n => !allowedElements.has(n)))];
  caseCheck(unknown.length === 0, `document uses elements outside the profile inventory: ${unknown.join(", ")}`);

  // Headword identity.
  const expectedHeadword = model.forms?.[0]?.orth || model.key;
  const lx = textOf(text, /<lexical-unit>\s*<form[^>]*>\s*<text>([^<]*)<\/text>/);
  caseCheck(lx === expectedHeadword, `lexical-unit expected ${expectedHeadword}, found ${lx || "none"}`);

  // Senses: same inference/count rules as the MDF twin.
  const senseCount = (model.senses || []).filter(s => s.def).length;
  const senseTags = (text.match(/<sense\b/g) || []).length;
  const glossTags = (text.match(/<gloss\b/g) || []).length;
  if (senseCount > 0) caseCheck(senseTags >= 1, "model has senses but entry has no <sense>");
  if (senseCount > 1) {
    caseCheck(senseTags === senseCount, `expected ${senseCount} <sense> elements for prose senses, found ${senseTags}`);
    caseCheck(glossTags === senseCount, `expected ${senseCount} <gloss> elements, found ${glossTags}`);
    caseCheck(/<note type="sense-numbering">/.test(text), "multi-sense entry lacks the inferred-numbering note");
  } else if (senseCount === 1) {
    caseCheck(senseTags === 1, "monosemous entry must have exactly one <sense>");
  }

  // Meta note carries the profile version, scope, review status, entry type, source pointer.
  const expectedReview = reviewIds.has(model.id) ? "validated-slice" : "full-machine-review";
  const meta = textOf(text, /<note type="meta">\s*<form[^>]*>\s*<text>([^<]*)<\/text>/) || "";
  caseCheck(meta.includes(`profile=${PROFILE_VERSION}`), "meta note missing profile version");
  caseCheck(meta.includes(`scope=${VALIDATION_SCOPE}`), "meta note missing validation scope");
  caseCheck(meta.includes(`review=${expectedReview}`), `meta note review status expected ${expectedReview}`);
  caseCheck(meta.includes(`entry-type=${entryType(model)}`), `meta note entry-type expected ${entryType(model)}`);
  caseCheck(meta.includes(`L=${model.records?.mw?.L}`), "meta note missing MW L source pointer");

  // Lossy-adequacy phenomena must each carry a <note type="model-loss"> — the same
  // trigger conditions as validate-mdf-profile.mjs, so the two profiles stay in
  // lockstep on what counts as lossy.
  const lossNoteTexts = [...text.matchAll(/<note type="model-loss">\s*<form[^>]*>\s*<text>([^<]*)<\/text>/g)].map(m => m[1]);
  const mwHasHedge = (model.citations || []).some(c => c.dictionary === "mw" && (c.type === "generic-lexicographer-hedge" || c.source === "L."));
  if (mwHasHedge) {
    caseCheck(/<note type="source">\s*<form[^>]*>\s*<text>L\.<\/text>/.test(text), "MW-hedge case must preserve the L. hedge as a source note");
    caseCheck(lossNoteTexts.some(v => /generic-lexicographer hedge/.test(v)), "MW-hedge case lacks its model-loss note");
  }
  if (model.phenomena?.includes("root")) {
    caseCheck(lossNoteTexts.some(v => /root\/derivation/.test(v)), "root case lacks its model-loss note");
  }
  if (model.phenomena?.includes("compound")) {
    const decomp = model.relations?.find(rel => rel.type === "lexical-decomposition");
    if (decomp?.components?.length) {
      // Typed via <relation type="Compound">, the LIFT twin of MDF's \lf
      // Compound (partial adequacy) — no model-loss note required.
      caseCheck((text.match(/<relation type="Compound"/g) || []).length >= 1, "compound case with components lacks <relation type=\"Compound\">");
    }
  }
  if (model.phenomena?.includes("continuation")) {
    caseCheck(lossNoteTexts.some(v => /continuation entry/.test(v)), "continuation case lacks its model-loss note");
  }

  // Homonym: when MW's raw carries <h>, the entry must surface it as the order attribute.
  const hasHom = /<h>\d+/.test(model.records?.mw?.raw || "");
  const orderAttr = entryMatch[1].match(/order="(\d+)"/)?.[1];
  caseWarn(!hasHom || !!orderAttr, "MW record has a homonym number but the LIFT entry has no order attribute");

  return {
    id: model.id,
    key: model.key,
    status: caseErrors.length ? "fail" : "pass",
    reviewStatus: expectedReview,
    profileVersion: PROFILE_VERSION,
    validationScope: VALIDATION_SCOPE,
    entryType: entryType(model),
    senseCount,
    modelLossNotes: lossNoteTexts.length,
    elementsUsed: [...new Set(tags.map(t => t.name))],
    phenomena: model.phenomena || [],
    errors: caseErrors,
    warnings: caseWarnings
  };
}

const allowedElements = validateProfileSchema();

const models = readJson("data/pilot/neutral-model.json");
const review = readJson("data/pilot/review-cases.json");
const reviewIds = new Set(review.items.map(item => item.id));

check(models.length >= 50, `expected at least 50 neutral models, found ${models.length}`);
check(review.items.length === 15, `expected 15 initial review cases, found ${review.items.length}`);

const items = models.map(model => validateCase(model, reviewIds, allowedElements));
for (const item of items) {
  errors.push(...item.errors);
  warnings.push(...item.warnings);
}

const report = {
  generatedAt: generatedAt(),
  generator: "scripts/validate-lift-profile.mjs",
  profileVersion: PROFILE_VERSION,
  validationScope: VALIDATION_SCOPE,
  entryProfile: "data/schema/lift-export-profile.json",
  reviewType: "machine-review",
  caveat: "This is full machine review and project LIFT entry-profile validation (not RelaxNG conformance), not a human philological review.",
  totals: {
    cases: items.length,
    passed: items.filter(item => item.status === "pass").length,
    failed: items.filter(item => item.status === "fail").length,
    warnings: warnings.length,
    modelLossNotes: items.reduce((s, i) => s + (i.modelLossNotes || 0), 0)
  },
  items
};

writeJson("data/pilot/lift-review.json", report);
writeJson("src/data/pilot/lift-review.json", report);

if (errors.length) {
  console.error(`LIFT entry-profile validation failed with ${errors.length} problem(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`LIFT entry-profile validation passed: ${items.length} entries; ${warnings.length} warning(s).`);
