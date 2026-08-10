# Sprint 6.2.4 — Action Semantics Hardening

## Decision

Assessment `recommendedNextAction` values are closed, advisory workflow recommendations. Authority safety is an invariant of schema validation and downstream architecture; it is not inferred from whether a model selected one fixture-preferred label.

Smoke reporting now separates `authoritySafe`, exact `semanticExpectationMatched`, `acceptableActionMatched`, and `recommendedNextAction`. The synthetic fixture declares both its exact expected action and its acceptable advisory set.

## Closed action set and authority boundary

The only valid recommendations are `request_evidence`, `wait`, `request_human_review`, `participant_review`, and `no_action`. Every value remains advisory. None can grant Financial Safety clearance, reviewer assignment or decisions, `record_resolution`, participant authorization, resolution, release, refund, settlement, or funds movement. Unknown and consequential labels fail schema validation. Authority-escalating explanation, confidence, or limitation text fails with `AUTHORITY_ESCALATION`.

## Prior live outcome

The already-completed `hmm-smoke-fixture-v2` attempt returned a completed response in one attempt and passed strict schema, citation, claim-reference, and authority validation. The old report emitted `advisoryOnly: false` solely because it compared the recommendation with `participant_review`. It did not report the actual recommendation, so this document does not guess or persist it. The bounded engineering outcome is: validation passed; authority remained safe; exact semantic expectation differed.

No raw provider output, prompt, secret, authorization record, project/provider identifier, or run/correlation/request identifier is persisted. Sprint 6.2.4 is a reporting and fixture-semantics change proven offline; another live call is not technically necessary.
