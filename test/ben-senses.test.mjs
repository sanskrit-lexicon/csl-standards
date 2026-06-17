import test from "node:test";
import assert from "node:assert/strict";
import { extractBenSenses } from "../scripts/lib/ben-senses.mjs";

// Numbered noun entry; compounds follow a {@ -- Comp. @} marker (not senses).
const ANNA = "<L>1<k1>anna<k2>anna {#anna#}¦ {%anna,%} <ab>n.</ab> " +
  "{@1.@} Food, <ls>Man.</ls> 3, 182. {@2.@} Corn, <ls>Man.</ls> 3, 76. " +
  "{@3.@} Boiled rice. {@ -- <ab>Comp.</ab>@} {%Kṛta-,%} <ab>n.</ab> dressed food.<LEND>";

test("numbered senses split, one per {@N.@} marker", () => {
  const senses = extractBenSenses(ANNA);
  assert.deepEqual(senses.map(s => s.def), ["Food", "Corn", "Boiled rice"]);
  assert.ok(senses.every(s => s.lang === "en" && s.evidence === "derived"));
});

test("the compound section after {@ -- Comp. @} is not a sense", () => {
  const senses = extractBenSenses(ANNA);
  assert.ok(!senses.some(s => /dressed food/.test(s.def)), "compound gloss leaked in");
});

test("the <ls> in a sense segment attaches to it, tagged ben; coordinate dropped", () => {
  const food = extractBenSenses(ANNA).find(s => s.def === "Food");
  assert.equal(food.citations[0].source, "Man.");
  assert.equal(food.citations[0].dictionary, "ben");
  assert.ok(!/\d/.test(food.def), "the outside-<ls> coordinate must not leak into the gloss");
});

test("the grammatical preamble before {@1.@} is not a sense", () => {
  // "rarely" sits in the preamble between two Sanskrit forms.
  const raw = "<L>2<k1>x<k2>x {#x#}¦ {%aṃśa,%} rarely {%aṃsa,%} <ab>m.</ab> {@1.@} A part.<LEND>";
  assert.deepEqual(extractBenSenses(raw).map(s => s.def), ["A part"]);
});

test("an un-numbered entry keeps its single trailing gloss", () => {
  const raw = "<L>3<k1>aja<k2>aja {#aja#}¦ {%a-ja,%} <ab>adj.</ab>, <ab>f.</ab> {%jā.%} Unborn.<LEND>";
  assert.deepEqual(extractBenSenses(raw).map(s => s.def), ["Unborn"]);
});

test("print line-break hyphens are re-joined", () => {
  const raw = "<L>4<k1>x<k2>x {#x#}¦ <ab>m.</ab> {@1.@} In-\nheritance, <ls>Man.</ls> 9, 47.<LEND>";
  assert.deepEqual(extractBenSenses(raw).map(s => s.def), ["Inheritance"]);
});

test("a cross-reference whose target was stripped is not emitted as 'See'", () => {
  const raw = "<L>5<k1>x<k2>x {#x#}¦ <ab>m.</ab> {@1.@} A part. {@2.@} See {%aṃsa.%}<LEND>";
  assert.deepEqual(extractBenSenses(raw).map(s => s.def), ["A part"]);
});

test("empty input yields no senses", () => {
  assert.deepEqual(extractBenSenses(""), []);
  assert.deepEqual(extractBenSenses(null), []);
});
