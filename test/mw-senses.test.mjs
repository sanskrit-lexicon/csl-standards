import test from "node:test";
import assert from "node:assert/strict";
import { extractMwSenses } from "../scripts/lib/mw-senses.mjs";

test("a general entry yields a gloss with leading grammar stripped", () => {
  const senses = extractMwSenses("<s>x</s> ¦ mfn. excellent, good; <ls>L.</ls><LEND>");
  assert.equal(senses.length, 1);
  assert.equal(senses[0].def, "excellent, good");
  assert.equal(senses[0].kind, "gloss");
  assert.equal(senses[0].evidence, "derived");
});

test("a 'See …' entry is a cross-reference, not a gloss", () => {
  const senses = extractMwSenses("<s>x</s> ¦ See <s>foo</s><LEND>");
  assert.equal(senses.length, 1);
  assert.equal(senses[0].kind, "cross-reference");
  assert.match(senses[0].def, /See foo/);
});

test("a verbal root glosses as 'to …' phrases when phenomenon is root", () => {
  const raw = "<s>and</s> ¦ <ab>cl.</ab> 1. <ab>P.</ab> <s>andati</s>, to bind, <ls>L.</ls><LEND>";
  const senses = extractMwSenses(raw, ["root"]);
  assert.ok(senses.length >= 1);
  assert.equal(senses[0].def, "to bind");
  assert.equal(senses[0].kind, "gloss");
});

test("a grammatical stub with no English gloss yields no senses", () => {
  assert.deepEqual(extractMwSenses("<s>x</s> ¦ <ab>g.</ab> 2<LEND>"), []);
});

test("empty input yields no senses", () => {
  assert.deepEqual(extractMwSenses(""), []);
  assert.deepEqual(extractMwSenses(null), []);
});

test("a gloss segment carries the <ls> citations that fall within it", () => {
  const senses = extractMwSenses("<s>x</s> ¦ mfn. a sacred text, <ls>RV. 1,1</ls>; <ls>L.</ls><LEND>");
  const withCit = senses.find(s => s.citations);
  assert.ok(withCit, "expected at least one sense to carry a citation");
  assert.equal(withCit.citations[0].dictionary, "mw");
});

test("duplicate glosses are de-duplicated", () => {
  const senses = extractMwSenses("<s>x</s> ¦ mfn. good; good<LEND>");
  const defs = senses.map(s => s.def);
  assert.equal(new Set(defs).size, defs.length);
});
