// Measure the 2006 "small classes" register against the csl-atlas abbreviation
// census (H6409 payload): per-string collision reduction under the register
// mapping vs the raw forms.
//
// Universe: the census collisionMatrix — the strings the payload itself flags
// as colliding (≥2 distinct expansions across the legend layer, 448 of the
// 4752 legend-carrying strings). The baseline is read straight from the
// payload, never re-scanned. The register mapping binds a sense to a register
// concept when the sense's expansion key (the census's own expansion_key
// semantics) is one of the concept's attestedKeys; every other sense stays
// exactly as the census records it.
//
// Two views are reported, neither cherry-picked:
//   C (concept view)  — per raw string, how many distinct concepts do its
//                       senses denote after binding (unbound sense = itself).
//   D (notation view) — after remapping bound senses to their concept's
//                       notation, how many distinct concepts share one
//                       notation (catches collisions the mapping itself
//                       would introduce or leave behind).
//
// Output: data/abbrev/small-class-collision-report.json + .md, byte-stable
// across runs (no wallclock; generatedAt honours SOURCE_DATE_EPOCH via
// scripts/lib/provenance.mjs, the house convention).
//
// Usage:
//   npm run measure-small-class-collisions
//   node scripts/measure-small-class-collisions.mjs --census <path>
//
// Exit 0 = report written; exit 1 = consistency failure (payload changed
// under the register's pinned identity, or the JS expansionKey disagrees
// with the payload's own polysemy counts).

import fs from "node:fs";
import path from "node:path";
import { generatedAt } from "./lib/provenance.mjs";
import {
  REGISTER_PATH, CENSUS_DEFAULT, CANARY_LABELS,
  loadRegister, loadCensus, collisionIndex, keyToConcept,
} from "./lib/small-class-register.mjs";

const root = process.cwd();
const args = process.argv.slice(2);
const OUT_JSON = path.join(root, "data", "abbrev", "small-class-collision-report.json");
const OUT_MD = path.join(root, "data", "abbrev", "small-class-collision-report.md");

// v1 baseline (H6419, register 1.0.0), pinned verbatim from the v1 report
// generated over the same census payload (448 strings / 1128 senses / 98
// bound / 8.69%). v2 compares against these numbers; a v2 that binds fewer
// senses than v1 is a regression and refuses to report.
const V1_BASELINE = Object.freeze({
  registerVersion: "1.0.0",
  handoff: "H6419",
  boundSenses: 98,
  senseCoveragePct: "8.69",
  boundLabels: 48,
  conceptsTouched: 16,
  excessSensesAfter: 634,
  resolvedStrings: 16,
  reducedStrings: 32,
  notationsCollidingAfter: 414,
  excessSensesAfterNotationView: 603,
});

function resolveCensus() {
  const flag = args.indexOf("--census");
  if (flag !== -1 && args[flag + 1]) return path.resolve(args[flag + 1]);
  if (process.env.CENSUS_PATH) return path.resolve(process.env.CENSUS_PATH);
  return path.resolve(root, CENSUS_DEFAULT);
}

const sorted = (arr) => [...arr].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
const pct = (num, den) => (den === 0 ? "0.00" : ((num / den) * 100).toFixed(2));

