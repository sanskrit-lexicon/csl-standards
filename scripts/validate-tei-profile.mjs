import fs from "node:fs";
import path from "node:path";
import { generatedAt } from "./lib/provenance.mjs";
import { ALL_DICTS, CORE_DICTS } from "./lib/dictionaries.mjs";

const root = process.cwd();
const errors = [];
const warnings = [];
const TEI_PROFILE = "tei-archival-profile-v0.1";
const VALIDATION_SCOPE = "full-tei-odd-profile";

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

function entryType(model) {
  if (model.phenomena?.includes("root")) return "verbal-root";
  if (model.phenomena?.includes("compound")) return "compound";
  if (model.phenomena?.includes("continuation")) return "continuation";
  return model.forms?.[0]?.type || "lemma";
}

function textForNote(xml, type) {
  const match = xml.match(new RegExp(`<note type="${type}">([\\s\\S]*?)<\\/note>`));
  return match?.[1]?.trim() || "";
}

function wellFormedEnough(xml, file) {
  const stack = [];
  const tagRe = /<\/?([A-Za-z_][\w:.-]*)(?:\s[^<>]*)?>/g;
  let match;
  while ((match = tagRe.exec(xml))) {
    const full = match[0];
    const name = match[1];
    if (full.startsWith("</")) {
      const open = stack.pop();
      if (open !== name) {
        errors.push(`${file}: closing </${name}> does not match <${open || "none"}>`);
        return false;
      }
    } else if (!full.endsWith("/>") && !full.startsWith("<?") && !full.startsWith("<!")) {
      stack.push(name);
    }
  }
  if (stack.length) {
    errors.push(`${file}: unclosed tags ${stack.join(", ")}`);
    return false;
  }
  return true;
}

function validateOdd() {
  const relative = "data/schema/tei-archival-profile.odd.xml";
  const file = path.join(root, relative);
  check(fs.existsSync(file), `${relative}: missing project ODD/schema profile`);
  if (!fs.existsSync(file)) return;

  const odd = fs.readFileSync(file, "utf8");
  wellFormedEnough(odd, relative);
  check(odd.includes('<schemaSpec ident="csl-tei-archival-profile-v0.1"'), `${relative}: missing schemaSpec ident`);
  for (const module of ["tei", "header", "core", "textstructure", "dictionaries", "linking"]) {
    check(odd.includes(`<moduleRef key="${module}"`), `${relative}: missing moduleRef ${module}`);
  }
  for (const required of ["csl-required-entry-shape", "source-entry", "profile-version", "validation-scope"]) {
    check(odd.includes(required), `${relative}: missing ODD constraint marker ${required}`);
  }
}

