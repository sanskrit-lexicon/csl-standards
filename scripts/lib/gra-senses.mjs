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
//   • Grassmann's citation apparatus is coordinate-based: the <div> segments give
//     the inflected forms and reference each attestation by `N〉 {hymn,verse}` keyed
//     to the numbered sense N ("-as 1〉 {548,12}. 5〉 {192,4}"). The dictionary is
//     wholly the Rigveda, so a coordinate is an RV locus; extractGraSenses attaches
//     it to the sense it attests, and extractGraCitations surfaces the flat list for
//     the neutral model so the loss corpus sees Grassmann's evidence. (The few real
//     <ls> — comparative-grammar refs like Cu. — are still attached per sense too;
//     coordinate refs are dropped from the gloss text.)
//
// Entries with no numbered run fall back to the Petersburg extractor, which
// handles GRA's <div>/{%…%} glosses fine; their coordinates are still surfaced at
// entry level by extractGraCitations.

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

// A coordinate ref {hymn,verse} (two+ numbers in braces) — distinct from the
// {#…#}/{@…@}/{%…%} pseudo-markup which never starts with a digit.
const COORD = /\{\s*(\d[\d.,\s]*\d)\s*\}/g;

function coordCite(source) {
  return { source, type: "named-source-citation", dictionary: "gra" };
}

function divPartOf(body) {
  const i = body.indexOf("<div");
  return i >= 0 ? body.slice(i) : "";
}

// Walk the <div> portion in document order, assigning each {hymn,verse} coordinate
// to the most recent N〉 sense number within its own <div> (null = prefix-keyed, not
// tied to a numbered sense). Returns the flat coordinate list and a per-sense map,
// each coordinate formatted as the RV locus "RV h,v".
function parseDivCitations(divPart) {
  const flat = [];
  const bySense = new Map();
  for (const seg of divPart.split(/<div\b[^>]*>/)) {
    const marks = [];
    for (const m of seg.matchAll(MARKER)) marks.push({ pos: m.index, num: Number(m[1]) });
    for (const m of seg.matchAll(COORD)) {
      const locus = m[1].replace(/\s+/g, "");
      if (/\d[.,]\d/.test(locus)) marks.push({ pos: m.index, coord: `RV ${locus}` });
    }
    marks.sort((a, b) => a.pos - b.pos);
    let current = null;
    for (const mk of marks) {
      if (mk.num !== undefined) current = mk.num;
      else {
        flat.push(mk.coord);
        if (current != null) {
          if (!bySense.has(current)) bySense.set(current, []);
          bySense.get(current).push(mk.coord);
        }
      }
    }
  }
  return { flat, bySense };
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
  const numberedByN = new Map();

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
    if (sense) {
      senses.push(sense);
      numberedByN.set(i + 1, sense);
    }
    if (senses.length >= 20) break;
  }

  // Attach Grassmann's coordinate citations (keyed by N〉 in the <div> apparatus)
  // to the numbered sense they attest, deduped and capped, alongside any <ls>.
  const { bySense } = parseDivCitations(divPartOf(body));
  for (const [n, coords] of bySense) {
    const sense = numberedByN.get(n);
    if (!sense) continue;
    const seen = new Set((sense.citations || []).map(c => c.source));
    const add = [...new Set(coords)].filter(s => !seen.has(s)).slice(0, 12).map(coordCite);
    if (add.length) sense.citations = [...(sense.citations || []), ...add];
  }

  return senses;
}

// Entry-level flat coordinate citations (deduped, capped) for the neutral model's
// citation layer — Grassmann's RV apparatus is coordinate-based ({hymn,verse}), not
// <ls>, so build-neutral-model adds these so the loss corpus's citation-coordinate
// evidence class (which reads model.citations) sees his evidence. Works for numbered
// and un-numbered entries alike.
export function extractGraCitations(raw) {
  if (!raw) return [];
  const { flat } = parseDivCitations(divPartOf(bodyOf(raw)));
  const seen = new Set();
  const out = [];
  for (const source of flat) {
    if (seen.has(source)) continue;
    seen.add(source);
    out.push(coordCite(source));
    if (out.length >= 12) break;
  }
  return out;
}
