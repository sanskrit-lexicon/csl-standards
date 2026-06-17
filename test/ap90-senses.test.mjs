import test from "node:test";
import assert from "node:assert/strict";
import { extractAp90Senses } from "../scripts/lib/ap90-senses.mjs";

const AC = '<L>314<pc>0021-c<k1>ac<k2>ac {#ac#}¦ {c1c} <ab>U.</ab> ({#acati, --aMcati#}, {#akta#}) To go, move; to honour; <lbinfo n="re+quest"/> request, ask &c. &c.; connected with {#aMc#} <ab>q. v.</ab> <LEND>';
const AKZ = '<L>117<k1>akz<k2>akz {#akz#}¦ {c1c} <ab>P.</ab> [{#akzati#}] {@1@} To reach. {@--2@} To pass through, pervade. {@--3@} To accumulate. <LEND>';

test("a single-gloss entry yields one English sense, apparatus stripped", () => {
  const senses = extractAp90Senses(AC);
  assert.equal(senses.length, 1);
  assert.equal(senses[0].def, "To go, move; to honour; request, ask");
  assert.equal(senses[0].lang, "en");
  assert.equal(senses[0].evidence, "derived");
});

test("the connected-with cross-reference tail is dropped", () => {
  assert.ok(!/connected with/.test(extractAp90Senses(AC)[0].def));
});

test("{@N@} numbered senses split into separate senses", () => {
  const defs = extractAp90Senses(AKZ).map(s => s.def);
  assert.deepEqual(defs, ["To reach", "To pass through, pervade", "To accumulate"]);
});

test("Sanskrit forms, class markers, and citations do not leak into the gloss", () => {
  const def = extractAp90Senses(AC)[0].def;
  assert.ok(!/acati|c1c|q\. v\.|aMc/.test(def));
});

test("a sense carries the <ls> citations within its segment, tagged ap90", () => {
  const raw = '<L>1<k1>x<k2>x {#x#}¦ <ab>P.</ab> {@1@} To bend <ls>Bk. 3. 25</ls>, <ls n="Bk.">4. 4</ls>. {@--2@} To send. <LEND>';
  const senses = extractAp90Senses(raw);
  assert.equal(senses[0].def, "To bend");
  assert.equal(senses[0].citations[0].source, "Bk. 3. 25");
  assert.equal(senses[0].citations[0].dictionary, "ap90");
  assert.equal(senses[0].citations[1].inheritedFrom, "Bk.");
  assert.ok(!("citations" in senses[1]), "a sense with no <ls> carries no citations key");
});

test("empty input yields no senses", () => {
  assert.deepEqual(extractAp90Senses(""), []);
  assert.deepEqual(extractAp90Senses(null), []);
});
