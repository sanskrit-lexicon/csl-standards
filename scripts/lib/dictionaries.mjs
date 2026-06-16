// Dictionary registry. Adding a dictionary beyond the MW/PWG/PWK tri-dict backbone
// is a one-line change here: list it in OPTIONAL_DICTS and give it a label + source
// location. Optional dictionaries are attached per case (when they share the
// headword) on the OntoLex/semantic side; the TEI archival/Lex-0 profiles and the
// published loss corpus stay the tri-dict backbone.

export const CORE_DICTS = ["mw", "pwg", "pwk"];
export const OPTIONAL_DICTS = ["ap90", "gra"];
export const ALL_DICTS = [...CORE_DICTS, ...OPTIONAL_DICTS];

export const DICT_LABEL = {
  mw: "Monier-Williams 1899",
  pwg: "Boehtlingk-Roth PWG",
  pwk: "Boehtlingk PWK",
  ap90: "Apte 1890",
  gra: "Grassmann Wörterbuch zum Rig-Veda"
};

// Source location relative to the csl-orig v02 directory (CDSL layout).
export const DICT_DIR = { mw: "mw", pwg: "pwg", pwk: "pw", ap90: "ap90", gra: "gra" };
export const DICT_FILE = { mw: "mw.txt", pwg: "pwg.txt", pwk: "pw.txt", ap90: "ap90.txt", gra: "gra.txt" };