function main() {
  const register = loadRegister(root);
  const censusPath = resolveCensus();
  if (!fs.existsSync(censusPath)) {
    console.error(`census payload not found at ${censusPath} — pass --census <path>`);
    process.exit(1);
  }
  const census = loadCensus(censusPath);
  const index = collisionIndex(census);
  const conceptByKey = keyToConcept(register);
  const conceptByUri = new Map(register.concepts.map(c => [c.uri, c]));

  // -- consistency guards ---------------------------------------------------
  if (register.provenance.census.generatedAt !== census.generatedAt ||
      register.provenance.census.corpusCommit !== census.provenance.corpusCommit) {
    console.error("census identity changed under the register's pinned provenance — re-pin provenance.census and re-run");
    process.exit(1);
  }

  const perLabel = [];
  const canary = [];
  let totalSenses = 0;
  let excessBefore = 0;
  let excessAfterC = 0;
  let boundSenses = 0;
  const boundLabels = new Set();
  const perConcept = new Map(register.concepts.map(c => [c.uri, { uri: c.uri, notation: c.notation[0], smallClass: c.smallClass, boundSenses: 0, labels: new Set() }]));

  const notationGroups = new Map(); // notation string -> Map(conceptId -> {labels:Set, count})

  for (const label of sorted([...index.keys()])) {
    const senses = index.get(label);
    const censusRow = census.collisionMatrix.find(r => r.label === label);
    const before = new Set(senses.map(s => s.expansionKey)).size;
    if (before !== censusRow.polysemy) {
      console.error(`label ${JSON.stringify(label)}: JS expansionKey count ${before} != payload polysemy ${censusRow.polysemy} — expansionKey divergence, refusing to report`);
      process.exit(1);
    }
    const senseRows = senses.map(s => {
      const conceptUri = conceptByKey.get(s.expansionKey) ?? null;
      if (conceptUri) {
        boundSenses += 1;
        boundLabels.add(label);
        perConcept.get(conceptUri).boundSenses += 1;
        perConcept.get(conceptUri).labels.add(label);
      }
      return { expansion: s.expansion, key: s.expansionKey, boundTo: conceptUri };
    });
    const conceptIds = senseRows.map(r => r.boundTo ?? `raw:${label}:${r.key}`);
    const after = new Set(conceptIds).size;
    excessBefore += before - 1;
    excessAfterC += after - 1;
    perLabel.push({
      label, before, after, bound: senseRows.filter(r => r.boundTo).length,
      senses: senseRows, categories: censusRow.senses.flatMap(s => s.categories)
        .filter((c, i, a) => a.indexOf(c) === i),
    });
    // notation view: bound sense -> concept's primary notation; unbound -> the raw label
    for (let i = 0; i < senses.length; i++) {
      const notation = senseRows[i].boundTo ? conceptByUri.get(senseRows[i].boundTo).notation[0] : label;
      const conceptId = conceptIds[i];
      if (!notationGroups.has(notation)) notationGroups.set(notation, new Map());
      const group = notationGroups.get(notation);
      if (!group.has(conceptId)) group.set(conceptId, { labels: new Set(), expansion: senseRows[i].expansion });
      group.get(conceptId).labels.add(label);
    }
    if (CANARY_LABELS.includes(label)) {
      canary.push({
        label,
        censusPolysemy: censusRow.polysemy,
        before, after,
        bound: senseRows.filter(r => r.boundTo).length,
        senses: senseRows,
      });
    }
    totalSenses += senses.length;
  }

  const collidingAfterC = perLabel.filter(r => r.after >= 2).length;
  const resolvedC = perLabel.filter(r => r.before >= 2 && r.after === 1).length;
  const reducedC = perLabel.filter(r => r.after < r.before).length;

  // H6447 goal condition: v2 must cover more collision mass than the pinned
  // v1 baseline over the same payload — a regression refuses to report.
  if (boundSenses <= V1_BASELINE.boundSenses) {
    console.error(`v2 binds ${boundSenses} senses, not more than the pinned v1 baseline (${V1_BASELINE.boundSenses}) — extension failed, refusing to report`);
    process.exit(1);
  }

  const notationCollisions = [];
  const newConceptPairs = [];
  let excessAfterD = 0;
  for (const [notation, group] of sorted([...notationGroups.entries()]).map(([n, g]) => [n, g])) {
    const conceptCount = group.size;
    excessAfterD += conceptCount - 1;
    if (conceptCount >= 2) {
      const labels = new Set();
      for (const info of group.values()) for (const l of info.labels) labels.add(l);
      const ids = [...group.keys()];
      const pairNew = [];
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const li = group.get(ids[i]).labels, lj = group.get(ids[j]).labels;
          if (![...li].some(l => lj.has(l))) {
            pairNew.push({ a: `${ids[i]} @ ${notation}`, b: `${ids[j]} @ ${notation}` });
          }
        }
      }
      for (const p of pairNew) newConceptPairs.push({ notation, ...p });
      notationCollisions.push({
        notation, concepts: conceptCount,
        labels: sorted([...labels]),
        spanningLabels: labels.size >= 2,
        newPairs: pairNew.length,
        senses: sorted([...group.entries()].map(([cid, info]) => ({
          conceptId: cid, expansion: info.expansion, label: sorted([...info.labels])[0],
        }))).map(s => `${s.conceptId} @ ${s.label} (${s.expansion.slice(0, 48)})`),
      });
    }
  }
  const spanningGroups = notationCollisions.filter(n => n.spanningLabels).length;

  const coverageConcepts = sorted([...perConcept.values()])
    .map(c => ({ ...c, labels: sorted([...c.labels]), labelCount: c.labels.size }));
  const touched = coverageConcepts.filter(c => c.boundSenses > 0);

  const report = {
    report: "small-class-collision-report",
    version: "2.0.0",
    handoff: "H6447",
    register: {
      uri: register.uri,
      version: register.version,
      concepts: register.concepts.length,
      unresolvedForms: register.unresolvedForms.length,
    },
    census: {
      repo: register.provenance.census.repo,
      file: register.provenance.census.file,
      handoff: register.provenance.census.handoff,
      generatedAt: census.generatedAt,
      corpusCommit: census.corpusCommit ?? census.provenance.corpusCommit,
      denominators: census.denominators,
      collisionStrings: census.collisionMatrix.length,
      legendCarryingStrings: Object.keys(census.polysemy).length,
    },
    baseline: {
      collidingStrings: perLabel.length,
      totalSenses,
      excessSenses: excessBefore,
      crossCategoryStrings: perLabel.filter(r => r.categories.length > 1).length,
      categorySenseCounts: Object.fromEntries(sorted(
        Object.entries(census.collisionMatrix.flatMap(r => r.senses.flatMap(s => s.categories)).reduce((acc, c) => (acc[c] = (acc[c] ?? 0) + 1, acc), {}))
      )),
      polysemyHistogram: census.polysemyHistogram,
    },
    coverage: {
      boundSenses,
      senseCoveragePct: pct(boundSenses, totalSenses),
      boundLabels: boundLabels.size,
      labelCoveragePct: pct(boundLabels.size, perLabel.length),
      conceptsTouched: touched.length,
      perConcept: coverageConcepts,
      v1Baseline: V1_BASELINE,
      v2VsV1: {
        sameCensusPayload: true,
        totalSenses,
        boundSensesV1: V1_BASELINE.boundSenses,
        boundSensesV2: boundSenses,
        boundSensesDelta: boundSenses - V1_BASELINE.boundSenses,
        senseCoveragePctV1: V1_BASELINE.senseCoveragePct,
        senseCoveragePctV2: pct(boundSenses, totalSenses),
        coveragePctPoints: (Number(pct(boundSenses, totalSenses)) - Number(V1_BASELINE.senseCoveragePct)).toFixed(2),
        boundLabelsV1: V1_BASELINE.boundLabels,
        boundLabelsV2: boundLabels.size,
        conceptsTouchedV1: V1_BASELINE.conceptsTouched,
        conceptsTouchedV2: touched.length,
      },
    },
    conceptMetric: {
      collidingStringsAfter: collidingAfterC,
      excessSensesAfter: excessAfterC,
      resolvedStrings: resolvedC,
      reducedStrings: reducedC,
      excessReductionPct: pct(excessBefore - excessAfterC, excessBefore),
      changedLabels: perLabel.filter(r => r.after !== r.before).map(r => ({
        label: r.label, before: r.before, after: r.after, bound: r.bound,
      })),
    },
    notationMetric: {
      notationsCollidingAfter: notationCollisions.length,
      excessSensesAfter: excessAfterD,
      notationGroupsSpanningLabels: spanningGroups,
      newConceptPairCount: newConceptPairs.length,
      newConceptPairs,
      collidingNotations: notationCollisions,
    },
    canary,
    generatedAt: generatedAt(),
  };

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2) + "\n");
  fs.writeFileSync(OUT_MD, renderMd(report, register));
  console.log(`report written: ${path.relative(root, OUT_JSON)} (+ .md)`);
  console.log(`baseline: ${perLabel.length} colliding strings, ${totalSenses} senses (excess ${excessBefore}); register binds ${boundSenses} senses (${pct(boundSenses, totalSenses)}%) on ${boundLabels.size} strings`);
  console.log(`v1→v2: ${V1_BASELINE.boundSenses} (${V1_BASELINE.senseCoveragePct}%) → ${boundSenses} (${pct(boundSenses, totalSenses)}%) bound senses, +${boundSenses - V1_BASELINE.boundSenses} senses over the pinned v1 baseline (same payload)`);
  console.log(`concept view: ${collidingAfterC} strings still colliding (excess ${excessAfterC}, -${pct(excessBefore - excessAfterC, excessBefore)}%); resolved ${resolvedC}, reduced ${reducedC}`);
  console.log(`notation view: ${notationCollisions.length} notations still carrying ≥2 concepts; ${spanningGroups} span ≥2 census strings; new concept pairs that never collided on a raw string: ${newConceptPairs.length}`);
}

