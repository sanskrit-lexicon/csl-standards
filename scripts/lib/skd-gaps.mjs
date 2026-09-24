// Registry of the places where the indigenous Śabdakalpadruma (SKD) apparatus
// has no — or only a partial — TEI Lex-0 home (H5321). The parser tags every
// sample entry with the gap ids it exhibits; the exporter witnesses each on the
// entry as <note type="lex0-gap" n="Gx">; the validator checks both directions.
// Prose with worked examples: docs/TEI_LEX0_SKD_GAPS.md.
//
// class:
//   no-home          — Lex-0 has no element/attribute for the structure; the
//                      export uses a typed workaround and declares the loss.
//   partial-home     — a Lex-0 element exists but drops part of the meaning.
//   digitisation     — not the kośa's own apparatus (CDSL layer); listed so the
//                      indigenous gaps are not confused with digitisation ones.
// corpusMarker: key into skd-lex0-sample.json corpus.markers (positive-marker
// count over all SKD records — a lower bound, never an absence claim).

export const SKD_GAPS = [
  {
    id: "G1",
    title: "iti-unit: sense and closing authority fused",
    class: "no-home",
    structure: "A run of meanings/synonyms is closed by `iti <authority>`; the authority formula is the boundary of the sense unit, not detachable apparatus.",
    lex0Lacks: "Lex-0 separates <sense>/<def> from <bibl>; it has no construct in which the attestation *is* the sense boundary.",
    workaround: "Each authority group = one <sense>; the formula as <bibl type=\"kosa-authority\"> inside it, plus <note type=\"model-loss\">; entry declares <note type=\"entry-convention\">kosa-iti-unit</note> (ODD csl-lex0-kosa-sense-boundary).",
    corpusMarker: "kosaAuthority"
  },
  {
    id: "G2",
    title: "Anubandha slot (it-letters) on a root entry",
    class: "no-home",
    structure: "Right after `¦` a root carries Vopadeva's it-letters (`aka¦, i Na gatyAM`): code letters for gaṇa and morphophonemic operations, decoded only through the Dhātudīpikā key in SKD's front matter.",
    lex0Lacks: "Lex-0 <gramGrp> has <pos>/<gen>/<gram>, but no category for an operation-code letter whose meaning lives in the dictionary's front matter.",
    workaround: "<gram type=\"anubandha\" resp=\"#source\"> per it-letter as printed; the M4 decode as <gram type=\"gana\">/<gram type=\"pada\"> with resp=\"#m4\" (derived, cert high).",
    corpusMarker: "rootSlot"
  },
  {
    id: "G3",
    title: "Zero-meaning: a marker's absence is itself a statement",
    class: "no-home",
    structure: "An empty slot means 'no anubandha' (front matter: a dot or zero); an unmarked pada is the parasmaipada default. The source asserts by silence.",
    lex0Lacks: "Lex-0 cannot distinguish 'the source states X is absent' from 'the source says nothing' — an omitted <gram> reads as unknown, a filled one over-asserts.",
    workaround: "Empty slot → <gram type=\"anubandha\" norm=\"none\">; an unmarked pada or unresolved gaṇa is NOT asserted but explained in <note type=\"zero-meaning\">.",
    corpusMarker: "rootZeroSlot"
  },
  {
    id: "G4",
    title: "Dhātupāṭha commentary layer inside the entry",
    class: "no-home",
    structure: "After the Kavikalpadruma line, Durgādāsa's commentary re-states each it-letter before the form it licenses (`i aNkyate . Na aNkate`) and closes with `iti durgAdAsaH`.",
    lex0Lacks: "No Lex-0 home for an attributed commentary nested in an entry, nor for forms keyed to the grammatical operation that produces them.",
    workaround: "<note type=\"commentary\" resp=\"#source\"> with <bibl><author>Durgādāsa</author></bibl> and the IAST text (capped at 600 chars; archival profile keeps the source).",
    corpusMarker: "kavikalpadrumaCommentary"
  },
  {
    id: "G5",
    title: "Paryāya run: an authority's numbered synonym list",
    class: "partial-home",
    structure: "`tatparyyAyaH . X 2 Y 3 …` — synonyms numbered from the kośa verse (the headword is no. 1), bound to the authority that closes the run.",
    lex0Lacks: "<xr type=\"synonymy\"> exists, but carries neither the verse ordinal nor the binding of the list to one authority.",
    workaround: "Kept inside the authority-bounded sense as `paryāya: …` in <def> (the iti-unit stays intact); ordinals dropped and declared in the model-loss note.",
    corpusMarker: "paryaya"
  },
  {
    id: "G6",
    title: "Bhāṣā gloss: vernacular equivalent without a language name",
    class: "partial-home",
    structure: "`akejuyA iti BAzA` — 'in the vernacular (bhāṣā)': a Bengali (occasionally Hindi) equivalent written in Sanskrit orthography.",
    lex0Lacks: "<cit type=\"translationEquivalent\"> needs an @xml:lang; the source names only 'the vernacular', so any language tag is an inference.",
    workaround: "<cit type=\"translationEquivalent\" xml:lang=\"bn-Latn\"> with cert=\"medium\" resp=\"#machine\" on the language attribution; the gloss itself resp=\"#source\".",
    corpusMarker: "bhasa"
  },
  {
    id: "G7",
    title: "Scoped cross-reference (`asya guRAH XSabde drazwavyAH`)",
    class: "partial-home",
    structure: "'For its properties, see under X': the reference defers only one aspect (guṇāḥ, the rest, the account) of the entry to another headword.",
    lex0Lacks: "<xr> has @type but no way to state which part of the entry's content is deferred.",
    workaround: "<xr type=\"see\"> with the scope as <lbl> and the target as <ref type=\"entry\">; unscoped references use <xr type=\"see\"> alone.",
    corpusMarker: "crossRefScoped"
  },
  {
    id: "G8",
    title: "Nibandha: treatise prose inside an entry",
    class: "no-home",
    structure: "Entries of 4,000+ characters embed ritual, medical, narrative or śāstric discussion with its own paragraphs, quotations and attributions (e.g. agniH L211).",
    lex0Lacks: "Lex-0 excludes free prose (<dictScrap>) and has no container for an encyclopaedic discourse attached to a lemma.",
    workaround: "Only the kośa-like head becomes senses; the remainder is summarised in <note type=\"unparsed-prose\"> (extent, quotations, attributions, opening) — never forced into <def>.",
    corpusMarker: "nibandha"
  },
  {
    id: "G9",
    title: "Quotation attributed by a following `iti <work>`",
    class: "partial-home",
    structure: "A literary quotation “…” is followed by `iti <work>` (iti tiTyAditattvaM); which sense it illustrates is given only by position.",
    lex0Lacks: "<cit type=\"example\"> must sit in one <sense>; the source gives no sense link, only adjacency.",
    workaround: "Attached to the sense group it follows, with @subtype=\"positional\" on the <cit> so the link is marked as inferred from position.",
    corpusMarker: "quotation"
  },
  {
    id: "G10",
    title: "Liṅga-based word class (triliṅga, avyaya)",
    class: "partial-home",
    structure: "The indigenous class is given by gender behaviour: `tri` (takes all three genders — an adjective) and `vya` (avyaya, indeclinable).",
    lex0Lacks: "Lex-0 <pos> assumes a part-of-speech taxonomy; 'triliṅga' is a morphological (gender) criterion, not a POS.",
    workaround: "<pos norm=\"adjective\"|\"indeclinable\" resp=\"#machine\"> plus the printed token as <gram type=\"linga\" resp=\"#source\">tri|vya</gram>.",
    corpusMarker: "triliṅga"
  },
  {
    id: "G11",
    title: "Derivation as grammatical analysis (sūtra, samāsa, Uṇādi)",
    class: "partial-home",
    structure: "The etymology parenthesis is a Pāṇinian derivation: root + affix, a sūtra reference (7.2.27), a compound type (naYsamAsaH) or an Uṇādi sūtra.",
    lex0Lacks: "<etym> holds <mentioned>/<lbl>/<bibl>, but has no slot for the rule applied or the compound type as analysis.",
    workaround: "<etym type=\"derivation\"> with <mentioned> for root + affix, the full analysis in <note type=\"analysis\">, and the sūtra/Uṇādi reference as <bibl>.",
    corpusMarker: null
  },
  {
    id: "G12",
    title: "CDSL correction layer `{{old->new|…}}` (digitisation, not indigenous)",
    class: "digitisation",
    structure: "csl-orig embeds editorial corrections with date, editor and issue URL inside the SKD text.",
    lex0Lacks: "Lex-0 has no change-tracking inside <orth>/<def>; corrections belong to the digitisation, not to the kośa.",
    workaround: "The corrected reading is exported; each correction is witnessed in <note type=\"cdsl-correction\"> with its issue URL.",
    corpusMarker: "cdslCorrection"
  }
];
