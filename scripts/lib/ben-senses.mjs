// Extract English senses from a Benfey Sanskrit-English (1866) raw record.
//
// Benfey numbers his senses with {@N.@} markers and glosses in plain English,
// very close to Apte (AP90) — but with a few format quirks this segmenter handles:
//   • the sense marker carries a trailing period ({@1.@}), unlike AP90's {@N@};
//   • compounds follow a {@ -- <ab>Comp.</ab>@} marker and are sub-entries, not
//     senses of the headword, so the body is cut there (likewise a "-- Cf." tail);
//   • the preamble (Sanskrit forms + grammar, before {@1.@}) is dropped for numbered
//     entries so stray English ("rarely") doesn't become a sense; an un-numbered
//     entry (e.g. 1. aja "Unborn.") keeps its single trailing gloss;
//   • the citation coordinate sits *outside* <ls> (`<ls>Man.</ls> 9, 47.`), so the
//     coordinate is stripped together with the tag (the bare siglum is still
//     captured for the sense link — cf. the same quirk noted when ben was added).
//
// Like the other extractors it favours precision over recall, so the sense count is
// a lower bound.

import { extractLabeledSources } from "./citations.mjs";

// Numbered sense markers: {@1.@}, {@ 2 @}, {@--3.@}.
const SEP = /\{@\s*-*\s*\d+\s*\.?\s*@\}/g;
// Compound section / etymology tail — everything from here on is sub-entries, not
// senses of the headword.
const TAIL = /\{@[^}]*\bComp\b[^}]*@\}|--\s*<ab>Cf\b/;

function clean(value) {
  return String(value || "")
    .replace(/<ls\b[^>]*>[\s\S]*?<\/ls>[\s\d,;.]*/g, " ")  // citation + its trailing coordinate
    .replace(/\{#[^#]*#\}/g, " ")                  // Sanskrit headword forms
    .replace(/\{%[^%]*%\}/g, " ")                  // Sanskrit forms / transliteration
    .replace(/<lang\b[^>]*>[\s\S]*?<\/lang>/g, " ") // foreign-script glosses (greek etc.)
    .replace(/\[[^\]]*\]/g, " ")                   // bracketed etymology
    .replace(/\{[^}]*\}/g, " ")                    // residual brace markers / coordinates
    .replace(/<ab>[^<]*<\/ab>/g, " ")              // abbreviations (m., adj., Cf.)
    .replace(/<[^>]+>/g, " ")
    .replace(/&c\./g, " ")
    .replace(/\([^)]*\)/g, " ")                    // parenthetical grammar notes
    .replace(/=\s*[ivxlcm]+\.[\s\d,]*/gi, " ")     // "= i. 88, 3" grammar-section reference
    .replace(/\b[ivxlcm]+\.\s*\d[\d,\s]*/gi, " ")  // bare "i. 436" / "ii. 5" section refs
    .replace(/\b\d+(?:\s*[.,]\s*\d+)+/g, " ")      // bare coordinate runs ("1, 2, 2", "1. 2294")
    .replace(/\s+/g, " ")
    .replace(/([a-z])-\s+([a-z])/g, "$1$2")        // re-join print line-break hyphens (In- heritance)
    .replace(/\s+([,;.])/g, "$1")
    .replace(/([,;.])\1+/g, "$1")                  // collapse repeated punctuation
    .replace(/^[\s,;.\d-]+/, "")                   // leading punctuation / stray marker digits
    .replace(/[\s,;.]+$/, "")
    .trim();
}

// True when the string reads like an English gloss, not residual apparatus or a
// cross-reference whose target was stripped ("See aṃsa." -> "See").
function isGloss(value) {
  if (!value) return false;
  if (/^(see|cf|comp|compare)\.?$/i.test(value)) return false;
  const letters = (value.match(/[A-Za-z]/g) || []).length;
  return /[A-Za-z]{3,}/.test(value) && letters >= 3 && value.length <= 200;
}

// <ls> within a sense segment, tagged ben for the sense link.
function segmentCitations(segment) {
  const cits = extractLabeledSources(segment).map(c => ({
    source: c.source,
    type: c.type,
    dictionary: "ben",
    ...(c.inheritedFrom ? { inheritedFrom: c.inheritedFrom } : {})
  }));
  return cits.length ? { citations: cits } : {};
}

export function extractBenSenses(raw) {
  if (!raw) return [];
  let body = String(raw).replace(/^[\s\S]*?¦/, "").replace(/\s*<LEND>\s*$/, "");
  body = body.split(TAIL)[0];  // drop the compound section / etymology tail

  const parts = body.split(SEP);
  // For numbered entries the first part is the preamble (grammar) — drop it; an
  // un-numbered entry is a single segment carrying its lone gloss.
  const segments = parts.length > 1 ? parts.slice(1) : parts;

  const senses = [];
  for (const segment of segments) {
    const def = clean(segment);
    if (isGloss(def) && !senses.some(s => s.def === def)) {
      senses.push({ def, lang: "en", evidence: "derived", ...segmentCitations(segment) });
    }
    if (senses.length >= 12) break;
  }
  return senses;
}
