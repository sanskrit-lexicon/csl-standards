import fs from "fs/promises";
import path from "path";

// Top 15 highest-stress cases by rank / score in hard-cases
const HIGH_STRESS_KEYS = new Set([
  "ac", "ah", "akz", "am", "aMh", "an", "aS", "at", "Bid", "DAv", "dih", "a", "aMSa", "aga", "akza"
]);

async function main() {
  const inputPath = path.resolve(process.cwd(), "data/pilot/neutral-model.json");
  const outputPaths = [
    path.resolve(process.cwd(), "data/pilot/loss-reports.json"),
    path.resolve(process.cwd(), "src/data/pilot/loss-reports.json")
  ];

  const models = JSON.parse(await fs.readFile(inputPath, "utf-8"));
  const reports = [];

  // Labeled-source citations (<ls>…</ls>) carried in a record's raw markup.
  const lsList = raw => [...String(raw || "").matchAll(/<ls[^>]*>(.*?)<\/ls>/g)]
    .map(m => m[1].replace(/<[^>]+>/g, "").trim()).filter(Boolean);

  for (const model of models) {
    const isHighStress = HIGH_STRESS_KEYS.has(model.key);
    const reviewStatus = isHighStress ? "reviewed" : "machine";

    for (const p of model.phenomena) {
      if (p === "hedge") {
        // CDSL markup gap classification
        reports.push({
          caseId: model.id,
          target: "tei",
          status: "partial",
          phenomenon: "generic-lexicographer-hedge",
          sourceDictionary: "mw",
          sourcePointer: { L: model.records.mw.L, line: model.records.mw.line },
          claim: "MW L. evidence preservation",
          loss: "TEI can preserve string/type but not shared evidential semantics",
          failureClassification: "cdsl-markup-gap",
          extensionNeeded: true,
          reviewStatus
        });
        
        // Model vocabulary gap classification
        reports.push({
          caseId: model.id,
          target: "ontolex",
          status: "partial",
          phenomenon: "generic-lexicographer-hedge",
          sourceDictionary: "mw",
          sourcePointer: { L: model.records.mw.L, line: model.records.mw.line },
          claim: "MW L. evidence preservation",
          loss: "Needs explicit evidence/provenance node (OntoLex-FrAC)",
          failureClassification: "model-vocabulary-gap",
          extensionNeeded: true,
          reviewStatus
        });
      } else if (p === "root") {
        reports.push({
          caseId: model.id,
          target: "tei",
          status: "partial",
          phenomenon: "root-as-entry",
          sourceDictionary: "mw",
          sourcePointer: { L: model.records.mw.L, line: model.records.mw.line },
          claim: "Root modeling",
          loss: "Root as entry is preservable; derivational role is not fully explicit in TEI dicts",
          failureClassification: "model-vocabulary-gap",
          extensionNeeded: false,
          reviewStatus
        });
        reports.push({
          caseId: model.id,
          target: "ontolex",
          status: "lossy",
          phenomenon: "root-as-derivational-base",
          sourceDictionary: "mw",
          sourcePointer: { L: model.records.mw.L, line: model.records.mw.line },
          claim: "Root modeling",
          loss: "Root needs lexical plus derivational relation (OntoLex-Morph gap)",
          failureClassification: "model-vocabulary-gap",
          extensionNeeded: true,
          reviewStatus
        });
      } else if (p === "compound") {
        reports.push({
          caseId: model.id,
          target: "tei",
          status: "clean",
          phenomenon: "compound-subentry",
          sourceDictionary: "mw",
          sourcePointer: { L: model.records.mw.L, line: model.records.mw.line },
          claim: "Compound modeling",
          failureClassification: "none",
          extensionNeeded: false,
          reviewStatus
        });
        reports.push({
          caseId: model.id,
          target: "ontolex",
          status: "partial",
          phenomenon: "compound-decomposition",
          sourceDictionary: "mw",
          sourcePointer: { L: model.records.mw.L, line: model.records.mw.line },
          claim: "Compound modeling",
          loss: "Decomposition needs explicit component graphs",
          failureClassification: "model-vocabulary-gap",
          extensionNeeded: true,
          reviewStatus
        });
      } else if (p === "continuation") {
        // Print compression classification
        reports.push({
          caseId: model.id,
          target: "tei",
          status: "partial",
          phenomenon: "continuation-parent",
          sourceDictionary: "mw",
          sourcePointer: { L: model.records.mw.L, line: model.records.mw.line },
          claim: "Continuation modeling",
          loss: "Parent must be recovered from adjacency due to page layout compression",
          failureClassification: "print-compression",
          extensionNeeded: false,
          reviewStatus
        });
        reports.push({
          caseId: model.id,
          target: "ontolex",
          status: "lossy",
          phenomenon: "continuation-parent",
          sourceDictionary: "mw",
          sourcePointer: { L: model.records.mw.L, line: model.records.mw.line },
          claim: "Continuation modeling",
          loss: "Suppressed headword needs explicit parent relation mapped in OntoLex",
          failureClassification: "print-compression",
          extensionNeeded: true,
          reviewStatus
        });
      }
    }

    // Source-level (lineage) collapse: named evidence present upstream is reduced
    // along PWG -> PWK -> MW. These are NOT target-model failures (TEI/OntoLex can
    // both hold named citations) — the loss is editorial, so target is "neutral"
    // and extensionNeeded is false. See docs/PAPER_OUTLINE.md sec. 7.
    const mwLs = lsList(model.records.mw?.raw);
    const pwgLs = lsList(model.records.pwg?.raw);
    const pwkLs = lsList(model.records.pwk?.raw);
    const sample = list => list.slice(0, 5);

    // PWG -> MW: PWG attests the lemma but MW carries no citation at all.
    if (pwgLs.length > 0 && mwLs.length === 0) {
      reports.push({
        caseId: model.id,
        target: "neutral",
        status: "lossy",
        phenomenon: "source-collapse",
        sourceDictionary: "pwg",
        sourcePointer: { L: model.records.pwg.L, line: model.records.pwg.line },
        claim: `PWG attests this lemma with ${pwgLs.length} named citation(s); MW carries none.`,
        loss: `PWG's named sources (e.g. ${sample(pwgLs).join("; ")}) are reduced to the MW lexicographer hedge or dropped; the lemma becomes textually unattested at the MW endpoint.`,
        failureClassification: "editorial-compression",
        extensionNeeded: false,
        reviewStatus,
        sourceEvidence: { pwg: pwgLs.length, pwk: pwkLs.length, mw: 0, sample: sample(pwgLs) }
      });
    }

    // PWG -> PWK: PWK abridges PWG's apparatus (drops some or all citations).
    if (pwgLs.length > 0 && pwkLs.length < pwgLs.length) {
      const droppedAll = pwkLs.length === 0;
      reports.push({
        caseId: model.id,
        target: "neutral",
        status: droppedAll ? "lossy" : "partial",
        phenomenon: "source-collapse",
        sourceDictionary: "pwk",
        sourcePointer: { L: model.records.pwk.L, line: model.records.pwk.line },
        claim: `PWK abridges PWG: PWG has ${pwgLs.length} named citation(s), PWK retains ${pwkLs.length}.`,
        loss: droppedAll
          ? `PWK drops PWG's entire named apparatus (e.g. ${sample(pwgLs).join("; ")}).`
          : `PWK keeps ${pwkLs.length} of ${pwgLs.length} PWG citation(s) and drops the rest.`,
        failureClassification: "editorial-compression",
        extensionNeeded: false,
        reviewStatus,
        sourceEvidence: { pwg: pwgLs.length, pwk: pwkLs.length, mw: mwLs.length, sample: sample(pwgLs) }
      });
    }
  }

  // Indigenous kosa sense/citation fusion (TEI Lex-0 pilot sec. 5): a kosa
  // structures sense and source as one indivisible "iti <authority>" unit, which
  // the Lex-0 export must split into def + bibl. This is not a model or markup
  // gap — it is a Sanskrit lexicographic convention with no equivalent in the
  // sense/citation-separating standards, hence "sanskrit-convention".
  const fixturesPath = path.resolve(process.cwd(), "data/pilot/lex0-fixtures.json");
  let fixtures = [];
  try { fixtures = JSON.parse(await fs.readFile(fixturesPath, "utf-8")); } catch { /* optional */ }
  for (const entry of fixtures) {
    if (!(entry.phenomena || []).includes("sense-citation-fusion")) continue;
    const groups = (entry.senses || []).filter(s => s.authority);
    const fused = (entry.senses || []).filter(s => s.loss);
    const authorities = [...new Set(groups
      .map(s => s.authority.author || s.authority.title).filter(Boolean))];
    reports.push({
      caseId: entry.id,
      target: "tei",
      status: "lossy",
      phenomenon: "sense-citation-fusion",
      sourceDictionary: "skd",
      sourcePointer: { L: entry.records?.skd?.L ?? null, line: null },
      claim: "In the kosa, sense and source authority form one indivisible 'iti <authority>' unit.",
      loss: `The TEI Lex-0 baseline splits ${groups.length} authority-bound sense group(s) into separate <def> + <bibl>; the indivisibility of the kosa iti-unit (a candidate Lex-0 ODD customisation) is not expressible in the baseline.`,
      failureClassification: "sanskrit-convention",
      extensionNeeded: true,
      reviewStatus: "machine",
      sourceEvidence: { authorityGroups: groups.length, fusedSynonymRuns: fused.length, authorities }
    });
  }

  for (const outputPath of outputPaths) {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, `${JSON.stringify(reports, null, 2)}\n`, "utf-8");
  }
  console.log(`Generated ${reports.length} loss reports at ${outputPaths.join(", ")}`);
}

main().catch(console.error);
