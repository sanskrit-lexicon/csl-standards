// Parse indigenous kosa (Sabdakalpadruma) records into the neutral-model shape
// the Lex-0 generator consumes, replacing the hand-curated fixture with a
// source-derived one (TEI Lex-0 pilot, slice 3).
//
// A kosa entry is structured by AUTHORITY: runs of meanings/synonyms each
// closed by "iti <authority>" (ity amaraH, iti medinI, iti hemacandraH). This
// is exactly the sense/citation fusion documented in docs/TEI_LEX0_PILOT.md
// sec. 5 — the parser keeps each authority group as one sense and records the
// fusion as a model-loss note.
//
// Tuned to and verified on Darmma (L17667). Generalises to iti-authority-
// segmented SKD records; uncovered structures fall back to a single sense.
//
// Usage: npm run parse-skd-kosa
// Output: data/pilot/lex0-fixtures.json

import fs from "node:fs/promises";
import path from "node:path";

const SKD_SOURCE = path.resolve(process.cwd(), "..", "csl-orig", "v02", "skd", "skd.txt");
const OUT = path.resolve(process.cwd(), "data", "pilot", "lex0-fixtures.json");
const TARGET_LS = ["17667"]; // extend with more kosa records as the parser grows

const GENDERS = new Map([
  ["puM", "masculine"], ["klI", "neuter"], ["strI", "feminine"], ["na", "neuter"], ["tri", "adjective"]
]);
const AUTHORITIES = new Map([
  ["amara", "Amara"], ["medini", "Medinī"], ["hemacandra", "Hemacandra"],
  ["viSva", "Viśva"], ["BaraTa", "Bharata"], ["trikANqa", "Trikāṇḍaśeṣa"]
]);

function dehyphenate(text) {
  return text.replace(/-\s*\n/g, "").replace(/\n/g, " ").replace(/\s+/g, " ").trim();
}

function normAuthority(token) {
  const key = token.replace(/[Hi]+$/, "").replace(/I+$/, "I"); // strip trailing visarga/sandhi -H
  return AUTHORITIES.get(token) || AUTHORITIES.get(key) || AUTHORITIES.get(key.toLowerCase())
    || AUTHORITIES.get(token.toLowerCase()) || null;
}

const QUOTES = /[()“”"]/g;

// Extract a "(yaTA, <source> . <ref> . “<quote>”)" example, if present.
function extractExample(text) {
  const m = text.match(/\(\s*yaTA[,\s]+([^.“”]+?)\s*\.\s*([\d,.\s]*?)\s*[“"]([^”"]*)[”"]\s*\)?/);
  if (!m) return { example: null, rest: text };
  const example = {
    source: m[1].trim(),
    cited: m[2].replace(/\s+/g, "").replace(/\.+$/, "") || undefined,
    quote: m[3].replace(/\s+/g, " ").trim()
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
    paryaya = pm[1].split(/\s*\d+\s*|\s*\.\s*/).map(s => s.replace(QUOTES, "").trim()).filter(Boolean);
    text = text.slice(0, pm.index);
  }
  // remaining "."-separated single-word meanings
  const meanings = text.split(/\s*\.\s*/).map(s => s.replace(QUOTES, "").trim())
    .filter(s => s && !/^\d/.test(s) && !/tatpary/.test(s) && s.length <= 40 && !/^se,/.test(s));
  const defParts = [];
  if (meanings.length) defParts.push(meanings.join("; "));
  if (paryaya?.length) defParts.push(`paryāya: ${paryaya.join(", ")}`);
  const sense = {
    def: defParts.join(" — ") || meanings.join("; ") || "(unparsed)",
    lang: "sa-Latn-x-SLP1",
    evidence: "observed",
    authority: authority ? { author: authority } : undefined
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
  body = body.replace(/^[^¦]*¦\s*,?\s*/, ""); // drop headword + danda separator

  // leading genders, up to the first parenthesis or danda
  const gm = body.match(/^([A-Za-z ]+?)\s*,\s*\(/);
  let genders = [];
  if (gm) {
    genders = gm[1].trim().split(/\s+/).map(t => GENDERS.get(t)).filter(Boolean);
    body = body.slice(gm[0].length - 1); // keep the "("
  }

  // etymology: first parenthetical (contains the root + Unadi reference)
  let etym = null;
  const em = body.match(/^\(([^()]*)\)\s*/);
  if (em) {
    const inner = em[1];
    const una = inner.match(/uRA?[MdiI]*\s*([\d.\s]+)/);
    etym = {
      type: "etymology", label: "from",
      mention: /\bDf\b/.test(inner) ? "Df" : "",
      source: una ? `Uṇādisūtra ${una[1].replace(/\s+/g, "").replace(/\.+$/, "")}` : ""
    };
    body = body.slice(em[0].length);
  }

  // segment on authority markers: "ity amaraH" / "iti medinI" / "iti hemacandraH"
  const markerRe = /\bit[iy]\s*([A-Za-zI]+)/g;
  const senses = [];
  let last = 0, m, pendingAuthority = null, groupStart = 0;
  while ((m = markerRe.exec(body))) {
    const authority = normAuthority(m[1]);
    if (!authority) continue; // not a kosa authority (e.g. "iti vA" inside prose)
    const group = body.slice(groupStart, m.index);
    senses.push(groupToSense(group, authority));
    groupStart = markerRe.lastIndex;
  }
  if (groupStart < body.length) {
    const s = groupToSense(body.slice(groupStart), null);
    const realDef = s.def && s.def !== "(unparsed)" && /[A-Za-z]{3}/.test(s.def);
    if (realDef) {
      senses.push(s);
    } else if (s.example && senses.length) {
      // a trailing illustration belongs to the last authority group
      senses[senses.length - 1].example = senses[senses.length - 1].example || s.example;
    }
  }

  return {
    id: `skd:${k1.replace(/[^A-Za-z0-9]/g, "")}`,
    key: k1.replace(/H$/, ""),
    phenomena: ["indigenous-kosa", "iti-authority", "sense-citation-fusion"],
    records: { skd: { L } },
    forms: [{ orth: k1.replace(/H$/, ""), type: "lemma" }],
    genders,
    relations: etym ? [etym] : [],
    senses,
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
  for (const e of entries) console.log(`  ${e.id}: ${e.genders.join("/")} ; ${e.senses.length} sense group(s)`);
}

main().catch(error => { console.error(error); process.exit(1); });
