// Extract German senses from a Petersburg dictionary (PWG / PWK) raw record.
//
// Unlike MW, the Petersburg dictionaries delimit senses explicitly: <div>
// markers with numbered run-ins ("1)", "— 1〉", "a)"), and the German gloss sits
// in {%…%} blocks (Sanskrit forms/examples are in {#…#}, citations in <ls>).
// Each <div> segment that carries a {%…%} gloss is one sense; the <ls> within it
// are the citations that attest that sense — so PWG/PWK citations can be linked
// to a sense, not just the entry.

import { extractLabeledSources } from "./citations.mjs";

function cleanDe(value) {
  return String(value || "")
    .replace(/\{#[^#]*#\}/g, " ")   // drop Sanskrit forms/examples
    .replace(/<[^>]+>/g, " ")        // drop tags
    .replace(/\s+/g, " ")
    .replace(/\s+([,;.:])/g, "$1")
    .trim();
}

export function extractPwSenses(raw, dictionary) {
  if (!raw) return [];
  const body = String(raw)
    .replace(/^.*?¦/, "")            // drop the <L>…<k2> metadata + headword bar
    .replace(/\s*<LEND>\s*$/, "")
    .replace(/\[Page[^\]]*\]/g, " ");

  // Split on <div>; each segment with a {%…%} gloss is a sense.
  const segments = body.split(/<div\b[^>]*>/);
  const senses = [];
  for (const segment of segments) {
    const glosses = [...segment.matchAll(/\{%([^%]*)%\}/g)]
      .map(m => cleanDe(m[1]))
      .filter(Boolean);
    if (!glosses.length) continue;
    const def = glosses.join("; ");
    if (!/[A-Za-zÀ-ÿ]{2,}/.test(def)) continue;
    const cits = extractLabeledSources(segment).map(c => ({
      source: c.source,
      type: c.type,
      dictionary,
      ...(c.inheritedFrom ? { inheritedFrom: c.inheritedFrom } : {})
    }));
    const sense = { def, lang: "de", evidence: "derived" };
    if (cits.length) sense.citations = cits;
    senses.push(sense);
    if (senses.length >= 20) break;
  }
  return senses;
}
