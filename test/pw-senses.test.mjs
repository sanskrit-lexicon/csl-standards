import test from "node:test";
import assert from "node:assert/strict";
import { extractPwSenses } from "../scripts/lib/pw-senses.mjs";

const RAW = "<L>1<pc>1<k1>x<k2>x ¦ <div n=\"1\"/> 1) {%gut%} <ls>AK.</ls> <div n=\"2\"/> 2) {%schön%}<LEND>";

test("each <div> segment with a {%…%} gloss becomes a German sense", () => {
  const senses = extractPwSenses(RAW, "pwg");
  assert.deepEqual(senses.map(s => s.def), ["gut", "schön"]);
  assert.ok(senses.every(s => s.lang === "de" && s.evidence === "derived"));
});

test("the <ls> within a segment attach to that sense, tagged with the dictionary", () => {
  const senses = extractPwSenses(RAW, "pwk");
  const gut = senses.find(s => s.def === "gut");
  assert.equal(gut.citations[0].source, "AK.");
  assert.equal(gut.citations[0].dictionary, "pwk");
  const schoen = senses.find(s => s.def === "schön");
  assert.equal(schoen.citations, undefined, "a sense with no <ls> carries no citations key");
});

test("Sanskrit {#…#} forms are not mistaken for German glosses", () => {
  const senses = extractPwSenses("<L>1<k1>x ¦ <div/> {#andati#} {%binden%}<LEND>", "pwg");
  assert.deepEqual(senses.map(s => s.def), ["binden"]);
});

test("a record with no {%…%} gloss yields no senses", () => {
  assert.deepEqual(extractPwSenses("<L>1<k1>x ¦ <div/> {#andati#}<LEND>", "pwg"), []);
});

test("empty input yields no senses", () => {
  assert.deepEqual(extractPwSenses("", "pwg"), []);
  assert.deepEqual(extractPwSenses(null, "pwg"), []);
});