function renderMd(r, register) {
  const w = [];
  w.push("# Small-class register vs raw forms — measured collision reduction (H6419 v1, extended H6447 v2)");
  w.push("");
  w.push("_Generated by `scripts/measure-small-class-collisions.mjs` — byte-stable, no wallclock stamp_");
  w.push("");
  w.push(`The 2006 proposal (Gasūns, EURALEX XII, pp. 773–778, §2.3) asserted that "small classes" keyed to concept class reduce abbreviation collisions. The v1 register (H6419) turned the scheme-as-printed into 20 SKOS-shaped concepts; v2 (H6447) extends it beyond the scheme-as-printed with the measured-residue classes — gender/features (feminine, masculine, neuter, middle), work titles, authors/editors — each concept census-evidenced, and grounds the 8 unresolved 2006 forms externally (Whitney 1879 / Macdonell 1916 / Knauer 1908, the paper's own reference grammars). The register ([data/abbrev/small-class-register.json](small-class-register.json)) now carries ${register.concepts.length} concepts; this table measures, over the H6409 census collision universe, how much collision mass v1 and v2 each absorb. No normative claim is made beyond these numbers.`);
  w.push("");
  w.push("## A. Baseline (verbatim census payload)");
  w.push("");
  w.push("| Metric | Value |");
  w.push("|---|---|");
  w.push(`| Colliding strings (≥2 distinct expansions) | ${r.baseline.collidingStrings} of ${r.census.legendCarryingStrings} legend-carrying strings |`);
  w.push(`| Distinct senses on colliding strings | ${r.baseline.totalSenses} (excess over one-per-string: ${r.baseline.excessSenses}) |`);
  w.push(`| Cross-category collision strings | ${r.baseline.crossCategoryStrings} |`);
  w.push(`| Category tags on collision senses | ${Object.entries(r.baseline.categorySenseCounts).map(([c, n]) => `${c} ${n}`).join(", ")} |`);
  w.push(`| Corpus denominators | ${r.census.denominators.corpusDictionariesParsed}/${r.census.denominators.corpusDictionariesDiscovered} dictionaries parsed, ${r.census.denominators.dictionariesWithLegends}/${r.census.denominators.dictionariesCatalogued} with machine-readable legends, ${r.census.denominators.entriesScanned} entries scanned |`);
  w.push("");
  w.push("## B. Register coverage — v1 vs v2 (same census payload, same denominators)");
  w.push("");
  const v = r.coverage.v2VsV1;
  w.push(`The v1 register bound ${v.boundSensesV1} of ${v.totalSenses} collision senses (${v.senseCoveragePctV1}%) on ${v.boundLabelsV1} strings; v2 binds ${v.boundSensesV2} (${v.senseCoveragePctV2}%) on ${v.boundLabelsV2} strings — +${v.boundSensesDelta} senses, +${v.coveragePctPoints} percentage points. Both numbers are computed over the identical pinned payload (generatedAt ${r.census.generatedAt}, corpusCommit ${r.census.corpusCommit}); v1 figures are the pinned v1 report verbatim, and the script refuses to report if v2 regresses below v1.`);
  w.push("");
  w.push("| Metric | v1 (H6419, 20 concepts) | v2 (H6447, ${r.register.concepts} concepts) |");
  w.push("|---|---|---|");
  w.push(`| Bound senses / ${v.totalSenses} | ${v.boundSensesV1} (${v.senseCoveragePctV1}%) | ${v.boundSensesV2} (${v.senseCoveragePctV2}%) |`);
  w.push(`| Bound strings / ${r.baseline.collidingStrings} | ${v.boundLabelsV1} | ${v.boundLabelsV2} |`);
  w.push(`| Concepts touching the universe | ${v.conceptsTouchedV1}/20 | ${v.conceptsTouchedV2}/${r.register.concepts} |`);
  w.push(`| Excess senses after binding | ${r.coverage.v1Baseline.excessSensesAfter} | ${r.conceptMetric.excessSensesAfter} |`);
  w.push("");
  w.push("Per-concept coverage:");
  w.push("");
  w.push("| Concept | Notation | Band | Bound senses | Census strings |");
  w.push("|---|---|---|---|---|");
  for (const c of r.coverage.perConcept.filter(c => c.boundSenses > 0)) {
    w.push(`| ${c.uri.split("#")[1]} | ${c.notation} | ${c.smallClass.split("#")[1]} | ${c.boundSenses} | ${c.labels.join(", ")} |`);
  }
  w.push("");
  w.push("## C. Collision reduction — concept view");
  w.push("");
  w.push(`After binding, ${r.conceptMetric.collidingStringsAfter} of ${r.baseline.collidingStrings} strings still carry ≥2 concepts; total excess falls ${r.baseline.excessSenses} → ${r.conceptMetric.excessSensesAfter} (−${r.conceptMetric.excessReductionPct}%). Fully resolved strings: ${r.conceptMetric.resolvedStrings}; strings reduced but not resolved: ${r.conceptMetric.reducedStrings - r.conceptMetric.resolvedStrings}.`);
  w.push("");
  if (r.conceptMetric.changedLabels.length) {
    w.push("| String | Senses before | Concepts after | Bound senses |");
    w.push("|---|---|---|---|");
    for (const c of r.conceptMetric.changedLabels) {
      w.push(`| ${c.label} | ${c.before} | ${c.after} | ${c.bound} |`);
    }
    w.push("");
  }
  w.push("## D. Collision after remapping — notation view");
  w.push("");
  w.push(`Under the register's notations, ${r.notationMetric.notationsCollidingAfter} notation strings still carry ≥2 concepts (excess ${r.notationMetric.excessSensesAfter}). ${r.notationMetric.notationGroupsSpanningLabels} of these span ≥2 census strings: a canonical notation absorbing its own attested variants from other strings (e.g. genitive senses of \`Gen.\`, \`gen.\`, \`g.\`, \`gén.\` joining \`G.\`). Pairwise, the mapping introduces **${r.notationMetric.newConceptPairCount}** concept pairs that never collided on any raw string${r.notationMetric.newConceptPairCount ? " — LISTED BELOW, a mapping defect to fix" : " (every colliding pair inside a notation group already collided on the raw string itself)"} .`);
  w.push("");
  if (r.notationMetric.collidingNotations.length) {
    w.push("| Notation | Distinct concepts | Census strings |");
    w.push("|---|---|---|");
    for (const n of r.notationMetric.collidingNotations.slice(0, 20)) {
      w.push(`| ${n.notation} | ${n.concepts} | ${n.labels.slice(0, 6).join(", ")}${n.labels.length > 6 ? ` … (${n.labels.length})` : ""} |`);
    }
    if (r.notationMetric.collidingNotations.length > 20) {
      w.push(`| … ${r.notationMetric.collidingNotations.length - 20} more | | |`);
    }
    w.push("");
  }
  w.push("## Canary — the 2006 §2.1/§2 target strings");
  w.push("");
  w.push("Register row → census row, numbers verbatim from the payload:");
  w.push("");
  w.push("| String | Census polysemy | Concepts after | Bound senses | Register outcome |");
  w.push("|---|---|---|---|---|");
  for (const c of r.canary) {
    const outcome = c.after === 1 ? "resolved" : (c.after < c.before ? `reduced ${c.before} → ${c.after}` : "unchanged — no proposed form covers its senses");
    w.push(`| ${c.label} | ${c.censusPolysemy} | ${c.after} | ${c.bound} | ${outcome} |`);
  }
  w.push("");
  for (const c of r.canary) {
    w.push(`**${c.label}** (census polysemy ${c.censusPolysemy}):`);
    w.push("");
    for (const s of c.senses) {
      const target = s.boundTo ? `→ register concept \`${s.boundTo.split("#")[1]}\`` : "→ unbound (no proposed form covers this sense; stays raw)";
      w.push(`- \`${s.expansion.replace(/\|/g, "\\|").slice(0, 90)}\` — key \`${s.key}\` ${target}`);
    }
    w.push("");
  }
  w.push("## Reproduce");
  w.push("");
  w.push("```sh");
  w.push("npm run validate-small-class-register -- --census <csl-atlas>/data/abbrev/abbrev_census.json");
  w.push("npm run measure-small-class-collisions -- --census <csl-atlas>/data/abbrev/abbrev_census.json");
  w.push("```");
  w.push("");
  w.push(`Census identity pinned in the register's provenance: generatedAt ${r.census.generatedAt}, corpusCommit ${r.census.corpusCommit}. Re-running must be byte-identical; any drift is a consistency failure, not a report update.`);
  w.push("");
  return w.join("\n");
}

main();
