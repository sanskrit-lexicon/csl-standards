import test from "node:test";
import assert from "node:assert/strict";
import { stripPseudoMarkup, extractLabeledSources } from "../scripts/lib/citations.mjs";

test("stripPseudoMarkup unwraps {#…#} and {%…%} and drops inline tags", () => {
  assert.equal(stripPseudoMarkup("{#andati#}, to bind"), "andati, to bind");
  assert.equal(stripPseudoMarkup("{%gut%} <s>schön</s>"), "gut schön");
});

test("stripPseudoMarkup keeps <ls> content and collapses whitespace", () => {
  assert.equal(stripPseudoMarkup("a <ls>RV.</ls>  b"), "a RV. b");
});

test("stripPseudoMarkup tolerates null/undefined", () => {
  assert.equal(stripPseudoMarkup(null), "");
  assert.equal(stripPseudoMarkup(undefined), "");
});

test("extractLabeledSources classifies a bare L. as the lexicographer hedge", () => {
  const [c] = extractLabeledSources("to bind, <ls>L.</ls>");
  assert.equal(c.source, "L.");
  assert.equal(c.type, "generic-lexicographer-hedge");
  assert.equal(c.inheritedFrom, null);
});

test("extractLabeledSources classifies a named source as a citation", () => {
  const [c] = extractLabeledSources("<ls>RV. 1,1,1</ls>");
  assert.equal(c.source, "RV. 1,1,1");
  assert.equal(c.type, "named-source-citation");
});

test("extractLabeledSources reads the inherited n= siglum", () => {
  const [c] = extractLabeledSources('<ls n="AK.">AK.</ls>');
  assert.equal(c.inheritedFrom, "AK.");
});

test("extractLabeledSources falls back to n= when the element is empty", () => {
  const [c] = extractLabeledSources('<ls n="VS."></ls>');
  assert.equal(c.source, "VS.");
  assert.equal(c.inheritedFrom, "VS.");
});

test("extractLabeledSources caps at max and returns [] for empty input", () => {
  const raw = Array.from({ length: 10 }, (_, i) => `<ls>S${i}</ls>`).join(" ");
  assert.equal(extractLabeledSources(raw, { max: 3 }).length, 3);
  assert.deepEqual(extractLabeledSources(""), []);
  assert.deepEqual(extractLabeledSources(null), []);
});

test("extractLabeledSources extracts every citation in order", () => {
  const sources = extractLabeledSources("<ls>RV.</ls> x <ls>AV.</ls>").map(c => c.source);
  assert.deepEqual(sources, ["RV.", "AV."]);
});
