import test from "node:test";
import assert from "node:assert/strict";
import { extractFriSenses } from "../scripts/lib/fri-senses.mjs";

const AC = '<L>71<pc>013<k1>ac<k2>ac √ac acati, añcati <div n="1"/>1 <lang n="czech">ohýbati; jíti</lang> <div n="1"/>2 <lang n="russian">сгибать; итти</lang> <div n="1"/>3 <lang n="english">to bend; go; honour</lang> <LEND>';

test("an FRI entry yields one sense with English as the primary definition", () => {
  const senses = extractFriSenses(AC);
  assert.equal(senses.length, 1);
  assert.equal(senses[0].def, "to bend; go; honour");
  assert.equal(senses[0].lang, "en");
  assert.equal(senses[0].evidence, "derived");
});

test("the Czech and Russian glosses are preserved as translations", () => {
  const [s] = extractFriSenses(AC);
  assert.equal(s.translations.cs, "ohýbati; jíti");
  assert.equal(s.translations.ru, "сгибать; итти");
  assert.ok(!("en" in s.translations), "the primary language is not duplicated as a translation");
});

test("the grammatical header (root, forms) is not mistaken for a gloss", () => {
  const defs = extractFriSenses(AC).map(s => s.def);
  assert.ok(!defs.some(d => /acati|√ac/.test(d)));
});

test("a second <div n=\"2\"> group becomes a second sense", () => {
  const raw = '<L>1<k1>x<k2>x <div n="1"/>3 <lang n="english">first</lang> <div n="2"/>3 <lang n="english">second</lang> <LEND>';
  assert.deepEqual(extractFriSenses(raw).map(s => s.def), ["first", "second"]);
});

test("falls back to Russian or Czech when English is absent", () => {
  const raw = '<L>1<k1>x<k2>x <div n="1"/>1 <lang n="czech">jen česky</lang> <LEND>';
  const [s] = extractFriSenses(raw);
  assert.equal(s.def, "jen česky");
  assert.equal(s.lang, "cs");
  assert.equal(s.translations, undefined);
});

test("empty input yields no senses", () => {
  assert.deepEqual(extractFriSenses(""), []);
  assert.deepEqual(extractFriSenses(null), []);
});
