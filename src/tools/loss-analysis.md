---
title: Loss Analysis
toc: false
---

```js
const analysis = FileAttachment("../data/pilot/loss-analysis.json").json();
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
const pct = (n, d) => d ? `${Math.round((n / d) * 100)}%` : "0%";
```

```js
const lr = analysis.lossReports;
const cross = analysis.crossDictionary;
const gaps = analysis.coverageGaps;
const total = lr.total;
const statuses = ["clean", "partial", "lossy"];
const targets = Object.keys(lr.targetByStatus);
const sortedEntries = obj => Object.entries(obj).sort((a, b) => b[1] - a[1]);
```

# ${t("lossAnalysis.title")}

${t("lossAnalysis.description")}

```html
<style>
.summary-band { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin: 18px 0; padding: 14px 0; border-top: 1px solid #d8dee4; border-bottom: 1px solid #d8dee4; }
.metric-value { font-size: 1.45rem; font-weight: 700; line-height: 1.2; }
.metric-label { color: #5f6b7a; font-size: 0.86rem; }
table.la { border-collapse: collapse; margin: 10px 0 6px; width: 100%; max-width: 640px; font-size: 0.92rem; }
table.la th, table.la td { border-bottom: 1px solid #eaeef2; padding: 6px 10px; text-align: left; }
table.la td.num, table.la th.num { text-align: right; font-variant-numeric: tabular-nums; }
table.la tr.tei td:first-child { color: #1f4f78; font-weight: 600; }
.status-lossy { color: #b42318; font-weight: 600; }
.status-partial { color: #a15c00; font-weight: 600; }
.status-clean { color: #1a7f37; font-weight: 600; }
.note { color: #3a3f45; background: #f6f8fa; border-left: 4px solid #0969da; padding: 10px 14px; margin: 12px 0; max-width: 720px; }
.bar { display: inline-block; height: 10px; background: #8db4d8; border-radius: 2px; vertical-align: middle; margin-left: 8px; }
.gaps { max-width: 720px; }
.gaps code { background: #f0f2f4; padding: 1px 5px; border-radius: 3px; }
</style>
```

```js
const lossy = lr.byStatus.lossy || 0;
const namedCites = (cross.citations.byType && cross.citations.byType["named-source-citation"]) || 0;
display(html`
<div class="summary-band">
  <div><div class="metric-value">${total}</div><div class="metric-label">${t("lossAnalysis.metric-reports")}</div></div>
  <div><div class="metric-value">${pct(lossy, total)}</div><div class="metric-label">${t("lossAnalysis.metric-lossy")}</div></div>
  <div><div class="metric-value">${lr.cases}</div><div class="metric-label">${t("lossAnalysis.metric-cases")}</div></div>
  <div><div class="metric-value">${namedCites}</div><div class="metric-label">${t("lossAnalysis.metric-citations")}</div></div>
</div>`);
```

## ${t("lossAnalysis.target-status")}

```js
display(html`
<table class="la">
  <thead><tr>
    <th>${t("lossAnalysis.col-target")}</th>
    ${statuses.map(s => html`<th class="num">${t("status." + s)}</th>`)}
  </tr></thead>
  <tbody>
    ${targets.map(tg => html`<tr class="${tg === "tei" ? "tei" : ""}">
      <td>${tg.toUpperCase()}</td>
      ${statuses.map(s => html`<td class="num status-${s}">${lr.targetByStatus[tg][s] || 0}</td>`)}
    </tr>`)}
  </tbody>
</table>`);
```

<div class="note">${t("lossAnalysis.asymmetry-note")}</div>

## ${t("lossAnalysis.by-cause")}

```js
const maxCause = Math.max(...Object.values(lr.byFailureClassification));
display(html`
<table class="la">
  <thead><tr><th>${t("lossAnalysis.col-cause")}</th><th class="num">${t("lossAnalysis.col-count")}</th><th class="num">${t("lossAnalysis.col-share")}</th><th></th></tr></thead>
  <tbody>
    ${sortedEntries(lr.byFailureClassification).map(([k, v]) => html`<tr>
      <td>${t("failure." + k)}</td><td class="num">${v}</td><td class="num">${pct(v, total)}</td>
      <td><span class="bar" style="width:${(v / maxCause) * 120}px"></span></td>
    </tr>`)}
  </tbody>
</table>`);
```

## ${t("lossAnalysis.by-phenomenon")}

```js
const maxPhen = Math.max(...Object.values(lr.byPhenomenon));
display(html`
<table class="la">
  <thead><tr><th>${t("lossAnalysis.col-phenomenon")}</th><th class="num">${t("lossAnalysis.col-count")}</th><th class="num">${t("lossAnalysis.col-share")}</th><th></th></tr></thead>
  <tbody>
    ${sortedEntries(lr.byPhenomenon).map(([k, v]) => html`<tr>
      <td>${t("phenomenon." + k)}</td><td class="num">${v}</td><td class="num">${pct(v, total)}</td>
      <td><span class="bar" style="width:${(v / maxPhen) * 120}px"></span></td>
    </tr>`)}
  </tbody>
</table>`);
```

## ${t("lossAnalysis.cross-dictionary")}

```js
display(html`
<p><strong>${t("lossAnalysis.records-present")}:</strong>
  MW ${cross.recordsPresent.mw} · PWG ${cross.recordsPresent.pwg} · PWK ${cross.recordsPresent.pwk} / ${cross.cases}</p>
<table class="la">
  <thead><tr><th>${t("lossAnalysis.citations-by-dict")}</th><th class="num">${t("lossAnalysis.col-count")}</th></tr></thead>
  <tbody>
    ${sortedEntries(cross.citations.byDictionary || {}).map(([k, v]) => html`<tr><td>${k.toUpperCase()}</td><td class="num">${v}</td></tr>`)}
  </tbody>
</table>`);
```

## ${t("lossAnalysis.coverage-gaps")}

```js
display(html`
<ul class="gaps">
  <li>source dictionaries instrumented: ${gaps.sourceDictionariesInstrumented.map(d => html`<code>${d}</code> `)}</li>
  <li>schema phenomena not emitted: ${gaps.schemaPhenomenaNotEmitted.map(d => html`<code>${d}</code> `)}</li>
  <li>statuses not emitted: ${gaps.schemaStatusesNotEmitted.map(d => html`<code>${d}</code> `)}</li>
  <li>roadmap causes not emitted: ${gaps.roadmapCausesNotEmitted.map(d => html`<code>${d}</code> `)}</li>
  <li>named-source citations materialized: <strong>${gaps.namedSourceCitationsMaterialized}</strong></li>
</ul>
<p style="color:#5f6b7a; font-size:0.88rem;">Generated by <code>${analysis.generatedBy}</code> · <a href="https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/LOSS_ANALYSIS.md" target="_blank">LOSS_ANALYSIS.md</a></p>`);
```
