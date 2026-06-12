# Practice Checks For csl-standards

Use these checks for API profiles, schemas, parity reports, roadmaps, and normative documentation.

## Schema invariants
Why this is needed here:
- Standards PRs define contracts that downstream repos implement later.
- A mixed or ambiguous field name here propagates into API controllers, parity scripts, and handoff docs.

Before merge, add to the PR:
- Field contract: exact meaning, allowed values, forbidden values, null/fallback meaning, source of truth.
- Axis split check: confirm a field does not mix concept, location, type, confidence, or processing status.
- Negative examples: cases that must fail, stay unknown, or remain out of scope.
- Compatibility note: downstream consumers that must change or remain unchanged.

## PR slicing
Use a separate PR when the standard mixes:
- normative contract changes,
- generated schema artifacts,
- parity/loss reports,
- roadmap or handoff docs.

Preferred sequence:
- contract/profile decision,
- machine schema update,
- parity or loss report,
- roadmap/handoff update.

## Narrow review prompt
Suggested prompt:

```md
Please check whether the changed contract fields each represent exactly one concept and whether the machine schema matches the normative profile. Ignore prose polish unless it changes the contract.
```

## PR checklist
- [ ] Changed fields have exact meanings and forbidden values.
- [ ] Machine schema and normative docs agree.
- [ ] Downstream compatibility is named.
- [ ] Review request asks one contract question.
