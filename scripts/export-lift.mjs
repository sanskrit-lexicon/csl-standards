import fs from "node:fs/promises";
import path from "node:path";
import { stripPseudoMarkup } from "./lib/citations.mjs";

// LIFT (Lexicon Interchange FormaT, https://github.com/sillsdev/lift-standard) export —
// the fourth interoperability view, added beside the TEI archival, OntoLex/FrAC
// semantic, and MDF flat-field profiles (docs/LIFT_EXPORT_MAPPING.md, MG ruling
// SanskritLexicography/papers/SIL_MDF_ECOSYSTEM_CORRELATION.md §5.2: "LIFT: add
// now — fourth serialization beside TEI/OntoLex/MDF"). Where MDF buys MUDIDI
// comparability, LIFT buys direct consumption by living SIL tools (FLEx, Lexique
// Pro, Webonary, Dictionary App Builder).
//
// This serializer reuses the same field-derivation helpers as export-mdf.mjs (same
// adequacy calls, same MW-focused scope) but targets LIFT's XML entry/sense/
// relation/etymology structure instead of SFM markers. It does not re-decide any
// adequacy call already made in docs/MDF_EXPORT_MAPPING.md; the same `model-loss`
// notes carry over as LIFT <note type="model-loss"> elements, so lossiness stays
// visible rather than silently dropped by the format switch.
//
// One CDSL record -> one LIFT <entry> -> one `.lift` file, mirroring export-mdf.mjs
// (a fragment file per case, not one merged lexicon, to keep per-case review and
// validation simple and consistent with the other three profiles).

const PROFILE_VERSION = "lift-export-profile-v0.1";
const VALIDATION_SCOPE = "full-lift-entry-profile";
const LIFT_VERSION = "0.13";

function safeCaseId(id) {
  return id.replace(/:/g, "-");
}

function entryType(model) {
  if (model.phenomena?.includes("root")) return "verbal-root";
  if (model.phenomena?.includes("compound")) return "compound";
  if (model.phenomena?.includes("continuation")) return "continuation";
  return model.forms?.[0]?.type || "lemma";
}

function oneLine(value) {
  return stripPseudoMarkup(value).replace(/\s+/g, " ").trim();
}

