import fs from "fs/promises";
import path from "path";
import { KOSHA_SIGLUM, EDITORIAL_SIGLUM, COORDINATE } from "./lib/evidence.mjs";
import { OPTIONAL_DICTS } from "./lib/dictionaries.mjs";

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
          mappedAs: "frac:Attestation with csl:evidenceClass \"hedge\"",
          loss: "Needs explicit evidence/provenance node (OntoLex-FrAC)",
          failureClassification: "model-vocabulary-gap",
          extensionNeeded: true,
          reviewStatus
        });

        // MDF (flat field schema) adequacy: the hedge has no MDF field at all.
        reports.push({
          caseId: model.id,
          target: "mdf",
          status: "lossy",
          phenomenon: "generic-lexicographer-hedge",
          sourceDictionary: "mw",
          sourcePointer: { L: model.records.mw.L, line: model.records.mw.line },
          claim: "MW L. evidence preservation",
          mappedAs: "\\bb L. + \\nt model-loss marker",
          loss: "MDF's flat \\bb flattens the generic-lexicographer hedge to a plain reference; the evidence-kind is not representable.",
          failureClassification: "model-vocabulary-gap",
          extensionNeeded: false,
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
          mappedAs: "csl:RootRelation with csl:whitneyRoot",
          loss: "Root needs lexical plus derivational relation (OntoLex-Morph gap)",
          failureClassification: "model-vocabulary-gap",
          extensionNeeded: true,
          reviewStatus
        });
        reports.push({
          caseId: model.id,
          target: "mdf",
          status: "lossy",
          phenomenon: "root-as-derivational-base",
          sourceDictionary: "mw",
          sourcePointer: { L: model.records.mw.L, line: model.records.mw.line },
          claim: "Root modeling",
          mappedAs: "\\et / \\nt model-loss marker",
          loss: "MDF has no root/derivation relation field; the derivational-base role survives only as a \\nt.",
          failureClassification: "model-vocabulary-gap",
          extensionNeeded: false,
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
          mappedAs: "decomp:ComponentList of decomp:Component",
          loss: "Decomposition needs explicit component graphs",
          failureClassification: "model-vocabulary-gap",
          extensionNeeded: true,
          reviewStatus
        });
        reports.push({
          caseId: model.id,
          target: "mdf",
          status: "lossy",
          phenomenon: "compound-decomposition",
          sourceDictionary: "mw",
          sourcePointer: { L: model.records.mw.L, line: model.records.mw.line },
          claim: "Compound modeling",
          mappedAs: "\\cf components + \\nt model-loss marker",
          loss: "MDF \\se subentry is not a semantic decomposition; components are flattened to \\cf cross-references.",
          failureClassification: "model-vocabulary-gap",
          extensionNeeded: false,
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
          mappedAs: "csl:ContinuationRelation (csl:recoveryStatus)",
          loss: "Suppressed headword needs explicit parent relation mapped in OntoLex",
          failureClassification: "print-compression",
          extensionNeeded: true,
          reviewStatus
        });
        reports.push({
          caseId: model.id,
          target: "mdf",
          status: "lossy",
          phenomenon: "continuation-parent",
          sourceDictionary: "mw",
          sourcePointer: { L: model.records.mw.L, line: model.records.mw.line },
          claim: "Continuation modeling",
          mappedAs: "single record + \\nt model-loss marker",
          loss: "MDF has no continuation concept; the suppressed headword must be resolved from adjacency before a single flat record can be emitted.",
          failureClassification: "print-compression",
          extensionNeeded: false,
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
        mappedAs: "csl:LineageRelation (recomposition)",
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
        mappedAs: "csl:LineageRelation (abridgement)",
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
      mappedAs: "Lex-0 ODD csl-lex0-kosa-sense-boundary (bibl[@type='kosa-authority'] + model-loss)",
      loss: `The TEI Lex-0 baseline splits ${groups.length} authority-bound sense group(s) into separate <def> + <bibl>; the indivisibility of the kosa iti-unit is recorded as a declared Lex-0 ODD customisation (authority formula = sense boundary) rather than silently flattened.`,
      failureClassification: "sanskrit-convention",
      extensionNeeded: true,
      reviewStatus: "machine",
      sourceEvidence: { authorityGroups: groups.length, fusedSynonymRuns: fused.length, authorities }
    });
  }

  // Evidence-class sub-typing that the sense/citation-separating standards flatten
  // (closes the remaining schema phenomena) plus a source data-quality marker.
  // Detected (heuristically) from the materialized citations and source raw; one
  // report per case per applicable phenomenon, target ontolex (the semantic model
  // that should carry the evidence class), cause model-vocabulary-gap.
  const sample = list => [...new Set(list)].slice(0, 5);
  // The csl: extension construct that now answers each evidence-class loss
  // (implemented in export-ontolex, SHACL-validated) — recorded as mappedAs so the
  // report points at its own remedy and analyze-loss can measure coverage.
  const evidenceReport = (model, phenomenon, cites, claim, loss, mappedAs) => ({
    caseId: model.id,
    target: "ontolex",
    status: "partial",
    phenomenon,
    sourceDictionary: cites[0].dictionary,
    sourcePointer: { L: model.records?.[cites[0].dictionary]?.L ?? null, line: null },
    claim,
    mappedAs,
    loss,
    failureClassification: "model-vocabulary-gap",
    extensionNeeded: true,
    reviewStatus: "machine",
    sourceEvidence: { count: cites.length, sample: sample(cites.map(c => c.source)) }
  });
  // Emit the kośa / editorial / coordinate evidence-class reports for one set of
  // citations (all from a single dictionary). Shared by the tri-dict backbone and
  // the optional-dictionary pass so both families stay in lockstep.
  const emitEvidenceClasses = (model, cites) => {
    const kosha = cites.filter(c => KOSHA_SIGLUM.test(c.source));
    if (kosha.length) reports.push(evidenceReport(model, "named-kosha-citation", kosha,
      "Named indigenous kośa (lexicon) sources, distinct from textual attestations.",
      "The kośa evidence class is modeled as an ordinary named-source citation; the indigenous-lexicon distinction is lost.",
      "frac:Attestation with csl:evidenceClass \"kosha\""));
    const editorial = cites.filter(c => EDITORIAL_SIGLUM.test(c.source));
    if (editorial.length) reports.push(evidenceReport(model, "editorial-reference", editorial,
      "Editorial / self references (ib., W., MW., catalogue) point within the lexicographic tradition, not to external texts.",
      "Editorial references are modeled as named-source citations; their non-attestation role is not distinguished.",
      "frac:Attestation with csl:evidenceClass \"editorial\""));
    const coord = cites.filter(c => COORDINATE.test(c.source));
    if (coord.length) reports.push(evidenceReport(model, "citation-coordinate", coord,
      "Named citations carry textual coordinates (book / hymn / verse).",
      "The coordinate is kept as a flat string in the citation abbr / evidence, not parsed into a structured locus or citedRange.",
      "frac:Attestation with csl:citedWork + csl:citedRange"));
  };
  const sicReport = (model, dict) => ({
    caseId: model.id, target: "neutral", status: "partial", phenomenon: "source-anomaly",
    sourceDictionary: dict, sourcePointer: { L: model.records?.[dict]?.L ?? null, line: null },
    claim: "The source record carries an editorial [sic] anomaly marker.",
    loss: "An unresolved source data-quality flag ([sic]) is carried through verbatim, not modeled as a quality assertion.",
    failureClassification: "data-quality", extensionNeeded: false, reviewStatus: "machine",
    sourceEvidence: { marker: "[sic]", dictionary: dict }
  });
  for (const model of models) {
    // Tri-dict backbone (mw/pwg/pwk) evidence-class reports.
    const cites = (model.citations || []).filter(c => !OPTIONAL_DICTS.includes(c.dictionary));
    emitEvidenceClasses(model, cites);
    const sicDict = ["mw", "pwg", "pwk"].find(d => /\[sic\]/i.test(model.records?.[d]?.raw || ""));
    if (sicDict) reports.push(sicReport(model, sicDict));
  }

  // Optional dictionaries (ap90/gra) are independent witnesses layered onto the
  // tri-dict backbone on the OntoLex side (scripts/lib/dictionaries.mjs). Their
  // named citations carry the same evidence-class distinctions the sense/citation-
  // separating standards flatten, so they yield the same model-vocabulary-gap loss
  // reports — emitted here as an additive family (the tri-dict reports above are
  // byte-for-byte untouched), keyed by the optional dictionary that supplied the
  // evidence. The corpus thus grows additively as dictionaries are registered.
  for (const model of models) {
    for (const dict of OPTIONAL_DICTS) {
      const cites = (model.citations || []).filter(c => c.dictionary === dict);
      if (cites.length) emitEvidenceClasses(model, cites);
    }
    const optSic = OPTIONAL_DICTS.find(d => /\[sic\]/i.test(model.records?.[d]?.raw || ""));
    if (optSic) reports.push(sicReport(model, optSic));
  }

  for (const outputPath of outputPaths) {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, `${JSON.stringify(reports, null, 2)}\n`, "utf-8");
  }
  console.log(`Generated ${reports.length} loss reports at ${outputPaths.join(", ")}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
