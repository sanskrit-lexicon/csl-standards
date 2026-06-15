import fs from "node:fs/promises";
import path from "node:path";

const DICTS = ["mw", "pwg", "pwk"];
const DICT_LABEL = {
  mw: "Monier-Williams 1899",
  pwg: "Boehtlingk-Roth PWG",
  pwk: "Boehtlingk PWK"
};

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
  const sourceRecordIds = DICTS.map(dict => iriFor(model.id, `record-${dict}`));
  const attestationNodes = [];
  const sourceRecordNodes = [];
  // Multi-resource senses: MW (English, model.senses) plus the German Petersburg
  // dictionaries (records.{pwg,pwk}.senses). Each sense keeps its source
  // dictionary and (internally) its sense-linked citations for the attestations.
  const langByDict = {mw: "en", pwg: "de", pwk: "de"};
  const senseNodes = [];
  for (const dict of DICTS) {
    const senses = dict === "mw" ? (model.senses || []) : (model.records?.[dict]?.senses || []);
    senses.forEach((sense, index) => {
      senseNodes.push({
        "@id": iriFor(model.id, `sense-${dict}-${index + 1}`),
        "@type": "ontolex:LexicalSense",
        "ontolex:isSenseOf": {"@id": caseIri},
        "skos:definition": {"@value": sense.def, "@language": langByDict[dict]},
        "csl:sourceDictionary": dict,
        ...(sense.kind === "cross-reference" ? {"csl:senseKind": "cross-reference"} : {}),
        _citations: sense.citations || []
      });
    });
  }

  for (const dict of DICTS) {
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
  for (const sense of senseNodes) {
    for (const c of sense._citations) {
      senseLinked.add(`${c.dictionary}:${c.source}`);
      attestationNodes.push({
        "@id": iriFor(model.id, `attestation-${++attSeq}`),
        "@type": "frac:Attestation",
        "frac:attests": {"@id": sense["@id"]},
        "frac:evidence": c.source,
        "prov:wasDerivedFrom": {"@id": recordIri(c.dictionary)},
        "csl:sourceDictionary": c.dictionary,
        "csl:evidenceType": c.type,
        ...(c.inheritedFrom ? {"csl:inheritedSiglum": c.inheritedFrom} : {})
      });
    }
  }
  for (const c of model.citations || []) {
    if (senseLinked.has(`${c.dictionary}:${c.source}`)) continue;
    attestationNodes.push({
      "@id": iriFor(model.id, `attestation-${++attSeq}`),
      "@type": "frac:Attestation",
      "frac:attests": {"@id": caseIri},
      "frac:evidence": c.source,
      "prov:wasDerivedFrom": {"@id": recordIri(c.dictionary)},
      "csl:sourceDictionary": c.dictionary,
      "csl:evidenceType": c.type,
      ...(c.inheritedFrom ? {"csl:inheritedSiglum": c.inheritedFrom} : {})
    });
  }

  // One lexicog:Entry per source dictionary that has senses — the multi-resource
  // (OntoLex-Lexicog) view: each dictionary's article for this lemma.
  const resourceNodes = [];
  for (const dict of DICTS) {
    const dictSenses = senseNodes.filter(s => s["csl:sourceDictionary"] === dict);
    if (!dictSenses.length) continue;
    resourceNodes.push({
      "@id": iriFor(model.id, `resource-${dict}`),
      "@type": "lexicog:Entry",
      "dct:source": DICT_LABEL[dict],
      "csl:dictionary": dict,
      "lexicog:describes": {"@id": caseIri},
      "lexicog:component": dictSenses.map(s => ({"@id": s["@id"]}))
    });
  }

  for (const sense of senseNodes) delete sense._citations;

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
    relationNodes.push({
      "@id": iriFor(model.id, "continuation-relation"),
      "@type": "csl:ContinuationRelation",
      "csl:relatesEntry": {"@id": caseIri},
      "csl:mwECode": eCode,
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
    "lexicog:entry": resourceNodes.map(resource => ({"@id": resource["@id"]})),
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
    "@graph": [entry, formNode, ...resourceNodes, ...senseNodes, ...sourceRecordNodes, ...attestationNodes, ...relationNodes]
  };
}

function turtleFor(jsonld) {
  const graph = jsonld["@graph"];
  const entry = graph.find(node => node["@type"]?.includes?.("ontolex:LexicalEntry"));
  const form = graph.find(node => node["@type"] === "ontolex:Form");
  const senses = graph.filter(node => node["@type"] === "ontolex:LexicalSense");
  const records = graph.filter(node => node["@type"] === "csl:SourceRecord");
  const attestations = graph.filter(node => node["@type"] === "frac:Attestation");
  const relations = graph.filter(node => String(node["@type"]).startsWith("csl:") || node["@type"] === "decomp:ComponentList");
  const resources = graph.filter(node => node["@type"] === "lexicog:Entry");

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
  for (const resource of resources) lines.push(`  lexicog:entry ${ttlIri(resource["@id"])} ;`);
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
    lines.push(`  skos:definition ${ttlString(sense["skos:definition"]["@value"])}@${sense["skos:definition"]["@language"]} .`);
    lines.push("");
  }

  for (const resource of resources) {
    lines.push(`${ttlIri(resource["@id"])} a lexicog:Entry ;`);
    lines.push(`  dct:source ${ttlString(resource["dct:source"])} ;`);
    lines.push(`  csl:dictionary ${ttlString(resource["csl:dictionary"])} ;`);
    lines.push(`  lexicog:describes ${ttlIri(entry["@id"])} ;`);
    lines.push(`  lexicog:component ${resource["lexicog:component"].map(c => ttlIri(c["@id"])).join(", ")} .`);
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
    lines.push(`  csl:evidenceType ${ttlString(att["csl:evidenceType"])} .`);
    lines.push("");
  }

  for (const relation of relations) {
    if (relation["@type"] === "csl:SourceRecord") continue;
    lines.push(`${ttlIri(relation["@id"])} a ${relation["@type"]} ;`);
    lines.push(`  csl:relatesEntry ${ttlIri(entry["@id"])} ;`);
    lines.push(`  csl:modelingNote ${ttlString(relation["csl:modelingNote"] || "relation exported for review")} .`);
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
