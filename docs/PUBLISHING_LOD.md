# Publishing the PWG→RU LOD graph — a step-by-step runbook

_Created: 08-07-2026 · Last updated: 08-07-2026_

This is the human-runnable runbook for taking the **PWG→RU** (Petersburg
Dictionary → Russian) Linked-Open-Data graph from *validated-locally* — where
[H350 / E7](https://github.com/gasyoun/Uprava/blob/main/handoffs/H350-Opus_RussianTranslation_epistemic_reach_lila_ontolex_wsd_08.07.26.md)
left it — to **real, dereferenceable, discoverable Linked Open Data**.

It is deliberately a document, not an action: the repo's mission still defers
"real RDF publication … to a later phase"
([`../README.md`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/README.md),
[`docs/BOUNDARY_RULES.md`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/BOUNDARY_RULES.md)).
This runbook **is** that later phase, written down so a human can work it when
the gates below clear. Nothing here has been published, registered, or stood up.

Each step is tagged:

- **[HUMAN]** — only a person can do it (register a domain, stand up hosting,
  press "publish", hold a credential).
- **[AGENT]** — an autonomous session can produce it (a config file, a metadata
  descriptor, a build run) with no human judgement.
- **[HUMAN-DECIDE]** — a fork that needs a human ruling before any agent can
  proceed; recorded as an `@DECIDE` in
  [`Uprava/GTD_NEXT_ACTIONS.md`](https://github.com/gasyoun/Uprava/blob/main/GTD_NEXT_ACTIONS.md).

The **[consolidated checklist](#9-consolidated-checklist)** at the end is the
part you actually work down; §1–§8 are the reasoning behind each row.

## What already exists (so you don't rebuild it)

| Artifact | Where | What it is |
|---|---|---|
| Graph generator (`--base-iri`) | [`RussianTranslation/src/export_lod.py`](https://github.com/gasyoun/SanskritLexicography/blob/master/RussianTranslation/src/export_lod.py) | Emits the OntoLex-Lemon + `vartrans` + PROV-O + LiLa graph; `--base-iri` is the only publication knob |
| Model + coverage table | [`RussianTranslation/LOD_GRAPH.md`](https://github.com/gasyoun/SanskritLexicography/blob/master/RussianTranslation/LOD_GRAPH.md) | The full model, namespaces, before/after field coverage, honest boundaries |
| Acceptance gate | [`RussianTranslation/src/lod_acceptance.py`](https://github.com/gasyoun/SanskritLexicography/blob/master/RussianTranslation/src/lod_acceptance.py) | Federated-join + lossless round-trip + SHACL; exit ≠ 0 on any failure |
| SPARQL + SHACL surface | [`../standards/pwg-ru-lod/`](https://github.com/sanskrit-lexicon/csl-standards/tree/main/standards/pwg-ru-lod) | The landed schema-only surface: [`sense_citation_dcsfreq.rq`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/standards/pwg-ru-lod/sense_citation_dcsfreq.rq), [`shapes.ttl`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/standards/pwg-ru-lod/shapes.ttl), [`README.md`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/standards/pwg-ru-lod/README.md) |
| Boundary contract | [`docs/BOUNDARY_RULES.md`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/BOUNDARY_RULES.md) | Generator + data stay in `RussianTranslation`; the **published graph + query/validation surface** live here |
| Evidence-label mapping | [`docs/EVIDENCE_LABEL_CROSSWALK.md`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/EVIDENCE_LABEL_CROSSWALK.md) | The atlas evidence labels ↔ PROV-O / TEI `@cert` mapping the grades reuse — cross-link, don't redefine |
| `csl:` vocabulary index | [`docs/CSL_VOCABULARY.md`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/CSL_VOCABULARY.md) | The extension-namespace index; `pwglex:` sits alongside it |
| Validated profile | [`docs/VALIDATED_INTEROPERABILITY_PROFILE.md`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/docs/VALIDATED_INTEROPERABILITY_PROFILE.md) | The 250-case validation the model already passed |

House skills the runbook **routes into** rather than re-deriving:
[`/publish-safety-check`](https://github.com/gasyoun/Uprava) (GO/NO-GO gate),
[`/data-release`](https://github.com/gasyoun/Uprava) (FAIR + Zenodo DOI +
`CITATION.cff`), [`/cut-release`](https://github.com/gasyoun/Uprava)
(version + tag + GitHub release).

---

## 1. Gates before anything is public — **[HUMAN-DECIDE]**

Two hard blocks stand before every other step. Neither is a code problem; both
are rulings.

### 1a. G5 — the citable subset is currently empty

The graph carries every sense, but grades them. `pwglex:citable` is a SPARQL
filter, not a separate build: `gr:approved` and `gr:human-reviewed` are citable;
`gr:machine-preview`, `gr:dict-attested`, `gr:kow`, `gr:corpus` are not
([`export_lod.py`](https://github.com/gasyoun/SanskritLexicography/blob/master/RussianTranslation/src/export_lod.py)
`GRADES`).

**Today the translation store is 100 % `ai_translated` → `gr:machine-preview`**,
so **the citable graph (`pwglex:citable true`) is empty** until human
sense-approvals (G5) land. This is the single most important thing to understand
before publishing: *there is no human-approved content to publish yet.*

**[HUMAN-DECIDE]** — choose the release posture:

- **(A) Wait for G5.** Publish nothing until an approved subset exists. Cleanest
  provenance; nothing ships for now.
- **(B) Publish the machine-preview tier as an explicitly non-citable preview.**
  Ship the full graph with every sense visibly graded `gr:machine-preview`, a
  prominent "machine translation, not yet human-reviewed — not citable" banner
  in the VoID description (§5) and the landing HTML, and the citable filter
  documented so consumers can select the (currently empty) approved subset. This
  is defensible **only** if the non-citable status is impossible to miss.

Recommendation: **(A) wait** for the first *content* release, but (B) is
acceptable for a clearly-labelled *technical preview* release whose value is the
graph shape, not the translations. Either way, a real content release waits on
G5. This ruling gates §6–§7.

### 1b. `/publish-safety-check` — mandatory, no exceptions — **[HUMAN]**

Before any publish action, run
[`/publish-safety-check`](https://github.com/gasyoun/Uprava) on the release
bundle. It checks intended visibility, rights on the underlying (gitignored)
translation + DCS stores, personal data, secrets, and gitignored-bulk leakage.
A NO-GO here stops everything.

### 1c. License composition — **[HUMAN-DECIDE]**

The lexicon is **CC BY-SA 4.0**. The published graph *joins* PWG senses to **DCS
corpus frequency** on the shared lemma IRI (the whole point of the lemma-bank
spine). Confirm the DCS-frequency contribution adds **no term stricter than
CC BY-SA 4.0** before the composed graph ships. Route the composition check
through [`/data-release`](https://github.com/gasyoun/Uprava)'s license step;
record the verbatim DCS license terms and the composition verdict. If DCS
carries a non-commercial or share-alike-incompatible term, the frequency graph
must be published separately (or omitted), not composed into a single
CC BY-SA 4.0 release.

---

## 2. The IRI domain decision — **[HUMAN-DECIDE]**

IRIs are permanent identifiers; the moment one dereferences publicly, churning it
breaks every downstream link. So the publication domain is a human ruling, not a
code default. The generator ships the **placeholder**
`https://w3id.org/sanskrit-lexicon/pwg-ru/` and takes `--base-iri`; **nothing
downstream hard-codes it**, so this decision changes zero lines of code — only
the value passed at build time. Already tracked as an `@DECIDE` in
[GTD](https://github.com/gasyoun/Uprava/blob/main/GTD_NEXT_ACTIONS.md).

| Option | Registration | Pros | Cons |
|---|---|---|---|
| **(a) w3id.org PURL** *(recommended)* | PR to [`perma-id/w3id.org`](https://github.com/perma-id/w3id.org) adding a redirect dir + `.htaccess` | Community standard for LOD; DNS-independent; permanent; you never own/renew a domain; survives project domain changes | One-time PR + review latency; redirect target must stay live |
| **(b) `samskrte.ru` subpath** | Configure a path on the domain the project already controls | Full control; instant | Ties permanent IRIs to a domain that could lapse or be repurposed; not the community norm |
| **(c) `sanskrit-lexicon.uni-koeln.de` path** | Request a path from Cologne | Institutional permanence, most authoritative | Needs Cologne coordination; slow; not under project control |

**Recommendation: (a) w3id.org.** It is the de-facto standard for scholarly LOD
namespaces precisely because it decouples the permanent identifier from any
hosting or DNS you have to maintain — the w3id redirect can point at GitHub Pages
today and a Cologne endpoint later without a single IRI changing. The base becomes
whatever you register (e.g. `https://w3id.org/sanskrit-lexicon/pwg-ru/`, which is
already the placeholder), passed to every build as `--base-iri`.

Sample w3id `.htaccess` (goes in the PR's redirect dir; the redirect target is
whatever hosting §3 stands up):

```apache
# w3id.org/sanskrit-lexicon/pwg-ru/.htaccess
# Permanent namespace for the PWG->RU LOD graph.
# Content negotiation is delegated to the hosting target (see §3).
RewriteEngine On
RewriteBase /sanskrit-lexicon/pwg-ru/

# Turtle for machines that ask for it
RewriteCond %{HTTP_ACCEPT} text/turtle [OR]
RewriteCond %{HTTP_ACCEPT} application/rdf\+xml
RewriteRule ^(.*)$ https://sanskrit-lexicon.github.io/pwg-ru-lod/$1.ttl [R=303,L]

# HTML for browsers
RewriteRule ^(.*)$ https://sanskrit-lexicon.github.io/pwg-ru-lod/$1.html [R=303,L]
```

---

## 3. Dereferenceability + content negotiation — **[HUMAN]** hosting, **[AGENT]** configs

The test of "real LOD": an IRI like `…/entry/rakz` returns **Turtle** to a machine
(`Accept: text/turtle`) and **HTML** to a browser, both describing the same
resource. Two design choices and two hosting shapes.

**Design choices** (record the ruling; the generator already emits slash IRIs):

- **Slash vs hash.** Our resources are per-entry/per-sense (many, individually
  addressable), so **slash IRIs with 303 redirects** are correct — hash IRIs
  suit a single small vocabulary document, not a 120k-entry dataset. (The
  `pwglex:` *vocabulary* itself can stay a hash namespace; the *instance data* is
  slash.)
- The 303 "see-also" pattern is the standard for non-information resources
  (a lemma is not a document); a browser and a triple store each get redirected
  to the representation they asked for.

**Hosting shape** (pick one — recommend static first):

- **(i) Static — recommended for a first release.** Pre-render one `.ttl` and one
  `.html` per resource, host on **GitHub Pages** behind the w3id redirect. No
  server to run, no uptime cost, trivially reproducible from the build. Conneg is
  handled by the w3id `.htaccess` above (303 to `.ttl` or `.html`). **[AGENT]** can
  generate the per-resource files from the full graph; **[HUMAN]** enables Pages
  on the hosting repo (after a [`/publish-safety-check`](https://github.com/gasyoun/Uprava)).
- **(ii) Dynamic.** An nginx/Apache reverse proxy doing conneg in front of a live
  store. More power (live queries), more to run and secure. Overkill for a first
  release at our scale.

Sample nginx conneg (only if you go dynamic — **[AGENT]**-generatable):

```nginx
# /etc/nginx/conf.d/pwg-ru-lod.conf  (dynamic option only)
location /sanskrit-lexicon/pwg-ru/ {
    if ($http_accept ~* "text/turtle|application/rdf\+xml") {
        return 303 https://data.example.org/pwg-ru/$uri.ttl;
    }
    return 303 https://data.example.org/pwg-ru/$uri.html;
}
```

For the static option, the per-resource files are produced from the full graph
(§8); the HTML rendering can be a minimal RDF-to-HTML template (label, grade
banner, definitions, citations, links) — **[AGENT]**-writable, no framework needed.

---

## 4. SPARQL endpoint — **[HUMAN-DECIDE]** host

At our scale (~120k entries, a few million triples) a live endpoint is optional,
not required, for a first release.

| Option | Setup cost | Memory / hosting | Notes |
|---|---|---|---|
| **Static dump + client-side query** *(recommended first)* | ~none | GitHub Pages | Ship the `.ttl` dump; consumers load it into their own store or query with client-side WASM (e.g. an in-browser Oxigraph/Comunica). No endpoint to run or secure. The [`sense_citation_dcsfreq.rq`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/standards/pwg-ru-lod/sense_citation_dcsfreq.rq) runs offline over the two graphs loaded together — exactly the acceptance mode. |
| **Oxigraph** | Low | Low (Rust, single binary) | Cheapest real endpoint; read-only mode; easy to containerize |
| **Apache Jena Fuseki** | Medium | Higher (JVM) | Most feature-complete; mature federation; heavier to host |
| **QLever** | Medium | Low per-triple, high build | Fastest for large graphs; overkill at our triple count |

**Recommendation: static dump first** (satisfies the federated acceptance query
offline), then **Oxigraph** as the cheapest hosted endpoint if a live
`SERVICE`-federation demo is wanted. The
[`sense_citation_dcsfreq.rq`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/standards/pwg-ru-lod/sense_citation_dcsfreq.rq)
already carries the commented `SERVICE` variant: once each graph sits behind its
own endpoint, the true cross-endpoint federation edge lights up by uncommenting
it. Until then the offline two-graph form is the canonical demonstration.

---

## 5. Dataset description metadata (VoID + DCAT) — **[AGENT]**

A published dataset needs a machine-readable descriptor so registries and crawlers
can index it. Write **`standards/pwg-ru-lod/void.ttl`** (VoID + DCAT): title,
license (`dcterms:license` → CC BY-SA 4.0, subject to §1c), `dcterms:publisher`,
an example resource, the **two graphs** (lexical + DCS-frequency) as `void:subset`
/ `dcat:distribution`, triple counts, and links to the SHACL profile and the
acceptance query. A **stub template** ships alongside this runbook at
[`../standards/pwg-ru-lod/void.ttl`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/standards/pwg-ru-lod/void.ttl)
— fill the counts from the real full-graph build (§8), not the fixture.

Also register the **`pwglex:` vocabulary at [LOV](https://lov.linkeddata.es/)**
(Linked Open Vocabularies): submit the vocabulary IRI, a short description, and
the namespace prefix via the LOV suggestion form. This makes the extension terms
discoverable and citable.

Mostly agent-writable; the one **[HUMAN]** confirm is `dcterms:publisher` /
`dcterms:creator` and the ORCID — use the canonical byline
(Dr. Mārcis Gasūns, ORCID [0000-0003-4513-884X](https://orcid.org/0000-0003-4513-884X)),
not a guessed value.

---

## 6. Versioning + DOI — **[AGENT]** prep → **[HUMAN]** submit

Route the full graph through [`/data-release`](https://github.com/gasyoun/Uprava):

1. **[AGENT]** — provenance README (source stores, generator version + model
   tier/version, build command, acceptance result), the
   [`/publish-safety-check`](https://github.com/gasyoun/Uprava) pass (§1b), and
   [`/cut-release`](https://github.com/gasyoun/Uprava) to promote the
   [`../changelog.md`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/changelog.md)
   `[Unreleased]` entries to a dated version + tag + GitHub release.
2. **[HUMAN]** — mint the **Zenodo concept + version DOI** (the concept DOI is the
   stable "all versions" identifier; each release gets its own version DOI) and
   round-trip the DOI back into `CITATION.cff`. Zenodo submission is the human
   `@DO` — an agent prepares the deposit metadata; a person presses submit.

Note the version DOI in the VoID descriptor (§5) so the dataset is self-citing.

---

## 7. Registration / discoverability — **[HUMAN]**

Once the release exists and dereferences:

- **[HUMAN]** Submit to **[lod-cloud.net](https://lod-cloud.net/)** — the LOD Cloud
  diagram. It wants: dataset title, description, the VoID/DCAT descriptor URL,
  example resource IRIs, license, `sameAs`/links to other datasets, contact, and
  a logo. Fill from the VoID file.
- **[HUMAN]** Cross-link to **[LiLa](https://lila-erc.eu/)** (the Latin lemma-bank
  the model deliberately mirrors). There is no published *Sanskrit* LiLa endpoint
  to `owl:sameAs` against yet; when one exists, the local `lila:Lemma` nodes take a
  one-line `owl:sameAs` add (already noted in
  [LOD_GRAPH.md](https://github.com/gasyoun/SanskritLexicography/blob/master/RussianTranslation/LOD_GRAPH.md)).
  Until then, link at the dataset level (VoID `void:target` / DCAT
  `dcat:qualifiedRelation`) and announce to the LiLa / LDK community.
- **[HUMAN]** Announce (LDK / Sanskrit-computational-linguistics channels); update
  the [`../standards/pwg-ru-lod/README.md`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/standards/pwg-ru-lod/README.md)
  "Publication status" section from "gated" to the live DOI + endpoint.

---

## 8. Full-graph build + validate before publish — **[AGENT]**

Everything above assumes a **green full-graph build**. Before any release ships,
run the generator on the **full** data (not the committed fixture) at the ruled
`--base-iri`, then the acceptance gate:

```sh
cd RussianTranslation                       # in gasyoun/SanskritLexicography
python src/export_lod.py all \
    --base-iri https://w3id.org/sanskrit-lexicon/pwg-ru/ \   # the §2 ruling
    --out-dir release
python src/lod_acceptance.py                # federated join + round-trip + SHACL; exit != 0 blocks publish
```

Only a **green** acceptance may be published. Notes:

- The full graph is **large** and **derived from gitignored stores** (the
  translation store + DCS frequency live in `RussianTranslation`, not in git), so
  this build runs where those stores exist, not in CI. CI validates the
  **fixture** only ([`release/fixture/`](https://github.com/gasyoun/SanskritLexicography/tree/master/RussianTranslation/release/fixture),
  4157 triples over `rakz` + `a`/`aMSa`/`aMSaka`).
- Regenerating the fixture, for reference:

  ```sh
  python src/export_lod.py lexicon  --keys-file release/fixture/fixture.keys --generated-at <date> --out-dir release/fixture
  python src/export_lod.py dcs-freq --keys-file release/fixture/fixture.keys --generated-at <date> --out-dir release/fixture
  ```

- The published `.ttl` dump + the per-resource static files (§3) are produced
  from this `release/` output.

---

## 9. Consolidated checklist

Work top to bottom; each row's prerequisite is above it. `[H]` = **[HUMAN]**,
`[A]` = **[AGENT]**, `[D]` = **[HUMAN-DECIDE]**.

| # | Step | Who | Prerequisite | Done when |
|---|---|---|---|---|
| 1 | Rule the release posture: wait for G5 vs labelled machine-preview (§1a) | `[D]` | — | Ruling recorded in GTD |
| 2 | Rule license composition: DCS-freq join ≤ CC BY-SA 4.0 (§1c) | `[D]` | — | Verdict + verbatim DCS terms recorded |
| 3 | Rule the IRI publication domain: w3id / samskrte.ru / Cologne (§2) | `[D]` | — | Domain chosen; becomes `--base-iri` |
| 4 | Register the w3id PURL (if option a) with the conneg `.htaccess` (§2) | `[H]` | #3 | PR merged into `perma-id/w3id.org` |
| 5 | Full-graph build at the ruled base IRI + green acceptance (§8) | `[A]` | #3 | `lod_acceptance.py` exits 0 on the full graph |
| 6 | `/publish-safety-check` on the release bundle (§1b) | `[H]` | #5 | GO verdict |
| 7 | Write `void.ttl` (VoID + DCAT) with real counts + confirm publisher/ORCID (§5) | `[A]`+`[H]` | #5 | `void.ttl` filled; publisher confirmed |
| 8 | Rule the SPARQL host: static dump vs Oxigraph/Fuseki/QLever (§4) | `[D]` | #5 | Host chosen |
| 9 | Stand up dereferenceable hosting (static Pages behind w3id) (§3) | `[H]`+`[A]` | #4, #6, #7 | IRIs return Turtle to machines, HTML to browsers |
| 10 | Register `pwglex:` at LOV (§5) | `[A]` | #7 | LOV suggestion submitted |
| 11 | `/data-release`: provenance + `/cut-release` version/tag/release (§6) | `[A]` | #6, #7 | Dated release cut |
| 12 | Mint Zenodo concept + version DOI; round-trip into `CITATION.cff` (§6) | `[H]` | #11 | DOI live; `CITATION.cff` updated |
| 13 | Submit to lod-cloud.net; cross-link LiLa; announce (§7) | `[H]` | #9, #12 | Dataset appears in the LOD Cloud |
| 14 | Flip [`../standards/pwg-ru-lod/README.md`](https://github.com/sanskrit-lexicon/csl-standards/blob/main/standards/pwg-ru-lod/README.md) status gated → live (§7) | `[A]` | #13 | README shows DOI + endpoint |

**The three rulings that block everything (#1–#3) are all `@DECIDE` rows in
[`Uprava/GTD_NEXT_ACTIONS.md`](https://github.com/gasyoun/Uprava/blob/main/GTD_NEXT_ACTIONS.md).**
Nothing downstream can start until they are made. #3 (IRI domain) already has a
row; #1 (release posture) and #2 (license composition) are added alongside it.

_Dr. Mārcis Gasūns_
