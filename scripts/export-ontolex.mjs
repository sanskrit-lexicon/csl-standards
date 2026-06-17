import fs from "node:fs/promises";
import path from "node:path";
import { evidenceClass, parseCoordinate } from "./lib/evidence.mjs";
import { extractLabeledSources } from "./lib/citations.mjs";
import { ALL_DICTS, DICT_LABEL } from "./lib/dictionaries.mjs";

// mw/pwg/pwk are the tri-dict backbone; optional dictionaries are attached per case
// (see scripts/lib/dictionaries.mjs). Senses are only modeled for the dictionaries
// that have a sense extractor; the rest contribute a source record and evidence
// (their named citations).
const DICTS = ALL_DICTS;

const BASE = "https://sanskrit-lexicon.github.io/csl-standards/id";
const PROFILE_VERSION = "ontolex-frac-profile-v0.1";

function safeCaseId(id) {
  return id.replace(/:/g, "-");
}

function iriForCase(id) {
  return `${BASE}/case/${encodeURIComponent(id)}`;
}

function iriFor(id, fragment) {
  return `${iriForCase(id)}#${fragment}`;
}

function ttlString(value) {
  return JSON.stringify(String(value ?? ""));
}

function ttlIri(value) {
  return `<${value}>`;
}


function entryType(model) {
  if (model.phenomena?.includes("root")) return "verbal-root";
  if (model.phenomena?.includes("compound")) return "compound";
  if (model.phenomena?.includes("continuation")) return "continuation";
  return model.forms?.[0]?.type || "lemma";
}

async function loadSourceIndexes(hardCases) {
  const indexes = {};
  for (const dict of DICTS) {
    const source = hardCases.sources?.[dict];
    if (!source) continue;
    const sourcePath = path.resolve(process.cwd(), source);
    const text = await fs.readFile(sourcePath, "utf8");
    const records = text.match(/<L>[\s\S]*?<LEND>/g) || [];
    indexes[dict] = new Map();
    for (const raw of records) {
      const L = raw.match(/^<L>([^<]+)/)?.[1];
      if (L) indexes[dict].set(L, raw.trim());
    }
  }
  return indexes;
}

function fullRaw(model, dict, indexes) {
  const L = model.records?.[dict]?.L;
  return indexes[dict]?.get(L) || model.records?.[dict]?.raw || "";
}

