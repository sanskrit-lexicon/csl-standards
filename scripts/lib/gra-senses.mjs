// Extract senses from a Grassmann (GRA) "Wörterbuch zum Rig-Veda" raw record.
//
// Grassmann numbers his sub-senses inline in the headword paragraph with `N〉`
// markers ("1〉 {%Antheil;%} 2〉 {%Erbtheil;%} …"), often after a discursive
// etymological preamble and a summarising "Also:". The generic Petersburg
// extractor (extractPwSenses) splits on <div> only, so on these entries it
// concatenates every gloss into a single sense (e.g. √ac, áṃśa). This extractor
// splits the headword paragraph on the `N〉` run so each numbered sub-sense
// becomes its own sense — precision over recall, like the other dictionaries.
//
// Two subtleties Grassmann's markup forces:
//   • The `N〉` markers reappear later as *back-references* ("Zwischen 1〉 und 2〉
//     finden Uebergänge statt"). Only the leading consecutive run 1〉 2〉 3〉 … is a
//     real sense list; the last numbered sense is truncated at the first
//     non-consecutive marker so a reference never spawns a spurious sense.
//   • Citation coordinates are `{N,M}` Rigveda hymn,verse refs (not <ls>), so the
//     few <ls> that do occur (e.g. comparative-grammar refs) are attached per
//     sense via the shared extractor; coordinate refs are dropped from the gloss.
//
// Entries with no numbered run fall back to the Petersburg extractor, which
// handles GRA's <div>/{%…%} glosses fine.

import { extractLabeledSources } from "./citations.mjs";
import { extractPwSenses } from "./pw-senses.mjs";

const MARKER = /(\d+)〉/g;

function bodyOf(raw) {
  return String(raw || "")
    .replace(/^.*?¦/s, "")            // drop the <L>…<k2> metadata + headword bar
    .replace(/\s*<LEND>\s*$/, "")
    .replace(/\[Page[^\]]*\]/g, " ");
}

// Clean a span of GRA German prose into a sense definition: drop citations,
// Sanskrit forms, headword forms, coordinate refs, tags and editorial brackets;
// unwrap {%…%} German glosses; trim leading marker/punctuation and trailing
// connectives.
function cleanDe(value) {
  return String(value || "")
    .replace(/<ls\b[^>]*>[\s\S]*?<\/ls>/g, " ")  // citations — extracted separately
    .replace(/\{#[^#]*#\}/g, " ")                  // Sanskrit forms/examples
    .replace(/\{@[^@]*@\}/g, " ")                  // headword/stem forms
    .replace(/\{%([^%]*)%\}/g, "$1")               // unwrap German glosses
    .replace(/\{[\d,;.\s]+\}/g, " ")               // coordinate refs {548,12}
    .replace(/<[^>]+>/g, " ")                       // remaining tags
    .replace(/\[[^\]]*\]/g, " ")                    // editorial brackets [Ab.]
    .replace(/\s+/g, " ")
    .replace(/\s+([,;.:])/g, "$1")
    .replace(/^[\s,;:.〉\d]+/, "")                   // leading marker/punctuation
    .replace(/[\s,;:.]+$/, "")                      // trailing connectives/punctuation
    .trim();
}

function glossesIn(segment) {
  return [...segment.matchAll(/\{%([^%]*)%\}/g)]
    .map(m => cleanDe(`{%${m[1]}%}`))
    .filter(Boolean);
}

function citationsIn(segment) {
  return extractLabeledSources(segment).map(c => ({
    source: c.source,
    type: c.type,
    dictionary: "gra",
    ...(c.inheritedFrom ? { inheritedFrom: c.inheritedFrom } : {})
  }));
}

function makeSense(def, span) {
  if (!def || !/[A-Za-zÀ-ÿ]{2,}/.test(def)) return null;
  const sense = { def, lang: "de", evidence: "derived" };
  const cits = citationsIn(span);
  if (cits.length) sense.citations = cits;
  return sense;
}

export function extractGraSenses(raw) {
  if (!raw) return [];
  const body = bodyOf(raw);
  const head = body.split(/<div\b[^>]*>/)[0];

  // Locate the `N〉` markers in the headword paragraph and keep only the leading
  // consecutive run 1〉 2〉 3〉 … (real sub-sense list); later/lower markers are
  // back-references.
  const markers = [...head.matchAll(MARKER)].map(m => ({
    num: Number(m[1]),
    start: m.index,
    end: m.index + m[0].length
  }));
  let runLen = 0;
  for (const marker of markers) {
    if (marker.num === runLen + 1) runLen += 1;
    else break;
  }
  if (runLen === 0) return extractPwSenses(raw, "gra");  // not a numbered entry

  const senses = [];

  // Preamble (before the first marker): etymological prose where only {%…%}
  // marks genuine German equivalents — join them into one base sense.
  const preamble = head.slice(0, markers[0].start);
  const preGlosses = glossesIn(preamble);
  if (preGlosses.length) {
    const sense = makeSense(preGlosses.join("; "), preamble);
    if (sense) senses.push(sense);
  }

  // Each numbered sub-sense spans from its marker to the next (the last in the
  // run ends at the first non-consecutive marker — a back-reference — or the end
  // of the headword paragraph). Its {%…%} glosses are the clean German
  // equivalents; only when a numbered span carries no gloss do we fall back to
  // its cleaned prose, which captures unmarked senses ("Name eines der
  // Aditisöhne") without dragging inflected forms or connectives into the others.
  for (let i = 0; i < runLen; i++) {
    const start = markers[i].end;
    const end = i + 1 < runLen
      ? markers[i + 1].start
      : (markers[runLen]?.start ?? head.length);
    const span = head.slice(start, end);
    const glosses = glossesIn(span);
    const def = glosses.length ? glosses.join("; ") : cleanDe(span);
    const sense = makeSense(def, span);
    if (sense) senses.push(sense);
    if (senses.length >= 20) break;
  }

  return senses;
}
