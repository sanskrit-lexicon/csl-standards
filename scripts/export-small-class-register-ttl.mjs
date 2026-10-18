// Deterministic SKOS Turtle export of the small-class abbreviation register
// (H6448): data/abbrev/small-class-register.json -> data/abbrev/small-class-register.ttl.
//
// Serialization contract (W3C SKOS Reference, read github-first):
//   - the register itself is the skos:ConceptScheme;
//   - one skos:Collection per 2006/v2 letter-length band, members sorted;
//   - one skos:Concept per concept with TYPED skos:notation literals
//     (skos:notation range is typed literals; the datatype denotes the
//     notation system — here scr:AbbreviationNotation, the 2006 scheme);
//   - skos:prefLabel / skos:altLabel as language-tagged literals (SKOS S14:
//     at most one prefLabel per language tag — pinned by the SHACL profile);
//   - skos:inScheme on every concept; register extensions (smallClass,
//     gramDimension, attestedKeys, census evidence, alt forms, unresolved
//     forms with external grounding, canary exhibits, provenance) under the
//     register's own scr: namespace, 1:1 with the JSON fields.
//
// Byte stability: the register is the only input; every list is sorted and
// every map iterated in sorted key order, so identical register bytes yield
// identical output bytes. The reproducible-builds SOURCE_DATE_EPOCH convention
// (via scripts/lib/provenance.mjs) pins scr:exportedAt when set; unset on a
// local run, the triple is omitted entirely.
//
// Usage: npm run export-small-class-register-ttl

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { REGISTER_PATH, loadRegister } from "./lib/small-class-register.mjs";
import { generatedAt } from "./lib/provenance.mjs";

export const OUTPUT_PATH = "data/abbrev/small-class-register.ttl";
const NOTATION_DATATYPE = "https://sanskrit-lexicon.github.io/csl-standards/registers/small-class-2006#AbbreviationNotation";

const PREFIXES = [
  ["skos", "http://www.w3.org/2004/02/skos/core#"],
  ["dct", "http://purl.org/dc/terms/"],
  ["rdfs", "http://www.w3.org/2000/01/rdf-schema#"],
  ["xsd", "http://www.w3.org/2001/XMLSchema#"],
  ["scr", "https://sanskrit-lexicon.github.io/csl-standards/registers/small-class-2006#"],
];

function iri(value) {
  return `<${value}>`;
}

function str(value) {
  // JSON.stringify escaping (quotes, backslash, control chars) is valid Turtle.
  return JSON.stringify(String(value ?? ""));
}

function langLines(predicate, langMap, out) {
  for (const lang of Object.keys(langMap ?? {}).sort()) {
    const values = [].concat(langMap[lang] ?? []).sort();
    for (const v of values) out.push(`  ${predicate} ${str(v)}@${lang} ;`);
  }
}

function notationLiteral(notation) {
  return `${str(notation)}^^${iri(NOTATION_DATATYPE)}`;
}

function fragmentIri(schemeUri, prefix, token) {
  const slug = String(token).replace(/\s+/g, "-");
  return `${schemeUri}#${prefix}${slug}`;
}

function blank(parts) {
  return `[ ${parts.join(" ; ")} ]`;
}

function schemeNode(register, exportedAt) {
  const out = [];
  out.push(`${iri(register.uri)} a skos:ConceptScheme ;`);
  langLines("dct:title", register.title, out);
  out.push(`  scr:registerVersion ${str(register.version)} ;`);
  const paper = register.provenance?.paper ?? {};
  out.push(`  scr:paper ${blank([
    `dct:creator ${str(paper.author)}`,
    `dct:title ${str(paper.title)}`,
    `dct:bibliographicCitation ${str(paper.venue)}`,
    `dct:issued ${str(String(paper.year))}^^xsd:gYear`,
    ...(paper.fulltext ? [`rdfs:seeAlso ${iri(paper.fulltext)}`] : []),
  ])} ;`);
  const census = register.provenance?.census ?? {};
  out.push(`  scr:census ${blank([
    `dct:source ${str(`${census.repo}/${census.file}`)}`,
    ...(census.handoff ? [`scr:handoff ${str(census.handoff)}`] : []),
    ...(census.generatedAt ? [`scr:generatedAt ${str(census.generatedAt)}^^xsd:dateTime`] : []),
    ...(census.corpusCommit ? [`scr:corpusCommit ${str(census.corpusCommit)}`] : []),
  ])} ;`);
  for (const key of ["lex0Pin", "skosRef", "jsonLdStyle", "adjacent"]) {
    const v = register.provenance?.[key];
    if (typeof v === "string" && v) out.push(`  scr:${key} ${str(v)} ;`);
  }
  if (exportedAt) out.push(`  scr:exportedAt ${str(exportedAt)}^^xsd:dateTime ;`);
  out[out.length - 1] = out[out.length - 1].replace(/ ;$/, " .");
  out.push("");
  return out;
}

function collectionNode(band) {
  const out = [];
  out.push(`${iri(band.uri)} a skos:Collection ;`);
  langLines("skos:prefLabel", band.prefLabel, out);
  langLines("skos:definition", band.definition, out);
  langLines("scr:paperQuote", band.paperQuote, out);
  for (const member of [...(band.member ?? [])].sort()) {
    out.push(`  skos:member ${iri(member)} ;`);
  }
  out[out.length - 1] = out[out.length - 1].replace(/ ;$/, " .");
  out.push("");
  return out;
}

