# Salt API Phase 0 Checklist

Date: 2026-06-20
Status: Phase 0 contract handoff complete; Phase 1 implementation lives in `csl-apidev`.

Phase 0 packages the Salt API contract so `csl-apidev` can implement it without guessing at
wire shape, field names, or loss policy. The next engineering track is the server work in
`csl-apidev`; `csl-standards` owns the contract artifacts below.

## Contract Artifacts

| Artifact | Role | Phase 0 state |
|---|---|---|
| [`SALT_API_PROFILE.md`](SALT_API_PROFILE.md) | Normative prose profile: endpoints, query parameters, entry envelope, `csl` extension object, versioning. | Ready for implementation. |
| [`SALT_API_PROFILE.ru.md`](SALT_API_PROFILE.ru.md) | Russian mirror of the profile for project coordination. | Present; keep synchronized when the normative profile changes. |
| [`../data/schema/salt-api.openapi.yaml`](../data/schema/salt-api.openapi.yaml) | OpenAPI 3.1 REST contract for `/dicts/{id}/restful/entries`, `/ids`, and `/graphql`. | Ready for implementation and client generation. |
| [`../data/schema/salt-api.graphql`](../data/schema/salt-api.graphql) | GraphQL SDL for `entries` and `ids`, including the additive `CslExtension`. | Ready for implementation. |
| [`SALT_API_LOSS_REPORT.md`](SALT_API_LOSS_REPORT.md) | CSL ↔ C-SALT divergence catalogue. | Ready as the Phase 1/3 parity ledger. |
| [`SALT_API_INTEGRATION_ROADMAP.md`](SALT_API_INTEGRATION_ROADMAP.md) | Implementation path for `csl-apidev`. | Phase 0 refreshed; Phase 1 is MW REST pilot. |

## Phase 1 Handoff

The first `csl-apidev` implementation slice is the MW pilot. Its deploy handoff lives in `csl-apidev/doc/salt_api_handoff.md`; this repository remains the contract source:

1. Serve `/dicts/mw/restful/entries` and `/dicts/mw/restful/ids`.
2. Preserve the C-SALT top-level entry fields exactly.
3. Place Cologne-only data in the additive `csl` object.
4. Return `xml: null` until TEI-P5 conversion lands; never place CSL display XML in the
   C-SALT `xml` slot.
5. Implement headword search modes first: `term`, `prefix`, `wildcard`, and `fuzzy`; return HTTP 400 for `regexp`/body-search modes until Phase 4 indexing exists.
6. Return HTTP 400 for body-search modes that are not yet indexed, rather than returning
   silent empty results.
7. Record parity findings and divergences in `SALT_API_LOSS_REPORT.md`.

## Validation Expectations

For this repository, Phase 0 validation is static:

- OpenAPI and GraphQL artifacts are present and linked from the normative profile.
- The public package scripts remain unchanged except for the scale-check harness.
- Normal repository gates continue to pass.

For `csl-apidev`, Phase 1 validation compares a fixed MW headword list against
C-SALT and record entry count, `id`, `headword_slp1`, `sense[]`, `re_headwords_slp1[]`, and
the `csl` extension payload shape.
