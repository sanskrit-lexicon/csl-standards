// Parse indigenous kosa (Sabdakalpadruma) records into the neutral-model shape
// the Lex-0 generator consumes, replacing the hand-curated fixture with
// source-derived entries (TEI Lex-0 pilot, slice 3; broadened in slice 4).
//
// A kosa entry is structured by AUTHORITY: runs of meanings/synonyms each
// closed by "iti <authority>" (ity amaraH, iti medinI, iti hemacandraH). This
// is exactly the sense/citation fusion documented in docs/TEI_LEX0_PILOT.md
// sec. 5 — the parser keeps each authority group as one sense and records the
// fusion as a model-loss note.
//
// Glosses are transliterated from the SLP1 source to IAST (slp1ToIast); the
// lemma orth is left in SLP1 because the generator declares it as SLP1.
// Authority attributions are normalised to IAST author/work names.
//
// Tuned on Darmma (L17667) and generalised to a curated set of iti-authority-
// segmented SKD records (TARGET_LS). Uncovered structures fall back to a single
// sense; non-kosa "iti X" (iti tiTyAditattvam, iti man) are left in prose.
//
// Usage: npm run parse-skd-kosa
// Output: data/pilot/lex0-fixtures.json

import fs from "node:fs/promises";
import path from "node:path";

const SKD_SOURCE = path.resolve(process.cwd(), "..", "csl-orig", "v02", "skd", "skd.txt");
const OUT = path.resolve(process.cwd(), "data", "pilot", "lex0-fixtures.json");
// Curated kosa records that parse to a sensible iti-authority sense structure.
// (jYAtiH L13859 is omitted: its trailing Medinī group is an irreducible
// nibandha discussion that does not reduce to glosses.)
const TARGET_LS = ["17667", "7806", "6080", "31183", "21315", "15202"];

// SLP1 function words that begin a prose clause rather than a kosa gloss.
const PROSE_LEAD = new Set([
  "atra", "tatra", "tataH", "tatas", "tena", "sa", "eze", "ezAM", "yAni",
  "kAni", "ca", "yaTA", "uktaM", "uktaYca", "evaM", "yadvA", "kiYca", "tat"
]);

const GENDERS = new Map([
  ["puM", "masculine"], ["klI", "neuter"], ["strI", "feminine"], ["na", "neuter"], ["tri", "adjective"]
]);
const GENDER_TOKENS = [...GENDERS.keys()].join("|");

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

function slp1ToIast(text) {
  if (!text) return text;
  let out = "";
  for (const ch of String(text)) out += SLP1_IAST[ch] ?? ch;
  return out;
}

// Authority/work names keyed by their SLP1 stem (case-sensitive: lower-casing
// SLP1 would destroy the aspirate/long-vowel distinctions).
const AUTHORITIES = new Map([
  ["amara", "Amara"], ["medini", "Medinī"], ["medinI", "Medinī"],
  ["hemacandra", "Hemacandra"], ["viSva", "Viśva"],
  ["Barata", "Bharata"], ["jawADara", "Jaṭādhara"],
  ["trikARqaSeza", "Trikāṇḍaśeṣa"],
  ["SabdaratnAvalI", "Śabdaratnāvalī"], ["mADavI", "Mādhavī"],
  ["SabdacandrikA", "Śabdacandrikā"]
]);

// Of the recognised authorities, these are text titles (kosas/commentaries)
// rather than persons, so they map to TEI <bibl><title> not <author>.
const WORKS = new Set(["Medinī", "Viśva", "Trikāṇḍaśeṣa", "Śabdaratnāvalī", "Mādhavī", "Śabdacandrikā"]);

function normAuthority(token) {
  if (!token) return null;
  const stem = token.replace(/H$/, ""); // drop closing visarga (sandhi -H)
  return AUTHORITIES.get(token) || AUTHORITIES.get(stem) || null;
}

// Build the TEI bibl payload: a work -> {title}, a person -> {author}.
function authorityRef(name) {
  if (!name) return undefined;
  return WORKS.has(name) ? { title: name } : { author: name };
}

