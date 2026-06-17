import fs from "fs/promises";
import path from "path";
import { extractLabeledSources } from "./lib/citations.mjs";
import { extractMwSenses } from "./lib/mw-senses.mjs";
import { extractPwSenses } from "./lib/pw-senses.mjs";
import { extractFriSenses } from "./lib/fri-senses.mjs";
import { ALL_DICTS, OPTIONAL_DICTS } from "./lib/dictionaries.mjs";

function parseGenderOrGrammar(raw) {
  if (!raw) return null;
  // Match standard grammatical tags
  const m = raw.match(/<ab>(cl\.|m\.|f\.|n\.|ind\.|adj\.)<\/ab>/);
  if (m) {
    const code = m[1];
    if (code === "m.") return "masculine";
    if (code === "f.") return "feminine";
    if (code === "n.") return "neuter";
    if (code === "ind.") return "indeclinable";
    if (code === "adj.") return "adjective";
    return code;
  }
  return null;
}

const MAX_CITATIONS_PER_DICT = 12;

function stripMarkup(value) {
  return String(value || "")
    .replace(/\{[#%]([^#%]*)[#%]\}/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Canonical citation layer: every <ls> labeled source across MW/PWG/PWK, tagged
// with its dictionary so downstream models (TEI Lex-0, analysis) read the named
// evidence from the neutral model rather than re-deriving it. Shares the <ls>
// parser with the exporters (scripts/lib/citations.mjs); deduped and capped per
// dictionary for a compact canonical layer.
// mw/pwg/pwk are always present (the tri-dict backbone); optional dictionaries are
// attached to cases that share their headword (see scripts/lib/dictionaries.mjs).
const CITATION_DICTS = ALL_DICTS;

function extractCitations(item) {
  const citations = [];
  for (const dict of CITATION_DICTS) {
    if (!item.records[dict]?.raw) continue;
    const seen = new Set();
    for (const c of extractLabeledSources(item.records[dict]?.raw, { strip: stripMarkup, max: Infinity })) {
      if (seen.has(c.source)) continue;
      seen.add(c.source);
      citations.push({
        source: c.source,
        type: c.type,
        dictionary: dict,
        ...(c.inheritedFrom ? { inheritedFrom: c.inheritedFrom } : {})
      });
      if (seen.size >= MAX_CITATIONS_PER_DICT) break;
    }
  }
  return citations;
}

function extractFormsAndRelations(item, id) {
  const forms = [];
  const relations = [];

  // Extract Lemma Form from MW / PWG / PWK
  const baseForm = {
    orth: item.key,
    type: "lemma",
    grammar: parseGenderOrGrammar(item.records.mw?.raw || item.records.pwg?.raw)
  };
  forms.push(baseForm);

  // Named-source + lexicographer-hedge citations across all three dictionaries.
  const mwRaw = item.records.mw?.raw || "";
  const citations = extractCitations(item);

  // Handle Root Phenomena
  if (item.phenomena.includes("root")) {
    // Look up verb class info
    const infoVerb = mwRaw.match(/<info verb="genuineroot" cp="([^"]+)"\/>/) || mwRaw.match(/<ab>cl\.<\/ab>\s*(\d+)/);
    if (infoVerb) {
      baseForm.type = "verbal-root";
      baseForm.verbClass = infoVerb[1];
    }
    
    // Check Whitney root association
    const whitneyMatch = mwRaw.match(/<info whitneyroots="([^"]+)"\/>/);
    if (whitneyMatch) {
      relations.push({
        type: "whitney-root-association",
        target: whitneyMatch[1]
      });
    }
  }

  // Handle Compound Phenomena
  if (item.phenomena.includes("compound")) {
    baseForm.type = "compound";
    // Check if there is an explicit segmentation or separator in k2
    const k2 = item.records.mw?.k2 || "";
    if (k2.includes("—") || k2.includes("-")) {
      const parts = k2.split(/[—–-]/).map(p => p.trim()).filter(Boolean);
      if (parts.length > 1) {
        relations.push({
          type: "lexical-decomposition",
          components: parts
        });
      }
    }
  }

  // Handle Continuation Phenomena
  if (item.phenomena.includes("continuation")) {
    baseForm.type = "continuation";
    // Find parent from raw metadata (usually is a sibling continuation)
    const eAttr = item.records.mw?.e || "";
    relations.push({
      type: "adjacency-continuation-parent",
      eCode: eAttr
    });
  }

  return { forms, relations, citations };
}

async function main() {
  const inputPath = path.resolve(process.cwd(), "data/pilot/hard-cases.json");
  const outputPaths = [
    path.resolve(process.cwd(), "data/pilot/neutral-model.json"),
    path.resolve(process.cwd(), "src/data/pilot/neutral-model.json")
  ];

  const data = JSON.parse(await fs.readFile(inputPath, "utf-8"));
  
  // Count occurrences of each key to handle duplicates
  const keyCounts = {};
  for (const item of data.items) {
    keyCounts[item.key] = (keyCounts[item.key] || 0) + 1;
  }

  const models = data.items.map(item => {
    const id = item.id || (
      keyCounts[item.key] > 1
        ? `mw-pwg-pwk:${item.key}-mw${item.records.mw.L}`
        : `mw-pwg-pwk:${item.key}`
    );

    const { forms, relations, citations } = extractFormsAndRelations(item, id);

    return {
      id,
      key: item.key,
      phenomena: item.phenomena || [],
      records: {
        mw: {
          L: item.records.mw?.L || null,
          line: item.records.mw?.line || null,
          pc: item.records.mw?.pc || null,
          raw: item.records.mw?.raw || null
        },
        pwg: {
          L: item.records.pwg?.L || null,
          line: item.records.pwg?.line || null,
          pc: item.records.pwg?.pc || null,
          raw: item.records.pwg?.raw || null,
          senses: extractPwSenses(item.records.pwg?.raw, "pwg")
        },
        pwk: {
          L: item.records.pwk?.L || null,
          line: item.records.pwk?.line || null,
          pc: item.records.pwk?.pc || null,
          raw: item.records.pwk?.raw || null,
          senses: extractPwSenses(item.records.pwk?.raw, "pwk")
        },
        // Optional dictionaries (e.g. Apte 1890, Grassmann): carried when the
        // sampler attached a counterpart. Each contributes its raw record and its
        // named citations (above); FRI also has a format-specific sense extractor
        // (trilingual glosses), while ap90/gra carry records only for now.
        ...Object.fromEntries(
          OPTIONAL_DICTS
            .filter(code => item.records[code])
            .map(code => [code, {
              L: item.records[code].L || null,
              line: item.records[code].line || null,
              pc: item.records[code].pc || null,
              raw: item.records[code].raw || null,
              ...(code === "fri" ? { senses: extractFriSenses(item.records[code].raw) } : {})
            }])
        )
      },
      forms,
      senses: extractMwSenses(item.records.mw?.raw, item.phenomena || []),
      citations,
      relations,
      loss: []
    };
  });

  for (const outputPath of outputPaths) {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, `${JSON.stringify(models, null, 2)}\n`, "utf-8");
  }
  console.log(`Generated neutral model for ${models.length} items at ${outputPaths.join(", ")}`);
}

main().catch(console.error);
