// Shared Śabdakalpadruma (SKD) helpers for the TEI Lex-0 indigenous sample
// (docs/TEI_LEX0_PILOT.md; gaps: docs/TEI_LEX0_SKD_GAPS.md).
//
// Pure functions only — no I/O — so the stratifier and the record parser are
// unit-tested (test/skd.test.mjs) and shared by scripts/parse-skd-kosa.mjs.
//
// Zero-meaning doctrine (csl-atlas docs/MICROSTRUCTURE_ZERO_MEANING.md): SKD
// carries none of the Western <ab>/<ls>/<div> apparatus, so the absence of a
// marker is never read as the absence of content. Concretely: an empty
// anubandha slot is the source's own statement "no anubandha" (SKD front
// matter), and an unmarked pada is the parasmaipada default, which is not
// asserted (csl-atlas docs/MICROSTRUCTURE_SKD_ANUBANDHA_KEY.md).

// SLP1 -> IAST. SLP1 encodes one Devanagari phoneme per ASCII char, so a
// per-character substitution is exact (no digraph ordering needed).
const SLP1_IAST = {
  a: "a", A: "ā", i: "i", I: "ī", u: "u", U: "ū",
  f: "ṛ", F: "ṝ", x: "ḷ", X: "ḹ", e: "e", E: "ai", o: "o", O: "au",
  M: "ṃ", H: "ḥ", "~": "m̐",
  k: "k", K: "kh", g: "g", G: "gh", N: "ṅ",
  c: "c", C: "ch", j: "j", J: "jh", Y: "ñ",
  w: "ṭ", W: "ṭh", q: "ḍ", Q: "ḍh", R: "ṇ",
  t: "t", T: "th", d: "d", D: "dh", n: "n",
  p: "p", P: "ph", b: "b", B: "bh", m: "m",
  y: "y", r: "r", l: "l", v: "v",
  S: "ś", z: "ṣ", s: "s", h: "h", L: "ḷ", "'": "'"
};

export function slp1ToIast(text) {
  if (!text) return text;
  let out = "";
  for (const ch of String(text)) out += SLP1_IAST[ch] ?? ch;
  return out;
}

// Kośa / dhātupāṭha authorities keyed by their SLP1 stem (case-sensitive:
// lower-casing SLP1 would destroy the aspirate/long-vowel distinctions).
export const AUTHORITIES = new Map([
  ["amara", "Amara"], ["medini", "Medinī"], ["medinI", "Medinī"],
  ["hemacandra", "Hemacandra"], ["viSva", "Viśva"],
  ["Barata", "Bharata"], ["jawADara", "Jaṭādhara"],
  ["trikARqaSeza", "Trikāṇḍaśeṣa"],
  ["SabdaratnAvalI", "Śabdaratnāvalī"], ["mADavI", "Mādhavī"],
  ["SabdacandrikA", "Śabdacandrikā"], ["rAjanirGaRwa", "Rājanighaṇṭu"],
  ["ratnamAlA", "Ratnamālā"], ["halAyuDa", "Halāyudha"],
  ["kavikalpadruma", "Kavikalpadruma"], ["durgAdAsa", "Durgādāsa"]
]);

// Of the recognised authorities, these are text titles (kośas, nighaṇṭus, the
// dhātupāṭha) rather than persons, so they map to <bibl><title>, not <author>.
export const WORKS = new Set([
  "Medinī", "Viśva", "Trikāṇḍaśeṣa", "Śabdaratnāvalī", "Mādhavī", "Śabdacandrikā",
  "Rājanighaṇṭu", "Ratnamālā", "Kavikalpadruma"
]);

export function normAuthority(token) {
  if (!token) return null;
  const stem = token.replace(/H$/, ""); // drop closing visarga (sandhi -H)
  return AUTHORITIES.get(token) || AUTHORITIES.get(stem) || null;
}

export function authorityRef(name) {
  if (!name) return undefined;
  return WORKS.has(name) ? { title: name } : { author: name };
}

// The Vopadeva/Dhātudīpikā anubandha (it-letter) inventory that SKD writes in
// the slot right after "¦" on a root entry (MICROSTRUCTURE_SKD_ANUBANDHA_KEY.md).
// Used only to READ the slot as printed; its interpretation (gaṇa/pada) comes
// from the csl-atlas M4 decode, never re-derived here.
export const ANUBANDHA_TOKENS = new Set([
  "ka", "ki", "ga", "gi", "da", "Da", "Sa", "Si", "pa", "na", "ya", "Ba", "li",
  "la", "lu", "Ga", "kza", "ja", "Ja", "Ra", "Wa", "mi", "va", "N", "Na", "Y", "Ya",
  "i", "A", "u", "U", "I", "O", "o", "e", "f", "F", "x", "m", "ma", "ir", "E",
  "Yi", "wu", "qu", "za", "t", "ta", "ra", "a"
]);

// Leading grammatical tokens of a nominal/indeclinable entry (after "¦,").
// "tri" = triliṅga (all three genders: an adjective by the indigenous liṅga
// taxonomy); "vya" = avyaya (indeclinable). Neither is a gender.
export const LINGA = new Map([
  ["puM", { kind: "gender", norm: "masculine" }],
  ["strI", { kind: "gender", norm: "feminine" }],
  ["klI", { kind: "gender", norm: "neuter" }],
  ["tri", { kind: "triliṅga", norm: "adjective" }],
  ["vya", { kind: "avyaya", norm: "indeclinable" }]
]);
const LINGA_RE = new RegExp(`^((?:${[...LINGA.keys()].join("|")})(?:[\\s,]+(?:${[...LINGA.keys()].join("|")}))*)(?=[\\s,(]|$)\\s*,?\\s*`);

