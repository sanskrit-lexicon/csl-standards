import test from "node:test";
import assert from "node:assert/strict";
import {
  slp1ToIast, normAuthority, authorityRef, applyCorrections, recordBody,
  leadingLinga, anubandhaSlot, classifyStratum, fnv1a, stratifiedPick, STRATA
} from "../scripts/lib/skd.mjs";
import { SKD_GAPS } from "../scripts/lib/skd-gaps.mjs";

// Raw csl-orig v02/skd/skd.txt records (L11792 GiRa, L12271 carpawA, L10817 gAtraBaNgA).
const GIRA = `<L>11792<pc>2-393-c<k1>GiRa<k2>GiRa
GiRa¦, i Na grahaRe . iti kavikalpadrumaH .. (BvAM-
AtmaM-sakaM-sew .) i, GiRRyate . Na, GiRRate .
jeGiRRyate . iti durgAdAsaH ..
<LEND>`;
const CARPATA = `<L>12271<pc>2-436-c<k1>carpawA<k2>carpawA
carpawA¦, strI, (carpawa + wAp .) BAdraSuklazazWI .
cApaqAzazWI iti BAzA .. asyA vivaraRaM
capewISabde drazwavyam ..
<LEND>`;
const GATRA = `<L>10817<pc>2-322-b<k1>gAtraBaNgA<k2>gAtraBaNgA
{{gAtraBaNgAH->gAtraBaNgA||20160503|Jim Funderburk|https://github.com/sanskrit-lexicon/CORRECTIONS/issues/291|view ending visarga as misprint on this f. noun ending in A}}¦, strI, (gAtrasya BaNgo'vasAdo yasyAH .)
SUkaSimbI . iti SabdacandrikA ..
<LEND>`;

test("SLP1 -> IAST is a per-character map", () => {
  assert.equal(slp1ToIast("GiRa"), "ghiṇa");
  assert.equal(slp1ToIast("kavikalpadrumaH"), "kavikalpadrumaḥ");
});

test("authorities keep SLP1 case and drop a closing visarga", () => {
  assert.equal(normAuthority("kavikalpadrumaH"), "Kavikalpadruma");
  assert.equal(normAuthority("amaraH"), "Amara");
  assert.equal(normAuthority("Amara"), null);
  assert.deepEqual(authorityRef("Kavikalpadruma"), { title: "Kavikalpadruma" });
  assert.deepEqual(authorityRef("Durgādāsa"), { author: "Durgādāsa" });
});

test("recordBody dehyphenates and drops the headword up to ¦", () => {
  const r = recordBody(GIRA);
  assert.equal(r.L, "11792");
  assert.equal(r.k1, "GiRa");
  assert.match(r.body, /^i Na grahaRe/);
  assert.match(r.body, /\(BvAM-AtmaM-sakaM-sew \.\)/);
  assert.deepEqual(r.corrections, []);
  // outside the annotation a line-final hyphen is a print word-split
  assert.match(recordBody("<L>1<pc>1<k1>x\nx¦, puM, saM-\nskAraH . (a-\nb)\n<LEND>").body, /saMskAraH \. \(ab\)/);
});

test("CDSL corrections are applied and witnessed with date and issue URL", () => {
  const r = recordBody(GATRA);
  assert.equal(r.corrections.length, 1);
  assert.equal(r.corrections[0].old, "gAtraBaNgAH");
  assert.equal(r.corrections[0].new, "gAtraBaNgA");
  assert.equal(r.corrections[0].date, "20160503");
  assert.equal(r.corrections[0].url, "https://github.com/sanskrit-lexicon/CORRECTIONS/issues/291");
  assert.match(r.body, /^strI,/);
  assert.equal(applyCorrections("no markup").corrections.length, 0);
});

test("leading liṅga: genders, triliṅga and avyaya are distinct kinds", () => {
  assert.deepEqual(leadingLinga("strI, (carpawa").linga.map(l => l.norm), ["feminine"]);
  assert.equal(leadingLinga("tri, sundaraH").linga[0].kind, "triliṅga");
  assert.equal(leadingLinga("vya, iti").linga[0].kind, "avyaya");
  assert.equal(leadingLinga("puM strI, x").linga.length, 2);
  assert.equal(leadingLinga("i Na grahaRe").linga.length, 0);
});

test("anubandha slot reads the printed it-letters; an empty slot is empty, not absent", () => {
  assert.deepEqual(anubandhaSlot("i Na grahaRe . iti").tokens, ["i", "Na"]);
  const empty = anubandhaSlot("BaraRe . iti kavikalpadrumaH");
  assert.deepEqual(empty.tokens, []);
  assert.match(empty.rest, /^BaraRe/);
});

test("stratum priority: dhātu needs an M4 row AND no leading liṅga", () => {
  const m4 = new Map([["11792", { anubandhas: "i Na" }], ["1", { anubandhas: "" }], ["12271", { anubandhas: "x" }]]);
  assert.equal(classifyStratum({ L: "11792", body: recordBody(GIRA).body }, m4), "dhatu-anubandha");
  assert.equal(classifyStratum({ L: "1", body: "BaraRe . iti kavikalpadrumaH" }, m4), "dhatu-zero-slot");
  // M4 flags nouns that cite a root; the liṅga token keeps them out of the dhātu strata.
  assert.equal(classifyStratum({ L: "12271", body: recordBody(CARPATA).body }, m4), "cross-reference");
  assert.equal(classifyStratum({ L: "9", body: "puM, agniH . iti amaraH" }, m4), "kosa-iti");
  assert.equal(classifyStratum({ L: "9", body: "puM, x . tatparyyAyaH . y 2 iti amaraH" }, m4), "kosa-paryaya");
  assert.equal(classifyStratum({ L: "9", body: "vya, x . iti amaraH" }, m4), "avyaya");
  assert.equal(classifyStratum({ L: "9", body: "puM, " + "a ".repeat(2100) }, m4), "nibandha");
  assert.equal(classifyStratum({ L: "9", body: "puM, x ." }, m4), "residual");
  assert.equal(STRATA.at(-1), "residual");
});

test("stratified pick is deterministic and seed-dependent", () => {
  const members = Array.from({ length: 50 }, (_, i) => String(i));
  assert.deepEqual(stratifiedPick(members, 4, "s"), stratifiedPick([...members].reverse(), 4, "s"));
  assert.notDeepEqual(stratifiedPick(members, 4, "s"), stratifiedPick(members, 4, "t"));
  assert.equal(fnv1a(""), 0x811c9dc5);
});

test("gap registry: unique ids, a class, and a Lex-0 lack + workaround for each", () => {
  const ids = SKD_GAPS.map(g => g.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const g of SKD_GAPS) {
    assert.match(g.id, /^G\d+$/);
    assert.ok(["no-home", "partial-home", "digitisation"].includes(g.class), g.id);
    assert.ok(g.lex0Lacks && g.workaround && g.structure, g.id);
  }
});
