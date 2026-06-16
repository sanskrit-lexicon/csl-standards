// Evidence-class sub-typing — the csl: extension layer's answer to the
// model-vocabulary gap (EXTENSION_PROPOSAL.md §1, LOSS_ANALYSIS.md §4b).
//
// A flat frac:Attestation carries a citation siglum as a string but cannot say
// what *kind* of evidence it is, nor parse its textual coordinate. These helpers
// refine a siglum into an evidence class and a structured coordinate, so the
// OntoLex export can emit csl:evidenceClass / csl:citedWork / csl:citedRange and
// build-loss-reports can detect (with the same patterns) the gap they close.

// Indigenous kośa (lexicon) authorities — Amara, Hemacandra, Medinī, Trikāṇḍa,
// Halāyudha, Vaijayantī, Viśva, Śabdaratnāvalī/-candrikā, Hārāvalī, Nānārtha.
export const KOSHA_SIGLUM = /^(AK\.|H\.|Medin|Trik|Hal[aā]y|Vaij|Vi[sś]va|[SŚ]abdar|[SŚ]abdac|H[aā]r[aā]v|N[aā]n[aā]rth|Amar)/;
// Editorial / self / catalogue references — point within the lexicographic
// tradition, not to an external text.
export const EDITORIAL_SIGLUM = /^(ib\.|W\.|MW\.|Verz|l\.c\.)/i;
// A textual coordinate: two or more numbers separated by , or . (book,hymn,verse).
export const COORDINATE = /\d+\s*[,.]\s*\d+/;

// Classify a citation into the extension's evidence class. `type` is the coarse
// type from extractLabeledSources (hedge vs named source).
export function evidenceClass(source, type) {
  const s = String(source ?? "").trim();
  if (type === "generic-lexicographer-hedge" || s === "L.") return "hedge";
  if (KOSHA_SIGLUM.test(s)) return "kosha";
  if (EDITORIAL_SIGLUM.test(s)) return "editorial";
  return "textual";
}

// Parse a citation's textual coordinate into { work, locus }, e.g.
// "AV. 6,116,1." -> { work: "AV.", locus: "6,116,1" }. Returns null when there
// is no two-part numeric coordinate. Heuristic: split at the first digit.
export function parseCoordinate(source) {
  const s = String(source ?? "").trim();
  if (!COORDINATE.test(s)) return null;
  const i = s.search(/\d/);
  if (i <= 0) return null;
  const work = s.slice(0, i).replace(/[\s,]+$/, "").trim();
  const locus = s.slice(i).replace(/\.\s*$/, "").replace(/\s+/g, "").trim();
  if (!work || !locus) return null;
  return { work, locus };
}
