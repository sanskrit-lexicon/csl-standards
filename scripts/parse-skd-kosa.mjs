// Parse indigenous kosa (Sabdakalpadruma) records into the neutral-model shape
// the Lex-0 generator consumes (TEI Lex-0 pilot slices 3-4; stratified sample
// H5321, docs/TEI_LEX0_SKD_GAPS.md).
//
// Selection = the 6 curated iti-authority records of slice 4 PLUS a
// deterministic stratified sample: every SKD record is assigned to one
// structural stratum (scripts/lib/skd.mjs STRATA — dhatu with / without an
// anubandha slot, cross-reference, nibandha, avyaya, paryaya, kosa-iti, bhasa
// gloss, literary quotation, residual) and PER_STRATUM records are drawn per
// stratum by an FNV-1a ordering under SEED. No Math.random, no clock: the
// sample is reproducible from the source alone.
//
// A kosa entry is structured by AUTHORITY: runs of meanings/synonyms each
// closed by "iti <authority>". Each authority group becomes one sense and the
// fusion is recorded as a model-loss (docs/TEI_LEX0_PILOT.md sec. 5). A root
// (dhatu) entry reads its anubandha slot as printed and takes the gana/pada
// interpretation from the csl-atlas M4 decode (Dhatudipika key). Zero-meaning
// doctrine: an empty slot is recorded as the source's "no anubandha", and an
// unmarked pada is NOT asserted as parasmaipada.
//
// Whatever has no Lex-0 home is recorded as a gap id (G1..G12, registry in
// data/pilot/skd-lex0-gaps.json) on the entry, never forced into a def.
//
// Inputs (sibling repos): ../csl-orig/v02/skd/skd.txt,
//   ../csl-atlas/data/lexico/indigenous_roots.csv (M4).
// Usage: npm run parse-skd-kosa
// Output: data/pilot/lex0-fixtures.json, data/pilot/skd-lex0-sample.json,
//         data/pilot/skd-lex0-gaps.json

import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  slp1ToIast, normAuthority, authorityRef, recordBody, leadingLinga, anubandhaSlot,
  classifyStratum, stratifiedPick, STRATA, KOSA_AUTH_RE, NIBANDHA_MIN_CHARS
} from "./lib/skd.mjs";
import { SKD_GAPS } from "./lib/skd-gaps.mjs";
import { generatedAt } from "./lib/provenance.mjs";

const ROOT = process.cwd();
const SKD_SOURCE = path.resolve(ROOT, "..", "csl-orig", "v02", "skd", "skd.txt");
const M4_CSV = path.resolve(ROOT, "..", "csl-atlas", "data", "lexico", "indigenous_roots.csv");
const OUT = path.resolve(ROOT, "data", "pilot", "lex0-fixtures.json");
const SAMPLE_OUT = path.resolve(ROOT, "data", "pilot", "skd-lex0-sample.json");
const GAPS_OUT = path.resolve(ROOT, "data", "pilot", "skd-lex0-gaps.json");

// Curated kosa records that parse to a sensible iti-authority sense structure
// (slice 4). jYAtiH L13859 is not curated: its trailing Medini group is an
// irreducible nibandha discussion — the stratified nibandha stratum now covers
// that shape explicitly (G8) instead of excluding it.
const CURATED_LS = ["17667", "7806", "6080", "31183", "21315", "15202"];
const SEED = "h5321-skd-lex0-v1";
const PER_STRATUM = 4;
const MAX_EXAMPLES_PER_SENSE = 3;
const COMMENTARY_MAX_CHARS = 600;
const PROSE_GAP_MIN_CHARS = 400;

// SLP1 function words that begin a prose clause rather than a kosa gloss.
const PROSE_LEAD = new Set([
  "atra", "tatra", "tataH", "tatas", "tena", "sa", "eze", "ezAM", "yAni",
  "kAni", "ca", "yaTA", "uktaM", "uktaYca", "evaM", "yadvA", "kiYca", "tat", "asya"
]);

