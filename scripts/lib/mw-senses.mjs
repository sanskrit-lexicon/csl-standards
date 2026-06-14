// Extract English senses from a Monier-Williams (MW) raw record.
//
// MW glosses sit after the grammatical apparatus, separated by ";" and <div>
// markers; verbal roots gloss as "to …" phrases; many entries are pure
// cross-references ("See <s>…</s>") or grammatical stubs (gaṇa membership, a
// homonym number) with no English gloss at all. This segmenter returns one
// entry per sense with a `kind` ("gloss" | "cross-reference"); stubs yield [].
//
// It deliberately favours precision over recall: a segment is kept only when it
// reads like a gloss, so grammatical residue stays out of the sense list. Each
// sense also carries the MW <ls> citations that fall within its segment, so a
// source can be linked to the specific sense it attests rather than the entry.

import { extractLabeledSources } from "./citations.mjs";

// Leading grammatical tokens to strip before a gloss (POS, gaṇa, fr./cf., etc.).
const LEAD = "mfn|mf|mn|m|f|n|ind\\.p|ind|am|pl|sg|du|g|fr|cf|a";

// MW <ls> citations within a segment, tagged as MW for the sense-level link.
function segmentCitations(segment) {
  const cits = extractLabeledSources(segment).map(c => ({
    source: c.source,
    type: c.type,
    dictionary: "mw",
    ...(c.inheritedFrom ? { inheritedFrom: c.inheritedFrom } : {})
  }));
  return cits.length ? { citations: cits } : {};
}

function cleanGloss(value) {
  return String(value || "")
    .replace(/<ls\b[^>]*>[\s\S]*?<\/ls>/g, " ")   // drop source citations
    .replace(/<s1?\b[^>]*>[\s\S]*?<\/s1?>/g, " ") // drop Sanskrit word refs
    .replace(/<gk\b[^>]*>[\s\S]*?<\/gk>/g, " ")   // drop Greek etyma
    .replace(/<etym\b[^>]*>[\s\S]*?<\/etym>/g, " ")
    .replace(/<lang\b[^>]*>[\s\S]*?<\/lang>/g, " ")
    .replace(/<srs\s*\/>/g, "")
    .replace(/<[^>]+>/g, " ")                      // drop remaining tags
    .replace(/&c\./g, "etc.")
    .replace(/\s+/g, " ")
    .replace(/\s+([,;:.])/g, "$1")
    .trim();
}

// True when the string reads like an English gloss, not an abbreviation,
// number, or bare reference.
function isGloss(value) {
  if (!value) return false;
  const letters = (value.match(/[A-Za-z]/g) || []).length;
  const hasWord = /[A-Za-z]{3,}/.test(value);
  return hasWord && letters >= 3 && value.length <= 200;
}

function stripLeadingGrammar(value) {
  let prev;
  let s = value;
  const re = new RegExp(`^\\s*(?:(?:${LEAD})\\.|\\([^)]*\\)|\\d+\\.?|[,;:.‘’\\s])\\s*`, "i");
  do { prev = s; s = s.replace(re, ""); } while (s !== prev);
  return s.trim();
}

function tidy(segment) {
  return stripLeadingGrammar(cleanGloss(segment))
    .replace(/\s*\[[^\]]*\]:?\s*$/, "")  // trailing "[ cf. ]" residue
    .replace(/\(\s*\)/g, "")             // emptied parens
    .replace(/[\s,;:.]+$/, "")
    .replace(/^[\s,;:.]+/, "")
    .trim();
}

// Verbal-root glosses: "to …" phrases, one per ;/<div> segment (commas inside a
// segment list English equivalents of a single sense and are kept). The "to …"
// search skips the leading conjugation apparatus and any "(also)" prefix.
function extractRootSenses(body) {
  const segments = body.replace(/<div\b[^>]*>/g, " ;; ").split(/\s*;;\s*|\s*;\s*/);
  const senses = [];
  for (const segment of segments) {
    let g = cleanGloss(segment);
    const at = g.search(/\bto\s/);
    if (at === -1) continue;
    g = g.slice(at).replace(/\s*[([].*$/, "");  // cut trailing etymology/refs
    g = g.replace(/[\s,;:.]+$/, "").trim();
    if (isGloss(g) && !senses.some(s => s.def === g)) {
      senses.push({ def: g, evidence: "derived", kind: "gloss", ...segmentCitations(segment) });
    }
    if (senses.length >= 12) break;
  }
  return senses;
}

export function extractMwSenses(raw, phenomena = []) {
  if (!raw) return [];
  let body = raw.replace(/^[\s\S]*?¦\s*/, "").replace(/\s*<LEND>\s*$/, "");
  body = body.replace(/<info\b[^>]*\/?>/g, " ").replace(/<listinfo\b[^>]*\/?>/g, " ")
    .replace(/\[Page[^\]]*\]/g, " ");

  // Cross-references keep the Sanskrit target inline. Strip only a leading POS
  // run (not full parentheticals, which carry the redirect text).
  const refsInline = cleanGloss(body.replace(/<s1?\b[^>]*>([\s\S]*?)<\/s1?>/g, "$1"));
  const lead = refsInline.replace(new RegExp(`^\\s*(?:(?:${LEAD})\\.\\s*)+`, "i"), "");
  // "See …" or "= <synonym> …"
  if (/^see\b/i.test(lead) || /^=\s*[A-Za-z√]/.test(lead)) {
    const def = lead.replace(/[\s.,)]+$/, "").trim();
    return isGloss(def) ? [{ def, evidence: "derived", kind: "cross-reference", ...segmentCitations(body) }] : [];
  }
  // Parenthetical redirect: "(for … See <target> …)".
  const redirect = refsInline.match(/\(\s*for\b[^)]*?\bSee\b\s*([^)]*)\)/i);
  if (redirect) {
    const def = `See ${redirect[1].replace(/[\s.]+$/, "").trim()}`;
    return isGloss(def) ? [{ def, evidence: "derived", kind: "cross-reference" }] : [];
  }

  if (phenomena.includes("root")) {
    const roots = extractRootSenses(body);
    if (roots.length) return roots;
  }

  // General: segment on ; and <div>, strip leading grammar, keep glosses.
  const segments = body.replace(/<div\b[^>]*>/g, " ;; ").split(/\s*;;\s*|\s*;\s*/);
  const senses = [];
  for (const segment of segments) {
    const def = tidy(segment);
    if (isGloss(def) && !senses.some(s => s.def === def)) {
      senses.push({ def, evidence: "derived", kind: "gloss", ...segmentCitations(segment) });
    }
    if (senses.length >= 12) break;
  }
  return senses;
}
