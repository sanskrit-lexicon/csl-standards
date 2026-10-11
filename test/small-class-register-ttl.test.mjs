import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { serializeRegister, OUTPUT_PATH } from "../scripts/export-small-class-register-ttl.mjs";
import { loadRegister, BANDS } from "../scripts/lib/small-class-register.mjs";

const register = loadRegister();
const ttlOnDisk = fs.readFileSync(OUTPUT_PATH, "utf8");

const NOTATION_DATATYPE_IRI = "https://sanskrit-lexicon.github.io/csl-standards/registers/small-class-2006#AbbreviationNotation";

test("export is deterministic: identical register bytes yield identical Turtle bytes", () => {
  assert.equal(serializeRegister(register), serializeRegister(register));
});

test("export honors SOURCE_DATE_EPOCH: pinned stamp present, unset stamp omitted", () => {
  const pinned = serializeRegister(register, {exportedAt: "2026-10-11T07:00:00.000Z"});
  assert.match(pinned, /scr:exportedAt "2026-10-11T07:00:00\.000Z"\^\^xsd:dateTime \./);
  const unpinned = serializeRegister(register, {exportedAt: undefined});
  assert.doesNotMatch(unpinned, /scr:exportedAt "/);
  // both variants stay deterministic and differ only by the stamp
  assert.equal(pinned, serializeRegister(register, {exportedAt: "2026-10-11T07:00:00.000Z"}));
  assert.equal(unpinned, ttlOnDisk);
});

test("committed .ttl is the current deterministic image of the register", () => {
  assert.equal(ttlOnDisk, serializeRegister(register));
});

test("scheme, one collection per band, one concept per concept are serialized", () => {
  assert.match(ttlOnDisk, /a skos:ConceptScheme ;/);
  assert.equal((ttlOnDisk.match(/a skos:Collection ;/g) ?? []).length, register.collections.length);
  assert.equal((ttlOnDisk.match(/a skos:Concept ;/g) ?? []).length, register.concepts.length);
  assert.equal((ttlOnDisk.match(/a scr:UnresolvedForm ;/g) ?? []).length, register.unresolvedForms.length);
  assert.equal((ttlOnDisk.match(/a scr:CanaryExhibit ;/g) ?? []).length, register.canaryExhibits.length);
  for (const band of register.collections) {
    assert.ok(ttlOnDisk.includes(`<${band.uri}> a skos:Collection ;`), band.uri);
  }
});

test("every concept carries inScheme, typed notation, and language-tagged prefLabel", () => {
  for (const concept of register.concepts) {
    const node = ttlOnDisk.split(`<${concept.uri}> a skos:Concept ;`)[1]?.split("\n\n")[0] ?? "";
    assert.ok(node.length, `${concept.uri}: concept node missing`);
    assert.ok(node.includes("skos:inScheme <https://sanskrit-lexicon.github.io/csl-standards/registers/small-class-2006> ;"), concept.uri);
    for (const notation of concept.notation) {
      assert.ok(
        node.includes(`skos:notation ${JSON.stringify(notation)}^^<${NOTATION_DATATYPE_IRI}> ;`),
        `${concept.uri}: notation ${notation} must be a typed literal`,
      );
    }
    for (const [lang, value] of Object.entries(concept.prefLabel)) {
      assert.ok(node.includes(`skos:prefLabel ${JSON.stringify(value)}@${lang} ;`), `${concept.uri}: prefLabel ${lang}`);
    }
    for (const [lang, values] of Object.entries(concept.altLabel ?? {})) {
      for (const value of [].concat(values)) {
        assert.ok(node.includes(`skos:altLabel ${JSON.stringify(value)}@${lang} ;`), `${concept.uri}: altLabel ${lang}`);
      }
    }
    assert.ok(node.includes(`scr:smallClass <${concept.smallClass}> ;`), concept.uri);
  }
});

test("SHACL profile pins the three headline contracts of the JS validator", () => {
  const shapes = fs.readFileSync("data/schema/small-class-register.shacl.ttl", "utf8");
  assert.ok(shapes.includes("sh:uniqueLang"), "SKOS S14 uniqueLang");
  assert.ok(shapes.includes("FILTER (STR($this) < STR(?other))"), "notation uniqueness within the scheme");
  assert.ok(shapes.includes("FILTER NOT EXISTS { ?band skos:member $this }"), "band consistency (concept direction)");
  assert.ok(shapes.includes("FILTER (?band != $this)"), "band consistency (collection direction)");
  assert.ok(shapes.includes("sh:datatype scr:AbbreviationNotation"), "typed notation datatype");
  for (const band of BANDS) {
    assert.ok(
      shapes.includes(`<https://sanskrit-lexicon.github.io/csl-standards/registers/small-class-2006#${band}>`),
      `band ${band} in the smallClass sh:in palette`,
    );
  }
});

test("band member lists in the TTL match the register's collections exactly", () => {
  for (const band of register.collections) {
    const node = ttlOnDisk.split(`<${band.uri}> a skos:Collection ;`)[1]?.split("\n\n")[0] ?? "";
    const members = [...node.matchAll(/skos:member <([^>]+)> [;.]/g)].map(m => m[1]).sort();
    assert.deepEqual(members, [...band.member].sort(), band.uri);
  }
});
