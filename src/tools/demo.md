---
title: Worked cases
toc: false
---

```js
const model = FileAttachment("../data/pilot/neutral-model.json").json();
const lossReports = FileAttachment("../data/pilot/loss-reports.json").json();
const localesEn = FileAttachment("../locales-en.json").json();
const localesRu = FileAttachment("../locales-ru.json").json();
```

```js
const lang = view(Inputs.radio(["en", "ru"], {
  label: "Language",
  value: "en",
  format: d => d === "ru" ? "Russian" : "English"
}));
```

```js
const currentLanguage = lang === "ru" ? "ru" : "en";
const t = (key) => {
  const locale = currentLanguage === "ru" ? localesRu : localesEn;
  let result = locale;
  for (const part of key.split(".")) {
    if (result && result[part] !== undefined) result = result[part];
    else return key;
  }
  return result;
};
// The three worked cases, in the loss-axis order of docs/DEMO.md.
const CASES = [
  { id: "mw-pwg-pwk:ac", slug: "ac" },
  { id: "mw-pwg-pwk:annavid", slug: "annavid" },
  { id: "mw-pwg-pwk:Ayana", slug: "Ayana" }
];
const DICT_LABEL = {
  mw: "Monier-Williams 1899", pwg: "Böhtlingk-Roth PWG", pwk: "Böhtlingk PWK",
  ap90: "Apte 1890", gra: "Grassmann (RV)", fri: "Frish Reader"
};
const DICT_ORDER = ["mw", "pwg", "pwk", "ap90", "gra", "fri"];
const TARGET_ORDER = { tei: 0, ontolex: 1, neutral: 2 };
const truncate = (s, n = 360) => { s = String(s || ""); return s.length > n ? s.slice(0, n).trimEnd() + " …" : s; };
```

```js
const selectedCase = view(Inputs.radio(CASES, {
  label: t("demo.select-case"),
  value: CASES[0],
  format: c => `${t("demo.case-" + c.slug)} · ${t("demo.axis-" + c.slug)}`
}));
```

```js
const entry = model.find(d => d.id === selectedCase.id);
const reports = lossReports
  .filter(r => r.caseId === selectedCase.id)
  .sort((a, b) => (TARGET_ORDER[a.target] ?? 9) - (TARGET_ORDER[b.target] ?? 9));
const presentDicts = DICT_ORDER.filter(d => entry.records[d] && entry.records[d].raw);
const citationsByDict = {};
for (const c of entry.citations || []) citationsByDict[c.dictionary] = (citationsByDict[c.dictionary] || 0) + 1;
const sensesByDict = DICT_ORDER
  .filter(d => entry.records[d] && Array.isArray(entry.records[d].senses) && entry.records[d].senses.length)
  .map(d => `${d.toUpperCase()} ${entry.records[d].senses.length}`);
```

```html
<style>
.summary-band { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; margin: 18px 0; padding: 14px 0; border-top: 1px solid #d8dee4; border-bottom: 1px solid #d8dee4; }
.metric-value { font-size: 1.45rem; font-weight: 700; line-height: 1.2; }
.metric-label { color: #5f6b7a; font-size: 0.86rem; }
.blurb { color: #3a3f45; background: #f6f8fa; border-left: 4px solid #0969da; padding: 10px 14px; margin: 12px 0; max-width: 760px; }
.stage-note { color: #5f6b7a; font-size: 0.9rem; max-width: 760px; margin: -2px 0 10px; }
.chips span { display: inline-block; background: #eef1f4; color: #324; border-radius: 12px; padding: 2px 10px; margin: 0 6px 6px 0; font-size: 0.84rem; }
.rawrec { margin: 8px 0; }
.rawrec .lbl { font-size: 0.82rem; color: #5f6b7a; margin-bottom: 2px; }
.rawrec pre { background: #f6f8fa; border: 1px solid #eaeef2; border-radius: 4px; padding: 8px 10px; white-space: pre-wrap; word-break: break-word; font-size: 0.82rem; margin: 0; }
table.demo { border-collapse: collapse; margin: 10px 0 6px; width: 100%; max-width: 880px; font-size: 0.9rem; }
table.demo th, table.demo td { border-bottom: 1px solid #eaeef2; padding: 6px 10px; text-align: left; vertical-align: top; }
table.demo tr.tei td:first-child { color: #1f4f78; font-weight: 600; }
table.demo tr.ontolex td:first-child { color: #6b3fa0; font-weight: 600; }
table.demo tr.neutral td:first-child { color: #7a5c00; font-weight: 600; }
table.demo code { background: #f0f2f4; padding: 1px 5px; border-radius: 3px; font-size: 0.86rem; }
.status-lossy { color: #b42318; font-weight: 600; }
.status-partial { color: #a15c00; font-weight: 600; }
.status-clean { color: #1a7f37; font-weight: 600; }
.kv { max-width: 760px; }
.kv b { display: inline-block; min-width: 120px; color: #444; }
.note { color: #3a3f45; background: #fff8e6; border-left: 4px solid #d4a72c; padding: 10px 14px; margin: 12px 0; max-width: 760px; }
.foot { color:#5f6b7a; font-size:0.86rem; margin-top: 18px; }
</style>
```

