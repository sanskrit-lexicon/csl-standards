# Salt API Integration Roadmap — sanskrit-lexicon.uni-koeln.de

Date: 2026-06-11
Status: **C-SALT MW contract verified live on 2026-06-11** (REST OpenAPI + GraphQL
introspection against `api.c-salt.uni-koeln.de/dicts/mw`). All field names, enum values,
and query signatures below are facts from the running service, not proposals.

> Scope note: this roadmap covers two repositories. The **normative contract and its
> documentation** are a `csl-standards` deliverable (the "C-SALT API Profile"). The
> **server implementation** is a `csl-apidev` deliverable, carried out by Jim Funderburk
> on the Cologne host. This document is written so the implementer can build the server
> straight from it. Endpoint sections follow the house style of
> `COLOGNE/api/getword.md`, `servepdf.md`, and `listhier.md`. Provisional defaults are
> marked **[provisional]** and may be changed without breaking the contract.

---

## 0. Purpose and audience

Goal stated by the project lead: **`sanskrit-lexicon.uni-koeln.de` should expose a full
"Salt API"** — an API that speaks the same contract as the C-SALT APIs at
`api.c-salt.uni-koeln.de`, so a client written against C-SALT (e.g. VedaWeb) can query the
Cologne original unchanged, and so the CCeH derivative (`cceh/c-salt_sanskrit_data`, 7
dictionaries) and the original (CDSL, ~40 dictionaries) converge on one interface.

This is **not** a request to run CCeH's software. It is a request to **serve the same
contract natively** from the existing PHP stack, over CDSL data, for many more
dictionaries than the derivative covers. Every design choice carries a short **Why**; the
implementer must understand the reason, not only the rule.

---

## 1. Background: the two APIs as they stand today

### 1.1. The C-SALT / Kosh API — verified contract

Built on **Kosh** (`cceh/kosh`): Python + Elasticsearch, served by Docker. Kosh reads XML
(TEI-P5 here), indexes selected fields via XPath into Elasticsearch, and serves **REST**
(Swagger/OpenAPI 2.0) and **GraphQL** over that index. Both return JSON. Per dictionary:

- REST:    `https://api.c-salt.uni-koeln.de/dicts/{id}/restful`
- GraphQL: `https://api.c-salt.uni-koeln.de/dicts/{id}/graphql`

**REST — verified for `mw`:**
```
GET /dicts/mw/restful/entries?field={field}&query={q}&query_type={query_type}&size={n}
GET /dicts/mw/restful/ids?ids={id}&ids={id}…           # batch fetch by id (multi-value)
```
- `field` (required), enum: `id`, `headword_slp1`, `sense`, `re_headwords_slp1`,
  `created`, `xml`.
- `query` (required): the search string.
- `query_type` (required), enum: `term`, `fuzzy`, `match`, `match_phrase`, `prefix`,
  `wildcard`, `regexp`.  *(Seven modes — note `match` and `prefix` in addition to the five
  the eLex papers list.)*
- `size` (optional): integer.
- Response envelope: `{"data": {"entries": [Entry, …]}}` / `{"data": {"ids": [Entry, …]}}`.

