// Extract senses from a Frish Sanskrit Reader (FRI) raw record.
//
// FRI is a trilingual reader: each sense is glossed in Czech, Russian, and
// English, wrapped in <lang n="czech|russian|english">…</lang> and grouped by a
// <div n="N"> sense marker (the bare 1/2/3 between the div and the lang tag is the
// language ordinal, not a sense number). Unlike MW/PWG/PWK, FRI carries no <ls>
// citation apparatus — so it contributes senses but no attestations.
//
// Each sense keeps English as its primary definition (consistent with the neutral
// model's one-definition-language-per-dictionary convention) and preserves the
// Czech/Russian glosses under `translations` for downstream multilingual use.

const LANG = { czech: "cs", russian: "ru", english: "en" };
const PRIMARY_ORDER = ["en", "ru", "cs"];

function clean(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractFriSenses(raw) {
  if (!raw) return [];
  // Walk <div> and <lang> elements in order; the most recent <div n="N"> assigns a
  // sense number to the <lang> glosses that follow it.
  const groups = new Map();
  let sense = "1";
  const token = /<div\b[^>]*\sn="([^"]+)"[^>]*\/?>|<lang\b[^>]*\sn="([^"]+)"[^>]*>([\s\S]*?)<\/lang>/g;
  for (const m of String(raw).matchAll(token)) {
    if (m[1] !== undefined) { sense = m[1]; continue; }
    const lang = LANG[(m[2] || "").toLowerCase()];
    if (!lang) continue;
    const text = clean(m[3]);
    if (!text) continue;
    if (!groups.has(sense)) groups.set(sense, {});
    groups.get(sense)[lang] = text;
  }

  const senses = [];
  for (const glosses of groups.values()) {
    const lang = PRIMARY_ORDER.find(l => glosses[l]);
    if (!lang) continue;
    const sense = { def: glosses[lang], lang, evidence: "derived" };
    const translations = {};
    for (const l of PRIMARY_ORDER) if (glosses[l] && l !== lang) translations[l] = glosses[l];
    if (Object.keys(translations).length) sense.translations = translations;
    senses.push(sense);
  }
  return senses;
}
