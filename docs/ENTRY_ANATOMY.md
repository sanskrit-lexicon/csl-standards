# Entry anatomy — the parts of a CDSL headword record, as a standard

_Created: 05-11-2026 · Last updated: 05-11-2026_

This note graduates the entry-anatomy canon from a machine-local skill
([`entry-anatomy` SKILL.md](https://github.com/gasyoun/claude-config/blob/main/skills/entry-anatomy/SKILL.md),
built under [H791](https://github.com/gasyoun/Uprava/blob/main/handoffs/archive/H791-Opus_claude-config_entry-anatomy-dict-skill_12.07.26.md))
into a repo standard: the labelled anatomy of a Cologne (CDSL) headword — which
structural parts a Sanskrit dictionary entry is made of, how they are read
straight off the source markup, and what each part is called. The skill remains
the **producer** (it renders the tinted HTML/JSON teaching assets); this
document is the **canon** the producers and any future consumer implement
against. Graduation contract: nothing from the skill is dropped; the two stay in
sync, this document being the normative surface.

## 1 — Why the anatomy is read, not guessed

The CDSL source is *already structured markup* (not flat print): the parts of an
entry are read straight off the tags rather than inferred from typography. This
is the same fact that makes the export profiles of this repo possible — the
neutral model and the TEI/OntoLex/MDF/LIFT mappings all key off these parts —
and it makes the anatomy a *standard* rather than a per-dictionary impression.

## 2 — The uniform skeleton

The `<L>…<LEND>` skeleton is uniform across all ~44 CDSL dictionaries:

- `<k1>` — the lemma key: the SLP1, accent-stripped search form (`kAla`, `guru`,
  `agni`), **not** Devanāgarī;
- `<k2>` — the display headword (Devanāgarī);
- `<pc>` — homonym index;
- `¦` — the body separator between header material and the entry body;
- `<lex>` — grammar-tagged material (gender/POS);
- `<ls>` — source citations (`RV.`, `MBh.`, `VS.` …);
- `<ab>` — abbreviation-shaped spans.

Only the **inline content markers** differ per dictionary family (§4).

## 3 — The parts taxonomy

Each matching entry is dissected into exactly these labelled parts:

| Part | Content |
| --- | --- |
| headword/lemma | Devanāgarī + IAST + source key (`<k1>`/`<k2>`) |
| homonym index | `<pc>` |
| grammar tag | gender / part of speech (`<lex>`) |
| etymology | root / derivation / compound analysis |
| Sanskrit forms | cited inflected and derivational forms |
| sense markers | the entry's sense-division apparatus |
| gloss/definition | the translation material |
| source citations | `<ls>` sigla with loci (`RV.`, `MBh.`, `VS.` …) |
| cross-references | `cf.` / `Vgl.` / `q.v.` |
| attested inflected forms with corpus loci | Grassmann's signature (`<div n=…>` in GRA) |

## 4 — Inline content markers per dictionary family

- **MW** — `<s>` senses, `<info>` supplementary material;
- **PWG / AP90 / GRA** — `{#…#}` Sanskrit spans, `{%…%}` gloss spans;
- **AP90** — additionally `{@N@}` sense numbers;
- **GRA** — additionally `<div n=…>` attested forms with corpus loci.

**To cover a new dictionary:** add one `DICT_MAPS[key]` entry with its `name`,
its `inline` marker list, and its `etym` regex — the render is shared, no other
change. (`mw`, `pwg`, `ap90`, `gra` ship built-in.)

## 5 — Products and consumers

The producer emits a self-contained, theme-aware **HTML** page (light+dark; one
card per matching entry, every part colour-coded, legend-labelled — safe to
embed in Docusaurus MDX, a lesson, or kosha) and a **JSON token stream**
(`--format json`; each token `{part, text}`) for programmatic re-rendering.
Registered consumers (each a separate wiring task, not done by the producer):
**csl-guides** — a "How to read a Sanskrit dictionary entry" MDX page (public,
SEO); **Systema-Sanscriticum** — an interactive learner-track lesson asset;
**kosha** — entry-structure explainer alongside the API; **pwg_ru / pwg_en**
(RussianTranslation) — anatomy of the German source entry beside its
translation, as a translator aid.

## 6 — Caveats (stated, not hidden)

- **Value is pedagogical/onboarding**, not research — a teaching asset (Tier
  0/1), not a data deliverable.
- **Nested markup** (an `<ls>` citation inside a `<lex>` grammar tag) is
  flattened into its outer part; the citation-ness of the inner span is not
  separately tinted. Fine for a teaching diagram, imperfect as a parser.
- **Etymology tagging is heuristic** (first etymology-shaped span); verify on a
  new dictionary before trusting it.
- **Devanāgarī rendering** relies on a system/site font (`Noto Sans
  Devanāgarī` / `Nirmala UI`); when embedding in an Artifact, inline the font as
  a data-URI (external fonts are CSP-blocked there).
- The headword argument is the **SLP1 `<k1>` key** (accent-stripped search
  form), not Devanāgarī; `--all-homonyms` renders every `<k1>` match (e.g. both
  *kāla*s), not just the first.

**Visual counterpart:** for the annotated-*picture* form — callout labels wired
by leader lines to an entry, print PDF + interactive web — use the
[`entry-specimen`](https://github.com/gasyoun/claude-config/blob/main/commands/entry-specimen.md)
command (this canon is the tinted-text breakdown; that one is the leader-line
specimen sheet).

## 7 — Producer reference

The producer script lives with the skill
(`entry_anatomy.py`; `--csl-root` auto-detects a sibling `csl-orig/` checkout;
needs `indic_transliteration` for the Devanāgarī/IAST header, degrading to the
raw `<k2>` key if the library is absent). Facts dossier for the graduation:
[A68_PD_TRENDS_GRILL_FACTBASE_2026-11-05.md](https://github.com/gasyoun/Uprava/blob/main/reports/A68_PD_TRENDS_GRILL_FACTBASE_2026-11-05.md) §3
(entry-anatomy canon was machine-local; this doc is the graduation).

_Dr. Mārcis Gasūns_
