import test from "node:test";
import assert from "node:assert/strict";
import {
  evidenceClass, parseCoordinate,
  KOSHA_SIGLUM, EDITORIAL_SIGLUM, COORDINATE
} from "../scripts/lib/evidence.mjs";

test("evidenceClass: the lexicographer hedge is detected by type and by string", () => {
  assert.equal(evidenceClass("L.", "generic-lexicographer-hedge"), "hedge");
  assert.equal(evidenceClass("L.", "named-source-citation"), "hedge");
});

test("evidenceClass: indigenous kośa authorities classify as kosha", () => {
  for (const s of ["AK.", "Amar", "Medin", "Halay", "Vaij.", "H."]) {
    assert.equal(evidenceClass(s, "named-source-citation"), "kosha", `${s} should be kosha`);
  }
});

test("evidenceClass: editorial/self references classify as editorial", () => {
  for (const s of ["ib.", "W.", "MW.", "Verz", "l.c."]) {
    assert.equal(evidenceClass(s, "named-source-citation"), "editorial", `${s} should be editorial`);
  }
});

test("evidenceClass: a plain textual siglum falls through to textual", () => {
  assert.equal(evidenceClass("RV. 1,1,1", "named-source-citation"), "textual");
  assert.equal(evidenceClass("", "named-source-citation"), "textual");
});

test("parseCoordinate splits a work siglum from its locus", () => {
  assert.deepEqual(parseCoordinate("AV. 6,116,1."), { work: "AV.", locus: "6,116,1" });
  assert.deepEqual(parseCoordinate("RV. 1.1"), { work: "RV.", locus: "1.1" });
});

test("parseCoordinate returns null without a two-part numeric coordinate", () => {
  assert.equal(parseCoordinate("L."), null);
  assert.equal(parseCoordinate("RV. 5"), null);
  assert.equal(parseCoordinate(""), null);
  assert.equal(parseCoordinate(null), null);
});

test("parseCoordinate returns null when no work siglum precedes the digits", () => {
  assert.equal(parseCoordinate("6,116,1"), null);
});

test("the exported patterns agree with the classifiers", () => {
  assert.ok(KOSHA_SIGLUM.test("AK."));
  assert.ok(EDITORIAL_SIGLUM.test("ib."));
  assert.ok(COORDINATE.test("6,116"));
  assert.ok(!COORDINATE.test("6"));
});
