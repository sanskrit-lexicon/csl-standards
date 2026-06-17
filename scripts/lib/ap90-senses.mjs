// Extract English senses from an Apte 1890 (AP90) raw record.
//
// Apte glosses in dense running English after a grammatical apparatus. Senses are
// numbered with {@N@} / {@--N@}, and verbal entries are further sectioned by Roman
// numerals {vI.v} {vII.v}. The gloss text is interleaved with Sanskrit forms
// ({#…#}), class/voice markers ({c1c}, <ab>P.</ab>), bracketed conjugation, and
// <ls> citations. This segmenter strips the apparatus and keeps the English gloss
// per sense; like the MW/PW extractors it favours precision over recall, so the
// sense count is a lower bound.

function clean(value) {
  return String(value || "")
    .replace(/<ls\b[^>]*>[\s\S]*?<\/ls>/g, " ")  // citations
    .replace(/\{#[^#]*#\}/g, " ")                // Sanskrit forms
    .replace(/\{%[^%]*%\}/g, " ")                // italic / grammatical labels
    .replace(/\[[^\]]*\]/g, " ")                 // bracketed conjugation / etymology
    .replace(/\{[^}]*\}/g, " ")                  // residual brace markers ({c1c}, {vI.v}, {1}, coordinates)
    .replace(/<lbinfo\b[^>]*\/?>/g, " ")
    .replace(/<ab>[^<]*<\/ab>/g, " ")            // abbreviations (P., U., q.v.)
    .replace(/<[^>]+>/g, " ")
    .replace(/&c\./g, " ")
    .replace(/\(\s*\)/g, " ")                    // emptied parentheticals
    .replace(/\s+/g, " ")
    .replace(/\s+([,;.])/g, "$1")
    .replace(/([,;.])\1+/g, "$1")                // collapse repeated punctuation
    .replace(/[\s,;.]+$/, "")
    .replace(/^[\s,;.]+/, "")
    .trim();
}

// True when the string reads like an English gloss, not residual apparatus.
function isGloss(value) {
  if (!value) return false;
  const letters = (value.match(/[A-Za-z]/g) || []).length;
  return /[A-Za-z]{3,}/.test(value) && letters >= 3 && value.length <= 200;
}

export function extractAp90Senses(raw) {
  if (!raw) return [];
  const body = String(raw).replace(/^[\s\S]*?¦/, "").replace(/\s*<LEND>\s*$/, "");
  // Sense boundaries: {@N@}/{@--N@} numbered senses and {vN.v} verb sections.
  const SEP = /\{@\s*-*\s*\d+\s*@\}|\{v[IVXLC]+\.?v\}/g;
  const segments = SEP.test(body) ? body.split(SEP) : [body];
  const senses = [];
  for (const segment of segments) {
    let def = clean(segment)
      .replace(/^\([^)]*\)\s*/, "")                  // leading conjugation parenthetical
      .replace(/[,;]?\s*connected with[\s\S]*$/i, "") // trailing cross-reference tail
      .replace(/[\s,;.]+$/, "")
      .trim();
    if (isGloss(def) && !senses.some(s => s.def === def)) {
      senses.push({ def, lang: "en", evidence: "derived" });
    }
    if (senses.length >= 12) break;
  }
  return senses;
}