function jsonldFor(model, rawByDict, isReviewCase) {
  const caseIri = iriForCase(model.id);
  const formIri = iriFor(model.id, "form-canonical");
  // The dictionaries actually present for this case (always mw/pwg/pwk; ap90 when
  // attached). Source records and their entry links follow the present set.
  const presentDicts = DICTS.filter(dict => model.records?.[dict]);
  const sourceRecordIds = presentDicts.map(dict => iriFor(model.id, `record-${dict}`));
  const attestationNodes = [];
  const sourceRecordNodes = [];
  // Multi-resource senses: MW (English, model.senses) plus the German Petersburg
  // dictionaries (records.{pwg,pwk}.senses). Each sense keeps its source
  // dictionary and (internally) its sense-linked citations for the attestations.
  const langByDict = {mw: "en", pwg: "de", pwk: "de", fri: "en", ap90: "en", gra: "de", ben: "en"};
  const senseNodes = [];
  for (const dict of DICTS) {
    const senses = dict === "mw" ? (model.senses || []) : (model.records?.[dict]?.senses || []);
    senses.forEach((sense, index) => {
      // A sense with `translations` (FRI's trilingual glosses) emits one
      // skos:definition literal per language; a single-language sense emits one
      // object (so mw/pwg/pwk output is unchanged).
      const primary = {"@value": sense.def, "@language": langByDict[dict]};
      const definition = sense.translations
        ? [primary, ...Object.entries(sense.translations).map(([lang, value]) => ({"@value": value, "@language": lang}))]
        : primary;
      senseNodes.push({
        "@id": iriFor(model.id, `sense-${dict}-${index + 1}`),
        "@type": "ontolex:LexicalSense",
        "ontolex:isSenseOf": {"@id": caseIri},
        "skos:definition": definition,
        "csl:sourceDictionary": dict,
        ...(sense.kind === "cross-reference" ? {"csl:senseKind": "cross-reference"} : {}),
        _citations: sense.citations || []
      });
    });
  }

  for (const dict of presentDicts) {
    const rec = model.records?.[dict] || {};
    const recordId = iriFor(model.id, `record-${dict}`);
    sourceRecordNodes.push({
      "@id": recordId,
      "@type": "csl:SourceRecord",
      "dct:source": DICT_LABEL[dict],
      "csl:dictionary": dict,
      "csl:recordNumber": rec.L,
      "csl:lineNumber": rec.line,
      "csl:pageColumn": rec.pc,
      "rdf:value": rawByDict[dict]
    });
  }

  // Attestations are model-driven: a sense-linked citation attests its sense; a
  // remaining entry-level citation (not represented by any sense) attests the
  // entry. This is the OntoLex side of sense-level citation linkage.
  const recordIri = dict => iriFor(model.id, `record-${dict}`);
  let attSeq = 0;
  const senseLinked = new Set();
  // The csl: evidence-class extension: sub-type each attestation (textual / kośa
  // / editorial / hedge) and parse its textual coordinate, so the flat
  // frac:Attestation carries the evidence class it would otherwise lose (§4b).
  const attestationFor = (c, attestsId) => {
    const coord = parseCoordinate(c.source);
    return {
      "@id": iriFor(model.id, `attestation-${++attSeq}`),
      "@type": "frac:Attestation",
      "frac:attests": {"@id": attestsId},
      "frac:evidence": c.source,
      "prov:wasDerivedFrom": {"@id": recordIri(c.dictionary)},
      "csl:sourceDictionary": c.dictionary,
      "csl:evidenceType": c.type,
      "csl:evidenceClass": evidenceClass(c.source, c.type),
      ...(coord ? {"csl:citedWork": coord.work, "csl:citedRange": coord.locus} : {}),
      ...(c.inheritedFrom ? {"csl:inheritedSiglum": c.inheritedFrom} : {})
    };
  };
  for (const sense of senseNodes) {
    for (const c of sense._citations) {
      senseLinked.add(`${c.dictionary}:${c.source}`);
      attestationNodes.push(attestationFor(c, sense["@id"]));
    }
  }
  for (const c of model.citations || []) {
    if (senseLinked.has(`${c.dictionary}:${c.source}`)) continue;
    attestationNodes.push(attestationFor(c, caseIri));
  }

  // OntoLex-Lexicog multi-resource view: per source dictionary that has senses, a
  // lexicog:LexicographicResource (the dictionary) containing one lexicog:Entry
  // (its article for this lemma) that describes the lemma and lists its senses.
  const resourceNodes = [];   // lexicog:LexicographicResource (the dictionary)
  const lexEntryNodes = [];   // lexicog:Entry (the article in that dictionary)
  for (const dict of DICTS) {
    const dictSenses = senseNodes.filter(s => s["csl:sourceDictionary"] === dict);
    if (!dictSenses.length) continue;
    const lexEntryId = iriFor(model.id, `lexentry-${dict}`);
    lexEntryNodes.push({
      "@id": lexEntryId,
      "@type": "lexicog:Entry",
      "lexicog:describes": {"@id": caseIri},
      "lexicog:component": dictSenses.map(s => ({"@id": s["@id"]}))
    });
    resourceNodes.push({
      "@id": iriFor(model.id, `resource-${dict}`),
      "@type": "lexicog:LexicographicResource",
      "dct:source": DICT_LABEL[dict],
      "csl:dictionary": dict,
      "lexicog:entry": {"@id": lexEntryId}
    });
  }

  for (const sense of senseNodes) delete sense._citations;

  // Source-collapse lineage (EXTENSION_PROPOSAL §4a): make the PWG → PWK → MW
  // evidence collapse an explicit, queryable relation, not only a loss report.
  // Counts use the same <ls> basis (record raw) as the source-collapse reports.
  const lsCount = dict => extractLabeledSources(model.records?.[dict]?.raw || "", {max: 9999}).length;
  const pwgN = lsCount("pwg"), pwkN = lsCount("pwk"), mwN = lsCount("mw");
  const lineageNodes = [];
  const lineageRelation = (to, toN, transition, note) => ({
    "@id": iriFor(model.id, `lineage-${to}`),
    "@type": "csl:LineageRelation",
    "csl:relatesEntry": {"@id": caseIri},
    "csl:lineageFrom": "pwg",
    "csl:lineageTo": to,
    "csl:transition": transition,
    "csl:sourceCitationCount": pwgN,
    "csl:retainedCitationCount": toN,
    "csl:droppedCitationCount": pwgN - toN,
    "csl:modelingNote": note
  });
  if (pwgN > 0 && pwkN < pwgN) lineageNodes.push(lineageRelation("pwk", pwkN, "abridgement",
    "PWK abridges PWG's named apparatus; dropped citations are upstream editorial loss, not a model gap."));
  if (pwgN > 0 && mwN < pwgN) lineageNodes.push(lineageRelation("mw", mwN, "recomposition",
    "MW recomposes the Petersburg dictionaries in English, collapsing named sources to the L. hedge or dropping them."));

  const relationNodes = [];
  if (model.phenomena?.includes("root")) {
    const whitney = model.relations?.find(rel => rel.type === "whitney-root-association")?.target;
    relationNodes.push({
      "@id": iriFor(model.id, "root-relation"),
      "@type": "csl:RootRelation",
      "csl:relatesEntry": {"@id": caseIri},
      ...(whitney ? {"csl:whitneyRoot": whitney} : {}),
      "csl:modelingNote": "Root is modeled as lexical entry plus derivational/grammatical relation."
    });
  }
  if (model.phenomena?.includes("compound")) {
    const decomp = model.relations?.find(rel => rel.type === "lexical-decomposition");
    relationNodes.push({
      "@id": iriFor(model.id, "decomposition"),
      "@type": "decomp:ComponentList",
      "csl:relatesEntry": {"@id": caseIri},
      "decomp:constituent": (decomp?.components || []).map((component, index) => ({
        "@id": iriFor(model.id, `component-${index + 1}`),
        "@type": "decomp:Component",
        "ontolex:correspondsTo": {
          "@id": `${BASE}/lexeme/${encodeURIComponent(component)}`
        },
        "rdfs:label": component
      })),
      "csl:modelingNote": decomp?.components?.length
        ? "Machine segmentation exported for review."
        : "Compound recognized, but component segmentation requires philological review."
    });
  }
  if (model.phenomena?.includes("continuation")) {
    const eCode = model.relations?.find(rel => rel.type === "adjacency-continuation-parent")?.eCode || "unknown";
    // §4 recovery status: the MW adjacency code is a pointer to recover the parent
    // from, not the parent itself — so a reconstructed parent is never asserted as
    // if printed. "conjectured" when we have the pointer, "unresolved" without it,
    // "recovered" reserved for an actually-asserted parent lemma.
    const recoveryStatus = eCode !== "unknown" ? "conjectured" : "unresolved";
    relationNodes.push({
      "@id": iriFor(model.id, "continuation-relation"),
      "@type": "csl:ContinuationRelation",
      "csl:relatesEntry": {"@id": caseIri},
      "csl:mwECode": eCode,
      "csl:recoveryStatus": recoveryStatus,
      "csl:modelingNote": "Continuation parent must be recovered from MW adjacency before semantic assertion."
    });
  }

  const form = model.forms?.[0] || {orth: model.key, type: entryType(model)};
  const entry = {
    "@id": caseIri,
    "@type": ["ontolex:LexicalEntry"],
    "ontolex:canonicalForm": {"@id": formIri},
    "ontolex:sense": senseNodes.map(sense => ({"@id": sense["@id"]})),
    "frac:attestation": attestationNodes.map(att => ({"@id": att["@id"]})),
    "csl:sourceRecord": sourceRecordIds.map(id => ({"@id": id})),
    "csl:caseId": model.id,
    "csl:key": model.key,
    "csl:entryType": entryType(model),
    "csl:phenomenon": model.phenomena || [],
    "csl:profileVersion": PROFILE_VERSION,
    "csl:reviewStatus": isReviewCase ? "validated-slice" : "full-machine-review",
    "csl:validationScope": "full-ontolex-shacl-profile"
  };

  const formNode = {
    "@id": formIri,
    "@type": "ontolex:Form",
    "ontolex:writtenRep": {"@value": form.orth || model.key, "@language": "sa-Latn-x-SLP1"},
    ...(form.grammar ? {"csl:grammar": form.grammar} : {}),
    ...(form.verbClass ? {"csl:verbClass": form.verbClass} : {})
  };

  return {
    "@context": {
      "ontolex": "http://www.w3.org/ns/lemon/ontolex#",
      "lexicog": "http://www.w3.org/ns/lemon/lexicog#",
      "decomp": "http://www.w3.org/ns/lemon/decomp#",
      "frac": "http://www.w3.org/ns/lemon/frac#",
      "prov": "http://www.w3.org/ns/prov#",
      "dct": "http://purl.org/dc/terms/",
      "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
      "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
      "skos": "http://www.w3.org/2004/02/skos/core#",
      "csl": "https://sanskrit-lexicon.github.io/csl-standards/ns#"
    },
    "@id": caseIri,
    "@graph": [entry, formNode, ...resourceNodes, ...lexEntryNodes, ...senseNodes, ...sourceRecordNodes, ...attestationNodes, ...relationNodes, ...lineageNodes]
  };
}