// CDSL digitisation corrections embedded in csl-orig:
// {{old->new|date|editor|url|note}}. Applied (new reading wins) and returned
// so the export can witness them; this is the CDSL layer, not the kośa's own.
export function applyCorrections(text) {
  const corrections = [];
  const out = text.replace(/\{\{([^{}]*?)->([^|{}]*)\|([^{}]*)\}\}/g, (_, oldR, newR, rest) => {
    const parts = rest.split("|");
    corrections.push({ old: oldR, new: newR, date: parts[1] || "", url: parts[3] || "" });
    return newR;
  });
  return { text: out, corrections };
}

// Raw record -> header fields + a single-line body (headword and "¦" dropped).
export function recordBody(raw) {
  const header = raw.match(/<L>([^<]+)<pc>([^<]*)<k1>([^<]*)/);
  const L = header?.[1];
  const pc = header?.[2] || "";
  const k1 = header?.[3] || "";
  const { text, corrections } = applyCorrections(raw.replace(/^<L>[^\n]*\n/, "").replace(/<LEND>\s*$/, ""));
  // A line-final hyphen is a print word-split, except inside the root's
  // grammatical annotation "(BvAM-AtmaM-sakaM-sew .)", where the hyphen after
  // an abbreviation mark (M or 0) separates fields and must survive the join.
  let body = text.replace(/([M0]?)-\s*\n(?=([^)\n]*(?:\n[^)\n]*)?)\))/g, (m, mark, tail) =>
    mark && /\b(?:sew|aniw|vew)\s*\.?\s*$/.test(tail) ? `${mark}-` : mark
  ).replace(/-\s*\n/g, "").replace(/\n/g, " ");
  body = body.replace(/\[Page[^\]]*\]/g, " ").replace(/<\/?P>/g, " ").replace(/\s+/g, " ").trim();
  const bar = body.indexOf("¦");
  const afterBar = bar >= 0 ? body.slice(bar + 1) : body;
  return { L, pc, k1, body: afterBar.replace(/^\s*,?\s*/, ""), corrections };
}

export function leadingLinga(body) {
  const m = body.match(LINGA_RE);
  if (!m) return { linga: [], rest: body };
  const linga = m[1].split(/[\s,]+/).filter(Boolean).map(t => ({ token: t, ...LINGA.get(t) }));
  return { linga, rest: body.slice(m[0].length) };
}

// Anubandha slot as printed: the leading run of inventory tokens on a root
// entry. An empty run is the source's "no anubandha" (dot or zero), never "no
// verb" (front matter, grantha-paripāṭī).
export function anubandhaSlot(body) {
  const tokens = [];
  const words = body.split(/\s+/);
  for (const w of words) {
    const t = w.replace(/[,.]+$/, "");
    if (!ANUBANDHA_TOKENS.has(t) || tokens.length >= 6) break;
    tokens.push(t);
    if (/[,.]$/.test(w)) break;
  }
  // a lone "a"/"na" followed by nothing slot-like is still read as a slot token;
  // the M4 decode is the authority for what it means.
  let rest = body;
  for (const t of tokens) rest = rest.replace(new RegExp(`^\\s*${t}[,.]?\\s*`), "");
  return { tokens, rest };
}

export const KOSA_AUTH_RE = /\bit[iy]\s*(amaraH|medinI|hemacandraH|viSvaH|BarataH|jawADaraH|trikARqaSezaH|SabdaratnAvalI|SabdacandrikA|rAjanirGaRwaH|halAyuDaH|ratnamAlA|kavikalpadrumaH|durgAdAsaH|mADavI)/;

// Stratum order is a priority order: a record belongs to the first stratum
// whose structural signature it carries. Every signature is a POSITIVE marker
// in the source; "residual" is what carries none of them, not "empty".
export const STRATA = [
  "dhatu-anubandha", "dhatu-zero-slot", "cross-reference", "nibandha",
  "avyaya", "kosa-paryaya", "kosa-iti", "bhasa-gloss", "literary-quotation", "residual"
];

export const NIBANDHA_MIN_CHARS = 4000;
export const XREF_MAX_CHARS = 300;

// m4Roots: Map<L, {anubandhas: string, ...}> of csl-atlas M4 SKD root rows.
export function classifyStratum({ L, body }, m4Roots) {
  const { linga } = leadingLinga(body);
  if (m4Roots.has(L) && linga.length === 0 && !/^\s*\[/.test(body)) {
    return m4Roots.get(L).anubandhas ? "dhatu-anubandha" : "dhatu-zero-slot";
  }
  if (body.length < XREF_MAX_CHARS && /Sabde\s+drazwavy/.test(body)) return "cross-reference";
  if (body.length >= NIBANDHA_MIN_CHARS) return "nibandha";
  if (linga.some(l => l.kind === "avyaya")) return "avyaya";
  if (/tatpary?y?AyaH/.test(body)) return "kosa-paryaya";
  if (KOSA_AUTH_RE.test(body)) return "kosa-iti";
  if (/iti BAzA/.test(body)) return "bhasa-gloss";
  if (/“/.test(body)) return "literary-quotation";
  return "residual";
}

// Deterministic, seedable ordering (FNV-1a 32-bit) so the stratified sample is
// reproducible from the source alone — no Math.random, no clock.
export function fnv1a(str) {
  let h = 0x811c9dc5;
  for (const ch of str) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function stratifiedPick(members, perStratum, seed) {
  return [...members]
    .sort((a, b) => fnv1a(`${seed}:${a}`) - fnv1a(`${seed}:${b}`) || String(a).localeCompare(String(b)))
    .slice(0, perStratum);
}
