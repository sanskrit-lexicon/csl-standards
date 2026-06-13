// Generate TEI Lex-0 baseline entries from the neutral model.
//
// Distinct from scripts/export-tei.mjs (the archival profile,
// tei-archival-profile-v0.1): this emits the DARIAH TEI Lex-0 baseline element
// set (entry, form/orth, gramGrp/pos+gen, sense/def, cit/quote, bibl, etym,
// usg, re) and binds each statement's epistemic status to @cert/@resp per
// docs/EVIDENCE_LABEL_CROSSWALK.md. It does NOT emit the archival
// <cit type="source-entry"> raw quotes.
//
// Inputs: data/pilot/neutral-model.json (50 MW/PWG/PWK cases) plus an optional
// data/pilot/lex0-fixtures.json — extra entries whose senses are provided
// explicitly rather than extracted from MW raw. For the indigenous SKD kosa
// case that file is produced from source by scripts/parse-skd-kosa.mjs.
//
// Usage: npm run export-tei-lex0
// See docs/TEI_LEX0_PILOT.md.

import fs from "node:fs/promises";
import path from "node:path";

const PROFILE_VERSION = "tei-lex0-pilot-v0.1";

function escapeXml(value) {
  return String(value ?? "").replace(/[<>&'"]/g, char => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;"
  })[char]);
}

function safeCaseId(id) {
  return id.replace(/:/g, "-");
}

