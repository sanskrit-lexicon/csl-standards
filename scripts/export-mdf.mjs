import fs from "node:fs/promises";
import path from "node:path";
import { stripPseudoMarkup } from "./lib/citations.mjs";

// MDF (SIL Multi-Dictionary Formatter, Toolbox/FLEx lineage) export — the third,
// deliberately flatter interoperability view beside the TEI archival and
// OntoLex/FrAC semantic profiles. This serializer follows docs/MDF_EXPORT_MAPPING.md
// verbatim: it does not re-decide any adequacy call made there. Where that doc's
// adequacy column says `lossy`, the flattening is made visible with a `\nt`
// model-loss marker, never silent (the signature case: the <ls>L.</ls>
// generic-lexicographer hedge → `\bb L.` + `\nt`).
//
// Scope: MW-focused (national language = English, so glosses go to `\ge`). MW is a
// retrieval dictionary with no examples, so `\xv`/`\xn` are never populated — an
// expected empty, not missing data (see the mapping doc's stress points). All
// Sanskrit is kept in SLP1, consistent with the TEI profile's orth notation; the
// mapping doc's IAST worked examples are illustrative, not normative.
//
// One CDSL record → one MDF record → one `.mdf` file, mirroring export-tei.mjs.

const PROFILE_VERSION = "mdf-export-profile-v0.1";
const VALIDATION_SCOPE = "full-mdf-marker-profile";

function safeCaseId(id) {
  return id.replace(/:/g, "-");
}

function entryType(model) {
  if (model.phenomena?.includes("root")) return "verbal-root";
  if (model.phenomena?.includes("compound")) return "compound";
  if (model.phenomena?.includes("continuation")) return "continuation";
  return model.forms?.[0]?.type || "lemma";
}

// One-line clean value for an MDF field: strip pseudo-markup and collapse to a
// single physical line (MDF markers are line-oriented; a field never wraps).
function oneLine(value) {
  return stripPseudoMarkup(value).replace(/\s+/g, " ").trim();
}

