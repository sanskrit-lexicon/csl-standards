#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pilotDirs = ["data/pilot", "src/data/pilot"];
const optionalDictionaries = ["ap90", "gra", "fri", "ben"];
const evidencePhenomena = [
  "source-collapse",
  "generic-lexicographer-hedge",
  "citation-coordinate",
  "named-kosha-citation",
  "editorial-reference"
];
const pipeline = [
  "scripts/select-review-cases.mjs",
  "scripts/build-neutral-model.mjs",
  "scripts/parse-skd-kosa.mjs",
  "scripts/build-loss-reports.mjs",
  "scripts/export-tei.mjs",
  "scripts/export-tei-lex0.mjs",
  "scripts/export-ontolex.mjs",
  "scripts/validate-pilot.mjs",
  "scripts/validate-tei-profile.mjs",
  "scripts/validate-tei-lex0.mjs",
  "scripts/validate-ontolex-profile.mjs",
  "scripts/analyze-loss-reports.mjs"
];

function parseMaxArgs(argv) {
  const values = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--max") values.push(Number(argv[++i]));
  }
  return values.length ? values : [500, 1000];
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "inherit"
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} exited with ${result.status}`);
  }
}

function capture(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8"
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} exited with ${result.status}: ${result.stderr}`);
  }
  return result.stdout.trim();
}

async function readJson(relPath) {
  return JSON.parse(await fs.readFile(path.join(repoRoot, relPath), "utf8"));
}

function tally(entries, keyFn) {
  const out = {};
  for (const entry of entries) {
    const key = keyFn(entry);
    out[key] = (out[key] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(out).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
}

function topEntries(object, limit = 8) {
  return Object.entries(object || {})
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([key, count]) => ({ key, count }));
}

function countOptionalAttachments(items) {
  return Object.fromEntries(optionalDictionaries.map(dictionary => [
    dictionary,
    items.filter(item => item.records?.[dictionary]).length
  ]));
}

function centralClaims(reports, analysis) {
  const targetByStatus = analysis.lossReports.targetByStatus;
  const teiWesternLossy = reports.filter(report =>
    report.target === "tei" &&
    report.status === "lossy" &&
    report.sourceDictionary !== "skd"
  ).length;
  const evidenceLosses = reports.filter(report =>
    report.status === "lossy" && evidencePhenomena.includes(report.phenomenon)
  ).length;
  const lossyTotal = reports.filter(report => report.status === "lossy").length;
  return {
    teiWesternLossy,
    ontolexClean: targetByStatus.ontolex?.clean || 0,
    teiLossy: targetByStatus.tei?.lossy || 0,
    ontolexLossy: targetByStatus.ontolex?.lossy || 0,
    neutralLossy: targetByStatus.neutral?.lossy || 0,
    evidenceLosses,
    lossyTotal,
    evidenceLossShare: lossyTotal ? Number((evidenceLosses / lossyTotal).toFixed(4)) : 0,
    holds:
      teiWesternLossy === 0 &&
      (targetByStatus.ontolex?.clean || 0) === 0 &&
      (targetByStatus.neutral?.lossy || 0) > (targetByStatus.ontolex?.lossy || 0) &&
      (targetByStatus.ontolex?.lossy || 0) > (targetByStatus.tei?.lossy || 0)
  };
}

async function summarizeRun(max) {
  const hardCases = await readJson("data/pilot/hard-cases.json");
  const reports = await readJson("data/pilot/loss-reports.json");
  const analysis = await readJson("data/pilot/loss-analysis.json");
  return {
    maxRequested: max,
    cases: hardCases.items.length,
    reports: reports.length,
    byStatus: analysis.lossReports.byStatus,
    targetByStatus: analysis.lossReports.targetByStatus,
    byFailureClassification: analysis.lossReports.byFailureClassification,
    byPhenomenon: analysis.lossReports.byPhenomenon,
    topCauses: topEntries(analysis.lossReports.byFailureClassification),
    topPhenomena: topEntries(analysis.lossReports.byPhenomenon),
    extensionCoverage: analysis.extensionCoverage,
    lineageCoverage: analysis.lineageCoverage,
    recordsPresent: analysis.crossDictionary.recordsPresent,
    optionalDictionaryAttachments: countOptionalAttachments(hardCases.items),
    centralClaims: centralClaims(reports, analysis)
  };
}

function compareRuns(runs) {
  const claimsHoldEverywhere = runs.every(run => run.centralClaims.holds);
  const evidenceDominantEverywhere = runs.every(run => run.centralClaims.evidenceLossShare >= 0.5);
  const topCauseKeys = runs.map(run => run.topCauses.slice(0, 3).map(item => item.key));
  const topPhenomenonKeys = runs.map(run => run.topPhenomena.slice(0, 3).map(item => item.key));
  return {
    claimsHoldEverywhere,
    evidenceDominantEverywhere,
    topCauseKeys,
    topPhenomenonKeys,
    topCauseStable: topCauseKeys.every(keys => keys.join("|") === topCauseKeys[0].join("|")),
    topPhenomenonStable: topPhenomenonKeys.every(keys => keys.join("|") === topPhenomenonKeys[0].join("|"))
  };
}

function markdownTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map(row => `| ${row.join(" | ")} |`)
  ].join("\n");
}

