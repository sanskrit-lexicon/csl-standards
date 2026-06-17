import test from "node:test";
import assert from "node:assert/strict";
import {
  CORE_DICTS, OPTIONAL_DICTS, ALL_DICTS,
  DICT_LABEL, DICT_DIR, DICT_FILE
} from "../scripts/lib/dictionaries.mjs";

test("ALL_DICTS is CORE followed by OPTIONAL, with no overlap", () => {
  assert.deepEqual(ALL_DICTS, [...CORE_DICTS, ...OPTIONAL_DICTS]);
  const overlap = CORE_DICTS.filter(d => OPTIONAL_DICTS.includes(d));
  assert.deepEqual(overlap, [], "a dictionary must be core or optional, not both");
});

test("the tri-dict backbone is exactly mw/pwg/pwk", () => {
  assert.deepEqual(CORE_DICTS, ["mw", "pwg", "pwk"]);
});

test("dictionary keys are unique", () => {
  assert.equal(new Set(ALL_DICTS).size, ALL_DICTS.length);
});

test("every dictionary has a label, directory, and file", () => {
  for (const dict of ALL_DICTS) {
    assert.ok(DICT_LABEL[dict], `${dict} is missing a label`);
    assert.ok(DICT_DIR[dict], `${dict} is missing a source directory`);
    assert.ok(DICT_FILE[dict], `${dict} is missing a source file`);
    assert.match(DICT_FILE[dict], /\.txt$/, `${dict} source file should be a .txt`);
  }
});

test("registry maps carry no keys outside ALL_DICTS", () => {
  for (const [name, map] of [["DICT_LABEL", DICT_LABEL], ["DICT_DIR", DICT_DIR], ["DICT_FILE", DICT_FILE]]) {
    for (const key of Object.keys(map)) {
      assert.ok(ALL_DICTS.includes(key), `${name} has stray key ${key}`);
    }
  }
});
