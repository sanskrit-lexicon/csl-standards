// Shared <ls> (labeled-source) citation extraction.
//
// MW/PWG/PWK records carry their source citations as <ls n="…">…</ls>. Three
// generators need to read them — build-neutral-model (the canonical layer),
// export-tei and export-ontolex (their own archival/semantic views) — so the
// parsing contract lives here once. Callers pass their own strip function and
// cap to preserve their existing output exactly.

// Elaborate de-markup used by the TEI/OntoLex exporters: unwrap pseudo-markup
// braces and inline tags, collapse whitespace.
export function stripPseudoMarkup(raw) {
  return String(raw || "")
    .replace(/\{#([^#]+)#\}/g, "$1")
    .replace(/\{%([^%]+)%\}/g, "$1")
    .replace(/<ls\b[^>]*>([\s\S]*?)<\/ls>/g, " $1 ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Extract { source, type, inheritedFrom } for each <ls> in a record's raw.
// `strip` cleans the element content; `max` caps the count. A bare "L." is the
// generic lexicographer hedge; everything else is a named source.
export function extractLabeledSources(raw, { strip = stripPseudoMarkup, max = 40 } = {}) {
  const citations = [];
  for (const match of String(raw || "").matchAll(/<ls\b([^>]*)>([\s\S]*?)<\/ls>/g)) {
    const attrs = match[1] || "";
    const source = strip(match[2]);
    const inherited = attrs.match(/\bn="([^"]+)"/)?.[1] || null;
    if (!source && !inherited) continue;
    citations.push({
      source: source || inherited,
      type: source === "L." ? "generic-lexicographer-hedge" : "named-source-citation",
      inheritedFrom: inherited
    });
    if (citations.length >= max) break;
  }
  return citations;
}
