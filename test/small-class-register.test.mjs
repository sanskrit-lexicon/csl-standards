import test from "node:test";
import assert from "node:assert/strict";
import {
  expansionKey, loadRegister, BANDS, CANARY_LABELS, keyToConcept,
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
  // the 2006 scheme proposes no forms for these — they must never bind
  assert.equal(map.get("case"), undefined);
  assert.equal(map.get("masculine"), undefined);
  assert.equal(map.get("vocativ"), undefined);
});
