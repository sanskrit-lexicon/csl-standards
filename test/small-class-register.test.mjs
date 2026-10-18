import test from "node:test";
import assert from "node:assert/strict";
import {
  expansionKey, loadRegister, BANDS, CANARY_LABELS, EXTERNAL_SOURCES, keyToConcept,
} from "../scripts/lib/small-class-register.mjs";

const register = loadRegister();

test("expansionKey mirrors the census builder's expansion_key()", () => {
  assert.equal(expansionKey("Nominative."), "nominative");
  assert.equal(expansionKey("Nominativ"), "nominativ");
  assert.equal(expansionKey("  Parasmai-pada "), "parasmai-pada");
  assert.equal(expansionKey("Ātmanepada."), "ātmanepada");
  assert.equal(expansionKey("génitif"), "génitif");
  // NFC: decomposed é (e + U+0301) composes to the same key
  assert.equal(expansionKey("ge\u0301nitif"), expansionKey("génitif"));
  assert.equal(expansionKey("onomatopœic."), "onomatopœic");
  assert.equal(expansionKey("singular number"), "singular number");
  assert.equal(expansionKey("x  <i>y</i>  z."), "x y z");
});

test("register invariants: unique uris, unique notations, disjoint attestedKeys", () => {
  const uris = register.concepts.map(c => c.uri);
  assert.equal(new Set(uris).size, uris.length);
  const notations = register.concepts.flatMap(c => c.notation);
  assert.equal(new Set(notations).size, notations.length);
  const keys = register.concepts.flatMap(c => c.attestedKeys);
  assert.equal(new Set(keys).size, keys.length);
});

test("prefLabel carries at most one value per language (SKOS S14)", () => {
  for (const c of register.concepts) {
    for (const [lang, v] of Object.entries(c.prefLabel)) {
      assert.equal(typeof v, "string", `${c.uri}: prefLabel.${lang} must be a single string`);
    }
  }
});

test("every concept carries band, dimension, paper quote, and evidence", () => {
  for (const c of register.concepts) {
    assert.ok(BANDS.some(b => c.smallClass.endsWith(b)), c.uri);
    assert.ok(c.gramDimension?.en, c.uri);
    assert.ok(c.paperQuote?.en, c.uri);
    assert.ok(c.evidence.length >= 1 && c.attestedKeys.length >= 1, c.uri);
    for (const ev of c.evidence) {
      assert.ok(
        c.attestedKeys.includes(expansionKey(ev.expansion)),
        `${c.uri}: evidence ${ev.expansion} must be covered by its own attestedKeys`,
      );
    }
  }
});

test("unresolved forms never collide with concept notations and carry a reason", () => {
  const notations = new Set(register.concepts.flatMap(c => c.notation));
  for (const f of register.unresolvedForms) {
    assert.ok(!notations.has(f.notation), f.notation);
    assert.ok(f.reason?.en, f.notation);
    assert.ok(f.paperQuote?.en, f.notation);
  }
});

test("v2 (H6447): every unresolved form is externally grounded in the paper's reference grammars", () => {
  for (const f of register.unresolvedForms) {
    assert.ok(Array.isArray(f.externalGrounding) && f.externalGrounding.length >= 1,
      `${f.notation}: externalGrounding must be a non-empty array`);
    for (const g of f.externalGrounding) {
      assert.ok(EXTERNAL_SOURCES.includes(g.source), `${f.notation}: source ${g.source} not in the palette`);
      assert.equal(typeof g.edition, "string");
      assert.ok(g.edition.length > 5, `${f.notation}: edition must be stated`);
      assert.equal(typeof g.quote, "string");
      assert.ok(g.quote.length >= 10, `${f.notation}: verbatim quote required`);
      assert.equal(typeof g.locator, "string");
      assert.ok(g.locator.length > 0, `${f.notation}: locator required`);
    }
  }
  // the two declared conflicts stay declared — never silently overwritten
  const pn = register.unresolvedForms.find(f => f.notation === "pn.");
  assert.ok(pn.censusConflict?.en.includes("pronoun, pronominal"), "pn. census conflict must stay declared");
  const ppf = register.concepts.find(c => c.notation[0] === "Ppf.");
  assert.ok(ppf.censusConflict?.en.includes("participe parfait"), "Ppf. census conflict must stay declared");
});

test("canary exhibits are exactly the 2006 §2.1/§2 target strings with integer polysemy", () => {
  assert.deepEqual(register.canaryExhibits.map(c => c.label), CANARY_LABELS);
  for (const c of register.canaryExhibits) {
    assert.equal(typeof c.censusPolysemy, "number");
    assert.ok(c.paperRole?.en);
  }
});

test("band collections quote the source and list their members consistently", () => {
  const bySmallClass = new Map();
  for (const c of register.concepts) {
    bySmallClass.set(c.smallClass, [...(bySmallClass.get(c.smallClass) ?? []), c.uri]);
  }
  for (const band of register.collections) {
    assert.ok(band.paperQuote?.en, band.uri);
    assert.deepEqual(
      [...(band.member ?? [])].sort(),
      [...(bySmallClass.get(band.uri) ?? [])].sort(),
      band.uri,
    );
  }
});

test("keyToConcept binds unambiguously; senses outside the scheme stay unbound", () => {
  const map = keyToConcept(register);
  assert.equal(map.get("singular"), register.concepts.find(c => c.notation[0] === "sg.").uri);
  assert.equal(map.get("plusquamperfekt"), register.concepts.find(c => c.notation[0] === "Ppf.").uri);
  // v2 (H6447): the measured-residue classes now bind
  assert.equal(map.get("masculine"), register.concepts.find(c => c.notation[0] === "m.").uri);
  assert.equal(map.get("femininum"), register.concepts.find(c => c.notation[0] === "f.").uri);
  assert.equal(map.get("neutre"), register.concepts.find(c => c.notation[0] === "n.").uri);
  assert.equal(map.get("medium"), register.concepts.find(c => c.notation[0] === "med.").uri);
  assert.equal(map.get("naiṣadhacarita"), register.concepts.find(c => c.notation[0] === "Naiṣ.").uri);
  // neither v1 nor v2 proposes forms for these — they must never bind
  assert.equal(map.get("case"), undefined);
  assert.equal(map.get("vocativ"), undefined);
  assert.equal(map.get("māhārāṣṭrī"), undefined);
  assert.equal(map.get("marut"), undefined);
});

test("v2 (H6447): the three residue bands carry the census-evidenced extension", () => {
  const v2bands = ["v2-gender-features", "v2-work-titles", "v2-authors-editors"];
  for (const b of v2bands) assert.ok(BANDS.includes(b));
  const byBand = new Map();
  for (const c of register.concepts) byBand.set(c.smallClass, [...(byBand.get(c.smallClass) ?? []), c.uri]);
  assert.equal(byBand.get(`https://sanskrit-lexicon.github.io/csl-standards/registers/small-class-2006#v2-gender-features`).length, 4);
  assert.equal(byBand.get(`https://sanskrit-lexicon.github.io/csl-standards/registers/small-class-2006#v2-work-titles`).length, 8);
  assert.equal(byBand.get(`https://sanskrit-lexicon.github.io/csl-standards/registers/small-class-2006#v2-authors-editors`).length, 3);
  // v1 is untouched: 20 concepts still sit in the four 2006 bands
  const v1 = register.concepts.filter(c => c.smallClass.endsWith("2006-1") || c.smallClass.endsWith("2006-2") || c.smallClass.endsWith("2006-3") || c.smallClass.endsWith("2006-4"));
  assert.equal(v1.length, 20);
});