function percent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function renderMarkdown(report) {
  const rows = report.runs.map(run => [
    String(run.maxRequested),
    String(run.cases),
    String(run.reports),
    String(run.centralClaims.teiLossy),
    String(run.centralClaims.ontolexLossy),
    String(run.centralClaims.neutralLossy),
    String(run.centralClaims.ontolexClean),
    String(run.centralClaims.teiWesternLossy),
    percent(run.centralClaims.evidenceLossShare),
    `${run.extensionCoverage.coveredByImplementedConstruct}/${run.extensionCoverage.ontolexModelVocabularyGapsNeedingExtension}`,
    `${run.lineageCoverage.modeledByLineageRelation}/${run.lineageCoverage.sourceCollapseReports}`,
    optionalDictionaries.map(dictionary => `${dictionary}=${run.optionalDictionaryAttachments[dictionary]}`).join(" ")
  ]);
  const claim = report.comparison.claimsHoldEverywhere ? "holds" : "does not hold";
  const evidence = report.comparison.evidenceDominantEverywhere ? "remains evidence-dominant" : "is not evidence-dominant at every scale";
  return `# Scale Stability Check

Generated by \`npm run scale-check\`.

The scale harness runs the pilot pipeline at larger sample sizes, captures compact summaries, and restores the canonical 250-case \`data/pilot/*\` and \`src/data/pilot/*\` corpus before exiting.

## Summary

${markdownTable(
  [
    "max",
    "cases",
    "reports",
    "TEI lossy",
    "OntoLex lossy",
    "neutral lossy",
    "OntoLex clean",
    "TEI western lossy",
    "evidence-loss share",
    "extension coverage",
    "lineage coverage",
    "optional attachments"
  ],
  rows
)}

## Interpretation

The central asymmetry claim ${claim} across the requested scale checks: TEI has no lossy western-dictionary reports, OntoLex has no clean reports, and the lossy burden remains neutral > OntoLex > TEI.

The lossy evidence pattern ${evidence}. Top cause stability is ${report.comparison.topCauseStable ? "stable" : "variant"} across the requested scales; top phenomenon stability is ${report.comparison.topPhenomenonStable ? "stable" : "variant"}.

## Top Cause Rankings

${report.runs.map(run => `- ${run.maxRequested}: ${run.topCauses.slice(0, 5).map(item => `${item.key}=${item.count}`).join(", ")}`).join("\n")}

## Top Phenomenon Rankings

${report.runs.map(run => `- ${run.maxRequested}: ${run.topPhenomena.slice(0, 5).map(item => `${item.key}=${item.count}`).join(", ")}`).join("\n")}

The full compact JSON artifact is at \`data/scale/scale-stability-report.json\`.
`;
}

async function snapshot(root) {
  const snapshotRoot = await fs.mkdtemp(path.join(os.tmpdir(), "csl-scale-check-"));
  for (const rel of pilotDirs) {
    await fs.cp(path.join(root, rel), path.join(snapshotRoot, rel), { recursive: true });
  }
  return snapshotRoot;
}

async function restore(root, snapshotRoot) {
  for (const rel of pilotDirs) {
    await fs.rm(path.join(root, rel), { recursive: true, force: true });
    await fs.cp(path.join(snapshotRoot, rel), path.join(root, rel), { recursive: true });
  }
}

async function main() {
  const maxValues = parseMaxArgs(process.argv.slice(2));
  const dirtyPilot = capture("git", ["status", "--porcelain", "--", ...pilotDirs]);
  if (dirtyPilot) {
    throw new Error(`Refusing to run with dirty pilot files:\n${dirtyPilot}`);
  }

  const snapshotRoot = await snapshot(repoRoot);
  const runs = [];
  try {
    for (const max of maxValues) {
      console.log(`\n=== Scale check: --max ${max} ===`);
      run(process.execPath, ["scripts/sample-hard-cases.mjs", "--max", String(max)]);
      for (const script of pipeline) run(process.execPath, [script]);
      runs.push(await summarizeRun(max));
    }
  } finally {
    await restore(repoRoot, snapshotRoot);
    await fs.rm(snapshotRoot, { recursive: true, force: true });
  }

  const report = {
    generatedBy: "scripts/run-scale-check.mjs",
    scalePolicy: "Canonical 250-case pilot files are restored after each scale run.",
    runs,
    comparison: compareRuns(runs)
  };
  await fs.mkdir(path.join(repoRoot, "data/scale"), { recursive: true });
  await fs.writeFile(
    path.join(repoRoot, "data/scale/scale-stability-report.json"),
    `${JSON.stringify(report, null, 2)}\n`
  );
  await fs.writeFile(path.join(repoRoot, "docs/SCALE_STABILITY.md"), renderMarkdown(report));

  const restoredPilot = capture("git", ["status", "--porcelain", "--", ...pilotDirs]);
  if (restoredPilot) {
    throw new Error(`Pilot files were not restored cleanly:\n${restoredPilot}`);
  }
  console.log("\nScale stability report written to docs/SCALE_STABILITY.md and data/scale/scale-stability-report.json");
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