function dehyphenate(text) {
  return text.replace(/-\s*\n/g, "").replace(/\n/g, " ").replace(/\s+/g, " ").trim();
}

const QUOTES = /[()“”"„‟�]/g;

// Extract a "(yaTA, <source> . <ref> . “<quote>”)" example, if present.
function extractExample(text) {
  const m = text.match(/\(\s*yaTA[,\s]+([^.“”„‟"]+?)\s*\.\s*([\d,.\s]*?)\s*[“„"]([^”‟"]*)[”‟"]\s*\)?/);
  if (!m) return { example: null, rest: text };
  const example = {
    source: slp1ToIast(m[1].trim()),
    cited: m[2].replace(/\s+/g, "").replace(/\.+$/, "") || undefined,
    quote: slp1ToIast(m[3].replace(/\s+/g, " ").trim())
  };
  return { example, rest: text.replace(m[0], " ").replace(/\([^()]*\)/g, " ") };
}

// One authority group -> one Lex-0 sense.
function groupToSense(rawGroup, authority) {
  const { example, rest } = extractExample(rawGroup);
  let text = rest.replace(/\([^()]*\)/g, " ");
  // paryaya: "tatparyyAyaH . w1 2 w2 3 ..." — synonyms separated by enumeration numbers
  let paryaya = null;
  const pm = text.match(/tatpary?y?AyaH\s*\.(.*)$/);
  if (pm) {
    paryaya = pm[1].split(/\s*\d+\s*|\s*\.\s*/).map(s => slp1ToIast(s.replace(QUOTES, "").trim())).filter(Boolean);
    text = text.slice(0, pm.index);
  }
  // remaining "."-separated single-word meanings (drop enumeration numbers,
  // "*" section marks, non-kosa "iti X" prose, and medinI index refs "se, 16")
  const meanings = text.split(/\s*\.\s*/)
    .map(s => s.replace(QUOTES, "").replace(/\*/g, " ").replace(/\b\d+\b/g, " ").replace(/\s+/g, " ").trim())
    .filter(s => s && !/tatpary/.test(s) && !/^it[iy]\b|^it[iy][A-Za-z]/.test(s)
      && !/^[A-Za-z]{1,3},/.test(s) && s.length <= 40 && !PROSE_LEAD.has(s.split(/\s+/)[0]))
    .map(slp1ToIast);
  const defParts = [];
  if (meanings.length) defParts.push(meanings.join("; "));
  if (paryaya?.length) defParts.push(`paryāya: ${paryaya.join(", ")}`);
  const sense = {
    def: defParts.join(" — ") || meanings.join("; ") || "(unparsed)",
    lang: "sa-Latn",
    evidence: "observed",
    authority: authorityRef(authority)
  };
  if (example) sense.example = example;
  if (paryaya?.length) {
    sense.loss = "In the source this synonym run and its authority (iti " +
      (authority || "X") + ") are one indivisible iti-unit: sense enumeration and " +
      "source attestation are a single construction, split into def + bibl here.";
  }
  return sense;
}

function parseRecord(raw) {
  const header = raw.match(/<L>([^<]+)<pc>([^<]*)<k1>([^<]*)/);
  const L = header?.[1];
  const k1 = header?.[3] || "";
  let body = dehyphenate(raw.replace(/^<L>[^\n]*\n/, "").replace(/<LEND>\s*$/, ""));
  body = body.replace(/\[Page[^\]]*\]/g, " "); // drop scan page markers
  body = body.replace(/^[^¦]*¦\s*,?\s*/, ""); // drop headword + danda separator

  // leading gender tokens (one or more), with or without a following parenthesis
  const gm = body.match(new RegExp(`^((?:${GENDER_TOKENS})(?:\\s+(?:${GENDER_TOKENS}))*)\\s*,?\\s*`));
  let genders = [];
  if (gm) {
    genders = gm[1].trim().split(/\s+/).map(t => GENDERS.get(t)).filter(Boolean);
    body = body.slice(gm[0].length);
  }

  // etymology: first parenthetical (root + affix, optionally an Unadi reference)
  let etym = null;
  const em = body.match(/^\(([^()]*)\)\s*/);
  if (em) {
    const inner = em[1];
    const una = inner.match(/uRA?[MdiI]*\s*([\d.\s]+)/);
    const deriv = inner.match(/([A-Za-zfFxXMH]+)\s*\+\s*([A-Za-zfFxXMH]+)/);
    let mention = "";
    if (/\bDf\b/.test(inner)) mention = slp1ToIast("Df");
    else if (deriv) mention = `${slp1ToIast(deriv[1])} + ${slp1ToIast(deriv[2])}`;
    etym = {
      type: "etymology", label: "from",
      mention,
      source: una ? `Uṇādisūtra ${una[1].replace(/\s+/g, "").replace(/\.+$/, "")}` : ""
    };
    body = body.slice(em[0].length);
  }

  // segment on authority markers: "ity amaraH", "iti medinI", and multi-word
  // attributions like "iti tawwIkAyAM BarataH" (the author is the 2nd token).
  const markerRe = /\bit[iy]\s*([A-Za-zI]+)(?:\s+([A-Za-zI]+))?/g;
  const senses = [];
  let m, groupStart = 0;
  while ((m = markerRe.exec(body))) {
    const authority = normAuthority(m[2]) || normAuthority(m[1]);
    if (!authority) continue; // not a kosa authority (e.g. "iti tiTyAditattvam")
    const group = body.slice(groupStart, m.index);
    senses.push(groupToSense(group, authority));
    groupStart = markerRe.lastIndex;
  }
  if (groupStart < body.length) {
    const s = groupToSense(body.slice(groupStart), null);
    const realDef = s.def && s.def !== "(unparsed)" && /[A-Za-zĀ-ʯ]{3}/.test(s.def);
    if (realDef) {
      senses.push(s);
    } else if (s.example && senses.length) {
      // a trailing illustration belongs to the last authority group
      senses[senses.length - 1].example = senses[senses.length - 1].example || s.example;
    }
  }

  // drop authority groups that are pure prose (no extractable meaning/example):
  // the entry-level loss note already records the fusion phenomenon.
  const keptSenses = senses.filter(s => !(s.def === "(unparsed)" && !s.example));

  return {
    id: `skd:${k1.replace(/[^A-Za-z0-9]/g, "")}`,
    key: k1.replace(/H$/, ""),
    phenomena: ["indigenous-kosa", "iti-authority", "sense-citation-fusion"],
    records: { skd: { L } },
    forms: [{ orth: k1.replace(/H$/, ""), type: "lemma" }],
    genders,
    relations: etym ? [etym] : [],
    senses: keptSenses,
    citations: [],
    loss: [
      "Source-parsed indigenous kosa entry: meanings/synonyms are grouped by their " +
      "closing authority (iti <author>), the kosa's own sense-and-citation unit."
    ]
  };
}

async function main() {
  let text;
  try { text = await fs.readFile(SKD_SOURCE, "utf8"); }
  catch { console.error(`Missing ${SKD_SOURCE}; SKD source (csl-orig) must be a sibling repo.`); process.exit(1); }

  const records = text.match(/<L>[\s\S]*?<LEND>/g) || [];
  const byL = new Map();
  for (const r of records) {
    const L = r.match(/<L>([^<]+)/)?.[1];
    if (L) byL.set(L, r);
  }
  const entries = [];
  for (const L of TARGET_LS) {
    const raw = byL.get(L);
    if (!raw) { console.warn(`SKD L${L} not found; skipped.`); continue; }
    entries.push(parseRecord(raw));
  }
  await fs.writeFile(OUT, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
  console.log(`Parsed ${entries.length} SKD kosa record(s) -> ${path.relative(process.cwd(), OUT)}`);
  for (const e of entries) console.log(`  ${e.id} (${e.key}): ${e.genders.join("/") || "—"} ; ${e.senses.length} sense group(s)`);
}

main().catch(error => { console.error(error); process.exit(1); });
