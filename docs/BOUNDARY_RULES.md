# Boundary Rules

Date: 2026-06-03

Status: human decision. `csl-standards` is the standards/export path for CDSL
dictionary data.

## Mission

`csl-standards` tests how CDSL dictionary records can be validated, exported,
and published through external lexicographic standards.

It is technical infrastructure, not the public dictionary atlas and not the
GitHub/org observatory.

## Admission Test

A page, script, dataset, schema, report, or plan belongs here only if its
primary object is one of:

- a TEI profile, ODD, XML export, or validation rule;
- an OntoLex, Lexicog, RDF, JSON-LD, Turtle, or SHACL profile;
- a standards-facing neutral model used for export or validation;
- a loss report that explains what a standard cannot safely preserve;
- a publication profile for other lexicographic projects;
- a standards migration or reproducibility workflow.

If it does not start from standards/export/validation work, it does not belong
here.

## Belongs Here

- TEI validation of CDSL markup.
- TEI publication profiles for reuse by lexicographic projects.
- OntoLex stress tests that expose unsafe or lossy dictionary modeling.
- RDF/JSON-LD/Turtle and SHACL experiments that are clearly marked as pilot or
  publication-ready.
- Neutral models when they exist to compare standards, not to become a new
  atlas data layer.
- Migration notes for moving TEI/OntoLex work out of `csl-atlas`.

## Does Not Belong Here

- Reader-facing dictionary exploration, dictionary lookup, and atlas dashboards;
  those belong in `csl-atlas`.
- GitHub repository, issue, contributor, workflow, and org-health analytics;
  those belong in `csl-observatory`.
- DCS corpus data and passage dashboards; DCS data belongs in VisualDCS.
- Grammar research; it needs a separate future repository.
- FrAC implementation before corpus evidence is ready.

## FrAC Rule

FrAC is allowed here only as a documented future interface until VisualDCS or
another corpus-evidence source is ready. Do not build FrAC-derived data or UI
from dictionary-only evidence.

The migrated MW-PWG-PWK OntoLex pilot contains legacy FrAC-style attestation
nodes. Treat them as a stress test showing where the model becomes unsafe, not
as a publication-ready FrAC claim.