function turtleFor(jsonld) {
  const graph = jsonld["@graph"];
  const entry = graph.find(node => node["@type"]?.includes?.("ontolex:LexicalEntry"));
  const form = graph.find(node => node["@type"] === "ontolex:Form");
  const senses = graph.filter(node => node["@type"] === "ontolex:LexicalSense");
  const records = graph.filter(node => node["@type"] === "csl:SourceRecord");
  const attestations = graph.filter(node => node["@type"] === "frac:Attestation");
  const relations = graph.filter(node => (String(node["@type"]).startsWith("csl:") || node["@type"] === "decomp:ComponentList") && node["@type"] !== "csl:LineageRelation");
  const lineages = graph.filter(node => node["@type"] === "csl:LineageRelation");
  const resources = graph.filter(node => node["@type"] === "lexicog:LexicographicResource");
  const lexEntries = graph.filter(node => node["@type"] === "lexicog:Entry");

  const lines = [
    "@prefix ontolex: <http://www.w3.org/ns/lemon/ontolex#> .",
    "@prefix lexicog: <http://www.w3.org/ns/lemon/lexicog#> .",
    "@prefix decomp: <http://www.w3.org/ns/lemon/decomp#> .",
    "@prefix frac: <http://www.w3.org/ns/lemon/frac#> .",
    "@prefix prov: <http://www.w3.org/ns/prov#> .",
    "@prefix dct: <http://purl.org/dc/terms/> .",
    "@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .",
    "@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .",
    "@prefix skos: <http://www.w3.org/2004/02/skos/core#> .",
    "@prefix csl: <https://sanskrit-lexicon.github.io/csl-standards/ns#> .",
    ""
  ];

  lines.push(`${ttlIri(entry["@id"])} a ontolex:LexicalEntry ;`);
  lines.push(`  ontolex:canonicalForm ${ttlIri(form["@id"])} ;`);
  lines.push(`  csl:caseId ${ttlString(entry["csl:caseId"])} ;`);
  lines.push(`  csl:key ${ttlString(entry["csl:key"])} ;`);
  lines.push(`  csl:entryType ${ttlString(entry["csl:entryType"])} ;`);
  lines.push(`  csl:profileVersion ${ttlString(entry["csl:profileVersion"])} ;`);
  lines.push(`  csl:reviewStatus ${ttlString(entry["csl:reviewStatus"])} ;`);
  lines.push(`  csl:validationScope ${ttlString(entry["csl:validationScope"])} ;`);
  for (const phenomenon of entry["csl:phenomenon"]) {
    lines.push(`  csl:phenomenon ${ttlString(phenomenon)} ;`);
  }
  for (const sense of senses) lines.push(`  ontolex:sense ${ttlIri(sense["@id"])} ;`);
  for (const record of records) lines.push(`  csl:sourceRecord ${ttlIri(record["@id"])} ;`);
  for (const att of attestations) lines.push(`  frac:attestation ${ttlIri(att["@id"])} ;`);
  lines[lines.length - 1] = lines[lines.length - 1].replace(/ ;$/, " .");
  lines.push("");

  lines.push(`${ttlIri(form["@id"])} a ontolex:Form ;`);
  lines.push(`  ontolex:writtenRep ${ttlString(form["ontolex:writtenRep"]["@value"])}@sa-Latn-x-SLP1 .`);
  lines.push("");

  for (const sense of senses) {
    lines.push(`${ttlIri(sense["@id"])} a ontolex:LexicalSense ;`);
    lines.push(`  ontolex:isSenseOf ${ttlIri(entry["@id"])} ;`);
    lines.push(`  csl:sourceDictionary ${ttlString(sense["csl:sourceDictionary"])} ;`);
    const defs = [].concat(sense["skos:definition"]);
    defs.forEach((d, i) => {
      lines.push(`  skos:definition ${ttlString(d["@value"])}@${d["@language"]}${i === defs.length - 1 ? " ." : " ;"}`);
    });
    lines.push("");
  }

  for (const resource of resources) {
    lines.push(`${ttlIri(resource["@id"])} a lexicog:LexicographicResource ;`);
    lines.push(`  dct:source ${ttlString(resource["dct:source"])} ;`);
    lines.push(`  csl:dictionary ${ttlString(resource["csl:dictionary"])} ;`);
    lines.push(`  lexicog:entry ${ttlIri(resource["lexicog:entry"]["@id"])} .`);
    lines.push("");
  }

  for (const lexEntry of lexEntries) {
    lines.push(`${ttlIri(lexEntry["@id"])} a lexicog:Entry ;`);
    lines.push(`  lexicog:describes ${ttlIri(entry["@id"])} ;`);
    lines.push(`  lexicog:component ${lexEntry["lexicog:component"].map(c => ttlIri(c["@id"])).join(", ")} .`);
    lines.push("");
  }

  for (const record of records) {
    lines.push(`${ttlIri(record["@id"])} a csl:SourceRecord ;`);
    lines.push(`  dct:source ${ttlString(record["dct:source"])} ;`);
    lines.push(`  csl:dictionary ${ttlString(record["csl:dictionary"])} ;`);
    lines.push(`  csl:recordNumber ${ttlString(record["csl:recordNumber"])} ;`);
    lines.push(`  csl:lineNumber ${ttlString(record["csl:lineNumber"])} ;`);
    lines.push(`  csl:pageColumn ${ttlString(record["csl:pageColumn"])} .`);
    lines.push("");
  }

  for (const att of attestations) {
    lines.push(`${ttlIri(att["@id"])} a frac:Attestation ;`);
    lines.push(`  frac:attests ${ttlIri(att["frac:attests"]["@id"])} ;`);
    lines.push(`  frac:evidence ${ttlString(att["frac:evidence"])} ;`);
    lines.push(`  prov:wasDerivedFrom ${ttlIri(att["prov:wasDerivedFrom"]["@id"])} ;`);
    lines.push(`  csl:evidenceType ${ttlString(att["csl:evidenceType"])} ;`);
    if (att["csl:citedWork"]) {
      lines.push(`  csl:citedWork ${ttlString(att["csl:citedWork"])} ;`);
      lines.push(`  csl:citedRange ${ttlString(att["csl:citedRange"])} ;`);
    }
    lines.push(`  csl:evidenceClass ${ttlString(att["csl:evidenceClass"])} .`);
    lines.push("");
  }

  for (const relation of relations) {
    if (relation["@type"] === "csl:SourceRecord") continue;
    lines.push(`${ttlIri(relation["@id"])} a ${relation["@type"]} ;`);
    lines.push(`  csl:relatesEntry ${ttlIri(entry["@id"])} ;`);
    if (relation["csl:recoveryStatus"]) lines.push(`  csl:recoveryStatus ${ttlString(relation["csl:recoveryStatus"])} ;`);
    lines.push(`  csl:modelingNote ${ttlString(relation["csl:modelingNote"] || "relation exported for review")} .`);
    lines.push("");
  }

  for (const lineage of lineages) {
    lines.push(`${ttlIri(lineage["@id"])} a csl:LineageRelation ;`);
    lines.push(`  csl:relatesEntry ${ttlIri(entry["@id"])} ;`);
    lines.push(`  csl:lineageFrom ${ttlString(lineage["csl:lineageFrom"])} ;`);
    lines.push(`  csl:lineageTo ${ttlString(lineage["csl:lineageTo"])} ;`);
    lines.push(`  csl:transition ${ttlString(lineage["csl:transition"])} ;`);
    lines.push(`  csl:sourceCitationCount ${lineage["csl:sourceCitationCount"]} ;`);
    lines.push(`  csl:retainedCitationCount ${lineage["csl:retainedCitationCount"]} ;`);
    lines.push(`  csl:droppedCitationCount ${lineage["csl:droppedCitationCount"]} ;`);
    lines.push(`  csl:modelingNote ${ttlString(lineage["csl:modelingNote"])} .`);
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

async function main() {
  const modelPath = path.resolve(process.cwd(), "data", "pilot", "neutral-model.json");
  const hardPath = path.resolve(process.cwd(), "data", "pilot", "hard-cases.json");
  const reviewPath = path.resolve(process.cwd(), "data", "pilot", "review-cases.json");
  const outputDir = path.resolve(process.cwd(), "data", "pilot", "ontolex");
  const turtleDir = path.resolve(process.cwd(), "data", "pilot", "rdf");

  await fs.rm(outputDir, {recursive: true, force: true});
  await fs.rm(turtleDir, {recursive: true, force: true});
  await fs.mkdir(outputDir, {recursive: true});
  await fs.mkdir(turtleDir, {recursive: true});

  const models = JSON.parse(await fs.readFile(modelPath, "utf8"));
  const hardCases = JSON.parse(await fs.readFile(hardPath, "utf8"));
  const review = JSON.parse(await fs.readFile(reviewPath, "utf8"));
  const reviewIds = new Set(review.items.map(item => item.id));
  const indexes = await loadSourceIndexes(hardCases);

  for (const model of models) {
    const rawByDict = Object.fromEntries(DICTS.map(dict => [dict, fullRaw(model, dict, indexes)]));
    const jsonld = jsonldFor(model, rawByDict, reviewIds.has(model.id));
    const stem = safeCaseId(model.id);
    await fs.writeFile(path.join(outputDir, `${stem}.json`), `${JSON.stringify(jsonld, null, 2)}\n`, "utf8");
    await fs.writeFile(path.join(turtleDir, `${stem}.ttl`), turtleFor(jsonld), "utf8");
  }

  console.log(`Exported ${models.length} OntoLex/FrAC JSON-LD files to ${outputDir}; ${models.length} Turtle RDF files to ${turtleDir}.`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