// Strip inline tags/markup from a raw fragment without the <ls> unwrap behaviour.
function stripTags(value) {
  return String(value ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

// The part-of-speech / gender for `\ps`. MW folds gender into the part of speech:
// prefer the explicit <lex> tag (m./f./n./mfn./ind.); fall back to the neutral
// model's derived grammar (+ verb class for roots) when the record has no <lex>.
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

// The homonym number, from MW's <h> (the machine key behind the <hom> display form).
function homonym(rawMw) {
  return rawMw.match(/<h>(\d+)/)?.[1] || null;
}

// The segmented / sort key <k2>. When it carries a morpheme boundary (— or -) it
// records genuine compounding/segmentation information → `\lc` (citation form).
// When it merely duplicates <k1> it is index metadata and is dropped. This
// resolves the mapping doc's open \lc-vs-\va question in favour of \lc for the
// boundary-bearing key (documented in the PR).
function citationForm(rawMw) {
  const k1 = rawMw.match(/<k1>([^<]*)/)?.[1];
  const k2 = rawMw.match(/<k2>([^<]*)/)?.[1];
  if (!k2 || k2 === k1) return null;
  if (!/[—-]/.test(k2)) return null;
  return k2.trim();
}

// Cross-reference targets marked by "q.v." in the MW record: the Sanskrit token
// immediately preceding <ab>q.v.</ab> is the referent (mapping doc worked example
// <s>pragfhya</s>, <ab>q.v.</ab> → \cf pragfhya). Kept in SLP1, deduplicated.
function qvCrossReferences(rawMw) {
  const refs = [];
  for (const m of rawMw.matchAll(/<s1?>([^<]+)<\/s1?>[),\s]*<ab>\s*q\.v\.\s*<\/ab>/g)) {
    const ref = oneLine(m[1]);
    if (ref && !refs.includes(ref)) refs.push(ref);
  }
  return refs;
}

// Etymology (\et) and source language (\es), when the MW record carries them.
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

// Serialize one neutral-model case to an MDF record. Field order follows the MDF
// marker hierarchy (\lx \hm \lc \ps \sn \ge \et \es \cf \bb \nt); all notes are
// grouped at the record end, model-loss markers distinguished by their prefix.
function mdfRecord(model, rawMw, isReviewCase) {
  const lines = [];
  const notes = [];          // sense/meta notes
  const lossNotes = [];      // \nt model-loss: … (adequacy = lossy in the mapping)

  const headword = model.forms?.[0]?.orth || model.key;
  lines.push(`\\lx ${headword}`);

  const hm = homonym(rawMw);
  if (hm) lines.push(`\\hm ${hm}`);

  const lc = citationForm(rawMw);
  if (lc) lines.push(`\\lc ${lc}`);

  const ps = partOfSpeech(model, rawMw);
  if (ps) lines.push(`\\ps ${ps}`);

  // Senses. MW senses are prose-segmented (never observed numbers), so a
  // multi-sense record's \sn numbering is inferred and labelled as such. A
  // monosemous record omits \sn per MDF convention.
  const senses = (model.senses || []).filter(s => s.def);
  if (senses.length > 1) {
    senses.forEach((sense, i) => {
      lines.push(`\\sn ${i + 1}`);
      lines.push(`\\ge ${oneLine(sense.def)}`);
    });
    notes.push("\\nt sense-numbering: inferred from prose segmentation, not observed in source");
  } else if (senses.length === 1) {
    lines.push(`\\ge ${oneLine(senses[0].def)}`);
  }

  const et = etymology(rawMw);
  if (et) lines.push(`\\et ${et}`);
  const es = sourceLanguage(rawMw);
  if (es) lines.push(`\\es ${es}`);

  // Cross-references: q.v. targets, then compound components (mapping doc:
  // compound decomposition flattens to \cf, MDF \se ≠ semantic decomposition).
  const crossRefs = qvCrossReferences(rawMw);
  const decomp = model.relations?.find(rel => rel.type === "lexical-decomposition");
  const components = decomp?.components || [];
  for (const ref of crossRefs) lines.push(`\\cf ${ref}`);
  for (const component of components) {
    const c = oneLine(component);
    if (c && !crossRefs.includes(c)) lines.push(`\\cf ${c}`);
  }

  // Bibliography / source citations — MW witnesses only, deduplicated. The
  // generic-lexicographer hedge (L.) is preserved as \bb L. and flagged lossy.
  const mwCitations = (model.citations || []).filter(c => c.dictionary === "mw");
  const seenBb = new Set();
  let hasHedge = false;
  for (const cite of mwCitations) {
    const isHedge = cite.type === "generic-lexicographer-hedge" || cite.source === "L.";
    const value = isHedge ? "L." : oneLine(cite.source);
    if (!value || seenBb.has(value)) continue;
    seenBb.add(value);
    lines.push(`\\bb ${value}`);
    if (isHedge) hasHedge = true;
  }

  // Model-loss markers — one per lossy adequacy row triggered by this record.
  if (hasHedge) {
    lossNotes.push("\\nt model-loss: <ls>L.</ls> generic-lexicographer hedge flattened to \\bb; evidence-kind not representable in MDF");
  }
  if (model.phenomena?.includes("root")) {
    const whitney = model.relations?.find(rel => rel.type === "whitney-root-association")?.target;
    lossNotes.push(`\\nt model-loss: root/derivation relation${whitney ? ` (Whitney root ${whitney})` : ""} has no MDF field`);
  }
  if (model.phenomena?.includes("compound") && components.length) {
    lossNotes.push("\\nt model-loss: compound decomposition flattened to \\cf; MDF \\se subentry is not a semantic decomposition");
  }
  if (model.phenomena?.includes("continuation")) {
    const eCode = model.relations?.find(rel => rel.type === "adjacency-continuation-parent")?.eCode || "unknown";
    lossNotes.push(`\\nt model-loss: continuation record; headword recovered from MW adjacency (e=${eCode}), not printed`);
  }

  const rec = model.records?.mw || {};
  const meta = `\\nt meta: profile=${PROFILE_VERSION}; scope=${VALIDATION_SCOPE}; review=${isReviewCase ? "validated-slice" : "full-machine-review"}; entry-type=${entryType(model)}; src=MW L=${rec.L} pc=${rec.pc}`;

  return [...lines, ...notes, ...lossNotes, meta].join("\n") + "\n";
}

async function main() {
  const modelPath = path.resolve(process.cwd(), "data", "pilot", "neutral-model.json");
  const hardPath = path.resolve(process.cwd(), "data", "pilot", "hard-cases.json");
  const reviewPath = path.resolve(process.cwd(), "data", "pilot", "review-cases.json");
  const outputDir = path.resolve(process.cwd(), "data", "pilot", "mdf");

  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(outputDir, { recursive: true });

  const models = JSON.parse(await fs.readFile(modelPath, "utf8"));
  const hardCases = JSON.parse(await fs.readFile(hardPath, "utf8"));
  const review = JSON.parse(await fs.readFile(reviewPath, "utf8"));
  const reviewIds = new Set(review.items.map(item => item.id));
  const index = await loadSourceIndexes(hardCases);

  for (const model of models) {
    const rawMw = fullRawMw(model, index);
    const record = mdfRecord(model, rawMw, reviewIds.has(model.id));
    await fs.writeFile(path.join(outputDir, `${safeCaseId(model.id)}.mdf`), record, "utf8");
  }

  console.log(`Exported ${models.length} MDF records to ${outputDir}; ${reviewIds.size} are in the validated review slice.`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