const QUOTES = /[()“”"„‟�]/g;

function csvRow(line) {
  const out = [];
  let cur = "", q = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (q) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i += 1; }
      else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

function loadM4(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const head = csvRow(lines[0]);
  const idx = name => head.indexOf(name);
  const roots = new Map();
  for (const line of lines.slice(1)) {
    if (!line.startsWith("skd,")) continue;
    const c = csvRow(line);
    roots.set(c[idx("L")], {
      rootSignal: c[idx("root_signal")], dhatupathaSource: c[idx("dhatupatha_source")],
      gana: c[idx("gana")], pada: c[idx("pada")], transitivity: c[idx("transitivity")],
      causative: c[idx("causative")] === "1", set: c[idx("set")] === "1",
      anit: c[idx("anit")] === "1", vet: c[idx("vet")] === "1",
      anubandhas: c[idx("anubandhas")]
    });
  }
  return roots;
}

function gitHead(dir) {
  try { return execFileSync("git", ["-C", dir, "rev-parse", "--short=12", "HEAD"], { encoding: "utf8" }).trim(); }
  catch { return null; }
}

// "(yaTA, <source> . <ref> . “<quote>”)" — the slice-4 source-linked example.
function extractYathaExample(text) {
  const m = text.match(/\(\s*yaTA[,\s]+([^.“”„‟"]+?)\s*\.\s*([\d,.\s]*?)\s*[“„"]([^”‟"]*)[”‟"]\s*\)?/);
  if (!m) return { example: null, rest: text };
  const example = {
    source: slp1ToIast(m[1].trim()),
    cited: m[2].replace(/\s+/g, "").replace(/\.+$/, "") || undefined,
    quote: slp1ToIast(m[3].replace(/\s+/g, " ").trim()),
    attachedBy: "source-link"
  };
  return { example, rest: text.replace(m[0], " ") };
}

// Bare literary quotations “…”, attributed by a FOLLOWING "iti <work>" when
// present (G9: attachment is positional, not a source link).
function extractQuotes(text) {
  const quotes = [];
  const rest = text.replace(/“([^”]*)”\s*[.|]*\s*(?:\d+\s*[.|]*\s*)*(?:it[iy]\s*([A-Za-z]+))?/g, (_, q, work) => {
    const authority = normAuthority(work);
    if (work && !authority && work.length < 4) work = undefined; // "iti WaH"-style grammatical tag, not a work
    quotes.push({
      quote: slp1ToIast(q.replace(/\s+/g, " ").trim()),
      source: work && !authority ? slp1ToIast(work) : (authority || undefined),
      attachedBy: "position"
    });
    return " . ";
  });
  return { quotes, rest };
}

// "<scope> XSabde drazwavyam" — "see under X" (G7 when a scope is stated).
function extractCrossRefs(text) {
  const refs = [];
  const rest = text.replace(/([^.()]*?)\b([A-Za-z]+?)Sabde\s+drazwavy[A-Za-z]*/g, (_, scope, target) => {
    const s = scope.replace(QUOTES, " ").replace(/\s+/g, " ").trim();
    refs.push({ target, targetIast: slp1ToIast(target), scope: s ? slp1ToIast(s) : undefined });
    return " . ";
  });
  return { refs, rest };
}

// "<vernacular> iti BAzA" — the Bengali/vernacular equivalent (G6).
function extractBhasa(text) {
  const out = [];
  const rest = text.replace(/([^.()“”]+?)\s+iti\s+BAzA\b/g, (_, v) => {
    const t = v.replace(QUOTES, "").replace(/\d+/g, " ").replace(/\s+/g, " ").trim();
    if (t) out.push({ text: slp1ToIast(t) });
    return " . ";
  });
  return { vernacular: out, rest };
}

// One authority group -> one Lex-0 sense (plus what it dropped, so nothing is
// silently lost: dropped prose is counted and surfaced as G8).
function groupToSense(rawGroup, authority, stats) {
  const yatha = extractYathaExample(rawGroup);
  const bhasa = extractBhasa(yatha.rest);
  const q = extractQuotes(bhasa.rest);
  let text = q.rest.replace(/\([^()]*\)/g, " ");
  let paryaya = null;
  const pm = text.match(/tatpary?y?AyaH\s*\.(.*)$/);
  if (pm) {
    paryaya = pm[1].split(/\s*\d+\s*|\s*\.\s*/).map(s => slp1ToIast(s.replace(QUOTES, "").trim())).filter(Boolean);
    text = text.slice(0, pm.index);
  }
  const meanings = [];
  for (const seg of text.split(/\s*\.\s*/)) {
    const s = seg.replace(QUOTES, "").replace(/\*/g, " ").replace(/\b\d+\b/g, " ").replace(/\s+/g, " ")
      .replace(/\s*\byaTA[,\s-]*$/, "").trim(); // a quote-introducing "yaTA, --" is not gloss text
    if (!s || /tatpary/.test(s) || /^it[iy]\b|^it[iy][A-Za-z]/.test(s) || /^[A-Za-z]{1,3},/.test(s)) continue;
    const lead = s.split(/\s+/)[0].replace(/[,;:-]+$/, "");
    if (/^-+$/.test(s) || lead === "yaTA" && s.replace(/^yaTA[,\s-]*/, "").length < 3) continue; // bare "yaTA, --" before a quote
    if (s.length > 60 || PROSE_LEAD.has(lead) || s.split(/\s+/).length > 6) {
      stats.proseSegments += 1;
      stats.proseChars += s.length;
      continue;
    }
    meanings.push(slp1ToIast(s));
  }
  const defParts = [];
  if (meanings.length) defParts.push(meanings.join("; "));
  if (paryaya?.length) defParts.push(`paryāya: ${paryaya.join(", ")}`);
  const examples = [yatha.example, ...q.quotes].filter(Boolean);
  const sense = {
    def: defParts.join(" — ") || "(unparsed)",
    lang: "sa-Latn",
    evidence: "observed",
    authority: authorityRef(authority)
  };
  if (examples.length) {
    sense.examples = examples.slice(0, MAX_EXAMPLES_PER_SENSE);
    stats.extraQuotes += Math.max(0, examples.length - MAX_EXAMPLES_PER_SENSE);
  }
  if (bhasa.vernacular.length) sense.vernacular = bhasa.vernacular;
  if (paryaya?.length) {
    sense.paryaya = paryaya;
    sense.loss = "In the source this synonym run and its authority (iti " +
      (authority?.author || authority || "X") + ") are one indivisible iti-unit: sense enumeration and " +
      "source attestation are a single construction, split into def + bibl here.";
  }
  return sense;
}

// Segment a body on kosa-authority markers ("ity amaraH", "iti medinI",
// "iti tawwIkAyAM BarataH" where the author is the 2nd token).
function segmentByAuthority(body, stats) {
  const markerRe = /\bit[iy]\s*([A-Za-zI]+)(?:\s+([A-Za-zI]+))?/g;
  const senses = [];
  let m, groupStart = 0;
  while ((m = markerRe.exec(body))) {
    const authority = normAuthority(m[2]) || normAuthority(m[1]);
    if (!authority) continue;
    senses.push(groupToSense(body.slice(groupStart, m.index), authority, stats));
    groupStart = markerRe.lastIndex;
  }
  if (groupStart < body.length) {
    const s = groupToSense(body.slice(groupStart), null, stats);
    const realDef = s.def !== "(unparsed)" && /[A-Za-zĀ-ʯ]{3}/.test(s.def);
    if (realDef) senses.push(s);
    else if (s.examples?.length && senses.length) {
      const last = senses[senses.length - 1];
      last.examples = [...(last.examples || []), ...s.examples].slice(0, MAX_EXAMPLES_PER_SENSE);
      if (s.vernacular) last.vernacular = [...(last.vernacular || []), ...s.vernacular];
    } else if (s.vernacular && senses.length) {
      const last = senses[senses.length - 1];
      last.vernacular = [...(last.vernacular || []), ...s.vernacular];
    }
  }
  return senses.filter(s => !(s.def === "(unparsed)" && !s.examples?.length && !s.vernacular));
}

function parseEtym(body) {
  const em = body.match(/^\(([^()]*)\)\s*/);
  if (!em) return { etym: null, rest: body };
  const inner = em[1];
  const una = inner.match(/uRA?[MdiI]*\s*([\d.\s]+)/);
  const deriv = inner.match(/([A-Za-zfFxXMH]+)\s*\+\s*([A-Za-zfFxXMH]+)/);
  const sutra = inner.match(/\b(\d+)\s*\.\s*(\d+)\s*\.\s*(\d+)\b/);
  const samasa = inner.match(/\b([A-Za-z]*samAsaH)/);
  let mention = "";
  if (/\bDf\b/.test(inner)) mention = slp1ToIast("Df");
  else if (deriv) mention = `${slp1ToIast(deriv[1])} + ${slp1ToIast(deriv[2])}`;
  const etym = {
    type: "etymology", label: "from", mention,
    source: una ? `Uṇādisūtra ${una[1].replace(/\s+/g, "").replace(/\.+$/, "")}` : "",
    analysis: slp1ToIast(inner.replace(/\s+/g, " ").trim())
  };
  if (sutra && !una) etym.sutraRef = `${sutra[1]}.${sutra[2]}.${sutra[3]}`;
  if (samasa) etym.samasa = slp1ToIast(samasa[1]);
  return { etym, rest: body.slice(em[0].length) };
}

// Root (dhatu) entry: slot as printed + M4 decode + meaning group bounded by
// the dhatupatha authority + Durgadasa's commentary layer.
function parseRoot(body, m4, stats) {
  const slot = anubandhaSlot(body);
  let rest = slot.rest;
  let annotation = null;
  rest = rest.replace(/\(([^()]*)\)/, (_, a) => { annotation = slp1ToIast(a.replace(/\s+/g, " ").trim()); return " "; });
  const kkd = rest.match(/\bit[iy]\s*kavikalpadrumaH/);
  const cut = kkd ? kkd.index + kkd[0].length : Math.max(0, rest.indexOf(".."));
  const head = kkd ? rest.slice(0, kkd.index) : (cut > 0 ? rest.slice(0, cut) : rest);
  const tail = cut > 0 ? rest.slice(cut) : "";
  const sense = groupToSense(head, kkd ? "Kavikalpadruma" : null, stats);
  let commentary = null;
  const tailText = tail.replace(/^[\s.]+/, "").trim();
  if (tailText) {
    const dm = tailText.match(/\bit[iy]\s*durgAdAsaH/);
    const text = slp1ToIast((dm ? tailText.slice(0, dm.index) : tailText).replace(/\s+/g, " ").replace(/[\s.]+$/, "").trim());
    commentary = {
      author: dm ? "Durgādāsa" : undefined,
      text: text.length > COMMENTARY_MAX_CHARS ? `${text.slice(0, COMMENTARY_MAX_CHARS)} …` : text,
      chars: text.length
    };
  }
  return {
    senses: sense.def === "(unparsed)" && !sense.examples ? [] : [sense],
    root: {
      slot: slot.tokens,
      slotIast: slot.tokens.map(slp1ToIast),
      annotation,
      m4: m4 ? {
        gana: m4.gana || null, pada: m4.pada || null, transitivity: m4.transitivity || null,
        causative: m4.causative, set: m4.set, anit: m4.anit, vet: m4.vet,
        anubandhas: m4.anubandhas ? m4.anubandhas.split("|") : [],
        dhatupathaSource: m4.dhatupathaSource || null
      } : null
    },
    commentary
  };
}

function gapIdsFor(entry) {
  const g = new Set();
  if (entry.senses.some(s => s.authority)) g.add("G1");
  if (entry.root) {
    if (entry.root.slot.length) g.add("G2");
    if (!entry.root.slot.length || !entry.root.m4?.pada || !entry.root.m4?.gana) g.add("G3");
    if (entry.commentary) g.add("G4");
  }
  if (entry.senses.some(s => s.paryaya)) g.add("G5");
  if (entry.senses.some(s => s.vernacular?.length)) g.add("G6");
  if (entry.crossRefs.some(r => r.scope)) g.add("G7");
  if (entry.stratum === "nibandha" || (entry.prose?.chars || 0) >= PROSE_GAP_MIN_CHARS) g.add("G8");
  if (entry.senses.some(s => (s.examples || []).some(e => e.attachedBy === "position"))) g.add("G9");
  if (entry.wordClass) g.add("G10");
  if (entry.relations.some(r => r.sutraRef || r.samasa || /Uṇādi/.test(r.source || ""))) g.add("G11");
  if (entry.corrections.length) g.add("G12");
  return [...g].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
}

function parseRecord(raw, { stratum, selection, m4 }) {
  const { L, pc, k1, body: rawBody, corrections } = recordBody(raw);
  const stats = { proseSegments: 0, proseChars: 0, extraQuotes: 0 };
  let body = rawBody;
  const x = extractCrossRefs(body);
  body = x.rest;

  let genders = [], wordClass = null, linga = [], relations = [], senses = [], root, commentary;
  const isRoot = stratum === "dhatu-anubandha" || stratum === "dhatu-zero-slot";
  if (isRoot) {
    ({ senses, root, commentary } = parseRoot(body, m4, stats));
  } else {
    const lg = leadingLinga(body);
    linga = lg.linga;
    genders = linga.filter(l => l.kind === "gender").map(l => l.norm);
    const wc = linga.find(l => l.kind !== "gender");
    wordClass = wc ? { kind: wc.kind, norm: wc.norm, token: wc.token } : null;
    body = lg.rest.replace(/^\[[^\]]*\]\s*,?\s*/, "");
    const e = parseEtym(body);
    if (e.etym) relations = [e.etym];
    let parseBody = e.rest;
    let nibandhaRemainder = "";
    if (stratum === "nibandha") {
      // the kosa-like head up to the first quotation or 600 chars; the
      // treatise remainder is summarised, not forced into senses (G8).
      const q = parseBody.indexOf("“");
      const cutAt = Math.min(q >= 0 ? q : parseBody.length, 600);
      const dd = parseBody.lastIndexOf("..", cutAt);
      const at = dd > 40 ? dd + 2 : cutAt;
      nibandhaRemainder = parseBody.slice(at);
      parseBody = parseBody.slice(0, at);
    }
    senses = segmentByAuthority(parseBody, stats);
    if (nibandhaRemainder) {
      stats.proseChars += nibandhaRemainder.length;
      stats.proseSegments += 1;
      stats.nibandha = {
        chars: nibandhaRemainder.length,
        quotations: (nibandhaRemainder.match(/“/g) || []).length,
        attributions: [...new Set([...nibandhaRemainder.matchAll(/\bit[iy]\s*([A-Za-z]{4,})/g)].map(m => m[1]))].length,
        opening: slp1ToIast(nibandhaRemainder.replace(/\s+/g, " ").trim().slice(0, 200))
      };
    }
  }

  const key = k1.replace(/H$/, "");
  const entry = {
    id: `skd:${k1.replace(/[^A-Za-z0-9]/g, "")}`,
    key,
    stratum,
    selection,
    phenomena: ["indigenous-kosa"],
    records: { skd: { L, pc } },
    forms: [{ orth: isRoot ? k1 : key, type: isRoot ? "verbal-root" : "lemma" }],
    genders,
    wordClass,
    relations,
    senses,
    citations: [],
    crossRefs: x.refs,
    corrections: corrections.map(c => ({ old: slp1ToIast(c.old), new: slp1ToIast(c.new), date: c.date, url: c.url })),
    loss: []
  };
  if (root) entry.root = root;
  if (commentary) entry.commentary = commentary;
  if (stats.proseSegments || stats.extraQuotes) {
    entry.prose = { segments: stats.proseSegments, chars: stats.proseChars, extraQuotations: stats.extraQuotes };
    if (stats.nibandha) entry.prose.nibandha = stats.nibandha;
  }
  if (senses.some(s => s.authority)) {
    entry.phenomena.push("iti-authority", "sense-citation-fusion");
    entry.loss.push("Source-parsed indigenous kosa entry: meanings/synonyms are grouped by their " +
      "closing authority (iti <author>), the kosa's own sense-and-citation unit.");
  }
  entry.gaps = gapIdsFor(entry);
  return entry;
}

// Case-insensitive-filesystem-safe ids: SLP1 is case-significant (aMSa vs
// amSa), so ids that collide case-insensitively get the SKD L number appended.
function disambiguateIds(entries) {
  const byFold = new Map();
  for (const e of entries) {
    const k = e.id.toLowerCase();
    byFold.set(k, (byFold.get(k) || 0) + 1);
  }
  const curatedIds = new Set(entries.filter(e => e.selection === "curated").map(e => e.id));
  for (const e of entries) {
    if (byFold.get(e.id.toLowerCase()) > 1 && !(e.selection === "curated" && curatedIds.has(e.id))) {
      e.id = `${e.id}-L${e.records.skd.L.replace(/[^0-9.]/g, "")}`;
    }
  }
}

async function main() {
  let text, m4Text;
  try { text = await fs.readFile(SKD_SOURCE, "utf8"); }
  catch { console.error(`Missing ${SKD_SOURCE}; SKD source (csl-orig) must be a sibling repo.`); process.exit(1); }
  try { m4Text = await fs.readFile(M4_CSV, "utf8"); }
  catch { console.error(`Missing ${M4_CSV}; the M4 anubandha decode (csl-atlas) must be a sibling repo.`); process.exit(1); }
  const m4Roots = loadM4(m4Text);

  const records = text.match(/<L>[\s\S]*?<LEND>/g) || [];
  const byL = new Map();
  const members = Object.fromEntries(STRATA.map(s => [s, []]));
  const corpus = {
    records: 0, aliasRecords: 0, strata: {},
    markers: { rootSlot: 0, rootZeroSlot: 0, rootPadaUnmarked: 0, rootGanaUnresolved: 0, kavikalpadrumaCommentary: 0,
      paryaya: 0, bhasa: 0, crossRefScoped: 0, crossRef: 0, nibandha: 0, triliṅga: 0, avyaya: 0, kosaAuthority: 0,
      quotation: 0, cdslCorrection: 0 }
  };
  const markerMembers = {};
  const mark = (key, L) => { corpus.markers[key] += 1; (markerMembers[key] ??= []).push(L); };
  for (const r of records) {
    const rb = recordBody(r);
    if (!rb.L) continue;
    // CDSL alias records ({{Lbody=N}}) carry no content of their own: they
    // point at another record's body, so they are counted, not stratified.
    if (/^\{\{Lbody=\d+\}\}$/.test(rb.body.trim())) { corpus.aliasRecords += 1; continue; }
    byL.set(rb.L, r);
    const stratum = classifyStratum(rb, m4Roots);
    members[stratum].push(rb.L);
    corpus.records += 1;
    const b = rb.body;
    if (stratum === "dhatu-anubandha") mark("rootSlot", rb.L);
    if (stratum === "dhatu-zero-slot") mark("rootZeroSlot", rb.L);
    if (stratum.startsWith("dhatu")) {
      const m = m4Roots.get(rb.L);
      if (!m.pada) mark("rootPadaUnmarked", rb.L);
      if (!m.gana) mark("rootGanaUnresolved", rb.L);
      if (/\bit[iy]\s*durgAdAsaH/.test(b)) mark("kavikalpadrumaCommentary", rb.L);
    }
    if (/tatpary?y?AyaH/.test(b)) mark("paryaya", rb.L);
    if (/iti\s+BAzA/.test(b)) mark("bhasa", rb.L);
    if (/Sabde\s+drazwavy/.test(b)) mark("crossRef", rb.L);
    if (/\b(asya|tasya|anyat|tad|etat)[^.]{0,40}Sabde\s+drazwavy/.test(b)) mark("crossRefScoped", rb.L);
    if (b.length >= NIBANDHA_MIN_CHARS) mark("nibandha", rb.L);
    const lg = leadingLinga(b).linga;
    if (lg.some(l => l.kind === "triliṅga")) mark("triliṅga", rb.L);
    if (lg.some(l => l.kind === "avyaya")) mark("avyaya", rb.L);
    if (KOSA_AUTH_RE.test(b)) mark("kosaAuthority", rb.L);
    if (/“/.test(b)) mark("quotation", rb.L);
    if (rb.corrections.length) mark("cdslCorrection", rb.L);
  }
  for (const s of STRATA) corpus.strata[s] = members[s].length;

  const curated = new Set(CURATED_LS);
  const selected = [];
  for (const L of CURATED_LS) {
    const raw = byL.get(L);
    if (!raw) { console.warn(`SKD L${L} not found; skipped.`); continue; }
    const stratum = classifyStratum(recordBody(raw), m4Roots);
    selected.push({ L, stratum, selection: "curated" });
  }
  const perStratum = {};
  for (const s of STRATA) {
    const pick = stratifiedPick(members[s].filter(L => !curated.has(L)), PER_STRATUM, `${SEED}:${s}`);
    perStratum[s] = pick;
    for (const L of pick) selected.push({ L, stratum: s, selection: "stratified" });
  }

  const entries = selected.map(({ L, stratum, selection }) =>
    parseRecord(byL.get(L), { stratum, selection, m4: m4Roots.get(L) }));
  // Gap witnesses: a registered gap that no curated/stratified entry exhibits
  // gets ONE deterministic corpus record carrying its marker, so every gap in
  // the registry is backed by an exported example (selection "gap-witness").
  const taken = new Set(selected.map(s => s.L));
  for (const g of SKD_GAPS) {
    if (!g.corpusMarker || entries.some(e => e.gaps.includes(g.id))) continue;
    const pool = (markerMembers[g.corpusMarker] || []).filter(L => !taken.has(L));
    for (const L of stratifiedPick(pool, pool.length, `${SEED}:witness:${g.id}`)) {
      const stratum = classifyStratum(recordBody(byL.get(L)), m4Roots);
      const e = parseRecord(byL.get(L), { stratum, selection: "gap-witness", m4: m4Roots.get(L) });
      if (!e.gaps.includes(g.id)) continue;
      e.witnessFor = g.id;
      entries.push(e);
      taken.add(L);
      break;
    }
  }
  disambiguateIds(entries);

  await fs.writeFile(OUT, `${JSON.stringify(entries, null, 2)}\n`, "utf8");

  await fs.writeFile(SAMPLE_OUT, `${JSON.stringify({
    schemaVersion: "1.0.0",
    license: "CC-BY-SA-4.0",
    generatedAt: generatedAt(),
    generatedBy: "npm run parse-skd-kosa",
    handoff: "H5321",
    sources: {
      skd: { path: "csl-orig/v02/skd/skd.txt", commit: gitHead(path.dirname(SKD_SOURCE)) },
      m4: { path: "csl-atlas/data/lexico/indigenous_roots.csv", commit: gitHead(path.dirname(M4_CSV)), skdRootRows: m4Roots.size }
    },
    design: {
      seed: SEED, perStratum: PER_STRATUM, ordering: "FNV-1a 32-bit over `${seed}:${stratum}:${L}`, ascending",
      strata: STRATA,
      rule: "priority order: a record belongs to the first stratum whose positive structural marker it carries (scripts/lib/skd.mjs classifyStratum)",
      curated: CURATED_LS
    },
    corpus,
    sample: {
      total: entries.length,
      curated: entries.filter(e => e.selection === "curated").length,
      stratified: entries.filter(e => e.selection === "stratified").length,
      gapWitness: entries.filter(e => e.selection === "gap-witness").map(e => ({ caseId: e.id, L: e.records.skd.L, for: e.witnessFor })),
      byStratum: Object.fromEntries(STRATA.map(s => [s, entries.filter(e => e.stratum === s).map(e => ({ caseId: e.id, L: e.records.skd.L, key: e.key, selection: e.selection }))]))
    }
  }, null, 2)}\n`, "utf8");

  const gaps = SKD_GAPS.map(g => {
    const hits = entries.filter(e => e.gaps.includes(g.id));
    return {
      ...g,
      corpusMarkerCount: g.corpusMarker ? corpus.markers[g.corpusMarker] : null,
      sampleCount: hits.length,
      examples: hits.slice(0, 3).map(e => ({
        caseId: e.id, L: e.records.skd.L, key: e.key, stratum: e.stratum,
        file: `data/pilot/tei-lex0/${e.id.replace(/:/g, "-")}.lex0.xml`
      }))
    };
  });
  await fs.writeFile(GAPS_OUT, `${JSON.stringify({
    schemaVersion: "1.0.0",
    license: "CC-BY-SA-4.0",
    generatedAt: generatedAt(),
    generatedBy: "npm run parse-skd-kosa",
    handoff: "H5321",
    note: "Every place the indigenous SKD apparatus has no (or only a partial) TEI Lex-0 home. Corpus counts are positive-marker counts over all SKD records (lower bounds, zero-meaning doctrine); examples are sample entries carrying the gap. Prose: docs/TEI_LEX0_SKD_GAPS.md.",
    gaps
  }, null, 2)}\n`, "utf8");

  const nWit = entries.filter(e => e.selection === "gap-witness").length;
  console.log(`Parsed ${entries.length} SKD record(s) (${CURATED_LS.length} curated + ${entries.length - CURATED_LS.length - nWit} stratified over ${STRATA.length} strata + ${nWit} gap witness) -> ${path.relative(ROOT, OUT)}`);
  for (const s of STRATA) console.log(`  ${s.padEnd(20)} corpus ${String(corpus.strata[s]).padStart(6)}  sample ${entries.filter(e => e.stratum === s).length}`);
  const missing = gaps.filter(g => g.sampleCount === 0).map(g => g.id);
  console.log(`Gaps: ${gaps.length} registered; without a sample example: ${missing.join(", ") || "none"}`);
}

main().catch(error => { console.error(error); process.exit(1); });