function stripPseudoMarkup(raw) {
  return String(raw || "")
    .replace(/\{#([^#]+)#\}/g, "$1")
    .replace(/\{%([^%]+)%\}/g, "$1")
    .replace(/<ls\b[^>]*>([\s\S]*?)<\/ls>/g, " $1 ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Mirror of export-tei.mjs sense extraction, for the MW/PWG/PWK cases whose
// neutral model carries no explicit senses.
function extractDefinitions(raw, phenomena) {
  const plain = stripPseudoMarkup(raw);
  const defs = [];
  if ((phenomena || []).includes("root")) {
    for (const match of plain.matchAll(/\bto\s+([^;:.]+?)(?=,?\s+(?:L\.|RV\.|TS\.|AV\.|VS\.|Dharma|See)|;|:|$)/g)) {
      const def = match[1].replace(/\s+/g, " ").trim();
      if (def && def.length <= 120 && !defs.includes(def)) defs.push(def);
      if (defs.length >= 8) break;
    }
  }
  if (defs.length === 0) {
    for (const match of String(raw || "").matchAll(/\{%([^%]+)%\}/g)) {
      const def = stripPseudoMarkup(match[1]);
      if (def && def.length <= 120 && !defs.includes(def)) defs.push(def);
      if (defs.length >= 6) break;
    }
  }
  return defs;
}

// Evidence label -> TEI @cert / @resp (docs/EVIDENCE_LABEL_CROSSWALK.md sec. A).
function cert(evidence, sourceResp = "#source") {
  switch (evidence) {
    case "observed": return ` cert="high" resp="${sourceResp}"`;
    case "derived": return ` cert="high" resp="#machine"`;
    case "inferred": return ` cert="low" resp="#machine"`;
    case "reviewed": return ` cert="high" resp="#reviewer"`;
    default: return "";
  }
}

const GENDER_NORM = new Map([
  ["m", "masculine"], ["m.", "masculine"], ["pum", "masculine"], ["puṃ", "masculine"], ["puM", "masculine"],
  ["f", "feminine"], ["f.", "feminine"], ["stri", "feminine"], ["strī", "feminine"], ["strI", "feminine"],
  ["n", "neuter"], ["n.", "neuter"], ["kli", "neuter"], ["klī", "neuter"], ["klI", "neuter"], ["napum", "neuter"]
]);

function indent(lines, pad) {
  return lines.filter(Boolean).map(line => pad + line).join("\n");
}

function gramGrpXml(model) {
  const form = model.forms?.[0] || {};
  const rows = [];
  // explicit normalized genders (fixtures) win
  const genders = model.genders
    || (form.grammar ? form.grammar.split(/\s+/).map(t => GENDER_NORM.get(t)).filter(Boolean) : []);
  const isVerb = form.type === "verbal-root" || /\bcl\.?\b/.test(form.grammar || "");
  if (isVerb) {
    rows.push(`<pos norm="verb"${cert("derived")}>verb</pos>`);
    if (form.verbClass) rows.push(`<gram type="verb-class"${cert("observed", "#source")}>${escapeXml(form.verbClass)}</gram>`);
  } else if (genders.length) {
    rows.push(`<pos norm="noun"${cert("derived")}>noun</pos>`);
    for (const g of genders) rows.push(`<gen norm="${escapeXml(g)}"${cert("observed")}>${escapeXml(g)}</gen>`);
  } else if (form.grammar) {
    rows.push(`<gram type="category"${cert("observed")}>${escapeXml(form.grammar)}</gram>`);
  }
  if (!rows.length) return "";
  return ["<gramGrp>", ...rows.map(r => "  " + r), "</gramGrp>"].join("\n");
}

function senseXml(sense, id, index) {
  const sid = `${id}-sense-${index + 1}`;
  const lines = [`<sense xml:id="${sid}" n="${index + 1}">`];
  const lang = sense.lang || "en";
  const ev = sense.evidence || "derived";
  lines.push(`  <def xml:lang="${escapeXml(lang)}"${cert(ev)}>${escapeXml(sense.def)}</def>`);
  if (sense.example) {
    lines.push(`  <cit type="example" xml:lang="sa">`);
    lines.push(`    <quote xml:space="preserve">${escapeXml(sense.example.quote)}</quote>`);
    lines.push(`    <bibl><title>${escapeXml(sense.example.source)}</title>${sense.example.cited ? `<citedRange>${escapeXml(sense.example.cited)}</citedRange>` : ""}</bibl>`);
    lines.push(`  </cit>`);
  }
  if (sense.authority) {
    const a = sense.authority;
    const inner = a.author ? `<author>${escapeXml(a.author)}</author>` : `<title>${escapeXml(a.title)}</title>`;
    lines.push(`  <bibl>${inner}${a.cited ? `<citedRange>${escapeXml(a.cited)}</citedRange>` : ""}</bibl>`);
  }
  if (sense.loss) {
    lines.push(`  <note type="model-loss" resp="#source">${escapeXml(sense.loss)}</note>`);
  }
  lines.push(`</sense>`);
  return lines.join("\n");
}

function citationsXml(model, id) {
  // Lex-0: named source citations and the MW lexicographer hedge, entry-level
  // (the neutral model does not link citations to specific senses).
  const named = (model.citations || []).filter(c => c.type !== "generic-lexicographer-hedge");
  const hedges = (model.citations || []).filter(c => c.type === "generic-lexicographer-hedge");
  const rows = [];
  for (const h of hedges) {
    rows.push(`<usg type="hint"${cert("observed")}>lexicographers only (${escapeXml(h.source)})</usg>`);
  }
  named.forEach((c, i) => {
    rows.push(`<bibl xml:id="${id}-cite-${i + 1}" type="named-source"${cert("observed")}><abbr>${escapeXml(c.source)}</abbr></bibl>`);
  });
  return rows;
}

function etymXml(model, id) {
  const rows = [];
  const whitney = model.relations?.find(r => r.type === "whitney-root-association")?.target;
  if (whitney) {
    rows.push(`<etym xml:id="${id}-etym-root" type="root"><lbl>verbal root</lbl> <ref type="whitney-root" target="urn:csl:whitney-root:${escapeXml(whitney)}"${cert("observed")}>${escapeXml(whitney)}</ref></etym>`);
  }
  const etym = model.relations?.find(r => r.type === "etymology");
  if (etym) {
    rows.push(`<etym xml:id="${id}-etym" type="derivation"><lbl>${escapeXml(etym.label || "from")}</lbl> <mentioned xml:lang="sa">${escapeXml(etym.mention || "")}</mentioned>${etym.source ? ` <bibl><title>${escapeXml(etym.source)}</title></bibl>` : ""}</etym>`);
  }
  return rows;
}

function entryXml(model) {
  const id = safeCaseId(model.id);
  const form = model.forms?.[0] || { orth: model.key, type: "lemma" };
  const dict = Object.keys(model.records || {})[0] || "mw";
  const rec = model.records?.[dict] || {};

  // senses: explicit (fixtures) or extracted from MW raw (the 50 cases)
  let senses = model.senses;
  if (!senses || !senses.length) {
    senses = extractDefinitions(model.records?.mw?.raw, model.phenomena).map(def => ({ def, lang: "en", evidence: "derived" }));
  }

  const body = [];
  body.push(`<entry xml:id="${id}" xml:lang="sa">`);
  body.push(`  <form type="lemma">`);
  body.push(`    <orth notation="SLP1" xml:lang="sa-Latn-x-SLP1"${cert("observed")}>${escapeXml(form.orth || model.key)}</orth>`);
  body.push(`  </form>`);
  const gram = gramGrpXml(model);
  if (gram) body.push(indent(gram.split("\n"), "  "));
  for (const e of etymXml(model, id)) body.push("  " + e);
  if (senses.length) {
    senses.forEach((s, i) => body.push(indent(senseXml(s, id, i).split("\n"), "  ")));
  } else {
    body.push(`  <sense xml:id="${id}-sense-unparsed"><note type="sense-status">No machine sense extracted; see the archival profile for the source record.</note></sense>`);
  }
  for (const c of citationsXml(model, id)) body.push("  " + c);
  for (const note of model.loss || []) body.push(`  <note type="model-loss" resp="#source">${escapeXml(note)}</note>`);
  body.push(`  <note type="source-record">${escapeXml(dict)} L${escapeXml(rec.L)}</note>`);
  body.push(`  <note type="profile-version">${PROFILE_VERSION}</note>`);
  body.push(`</entry>`);
  return body.join("\n");
}

function teiDocument(model) {
  const id = safeCaseId(model.id);
  return `<?xml version="1.0" encoding="UTF-8"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0" xml:id="${id}">
  <teiHeader>
    <fileDesc>
      <titleStmt>
        <title>CDSL TEI Lex-0 entry: ${escapeXml(model.key)}</title>
        <respStmt xml:id="source"><resp>headword, grammar, and citations as printed</resp><name>CDSL source dictionary</name></respStmt>
        <respStmt xml:id="machine"><resp>derived classification and gloss extraction</resp><name>scripts/export-tei-lex0.mjs</name></respStmt>
      </titleStmt>
      <publicationStmt>
        <publisher>CSL Standards</publisher>
        <availability><licence target="https://creativecommons.org/licenses/by-sa/4.0/">CC-BY-SA-4.0</licence></availability>
      </publicationStmt>
      <sourceDesc><p>Derived from CDSL source records for the TEI Lex-0 baseline pilot.</p></sourceDesc>
    </fileDesc>
    <encodingDesc>
      <projectDesc><p>${PROFILE_VERSION}; DARIAH TEI Lex-0 baseline element model. Per-statement epistemic status is carried in @cert/@resp (docs/EVIDENCE_LABEL_CROSSWALK.md).</p></projectDesc>
    </encodingDesc>
  </teiHeader>
  <text>
    <body>
${indent(entryXml(model).split("\n"), "      ")}
    </body>
  </text>
</TEI>
`;
}

async function readJsonIfExists(file) {
  try { return JSON.parse(await fs.readFile(file, "utf8")); }
  catch { return null; }
}

async function main() {
  const root = process.cwd();
  const models = JSON.parse(await fs.readFile(path.resolve(root, "data", "pilot", "neutral-model.json"), "utf8"));
  const fixtures = await readJsonIfExists(path.resolve(root, "data", "pilot", "lex0-fixtures.json")) || [];
  const outputDir = path.resolve(root, "data", "pilot", "tei-lex0");
  await fs.mkdir(outputDir, { recursive: true });
  // Clear only our own generated outputs; preserve the hand-authored
  // *.lex0.tei.xml exemplar that documents the target encoding.
  for (const f of await fs.readdir(outputDir)) {
    if (f.endsWith(".lex0.xml")) await fs.rm(path.join(outputDir, f));
  }

  const all = [...models, ...fixtures];
  for (const model of all) {
    await fs.writeFile(path.join(outputDir, `${safeCaseId(model.id)}.lex0.xml`), teiDocument(model), "utf8");
  }
  console.log(`Exported ${all.length} TEI Lex-0 entries to ${outputDir} (${models.length} extracted + ${fixtures.length} fixture(s)).`);
}

main().catch(error => { console.error(error); process.exit(1); });