function validateTeiCase(model, reviewIds) {
  const stem = safeCaseId(model.id);
  const relative = `data/pilot/tei/${stem}.xml`;
  const file = path.join(root, relative);
  const caseErrors = [];
  const caseWarnings = [];
  const caseCheck = (condition, message) => check(condition, `${relative}: ${message}`, caseErrors);
  const caseWarn = (condition, message) => check(condition, `${relative}: ${message}`, caseWarnings);

  caseCheck(fs.existsSync(file), "missing TEI file");
  if (!fs.existsSync(file)) {
    return {id: model.id, key: model.key, status: "fail", errors: caseErrors, warnings: caseWarnings};
  }

  const xml = fs.readFileSync(file, "utf8");
  const status = textForNote(xml, "review-status");
  const expectedStatus = reviewIds.has(model.id) ? "validated-slice" : "full-machine-review";
  const sourceEntryCount = (xml.match(/<cit\b[^>]*type="source-entry"/g) || []).length;
  // The archival profile carries one source-entry per present dictionary: the
  // mw/pwg/pwk backbone plus any optional dictionary (ap90/gra) that has a record.
  const presentDicts = ALL_DICTS.filter(dict => model.records?.[dict]);
  const expectedSources = presentDicts.length;

  wellFormedEnough(xml, relative);
  caseCheck(xml.includes(`<TEI xmlns="http://www.tei-c.org/ns/1.0" xml:id="${stem}"`), "missing TEI namespace or case xml:id");
  caseCheck(xml.includes("<teiHeader>"), "missing teiHeader");
  caseCheck(xml.includes(`<entry xml:id="${stem}-entry" type="${entryType(model)}"`), `missing expected entry id/type ${entryType(model)}`);
  caseCheck(xml.includes("<form type="), "missing form");
  caseCheck(xml.includes('<orth notation="SLP1" xml:lang="sa-Latn-x-SLP1"'), "missing SLP1 orth");
  caseCheck(xml.includes(`<orth notation="SLP1" xml:lang="sa-Latn-x-SLP1">${model.forms?.[0]?.orth || model.key}</orth>`), "orth does not match neutral model form/key");
  caseCheck(xml.includes(TEI_PROFILE), "missing TEI profile version");
  caseCheck(textForNote(xml, "profile-version") === TEI_PROFILE, "profile-version note mismatch");
  caseCheck(textForNote(xml, "validation-scope") === VALIDATION_SCOPE, "validation-scope note mismatch");
  caseCheck(status === expectedStatus, `review-status expected ${expectedStatus}, found ${status || "none"}`);
  caseCheck(sourceEntryCount === expectedSources, `expected ${expectedSources} source-entry citations (${presentDicts.join("/")}), found ${sourceEntryCount}`);
  caseCheck(CORE_DICTS.every(dict => presentDicts.includes(dict)), `archival case must carry the ${CORE_DICTS.join("/")} backbone`);

  for (const dict of presentDicts) {
    caseCheck(xml.includes(`source="#dict-${dict}"`), `missing source-entry pointer for ${dict}`);
    caseCheck(xml.includes(`<idno type="L">${model.records?.[dict]?.L}</idno>`), `missing CDSL L number for ${dict}`);
  }

  caseCheck(xml.includes("&lt;L&gt;") && !xml.includes("<L>"), "raw CDSL tags must be escaped, not live pseudo-XML");
  caseCheck((xml.match(/<quote xml:space="preserve">/g) || []).length === expectedSources, `expected ${expectedSources} preserved source quotes`);
  caseWarn(xml.includes("<listBibl") || !model.phenomena.includes("hedge"), "hedge case lacks extracted citation index");

  // csl: evidence-class extension — every citation <bibl> carries a sub-typed
  // @subtype evidence class, and any <citedRange> has a value.
  const TEI_EVIDENCE_CLASSES = ["textual", "hedge", "kosha", "editorial"];
  const subtypes = [...xml.matchAll(/<bibl\b[^>]*\bsubtype="([^"]*)"/g)].map(m => m[1]);
  caseCheck(subtypes.every(s => TEI_EVIDENCE_CLASSES.includes(s)),
    `citation bibl has an invalid evidence-class @subtype (${subtypes.filter(s => !TEI_EVIDENCE_CLASSES.includes(s)).join(", ") || "none"})`);
  caseCheck(!xml.includes("<citedRange></citedRange>"), "empty <citedRange> emitted");

  if (model.phenomena.includes("hedge")) {
    caseCheck(xml.includes("generic-lexicographer-hedge"), "missing hedge evidence class");
    caseCheck(xml.includes('subtype="hedge"'), "hedge case lacks subtype=\"hedge\" on its citation");
  }
  if (model.phenomena.includes("root")) {
    caseCheck(xml.includes('type="verbal-root"'), "missing verbal-root entry type");
    caseCheck(xml.includes('type="root"'), "missing root relation");
  }
  if (model.phenomena.includes("compound")) {
    caseCheck(xml.includes('type="compound"'), "missing compound relation");
  }
  if (model.phenomena.includes("continuation")) {
    caseCheck(xml.includes("adjacency-continuation-parent"), "missing continuation relation");
    // §4 recovery status on the continuation <xr> @subtype.
    const recovery = xml.match(/<xr\b[^>]*type="adjacency-continuation-parent"[^>]*\bsubtype="([^"]*)"/)?.[1];
    caseCheck(["recovered", "conjectured", "unresolved"].includes(recovery),
      `continuation <xr> has missing/invalid recovery-status @subtype (${recovery || "none"})`);
  }

  return {
    id: model.id,
    key: model.key,
    status: caseErrors.length ? "fail" : "pass",
    reviewStatus: status,
    profileVersion: textForNote(xml, "profile-version"),
    validationScope: textForNote(xml, "validation-scope"),
    entryType: entryType(model),
    sourceEntryCount,
    phenomena: model.phenomena || [],
    errors: caseErrors,
    warnings: caseWarnings
  };
}

validateOdd();

const models = readJson("data/pilot/neutral-model.json");
const review = readJson("data/pilot/review-cases.json");
const reviewIds = new Set(review.items.map(item => item.id));

check(models.length >= 50, `expected at least 50 neutral models, found ${models.length}`);
check(review.items.length === 15, `expected 15 initial review cases, found ${review.items.length}`);

const items = models.map(model => validateTeiCase(model, reviewIds));
for (const item of items) {
  errors.push(...item.errors);
  warnings.push(...item.warnings);
}

const report = {
  generatedAt: generatedAt(),
  generator: "scripts/validate-tei-profile.mjs",
  profileVersion: TEI_PROFILE,
  validationScope: VALIDATION_SCOPE,
  schemaProfile: "data/schema/tei-archival-profile.odd.xml",
  reviewType: "machine-review",
  caveat: "This is full machine review and project ODD/profile validation, not a human philological review.",
  totals: {
    cases: items.length,
    passed: items.filter(item => item.status === "pass").length,
    failed: items.filter(item => item.status === "fail").length,
    warnings: warnings.length
  },
  items
};

writeJson("data/pilot/tei-review.json", report);
writeJson("src/data/pilot/tei-review.json", report);

if (errors.length) {
  console.error(`TEI ODD/profile validation failed with ${errors.length} problem(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`TEI ODD/profile validation passed: ${items.length} cases; ${warnings.length} warning(s).`);