function conceptNode(concept) {
  const out = [];
  out.push(`${iri(concept.uri)} a skos:Concept ;`);
  for (const scheme of [...new Set(concept.inScheme ?? [])].sort()) {
    out.push(`  skos:inScheme ${iri(scheme)} ;`);
  }
  for (const notation of [...concept.notation].sort()) {
    out.push(`  skos:notation ${notationLiteral(notation)} ;`);
  }
  langLines("skos:prefLabel", concept.prefLabel, out);
  langLines("skos:altLabel", concept.altLabel, out);
  langLines("scr:gramDimension", concept.gramDimension, out);
  langLines("scr:paperQuote", concept.paperQuote, out);
  langLines("scr:censusConflict", concept.censusConflict, out);
  langLines("skos:scopeNote", concept.scopeNote, out);
  if (concept.smallClass) out.push(`  scr:smallClass ${iri(concept.smallClass)} ;`);
  for (const key of [...concept.attestedKeys].sort()) {
    out.push(`  scr:attestedKeys ${str(key)} ;`);
  }
  const evidence = [...(concept.evidence ?? [])]
    .sort((a, b) => `${a.label}\u0000${a.expansion}`.localeCompare(`${b.label}\u0000${b.expansion}`))
    .map(e => blank([`scr:label ${str(e.label)}`, `scr:expansion ${str(e.expansion)}`]));
  if (evidence.length) {
    out.push(`  scr:censusEvidence ${evidence.join(" ,\n      ")} ;`);
  }
  const altForms = [...(concept.altForm ?? [])]
    .sort((a, b) => a.notation.localeCompare(b.notation))
    .map(alt => blank([
      `skos:notation ${notationLiteral(alt.notation)}`,
      ...(alt.smallClass ? [`scr:smallClass ${iri(alt.smallClass)}`] : []),
      `dct:source ${str(alt.source)}`,
      `scr:censusLegends ${Number(alt.censusLegends)}`,
    ]));
  if (altForms.length) {
    out.push(`  scr:altForm ${altForms.join(" ,\n      ")} ;`);
  }
  out[out.length - 1] = out[out.length - 1].replace(/ ;$/, " .");
  out.push("");
  return out;
}

function unresolvedNode(schemeUri, form) {
  const out = [];
  out.push(`${iri(fragmentIri(schemeUri, "unresolved-", form.notation))} a scr:UnresolvedForm ;`);
  out.push(`  skos:notation ${notationLiteral(form.notation)} ;`);
  if (form.smallClass) out.push(`  scr:smallClass ${iri(form.smallClass)} ;`);
  langLines("scr:paperQuote", form.paperQuote, out);
  langLines("scr:reason", form.reason, out);
  langLines("scr:censusConflict", form.censusConflict, out);
  const grounding = [...(form.externalGrounding ?? [])]
    .sort((a, b) => `${a.source}\u0000${a.edition}`.localeCompare(`${b.source}\u0000${b.edition}`))
    .map(g => blank([
      `scr:source ${str(g.source)}`,
      `scr:edition ${str(g.edition)}`,
      `scr:quote ${str(g.quote)}`,
      `scr:locator ${str(g.locator)}`,
    ]));
  if (grounding.length) {
    out.push(`  scr:externalGrounding ${grounding.join(" ,\n      ")} ;`);
  }
  out[out.length - 1] = out[out.length - 1].replace(/ ;$/, " .");
  out.push("");
  return out;
}

function canaryNode(schemeUri, exhibit) {
  const out = [];
  out.push(`${iri(fragmentIri(schemeUri, "canary-", exhibit.label))} a scr:CanaryExhibit ;`);
  out.push(`  scr:label ${str(exhibit.label)} ;`);
  langLines("scr:paperRole", exhibit.paperRole, out);
  out.push(`  scr:censusPolysemy ${Number(exhibit.censusPolysemy)} .`);
  out.push("");
  return out;
}

// Pure serializer: register JSON -> Turtle bytes. Deterministic for identical
// register input; exportedAt comes from SOURCE_DATE_EPOCH (omitted when unset).
export function serializeRegister(register, {exportedAt = generatedAt()} = {}) {
  const lines = [];
  lines.push("# Small-class abbreviation register — deterministic SKOS Turtle export (H6448).");
  lines.push(`# Generated from ${REGISTER_PATH} (register v${register.version}) by`);
  lines.push("# scripts/export-small-class-register-ttl.mjs — byte-stable: identical register");
  lines.push("# input yields identical bytes. SOURCE_DATE_EPOCH (reproducible-builds) pins");
  lines.push("# scr:exportedAt; unset locally, the triple is omitted entirely.");
  lines.push("");
  for (const [p, ns] of PREFIXES) lines.push(`@prefix ${p}: <${ns}> .`);
  lines.push("");
  lines.push(...schemeNode(register, exportedAt));
  for (const band of [...(register.collections ?? [])].sort((a, b) => a.uri.localeCompare(b.uri))) {
    lines.push(...collectionNode(band));
  }
  for (const concept of [...register.concepts].sort((a, b) => a.uri.localeCompare(b.uri))) {
    lines.push(...conceptNode(concept));
  }
  for (const form of [...(register.unresolvedForms ?? [])].sort((a, b) => a.notation.localeCompare(b.notation))) {
    lines.push(...unresolvedNode(register.uri, form));
  }
  for (const exhibit of [...(register.canaryExhibits ?? [])].sort((a, b) => a.label.localeCompare(b.label))) {
    lines.push(...canaryNode(register.uri, exhibit));
  }
  return `${lines.join("\n")}\n`;
}

function main() {
  const root = process.cwd();
  const register = loadRegister(root);
  const ttl = serializeRegister(register);
  const outPath = path.join(root, OUTPUT_PATH);
  fs.writeFileSync(outPath, ttl, "utf8");
  console.log(`Exported ${register.concepts.length} concepts, ${(register.collections ?? []).length} band collections, ${(register.unresolvedForms ?? []).length} unresolved forms, ${(register.canaryExhibits ?? []).length} canary exhibits to ${OUTPUT_PATH}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
