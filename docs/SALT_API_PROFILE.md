# C-SALT API Profile (CSL)

Version: 0.1.0
Date: 2026-06-11
Status: **Draft normative profile.** The contract below was verified live against
`api.c-salt.uni-koeln.de/dicts/mw` (REST OpenAPI `/restful/spec` + GraphQL introspection)
on 2026-06-11.

Machine-readable companions (authoritative for tooling):
- REST: [`data/schema/salt-api.openapi.yaml`](../data/schema/salt-api.openapi.yaml)
- GraphQL: [`data/schema/salt-api.graphql`](../data/schema/salt-api.graphql)

Russian mirror: [`SALT_API_PROFILE.ru.md`](SALT_API_PROFILE.ru.md).
Divergence catalogue: [`SALT_API_LOSS_REPORT.md`](SALT_API_LOSS_REPORT.md).
Implementation plan: [`SALT_API_INTEGRATION_ROADMAP.md`](SALT_API_INTEGRATION_ROADMAP.md).

---

## 1. Purpose and status

This profile defines the **Salt API** that the Cologne Digital Sanskrit Lexicon original
(`sanskrit-lexicon.uni-koeln.de`, implemented in `csl-apidev`) MUST expose so that a client
written for the C-SALT APIs queries the original unchanged.

The profile is **wire-compatible** with the C-SALT / Kosh API: every endpoint, parameter,
enum value, and top-level entry field reproduces C-SALT exactly. CSL adds exactly one thing
— a namespaced `csl` object on the entry — carrying data the Kosh model has no slot for.

This is a **clean-room** profile. C-SALT is used only as a *parity oracle*: the original's
implementation is reconstructed from CSL data and validated against C-SALT, never copied
from it.

The key words MUST, MUST NOT, SHOULD, MAY are used per RFC 2119.

## 2. Endpoints

For a dictionary with lower-case id `{id}` (§7), a conforming host MUST serve:

| Method | Path | Purpose |
|---|---|---|
| GET | `/dicts/{id}/restful/entries` | Search entries (§3, §4). |
| GET | `/dicts/{id}/restful/ids` | Batch-fetch entries by id list (§5). |
| POST | `/dicts/{id}/graphql` | GraphQL `entries` and `ids` (§6). |
| GET | `/{dict}/{ref}` | Clean-URL permalink to an entry by headword or lnum — subsumes COLOGNE#249 (§6a). |

Responses for the `restful` and `graphql` endpoints MUST be `application/json`.

## 3. REST — search (`/restful/entries`)

### 3.1 Query parameters

| Name | Required | Type | Enum / values |
|---|---|---|---|
| `field` | yes¹ | string | `id`, `headword_slp1`, `sense`, `re_headwords_slp1`, `created`, `xml` |
| `query` | yes | string | the search string |
| `query_type` | yes¹ | string | `term`, `fuzzy`, `match`, `match_phrase`, `prefix`, `wildcard`, `regexp` |
| `size` | no | integer | maximum entries (default 25) |
| `transLit` | no | string | `slp1`, `deva`, `hk`, `roman`, `itrans` — **CSL extension** (default `slp1`) |
| `accent` | no | string | `yes`, `no` — **CSL extension** (default `no`) |

¹ C-SALT marks `field`, `query`, `query_type` all required. A CSL host MAY relax `field`
and `query_type` to the defaults `headword_slp1` / `term` for browser convenience, but MUST
still accept the strict C-SALT form. The two **CSL extension** parameters MUST NOT change
the meaning of any C-SALT parameter.

### 3.2 Response

```json
{ "data": { "entries": [ /* Entry, §8 */ ] } }
```

On a missing or invalid parameter the host MUST return HTTP 400 with
`{ "error": "<message>" }` (C-SALT message form:
`Missing or invalid parameter: 'field'`).

### 3.3 Example

```
GET /dicts/mw/restful/entries?field=headword_slp1&query=agni&query_type=term&size=1
```

## 4. Search modes (`query_type`)

A conforming host MUST accept all seven values. The *quality* of each mode MAY depend on the
search backend (see the roadmap §4.3: PHP-native over headwords, or Elasticsearch). At
minimum:

| Mode | Meaning | Minimum CSL behaviour |
|---|---|---|
| `term` | exact match | exact headword-key match |
| `prefix` | starts-with | headword prefix match |
| `wildcard` | `*`/`?` glob | glob over the searched field |
| `regexp` | regular expression | regex over the searched field |
| `fuzzy` | edit-distance | approximate headword match |
| `match` | token match | token match over the field |
| `match_phrase` | phrase match | phrase match over the field |

`match` / `match_phrase` over `field=sense` or `field=xml` (body search) MAY be deferred
(roadmap Phase 4) but MUST then return HTTP 400 rather than silently empty results.

## 5. REST — batch fetch (`/restful/ids`)

```
GET /dicts/{id}/restful/ids?ids={id}&ids={id}…
```

`ids` is a repeated (multi-value) parameter. The response MUST be
`{ "data": { "ids": [ /* Entry */ ] } }`. This is a **get-by-id**, not a search.

## 6. GraphQL (`/graphql`)

The schema is [`salt-api.graphql`](../data/schema/salt-api.graphql). Two root fields:

```graphql
entries(field: Field = headword_slp1, query: String!, queryType: QueryType = term, size: Int = 25): [Entry!]
ids(ids: [String!]!): [Entry!]
```

**Casing.** GraphQL uses camelCase argument and field names (`queryType`, `headwordSlp1`,
`reHeadwordsSlp1`); REST uses the snake_case forms in §3.1 and §8. Both are normative; a
host MUST honour the casing of the face being called.

**Per-dictionary type name.** The live C-SALT service names the entry object type after the
dictionary id (`mw`, `ap90`, …). A CSL host MAY follow that convention; the profile refers
to the type abstractly as `Entry`.

## 6a. Clean-URL permalinks (subsumes COLOGNE#249)

`csl-apidev` already plans clean-URL permalinks (the `cleanurl` endpoint stub in
`doc/readme.md`, tracked as COLOGNE#249), e.g. `/MW/bAQa` (by headword) or `/MW/144239`
(by lnum). The Salt profile **subsumes** that item rather than competing with it: a
conforming CSL host SHOULD serve

```
GET /{dict}/{ref}
```

where `{dict}` is the (upper- or lower-case) dictcode and `{ref}` is either a headword
(in any supported transliteration) or an `lnum`. It resolves to the same record(s) as
`/dicts/{id}/restful/entries`, returning HTML for browsers and the §3.2 JSON envelope under
content negotiation (`Accept: application/json`). One clean-URL scheme serves both humans
and machines, so the work is done once. The reserved segments `restful` and `graphql` are
not valid `{dict}` values.

## 7. Dictionary id registry

ids are lower-case. The seven C-SALT ids (all verified reachable 2026-06-11) and their CSL
dictcodes:

| Salt id | CSL dictcode | Direction |
|---|---|---|
| `mw` | MW | Skt→Eng |
| `ap90` | AP90 | Skt→Eng |
| `bhs` | BHS | Skt→Eng |
| `vei` | VEI | Skt→Eng |
| `pwg` | PWG | Skt→Ger |
| `gra` | GRA | Skt→Ger |
| `ae` | AE | Eng→Skt |

A CSL host SHOULD additionally serve every other CDSL v02 dictionary under the same
contract, using its lower-cased dictcode as the id. Coverage beyond the seven is the
original's primary advantage over the derivative.

## 8. The Entry object

### 8.1 C-SALT-compatible fields (top level — MUST match C-SALT)

| Field (REST / GraphQL) | Type | Meaning |
|---|---|---|
| `id` / `id` | string | Stable entry id. **MUST equal C-SALT's exactly:** `lemma-{headword_slp1}` for a unique headword, or `lemma-{headword_slp1}-{n}` for homonyms (`n` = 1-based homonym number; verified live: `ka` → `lemma-ka-1`…`lemma-ka-4`, while single headwords `agni`/`aMSa` carry no suffix). Reconstructed from CSL `key` + the `hc1` homonym counter. |
| `headword_slp1` / `headwordSlp1` | string | Headword in SLP1. |
| `sense` / `sense` | string[] | Sense glosses. |
| `re_headwords_slp1` / `reHeadwordsSlp1` | string[] | Run-on / sub-headwords in SLP1. |
| `created` / `created` | date-time | Index/build timestamp. |
| `xml` / `xml` | string \| null | **TEI-P5 body.** On a CSL host this MUST be `null` until TEI conversion ships (roadmap Phase 5) and MUST NOT contain CSL display-XML. |

### 8.2 CSL extension (`csl` object — additive; absent on C-SALT)

A CSL host MUST place all original-only data inside a single `csl` object, so the top level
stays drop-in compatible. A C-SALT client MUST be able to ignore `csl` with no loss of
C-SALT-defined data.

| `csl.` field | From CSL | Meaning |
|---|---|---|
| `lnum` | `lnum` | Cologne record id / L-number (e.g. `144239`); equals the TEI `monier_<lnum>` and Jim's existing `lnum` parameter (`restfulparm.md`). |
| `page` / `column` | `pageNumber` / `columnId` | Scan coordinates. |
| `scanUrl` | `imgUrl` | Clean Salt URL to the scanned page. |
| `html` / `text` | `html` / `text` | Rendered entry. |
| `xmlCsl` | `xml` | CSL display-XML (Cologne edition markup) — available immediately. |
| `references` | `references[]` | Flat source/reference labels. |
| `headwordDeva` / `headwordIast` / `accentedKey` | derived | Transliterations and the accented key2 form. |

## 9. Compatibility statement

A request valid against C-SALT, sent to a conforming CSL host, MUST return a response whose
top-level shape (`data.entries[]` / `data.ids[]`) and entry fields (§8.1) are
indistinguishable in structure from C-SALT's, except that:
1. `xml` MAY be `null` until Phase 5; and
2. each entry MAY carry an additional `csl` object.

No other structural divergence is permitted by this profile. Behavioural divergences
(coverage of additional dictionaries, additional homonyms, richer `csl` data) are expected
and catalogued in [`SALT_API_LOSS_REPORT.md`](SALT_API_LOSS_REPORT.md).

## 10. Versioning

This profile is versioned independently of any host. Backwards-compatible additions
(new `csl.*` fields, new dictionary ids) increment the minor version; changes to §8.1 or
§2–§6 increment the major version.