**GraphQL — verified for `mw`:**
```graphql
{ entries(field: headword_slp1, query: "agni", queryType: term, size: 1) {
    id headwordSlp1 sense reHeadwordsSlp1 created xml } }

{ ids(ids: ["<entry-id>", …]) { id headwordSlp1 xml } }
```
- Root fields: `entries(field, query, queryType, size)` and `ids(ids)`, each returning
  `[<id>]` where the **object type is named after the dictionary id** (the MW entry type
  is literally `mw`; AP90's is `ap90`).
- **Casing split to document:** REST uses `query_type` (snake_case) and snake_case field
  enums; GraphQL uses `queryType` (camelCase) and camelCase field names
  (`headwordSlp1`, `reHeadwordsSlp1`). Same concepts, two spellings.

**The Entry object (verified):**

| Field (REST / GraphQL) | Type | Meaning |
|---|---|---|
| `id` / `id` | string | Stable entry id. |
| `headword_slp1` / `headwordSlp1` | string | Headword in SLP1. |
| `sense` / `sense` | string[] | Extracted sense glosses. |
| `re_headwords_slp1` / `reHeadwordsSlp1` | string[] | Run-on / sub-headwords in SLP1. |
| `created` / `created` | date-time | Index timestamp. |
| `xml` / `xml` | string (XML) | **The TEI-P5 entry body.** |

**Key finding from the real `mw/agni` response.** Kosh's flat fields are thin, but the
`xml` (TEI) body is rich and is **generated from CSL's own Cologne conventions**:
```xml
<entry xmlns="http://www.tei-c.org/ns/1.0" xml:id="lemma-agni" ana="H1">
  <form><idno ana="hc3">110</idno>
        <orth ana="key1" xml:lang="san-Latn-x-SLP1">agni</orth>
        <idno ana="hc1">1</idno>
        <hyph ana="key2" xml:lang="san-Latn-x-SLP1-headword">agn/i</hyph></form>
  <sense> … <cit type="literary_source"><bibl><ref target="#auth-Un2_">Un2.</ref></bibl></cit> …
    <note><ref target="#page-0005" type="facs">5,1</ref>
          <idno ana="L" xml:id="monier_890">890</idno></note></sense> …
</entry>
```
So **page/column (`5,1`), the accented key2 (`agn/i`), the homonym number (`hc1=1`), and
the L-number (`monier_890`) all survive inside the TEI** — they are simply not exposed as
flat fields. Two consequences:
1. The C-SALT TEI is downstream of the **same CSL source** the original serves (the
   `ana="H1"`, `key1`/`key2`, `hc1`, `as0`/`as1`, `L`/`monier_<n>` markers are CSL
   conventions). CDSL→TEI is therefore a path CCeH has already walked — Phase 5 is far less
   speculative than feared.
2. `monier_890` ≈ CSL's L-number / `recordId`, so **`id` alignment between the two hosts is
   probably mechanical**, not a research problem (§8 Q2).

### 1.2. The current CSL API (`getword.php`, in production)

From `COLOGNE/api/getword.md`:
```
…/scans/MWScan/2020/web/webtc/getword.php?key=Davala&filter=deva&noLit=off&accent=no&transLit=slp1
```
clean URL `/entries/{dictcode}/{word}/{intl}/{outtl}/{accent}`, returning
`{params, results:[{recordId, pageNumber, columnId, imgUrl, html, text, xml, references}]}`.
Companions: `servepdf.php` (`/pdf/{dict}/{mode}/{value}`), `listhier.php`
(`/list/{dict}/{word}/…`). The render path is the three shared modules `dal.php`,
`basicadjust.php`, `basicdisplay.php` (`csl-websanlexicon/v02/makotemplates/web/webtc/`,
copied into `csl-apidev` by `apidev_copy.sh`).

### 1.3. Why the two are already close

`getword.php` already produces the headword (SLP1 `key`), a `recordId`, the entry body, and
the scan apparatus. CSL holds a **superset** of what Kosh exposes flatly, and the missing
flat fields (`sense[]`, `re_headwords_slp1[]`) are derivable from the same markup that
already yields the TEI. The Salt work is therefore: **re-envelope** existing output to the
Kosh field names, **add the `query_type` search modes**, **add a GraphQL `entries`/`ids`
face**, **add clean `/dicts/{id}/…` routes**, and (Phase 5) **fill `xml` with TEI**.

---

## 2. Decisions taken

| # | Decision | Chosen | Consequence |
|---|---|---|---|
| 1 | How the server serves it | **Native PHP in `csl-apidev`** | Own the contract; reuse `dal`/`basicdisplay`; cover all ~40 dicts; no obligation to operate CCeH's stack. |
| 2 | Entry payload | **CSL payload now, TEI-P5 later** | Ship CSL renderings immediately via extension fields; fill the canonical `xml`(TEI) in Phase 5 (§3.4). |
| 3 | Dictionary scope | **MW-only pilot first** | Prove the pipeline on Monier-Williams, publish, then decide 7-vs-40 with real parity numbers (Phase 3 gate). |
| 4 | `csl-standards` deliverable | **Bilingual API Profile + schema** | Normative EN/RU profile + OpenAPI + GraphQL SDL + loss report. The spec Jim builds against. |
| 5 | Search backend | **PHP-native pilot, Elasticsearch at Phase 4** | MW pilot needs only headword modes (no new runtime); ES (or SQLite FTS5) enters for body search + scale. Contract identical either way. |
| 6 | Public `id` | **Match C-SALT exactly** | `lemma-{headword_slp1}` (or `-{n}` for homonyms); built from `key` + `hc1`. The `lnum` moves to `csl.lnum`. |
| 7 | Clean URLs | **Salt subsumes `cleanurl` (COLOGNE#249)** | one `/{dict}/{ref}` permalink alongside the `/dicts/{id}/…` API; Jim implements the permalink once. |
| 8 | C-SALT relation | **Clean-room** | reconstruct from CSL data; C-SALT's TEI is a parity oracle, never a code source. |
| 9 | Landing | **PRs to csl-standards and csl-apidev** | reviewed on GitHub, not pushed to default branches. |

---

## 3. The target contract (CSL-native Salt API)

CSL dictionary codes are **upper-case** (`MW`); Salt ids are **lower-case** (`mw`). The
rewrite layer (§4.5) folds case. CSL reproduces the Kosh routes and field names exactly,
and adds CSL-only data under a namespaced `csl` object so the top level stays drop-in
compatible.

### 3.1. REST — entry search

#### 3.1.1. C-SALT URL (target)
```
https://api.c-salt.uni-koeln.de/dicts/mw/restful/entries?field=headword_slp1&query=agni&query_type=term&size=10
```
#### 3.1.2. CSL Salt URL (what we serve)
```
https://sanskrit-lexicon.uni-koeln.de/dicts/mw/restful/entries?field=headword_slp1&query=agni&query_type=term&size=10
```
#### 3.1.3. Input parameters

| Parameter | Required (Kosh) | Values | Meaning |
|---|---|---|---|
| `field` | yes | `id`, `headword_slp1`, `sense`, `re_headwords_slp1`, `created`, `xml` | Indexed field to search. |
| `query` | yes | string | Search string. |
| `query_type` | yes | `term`, `fuzzy`, `match`, `match_phrase`, `prefix`, `wildcard`, `regexp` | Search mode (§4.3). |
| `size` | no | integer | Max entries. |
| `transLit` | no | `slp1`,`deva`,`hk`,`roman`,`itrans` | **CSL extension.** Kosh has none. |
| `accent` | no | `yes`,`no` | **CSL extension.** Kosh has none. |

> Kosh marks `field`/`query`/`query_type` **required**. CSL **[provisional]** may default
> `field=headword_slp1`, `query_type=term`, `size=25` for browser convenience, while still
> accepting the strict Kosh form unchanged. The clean URL (§3.1.4) supplies the same.

#### 3.1.4. Suggested clean URL (CSL convenience over the query form)
```
/dicts/{id}/entry/{query}/{query_type}/{inputtransliteration}/{outputtransliteration}/{accent}
```
Examples:
1. `…/dicts/mw/entry/agni/term/s/d/n`
2. `…/dicts/pwg/entry/अनुभूति/term/d/h/n`
3. `…/dicts/mw/entry/agn%2A/wildcard/s/d/n`

#### 3.1.5. Allowable values
1. `id` — lower-case Salt id. Phase 1: `mw` only. Later: §3.5.
2. transliteration codes `s/d/h/r/i` (slp1/deva/hk/roman/itrans), as in `getword.md`.
3. `accent` — `y/n`.

#### 3.1.6. Defaults [provisional]
`field=headword_slp1` · `query_type=term` · `size=25` · `intl=s` · `outtl=d` · `accent=n`.

#### 3.1.7. Rewrite rules (mirror the existing `getword` rewrites)
```
# Strict Kosh query form
RewriteRule ^dicts/([^/]*)/restful/entries$  /scans/awork/apidev/api1/salt_entries.php?dict=$1  [QSA,L]
RewriteRule ^dicts/([^/]*)/restful/ids$      /scans/awork/apidev/api1/salt_ids.php?dict=$1      [QSA,L]
# CSL clean form
RewriteRule ^dicts/([^/]*)/entry/([^/]*)/([^/]*)/([^/]*)/([^/]*)/([^/]+)$  /scans/awork/apidev/api1/salt_entries.php?dict=$1&query=$2&query_type=$3&transLit=$4&filter=$5&accent=$6  [L]
RewriteRule ^dicts/([^/]*)/entry/([^/]*)$  /scans/awork/apidev/api1/salt_entries.php?dict=$1&query=$2&query_type=term&transLit=slp1&filter=deva&accent=no  [L]
```
(`salt_entries.php` / `salt_ids.php` paths are placeholders; set to the chosen `apidev`
location — §8 Q6.)

#### 3.1.8. Expected output (Salt envelope; §3.4 explains the split)
```json
{
  "data": {
    "entries": [
      {
        "id": "mw-100564",
        "headword_slp1": "agni",
        "sense": ["fire, sacrificial fire …", "the number three …"],
        "re_headwords_slp1": ["agniprawizWA", "agnihowra"],
        "created": "2026-06-11T00:00:00",
        "xml": null,
        "csl": {
          "recordId": "100564",
          "page": "5", "column": "1",
          "scanUrl": "https://sanskrit-lexicon.uni-koeln.de/dicts/mw/pdf/page/5",
          "html": "…", "text": "…",
          "xmlCsl": "<H1>…</H1>",
          "references": ["RV.", "AV.", "MBh."],
          "headwordDeva": "अग्नि", "headwordIast": "agni",
          "accentedKey": "agn/i"
        }
      }
    ]
  }
}
```
**Why `xml` is `null` in Phase 1 and the CSL body lives under `csl`:** in the Kosh
contract `xml` *means TEI-P5*. We must not put CSL display-XML there or a Kosh client would
silently receive the wrong schema. So the canonical `xml` stays empty until Phase 5 fills
it with real TEI, while CSL's display-XML/html/text/scan are available **immediately** under
the additive `csl` object. A Kosh-only client reads the top level and ignores `csl`; a
CSL-aware client reads `csl`. No breaking change when Phase 5 lands.

#### 3.1.9. Questions
1. Publish the clean `entry` route, or only the C-SALT-identical `restful/entries?…` form?
2. `sense[]` and `re_headwords_slp1[]` are best-effort before Phase 5 (they come from the
   same parse that yields TEI). Ship them empty in Phase 1, or wait until extraction is
   solid? (Recommendation: ship `re_headwords_slp1` from CSL run-ons now; mark `sense`
   best-effort.)

### 3.2. REST — batch fetch by id

```
GET /dicts/{id}/restful/ids?ids=mw-100564&ids=mw-100565     # multi-value, returns full entries
```
Maps to `getword`'s record lookup by `recordId`, once per id. This is Kosh's `ids` query —
a **batch get by id**, not a search (an earlier draft mis-described it).

### 3.3. GraphQL

#### 3.3.1. Endpoint
```
POST https://sanskrit-lexicon.uni-koeln.de/dicts/{id}/graphql
```
#### 3.3.2. Schema (verified against C-SALT; reproduce field-for-field)
```graphql
type Query {
  entries(field: field, query: String!, queryType: queryType, size: Int): [mw]
  ids(ids: [String]): [mw]
}
enum field { id headword_slp1 sense re_headwords_slp1 created xml }
enum queryType { term fuzzy match match_phrase prefix wildcard regexp }
type mw {           # object type is named after the dict id
  id: String
  headwordSlp1: String
  sense: [String]
  reHeadwordsSlp1: [String]
  created: DateTime
  xml: String       # TEI-P5; null until Phase 5 on the CSL side
  csl: CslExtension # CSL-only additive block (our extension to the Kosh type)
}
```
> Confirmed by live introspection 2026-06-11. The only CSL addition to the Kosh type is the
> `csl` block (§3.4); everything above it is identical to C-SALT. Per-dict type naming
> (`mw`, `ap90`, …) is Kosh's convention — keep it for drop-in tooling.

#### 3.3.3. PHP implementation [provisional]
Use **`webonyx/graphql-php`** (de-facto standard; gives schema, validation, introspection
that clients expect). `entries`/`ids` resolve through the **same** `dal`/`basicdisplay`
code as REST, so the two faces cannot diverge. Marked provisional pending §8 Q4.

### 3.4. The Salt entry envelope — CSL ↔ Kosh mapping

Top level = the verified Kosh fields (drop-in). The `csl` object = everything CSL has that
Kosh does not.

| Salt field | Filled from CSL | When | Note |
|---|---|---|---|
| `id` | `lemma-{headword_slp1}` (or `-{n}` for homonyms) — **matches C-SALT** | now | Built from `key` + `hc1`. Verified: `ka` → `lemma-ka-1`…`-4`. |
| `headword_slp1` | `key` (already SLP1) | now | Direct. |
| `sense[]` | best-effort sense split / Phase-5 TEI `<sense>` | now (rough) → Phase 5 | Sense extraction is the hard interoperability case the repo studies. |
| `re_headwords_slp1[]` | CSL run-on headwords | now | From existing sub-entries. |
| `created` | dict generation date | now | Cosmetic parity with Kosh. |
| `xml` | **TEI-P5** | **Phase 5** | Kosh semantics. `null` before Phase 5 — never CSL-XML. |
| `csl.lnum` | `lnum` | now | Cologne record id / L-number; = TEI `monier_<lnum>`; Jim's existing `lnum` (`restfulparm.md`). |
| `csl.page` / `csl.column` | `pageNumber` / `columnId` | now | CSL-only flat; in TEI only as `facs` `5,1`. |
| `csl.scanUrl` | `imgUrl` (`servepdf`) | now | CSL-only. Strong advantage. |
| `csl.html` / `csl.text` | `html` / `text` | now | CSL-only renderings. |
| `csl.xmlCsl` | `xml` (CSL display-XML) | now | The Cologne edition markup — available immediately. |
| `csl.references[]` | `references[]` | now | Flat; structural form is inside TEI `<cit>`/`<bibl>`. |
| `csl.headwordDeva` / `headwordIast` / `accentedKey` | `basicadjust` transliterations + key2 | now | CSL-only. |

### 3.5. Dictionary id table — 7 C-SALT ids confirmed live (2026-06-11)

| Salt id | CSL dictcode | Direction | In C-SALT (`/restful/spec` → 200) |
|---|---|---|---|
| `mw` | MW | Skt→Eng | ✓ |
| `ap90` | AP90 | Skt→Eng | ✓ |
| `bhs` | BHS | Skt→Eng | ✓ |
| `vei` | VEI | Skt→Eng | ✓ |
| `pwg` | PWG | Skt→Ger | ✓ |
| `gra` | GRA | Skt→Ger | ✓ |
| `ae` | AE | Eng→Skt | ✓ |
| *(all other CDSL v02 dicts: ACC, AP, BEN, BOP, BOR, …)* | — | mixed | **CSL-only coverage** |

All seven `{id}` ↔ CSL dictcode pairs are confirmed reachable; the entry-count cross-check
(the 30-second confirmation) folds into Phase 0.

---

## 4. How it is built natively in PHP (the "how")

### 4.1. Reuse the three shared modules
`dal.php` / `basicadjust.php` / `basicdisplay.php` already produce everything in the `csl`
block. Keep using them via `apidev_copy.sh`; do not fork their logic. **Why:** one render
path for website and API means the API never drifts from what users see.

### 4.2. Add a thin controller; do not disturb `api0`
Add `csl-apidev/api1/` (sibling of `api0/`) with `salt_entries.php`, `salt_ids.php`,
`graphql.php`. Each parses the Salt route, dispatches to `dal`, calls `basicdisplay`,
assembles the §3.4 envelope, emits JSON. Production endpoints are untouched, so the pilot
cannot regress the live site.

### 4.3. Search backend — two supported options, identical contract

The Salt contract is **backend-agnostic**: the same `field`/`query`/`query_type` surface
can be executed two ways.

**Option A — PHP over existing CDSL indexes (no new runtime).**

| `query_type` | CSL realization | Exists today as |
|---|---|---|
| `term` | exact headword-key match | `getword` lookup |
| `prefix` | starts-with on headword | `listhier` neighborhood |
| `wildcard` | `*`/`?` glob on headword | site glob search |
| `regexp` | regex on headword | advanced/regex search |
| `fuzzy` | edit-distance on headword | `getsuggest` |
| `match` / `match_phrase` | token / phrase over body | *needs a body index (Phase 4)* |

**Option B — Elasticsearch (Kosh-identical).** Yes, **CSL can absolutely use
Elasticsearch.** Decision #1 (native PHP) is about *who serves the HTTP contract*, not
about the datastore. The PHP controller can resolve `entries`/`ids` against an
Elasticsearch index instead of the CDSL indexes, and because C-SALT/Kosh is open source we
can index CDSL with **the same XPath→field mapping Kosh uses**, giving:
- all seven `query_type` modes (including `match`/`match_phrase`/`fuzzy`) with one engine
  and Elasticsearch-quality ranking;
- byte-level parity with C-SALT's search semantics;
- a clean road to full-text body search at ~40-dictionary scale.

Cost: a JVM/Elasticsearch service to install, secure, and keep running on (or beside) the
Cologne host, plus an indexing step in the dictionary build. **Why this is now an open
decision (§5, §8 Q5):** the project lead asked to keep Elasticsearch on the table. The
honest trade is *operational simplicity (Option A)* vs *search power + exact Kosh parity
(Option B)*. A sensible middle path: **Phase 1–3 on Option A** (MW pilot needs only
headword modes, no new service), **re-evaluate Option B at Phase 4** when body search and
scale arrive — at which point Elasticsearch (or SQLite FTS5 as a lighter alternative)
earns its keep. The contract and the controller do not change when the backend does.

### 4.4. GraphQL face
`api1/graphql.php` (webonyx [provisional]) resolves `entries`/`ids` through the same code
as REST. Only two root fields.

### 4.5. Apache rewrite layer
Add the §3.1.7 rules beside the existing `entries`/`pdf`/`list` rewrites; lower-case/fold
the dict code; bridge `/dicts/{id}/pdf/page/{n}` to `servepdf.php` so `csl.scanUrl` is
itself a clean Salt URL.

---

## 5. The `csl-standards` deliverable — the C-SALT API Profile

New documentation set, parallel to the MDF profile (csl-standards#1):
```
csl-standards/
  docs/SALT_API_PROFILE.md          # normative prose, EN
  docs/SALT_API_PROFILE.ru.md       # RU mirror (repo is bilingual)
  docs/SALT_API_LOSS_REPORT.md      # CSL↔Kosh divergences (§7), as findings
  data/schema/salt-api.openapi.yaml # OpenAPI for REST (§3.1–3.2)
  data/schema/salt-api.graphql      # GraphQL SDL (§3.3.2)
```
Normative for `csl-apidev` to implement; descriptive of how the CCeH derivative already
realizes the same contract. Core = the §3.4 mapping and §3.5 id table. **Why a profile and
not prose:** the OpenAPI + SDL validate *both* hosts against one contract — that is what
makes "integration" checkable, not aspirational.

---

## 6. Phased roadmap

### Phase 0 — Profile & contract (`csl-standards`) — no server work
- Author `SALT_API_PROFILE.md` (+ RU), `salt-api.openapi.yaml`, `salt-api.graphql`,
  `SALT_API_LOSS_REPORT.md` (first pass). The contract is already captured (this doc, §1.1,
  §3); Phase 0 turns it into the normative artifacts.
- Cross-check the 7 entry counts against the live `/restful/spec` endpoints.
- **Exit:** the spec Jim builds against exists and is reviewed.

### Phase 1 — MW REST pilot (`csl-apidev`)
- `api1/salt_entries.php`: `/dicts/mw/restful/entries` for `query_type` ∈ `{term, prefix,
  wildcard, regexp, fuzzy}` over headwords; full §3.4 envelope (`xml: null`, `csl` filled).
- `salt_ids.php` (batch by id); rewrites; `csl.scanUrl` bridged to `servepdf.php`.
- **Exit:** MW answers Salt REST live, identical envelope for every headword.

### Phase 2 — MW GraphQL pilot
- `api1/graphql.php`: `entries` + `ids` over the same resolvers; field names per §3.3.2.
- **Exit:** MW answers Salt GraphQL; REST and GraphQL return the same records.

### Phase 3 — Parity review & the 7-vs-40 decision gate
- Validation recipe (§9): same headwords on both hosts; compare `id` (does
  `{dict}-{recordId}` line up with `monier_<L>`?), count, headword form. Write results into
  `SALT_API_LOSS_REPORT.md`.
- **Decision (project lead):** expand to the 7 C-SALT dicts, all ~40 CDSL dicts, or a
  staged order — backed by real MW numbers. **Also decide search backend (Option A vs B)
  for scale-out.**
- **Exit:** a recorded scope + backend decision and a published MW parity report.

### Phase 4 — Scale-out
- Per-dictionary config table (the CSL analogue of `.kosh`): id, languages, headword field,
  body-search flag. Add `match`/`match_phrase`/`fulltext` where wanted — this is where
  Elasticsearch (or SQLite FTS5) is chosen per §4.3/§8 Q5.
- **Exit:** the Salt API covers the chosen dictionaries — CSL's coverage advantage is real.

### Phase 5 — TEI-P5 view (closes payload parity)
- Fill canonical `xml` with TEI-P5. Because C-SALT's TEI already derives from CSL
  conventions (§1.1), this is reproducing a known transform, not inventing one; lossy spots
  are documented, not hidden. Upgrade `sense[]` to TEI-quality here.
- **Exit:** Salt entries carry TEI in `xml` and CSL renderings in `csl`.

### Phase 6 — Convergence with CCeH (optional coordination)
- Offer CSL as upstream so C-SALT can grow past 7 dicts; align `id`s; optionally share the
  CDSL→TEI conversion. Collaboration, not a code dependency.

---

## 7. Loss report — first pass (verified)

| Direction | What does not survive *as a flat field* | Detail |
|---|---|---|
| CSL → Kosh flat fields | scan page/column, `scanUrl`, `html`/`text`, flat `references`, accent, multi-transliteration | None have a Kosh flat slot — but **page/column/accent/L-number do survive inside the TEI** (`facs 5,1`, `key2 agn/i`, `monier_890`). The loss is in the *flat* projection, not the TEI. |
| Kosh → CSL (pre-Phase-5) | TEI-P5 structure in `xml` | CSL `xml` is `null` until Phase 5; structural TEI queries are unanswerable on CSL until then. CSL display-XML lives at `csl.xmlCsl` meanwhile. |
| Both | `id` semantics | Kosh ids are index-stable; CSL `recordId` stability across `redo_xampp_selective.sh` must be confirmed (§8 Q2). The TEI `monier_<L>` suggests alignment is mechanical. |
| Modeling | `sense[]` quality | Kosh's `sense[]` is parsed from TEI `<sense>`; CSL can only approximate it before Phase 5. The gap between rough and TEI-grade senses is itself a finding for the paper. |

These rows seed `SALT_API_LOSS_REPORT.md` and feed the paper's "what TEI/OntoLex capture and
where both need extension."

---

## 8. Open questions (for Jim) — with provisional defaults already chosen

Resolved this round are struck through; the rest carry a recommended default so the spec is
not blocked.

1. ~~**GraphQL field names** — unknown.~~ **RESOLVED:** introspected live (§1.1, §3.3.2).
2. ~~**`recordId` → public id**~~ **RESOLVED:** the public `id` matches C-SALT exactly —
   `lemma-{headword_slp1}` (or `-{n}` for homonyms; verified `ka` → `lemma-ka-1`…`-4`),
   built from `key` + `hc1`. The `lnum` (Jim's existing parameter) moves to `csl.lnum`.
   Phase-3 check: confirm CSL homonym ordering agrees with C-SALT.
3. ~~**Prefixed vs bare id**~~ **RESOLVED:** neither — match C-SALT's `lemma-…` token.
4. **GraphQL library** — **Default [provisional]:** `webonyx/graphql-php`. Revisit only if
   adding a Composer dependency on the host is unwanted.
5. ~~**Search backend**~~ **RESOLVED:** PHP-native for the MW pilot; Elasticsearch (or
   SQLite FTS5) enters at Phase 4 for body search + scale. Contract unchanged either way.
6. **Controller home** — confirm the real `apidev` path for `api1/` and the rewrite targets
   in §3.1.7 (currently placeholders).
7. **CORS / rate limit / auth** — **Default [provisional]:** match C-SALT (open,
   unauthenticated), subject to the Cologne host's usual limits.
8. **`noLit`** — `getword.md` itself asks what it is for. **Default [provisional]:** keep it
   as an internal `getword` parameter, not exposed in the Salt surface, unless it changes
   results materially.

---

## 9. Appendix — MW parity validation recipe (Phase 3)

For a fixed headword list (`agni`, `Davala`, `aMSa`, `indra`, `BU`):
1. C-SALT: `GET …/dicts/mw/restful/entries?field=headword_slp1&query={hw}&query_type=term`
2. CSL:    `GET …/dicts/mw/restful/entries?field=headword_slp1&query={hw}&query_type=term`
3. Compare: entry count per headword; each `id` (does `{dict}-{recordId}` match the TEI
   `monier_<L>`?); the `headword_slp1` form; and (Phase 5) `xml` TEI vs C-SALT's TEI body.
4. Record agreements and divergences in `SALT_API_LOSS_REPORT.md`. Divergences are expected
   where CSL covers homonyms, continuation entries, or scan apparatus the 7-dictionary
   derivative does not.

A small script under `csl-standards/data/pilot/` can automate this (reusing the repo's
`npm run sample` data-handling pattern) and emit a parity table.

---

*End of roadmap. The verified contract above is ready to become the Phase 0 normative
artifacts (`SALT_API_PROFILE.md` + RU, `salt-api.openapi.yaml`, `salt-api.graphql`,
`SALT_API_LOSS_REPORT.md`) on request.*
