// Month-3 analysis: quantify the loss-report corpus and the MW/PWG/PWK
// cross-dictionary signal, so the paper's Standards Critique (PAPER_OUTLINE.md
// sec. 8, Figures 2 and 5) rests on regenerable numbers rather than prose.
//
// Reads data/pilot/loss-reports.json and data/pilot/neutral-model.json; writes
// data/pilot/loss-analysis.json (the machine artifact) and prints a Markdown
// summary. The companion narrative is docs/LOSS_ANALYSIS.md.
//
// Usage: npm run analyze-loss

import fs from "node:fs/promises";
import path from "node:path";

// Loss-report phenomena defined in docs/LOSS_REPORT_SCHEMA.md, to detect which
// the current generator does and does not yet emit.
const SCHEMA_PHENOMENA = [
  "generic-lexicographer-hedge", "named-kosha-citation", "source-collapse",
  "root-as-entry", "root-as-derivational-base", "compound-subentry",
  "compound-decomposition", "continuation-parent", "citation-coordinate",
  "editorial-reference"
];
const SCHEMA_STATUSES = ["clean", "partial", "lossy", "failure"];
// Failure causes named in the Month-3 roadmap, to detect coverage.
const ROADMAP_CAUSES = [
  "model-vocabulary-gap", "cdsl-markup-gap", "print-compression",
  "sanskrit-convention", "data-quality"
];

function tally(rows, key) {
  const m = {};
  for (const r of rows) {
    const k = typeof key === "function" ? key(r) : r[key];
    m[k] = (m[k] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(m).sort((a, b) => b[1] - a[1]));
}

function crosstab(rows, rowKey, colKey) {
  const m = {};
  for (const r of rows) {
    const a = r[rowKey], b = r[colKey];
    (m[a] ||= {})[b] = ((m[a] || {})[b] || 0) + 1;
  }
  return m;
}

function mdTable(title, counts, total) {
  const lines = [`| ${title} | n | % |`, "|---|--:|--:|"];
  for (const [k, v] of Object.entries(counts)) {
    lines.push(`| ${k} | ${v} | ${((v / total) * 100).toFixed(0)}% |`);
  }
  return lines.join("\n");
}

async function main() {
  const root = process.cwd();
  const reports = JSON.parse(await fs.readFile(path.resolve(root, "data/pilot/loss-reports.json"), "utf8"));
  const models = JSON.parse(await fs.readFile(path.resolve(root, "data/pilot/neutral-model.json"), "utf8"));
  const n = reports.length;

  // --- loss-report corpus ---
  const byStatus = tally(reports, "status");
  const byTarget = tally(reports, "target");
  const byPhenomenon = tally(reports, "phenomenon");
  const byClass = tally(reports, "failureClassification");
  const byExtension = tally(reports, r => `extensionNeeded=${r.extensionNeeded}`);
  const byReview = tally(reports, "reviewStatus");
  const bySource = tally(reports, "sourceDictionary");
  const targetStatus = crosstab(reports, "target", "status");
  const cases = new Set(reports.map(r => r.caseId)).size;

  // --- neutral-model cross-dictionary signal ---
  const phen = {};
  let mw = 0, pwg = 0, pwk = 0, citTotal = 0;
  const citTypes = {};
  const citByDict = {};
  for (const m of models) {
    if (m.records?.mw) mw++; if (m.records?.pwg) pwg++; if (m.records?.pwk) pwk++;
    for (const p of m.phenomena || []) phen[p] = (phen[p] || 0) + 1;
    for (const c of m.citations || []) {
      citTotal++;
      citTypes[c.type] = (citTypes[c.type] || 0) + 1;
      if (c.dictionary) citByDict[c.dictionary] = (citByDict[c.dictionary] || 0) + 1;
    }
  }

  // --- coverage gaps (findings, not failures) ---
  const emittedPhenomena = new Set(reports.map(r => r.phenomenon));
  const emittedStatuses = new Set(reports.map(r => r.status));
  const emittedCauses = new Set(reports.map(r => r.failureClassification).filter(c => c !== "none"));
  const gaps = {
    sourceDictionariesInstrumented: Object.keys(bySource),
    schemaPhenomenaNotEmitted: SCHEMA_PHENOMENA.filter(p => !emittedPhenomena.has(p)),
    schemaStatusesNotEmitted: SCHEMA_STATUSES.filter(s => !emittedStatuses.has(s)),
    roadmapCausesNotEmitted: ROADMAP_CAUSES.filter(c => !emittedCauses.has(c)),
    namedSourceCitationsMaterialized: citTypes["named-source-citation"] || 0
  };

  const analysis = {
    generatedBy: "scripts/analyze-loss-reports.mjs",
    lossReports: {
      total: n, cases,
      byStatus, byTarget, byPhenomenon, byFailureClassification: byClass,
      byExtensionNeeded: byExtension, byReviewStatus: byReview, bySourceDictionary: bySource,
      targetByStatus: targetStatus
    },
    crossDictionary: {
      cases: models.length,
      recordsPresent: { mw, pwg, pwk },
      phenomena: phen,
      citations: { total: citTotal, byType: citTypes, byDictionary: citByDict }
    },
    coverageGaps: gaps
  };

  await fs.writeFile(path.resolve(root, "data/pilot/loss-analysis.json"), `${JSON.stringify(analysis, null, 2)}\n`, "utf8");

  // Markdown summary to stdout (the tables embedded in docs/LOSS_ANALYSIS.md).
  const out = [];
  out.push(`# Loss-report analysis (${n} reports across ${cases} cases)\n`);
  out.push(mdTable("status", byStatus, n) + "\n");
  out.push("## target × status\n");
  out.push("| target | clean | partial | lossy | failure |");
  out.push("|---|--:|--:|--:|--:|");
  for (const t of Object.keys(targetStatus)) {
    const r = targetStatus[t];
    out.push(`| ${t} | ${r.clean || 0} | ${r.partial || 0} | ${r.lossy || 0} | ${r.failure || 0} |`);
  }
  out.push("\n" + mdTable("failureClassification", byClass, n) + "\n");
  out.push(mdTable("phenomenon", byPhenomenon, n) + "\n");
  out.push("## cross-dictionary (neutral model)\n");
  out.push(`records present: mw=${mw} pwg=${pwg} pwk=${pwk} of ${models.length}`);
  out.push(mdTable("phenomenon", phen, models.length) + "\n");
  out.push("## coverage gaps");
  out.push("```json\n" + JSON.stringify(gaps, null, 2) + "\n```");
  console.log(out.join("\n"));
  console.log(`\nWrote data/pilot/loss-analysis.json`);
}

main().catch(error => { console.error(error); process.exit(1); });