function stripTags(value) {
  return String(value ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

// Minimal XML text-node escaping (LIFT is plain XML, no CDATA convention).
function xmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function partOfSpeech(model, rawMw) {
  const lex = rawMw.match(/<lex>([\s\S]*?)<\/lex>/);
  if (lex) {
    const value = stripTags(lex[1]).replace(/\.$/, ".").trim();
    if (value) return value;
  }
  const form = model.forms?.[0] || {};
  if (form.grammar) return [form.grammar, form.verbClass].filter(Boolean).join(" ");
  return null;
}

function homonym(rawMw) {
  return rawMw.match(/<h>(\d+)/)?.[1] || null;
}

// Same segmented/sort-key rule as export-mdf.mjs: <k2> becomes a citation
// (LIFT: <lexical-unit>'s <variant>) only when it carries a genuine morpheme
// boundary, never when it is index metadata duplicating <k1>.
function citationForm(rawMw) {
  const k1 = rawMw.match(/<k1>([^<]*)/)?.[1];
  const k2 = rawMw.match(/<k2>([^<]*)/)?.[1];
  if (!k2 || k2 === k1) return null;
  if (!/[—-]/.test(k2)) return null;
  return k2.trim();
}

function qvCrossReferences(rawMw) {
  const refs = [];
  for (const m of rawMw.matchAll(/<s1?>([^<]+)<\/s1?>[),\s]*<ab>\s*q\.v\.\s*<\/ab>/g)) {
    const ref = oneLine(m[1]);
    if (ref && !refs.includes(ref)) refs.push(ref);
  }
  return refs;
}

function etymology(rawMw) {
  const etym = rawMw.match(/<etym>([\s\S]*?)<\/etym>/);
  return etym ? oneLine(etym[1]) : null;
}
function sourceLanguage(rawMw) {
  const lang = rawMw.match(/<lang>([^<]*)<\/lang>/) || rawMw.match(/<gk>([^<]*)<\/gk>/);
  return lang ? stripTags(lang[1]) : null;
}

async function loadSourceIndexes(hardCases) {
  const source = hardCases.sources?.mw;
  if (!source) return new Map();
  const text = await fs.readFile(path.resolve(process.cwd(), source), "utf8");
  const index = new Map();
  for (const raw of text.match(/<L>[\s\S]*?<LEND>/g) || []) {
    const L = raw.match(/^<L>([^<]+)/)?.[1];
    if (L) index.set(L, raw.trim());
  }
  return index;
}

function fullRawMw(model, index) {
  const L = model.records?.mw?.L;
  return index.get(L) || model.records?.mw?.raw || "";
}

function indent(lines, level) {
  return lines.map(l => `${"  ".repeat(level)}${l}`);
}

// Serialize one neutral-model case to a single-entry LIFT XML fragment. Element
// order (entry -> lexical-unit -> variant -> trait -> sense[grammatical-info,
// gloss, definition, relation, note] -> etymology -> note) follows the LIFT 0.13
// schema's own element sequence, not a body-of-work borrowed from the MDF field
// order (LIFT is XML, not line-oriented SFM, so there is no App B analogue).
function liftEntry(model, rawMw, isReviewCase) {
  const headword = model.forms?.[0]?.orth || model.key;
  const hm = homonym(rawMw);
  const lc = citationForm(rawMw);
  const ps = partOfSpeech(model, rawMw);

  const attrs = [`id="${xmlEscape(safeCaseId(model.id))}"`];
  if (hm) attrs.push(`order="${xmlEscape(hm)}"`);

  const body = [];
  body.push(`<lexical-unit>`);
  body.push(...indent([`<form lang="sa-Latn-x-slp1"><text>${xmlEscape(headword)}</text></form>`], 1));
  body.push(`</lexical-unit>`);

  if (lc) {
    body.push(`<variant>`);
    body.push(...indent([`<form lang="sa-Latn-x-slp1"><text>${xmlEscape(lc)}</text></form>`], 1));
    body.push(...indent([`<trait name="variant-type" value="segmented-citation-form"/>`], 1));
    body.push(`</variant>`);
  }

  // Senses. Same inference rule as MDF: MW senses are prose-segmented, so a
  // multi-sense entry's order is the only numbering signal (never claimed
  // "observed"); a monosemous entry emits one unnumbered <sense>.
  //
  // Relations: q.v. targets stay untyped ("cf", LIFT's default cross-reference
  // type — no controlled vocabulary entry cleanly fits a generic see-also
  // pointer). Compound components get the typed "Compound" relation, the LIFT
  // twin of MDF's \lf Compound (App. D: "lexicalized compound using headword
  // not easily handled by other lexical functions").
  const senses = (model.senses || []).filter(s => s.def);
  const crossRefs = qvCrossReferences(rawMw);
  const decomp = model.relations?.find(rel => rel.type === "lexical-decomposition");
  const components = decomp?.components || [];
  const allRefs = [
    ...crossRefs.map(ref => ({ ref, type: "cf" })),
    ...[...new Set(components.map(oneLine).filter(Boolean))]
      .filter(c => !crossRefs.includes(c))
      .map(ref => ({ ref, type: "Compound" }))
  ];

  const senseXml = (sense, order) => {
    const lines = [`<sense id="${xmlEscape(safeCaseId(model.id))}-s${order}"${senses.length > 1 ? ` order="${order}"` : ""}>`];
    if (ps) lines.push(...indent([`<grammatical-info value="${xmlEscape(ps)}"/>`], 1));
    lines.push(...indent([`<gloss lang="en"><text>${xmlEscape(oneLine(sense.def))}</text></gloss>`], 1));
    for (const { ref, type } of allRefs) {
      lines.push(...indent([`<relation type="${type}" ref="${xmlEscape(ref)}"/>`], 1));
    }
    if (senses.length > 1) {
      lines.push(...indent([`<note type="sense-numbering"><form lang="en"><text>inferred from prose segmentation, not observed in source</text></form></note>`], 1));
    }
    lines.push(`</sense>`);
    return lines;
  };

  if (senses.length > 1) {
    senses.forEach((sense, i) => body.push(...senseXml(sense, i + 1)));
  } else if (senses.length === 1) {
    body.push(...senseXml(senses[0], 1));
  } else if (allRefs.length) {
    // No prose gloss but cross-references exist (rare) — still surface them.
    body.push(...senseXml({ def: "" }, 1));
  }

  const et = etymology(rawMw);
  const es = sourceLanguage(rawMw);
  if (et || es) {
    body.push(`<etymology type="proto"${es ? ` source="${xmlEscape(es)}"` : ""}>`);
    if (et) body.push(...indent([`<form lang="sa-Latn-x-slp1"><text>${xmlEscape(et)}</text></form>`], 1));
    body.push(`</etymology>`);
  }

  // Bibliography / source citations, same dedupe + hedge handling as MDF's \bb.
  const mwCitations = (model.citations || []).filter(c => c.dictionary === "mw");
  const seenBb = new Set();
  let hasHedge = false;
  for (const cite of mwCitations) {
    const isHedge = cite.type === "generic-lexicographer-hedge" || cite.source === "L.";
    const value = isHedge ? "L." : oneLine(cite.source);
    if (!value || seenBb.has(value)) continue;
    seenBb.add(value);
    body.push(`<note type="source"><form lang="en"><text>${xmlEscape(value)}</text></form></note>`);
    if (isHedge) hasHedge = true;
  }

  // Model-loss notes, one per lossy adequacy row triggered by this entry — the
  // LIFT-side twin of MDF's \nt model-loss: lines, same trigger conditions.
  const lossNotes = [];
  if (hasHedge) {
    lossNotes.push("<ls>L.</ls> generic-lexicographer hedge flattened to a source note; evidence-kind not representable in LIFT core");
  }
  if (model.phenomena?.includes("root")) {
    const whitney = model.relations?.find(rel => rel.type === "whitney-root-association")?.target;
    lossNotes.push(`root/derivation relation${whitney ? ` (Whitney root ${whitney})` : ""} has no dedicated LIFT field; carried in <etymology>/note only`);
  }
  // Compound decomposition is typed via <relation type="Compound">, not
  // flattened to plain "cf" (partial adequacy, matching MDF's \lf Compound),
  // so it gets no model-loss note.
  if (model.phenomena?.includes("continuation")) {
    const eCode = model.relations?.find(rel => rel.type === "adjacency-continuation-parent")?.eCode || "unknown";
    lossNotes.push(`continuation entry; headword recovered from MW adjacency (e=${eCode}), not printed`);
  }
  for (const note of lossNotes) {
    body.push(`<note type="model-loss"><form lang="en"><text>${xmlEscape(note)}</text></form></note>`);
  }

  const rec = model.records?.mw || {};
  const expectedReview = isReviewCase ? "validated-slice" : "full-machine-review";
  const meta = `profile=${PROFILE_VERSION}; scope=${VALIDATION_SCOPE}; review=${expectedReview}; entry-type=${entryType(model)}; src=MW L=${rec.L} pc=${rec.pc}`;
  body.push(`<note type="meta"><form lang="en"><text>${xmlEscape(meta)}</text></form></note>`);

  const entryLines = [`<entry ${attrs.join(" ")}>`, ...indent(body, 1), `</entry>`];
  return entryLines.join("\n") + "\n";
}

function liftFragment(entryXml) {
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<lift version="${LIFT_VERSION}" producer="csl-standards/export-lift.mjs">`,
    ...indent(entryXml.trimEnd().split("\n"), 1),
    `</lift>`
  ].join("\n") + "\n";
}

async function main() {
  const modelPath = path.resolve(process.cwd(), "data", "pilot", "neutral-model.json");
  const hardPath = path.resolve(process.cwd(), "data", "pilot", "hard-cases.json");
  const reviewPath = path.resolve(process.cwd(), "data", "pilot", "review-cases.json");
  const outputDir = path.resolve(process.cwd(), "data", "pilot", "lift");

  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(outputDir, { recursive: true });

  const models = JSON.parse(await fs.readFile(modelPath, "utf8"));
  const hardCases = JSON.parse(await fs.readFile(hardPath, "utf8"));
  const review = JSON.parse(await fs.readFile(reviewPath, "utf8"));
  const reviewIds = new Set(review.items.map(item => item.id));
  const index = await loadSourceIndexes(hardCases);

  for (const model of models) {
    const rawMw = fullRawMw(model, index);
    const entryXml = liftEntry(model, rawMw, reviewIds.has(model.id));
    await fs.writeFile(path.join(outputDir, `${safeCaseId(model.id)}.lift`), liftFragment(entryXml), "utf8");
  }

  console.log(`Exported ${models.length} LIFT entries to ${outputDir}; ${reviewIds.size} are in the validated review slice.`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