# ${t("demo.title")}

${t("demo.description")}

```js
display(html`<div class="blurb">${t("demo.blurb-" + selectedCase.slug)}</div>`);
```

```js
const lossy = reports.filter(r => r.status === "lossy").length;
const namedCites = (entry.citations || []).filter(c => c.type === "named-source-citation").length;
display(html`
<div class="summary-band">
  <div><div class="metric-value">${presentDicts.length}</div><div class="metric-label">${t("demo.present-in")}</div></div>
  <div><div class="metric-value">${reports.length}</div><div class="metric-label">${t("demo.reports-for-case")}</div></div>
  <div><div class="metric-value">${lossy}</div><div class="metric-label">${t("status.lossy")}</div></div>
  <div><div class="metric-value">${namedCites}</div><div class="metric-label">${t("demo.citations")}</div></div>
</div>`);
```

## ${t("demo.stage0")}

<div class="stage-note">${t("demo.stage0-note")}</div>

```js
display(html`<div>${presentDicts.map(d => html`
  <div class="rawrec">
    <div class="lbl">${d.toUpperCase()} · ${DICT_LABEL[d]} · L=${entry.records[d].L ?? "?"}</div>
    <pre>${truncate(entry.records[d].raw)}</pre>
  </div>`)}</div>`);
```

## ${t("demo.stage1")}

<div class="stage-note">${t("demo.stage1-note")}</div>

```js
const senseDefs = (entry.senses || []).map(s => s.def).filter(Boolean);
display(html`
<div class="kv">
  <p><b>id</b> <code>${entry.id}</code></p>
  <p><b>${t("demo.phenomena")}</b></p>
  <div class="chips">${(entry.phenomena || []).map(p => html`<span>${p}</span>`)}</div>
  <p><b>${t("demo.forms")}</b> ${(entry.forms || []).map(f =>
    `${f.orth} (${[f.type, f.grammar, f.verbClass].filter(Boolean).join(", ")})`).join(" · ")}</p>
  <p><b>${t("demo.senses")}</b> ${senseDefs.length
    ? senseDefs.slice(0, 8).join(" · ") + (senseDefs.length > 8 ? ` … (+${senseDefs.length - 8})` : "")
    : "—"}</p>
  <p><b>${t("demo.senses-by-dict")}</b> ${sensesByDict.length ? sensesByDict.join(" · ") : "—"}</p>
  <p><b>${t("demo.citations")}</b> ${DICT_ORDER.filter(d => citationsByDict[d]).map(d =>
    `${d.toUpperCase()} ${citationsByDict[d]}`).join(" · ") || "—"}</p>
  <p><b>${t("demo.relations")}</b> ${(entry.relations || []).map(r =>
    `${r.type}${r.target ? " → " + r.target : r.eCode ? " (e=" + r.eCode + ")" : r.components ? " [" + r.components.join(" + ") + "]" : ""}`).join(" · ") || "—"}</p>
</div>`);
```

## ${t("demo.stage4")}

<div class="stage-note">${t("demo.stage4-note")}</div>

```js
display(html`
<table class="demo">
  <thead><tr>
    <th>${t("demo.col-target")}</th>
    <th>${t("demo.col-phenomenon")}</th>
    <th>${t("demo.col-status")}</th>
    <th>${t("demo.col-cause")}</th>
    <th>${t("demo.col-remedy")}</th>
  </tr></thead>
  <tbody>
    ${reports.map(r => html`<tr class="${r.target}">
      <td>${r.target.toUpperCase()}</td>
      <td>${t("phenomenon." + r.phenomenon)}</td>
      <td class="status-${r.status}">${t("status." + r.status)}</td>
      <td>${t("failure." + r.failureClassification)}</td>
      <td>${r.mappedAs ? html`<code>${r.mappedAs}</code>` : t("demo.no-remedy")}</td>
    </tr>`)}
  </tbody>
</table>`);
```

<div class="note">${t("demo.asymmetry")}</div>

```js
const ghCase = selectedCase.id.replace("mw-pwg-pwk:", "mw-pwg-pwk-");
display(html`<p class="foot">${t("demo.reproduce")}
  · <a href="https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/DEMO.md" target="_blank">DEMO.md</a>
  · <a href="https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/pilot/tei/${ghCase}.xml" target="_blank">TEI</a>
  · <a href="https://github.com/sanskrit-lexicon/csl-standards/blob/main/data/pilot/ontolex/${ghCase}.json" target="_blank">OntoLex</a></p>`);
```
