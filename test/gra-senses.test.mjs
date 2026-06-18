import test from "node:test";
import assert from "node:assert/strict";
import { extractGraSenses, extractGraCitations } from "../scripts/lib/gra-senses.mjs";

// Grassmann's numbered sub-senses on the headword line (after the "daher").
const AMSA = "<L>1<pc>1<k1>aMSa<k2>aMSa {@áṃśa,@}¦ <ab>m.</ab>, das als " +
  "Antheil erlangte, daher 1〉 {%Antheil;%} 2〉 {%Erbtheil;%} 3〉 {%Partei;%} " +
  "4〉 {%der viele Antheile besitzt%} oder {%zu vergeben hat%} und daher " +
  "5〉 Name eines der Aditisöhne.<LEND>";

test("splits the leading N〉 run into one sense each", () => {
  const senses = extractGraSenses(AMSA);
  assert.deepEqual(senses.map(s => s.def), [
    "Antheil", "Erbtheil", "Partei",
    "der viele Antheile besitzt; zu vergeben hat",
    "Name eines der Aditisöhne"
  ]);
  assert.ok(senses.every(s => s.lang === "de" && s.evidence === "derived"));
});

test("a numbered sense with no {%…%} gloss falls back to its cleaned prose", () => {
  const senses = extractGraSenses(AMSA);
  assert.equal(senses[4].def, "Name eines der Aditisöhne");
});

// Back-references ("Zwischen 1〉 und 2〉 …") are not consecutive after the run,
// so they must not spawn spurious senses, and must not leak into the last sense.
const AMSU = "<L>2<k1>aMSu<k2>aMSu {@aṃśú,@}¦ <ab>m.</ab>, Name der " +
  "{%Pflanze, aus welcher der Soma gepresst wurde%}. Also: 1〉 {%Somapflanze,%} " +
  "2〉 der aus ihr gepresste {%Somasaft,%} 3〉 {%Eigenname%} eines Sängers. " +
  "Zwischen 1〉 und 2〉 finden Uebergänge statt.<LEND>";

test("back-reference markers neither split nor leak into the last sense", () => {
  const senses = extractGraSenses(AMSU);
  assert.deepEqual(senses.map(s => s.def), [
    "Pflanze, aus welcher der Soma gepresst wurde",  // preamble base sense
    "Somapflanze", "Somasaft", "Eigenname"
  ]);
});

// √ac: a discursive preamble with many prefix glosses, then a 1〉/2〉 run.
const AC = "<L>3<k1>ac<k2>ac {@√ac@} (√añc).¦ der Begriff: {%biegen%} hervor; " +
  "[<ls>Cu.</ls>] mit ápa: {%fortdrängen%}, ví, {%auseinanderbiegen,%} " +
  "sám 1〉 {%zusammenbiegen,%} 2〉 sich {%zusammendrängen%}.<LEND>";

test("preamble glosses join into one base sense, kept apart from the numbered run", () => {
  const senses = extractGraSenses(AC);
  assert.equal(senses.length, 3);
  assert.equal(senses[0].def, "biegen; fortdrängen; auseinanderbiegen");
  assert.deepEqual(senses.slice(1).map(s => s.def), ["zusammenbiegen", "zusammendrängen"]);
});

test("an <ls> in a span attaches to that sense, tagged gra", () => {
  const senses = extractGraSenses(AC);
  assert.equal(senses[0].citations[0].source, "Cu.");
  assert.equal(senses[0].citations[0].dictionary, "gra");
});

test("an un-numbered GRA entry falls back to the Petersburg <div>/{%…%} extractor", () => {
  const raw = "<L>4<k1>x<k2>x {@x@}¦ <div n=\"1\"/> {%gut%} <div n=\"2\"/> {%schön%}<LEND>";
  assert.deepEqual(extractGraSenses(raw).map(s => s.def), ["gut", "schön"]);
});

test("empty input yields no senses", () => {
  assert.deepEqual(extractGraSenses(""), []);
  assert.deepEqual(extractGraSenses(null), []);
});

// The <div> apparatus keys each {hymn,verse} coordinate to a sense number; a
// prefix-keyed coordinate (no N〉) belongs to the entry, not a numbered sense.
const AMSA_DIV = "<L>1<k1>aMSa<k2>aMSa {@áṃśa,@}¦ <ab>m.</ab> 1〉 {%Antheil;%} " +
  "2〉 {%Erbtheil;%}\n<div n=\"TS\">-as 1〉 {548,12}. 2〉 {279,4}; {102,4}.\n" +
  "<div n=\"RV\">úd kóśam {437,8}.<LEND>";

test("coordinates are attached to the numbered sense they attest, as RV loci", () => {
  const senses = extractGraSenses(AMSA_DIV);
  assert.deepEqual(senses[0].citations.map(c => c.source), ["RV 548,12"]);
  assert.deepEqual(senses[1].citations.map(c => c.source), ["RV 279,4", "RV 102,4"]);
  assert.ok(senses[0].citations.every(c => c.dictionary === "gra" && c.type === "named-source-citation"));
});

test("extractGraCitations returns the flat entry-level coordinate list incl. prefix-keyed loci", () => {
  const sources = extractGraCitations(AMSA_DIV).map(c => c.source);
  assert.deepEqual(sources, ["RV 548,12", "RV 279,4", "RV 102,4", "RV 437,8"]);
  // the prefix-keyed 437,8 (no N〉) is entry-level only, on no sense
  const senses = extractGraSenses(AMSA_DIV);
  assert.ok(!senses.some(s => (s.citations || []).some(c => c.source === "RV 437,8")));
});

test("a pseudo-markup brace ({@…@}/{%…%}) is not mistaken for a coordinate", () => {
  const raw = "<L>2<k1>x<k2>x {@x@}¦ <ab>m.</ab> 1〉 {%gut%}\n<div n=\"TS\">{@sám@} 1〉 {408,12}.<LEND>";
  assert.deepEqual(extractGraCitations(raw).map(c => c.source), ["RV 408,12"]);
});
