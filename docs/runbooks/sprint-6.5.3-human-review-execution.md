# Founder runbook — Sprint 6.5.3 human-review execution

## Stop conditions

Do not begin until the founder approves every decision below. Do not use real customer, agreement, evidence, payment, health, identity, or other sensitive data. Do not make provider calls, access API keys, enable production, recruit or contact anyone through this workflow, or reuse Sprint 6.4 authorization/audit artifacts.

## Founder decisions required before assigning reviewers

Approve, in writing:

1. Protocol `human-review-protocol-v1`, rubric `human-review-rubric-v1`, study `hmm-comprehension-study-v1`, result schema `human-review-result-v1`, dataset `2.0.0`, and the precommitted thresholds.
2. The 15-case sample, two-reviewer minimum, 30 required reviews, 14-partition coverage, and separate four-review conflict-label requirement.
3. Each reviewer's eligibility and independence, including product orientation, conflicts, absence of answer-key access, and separation from the operator/scoring authors. Assign only a non-sensitive `REV-*` alias.
4. The operator and `OPR-*` alias. Confirm that person is not a reviewer or adjudicator and has no authority to alter answers.
5. A provisional eligible `ADJ-*` candidate or the process for selecting one, with independence from reviewers/operator. Adjudication may be unnecessary.
6. The two pinned presentation orders and blinding method; reviewers must not see the key or each other's work before sealing.
7. Available accessibility formats, extra-time policy, support contact/process, and the rule that no diagnosis disclosure is required.
8. Where the alias-to-eligibility verification record is kept, who can access it, how long it is retained, and when it is deleted. Do not put it in this repository.
9. Who may access and back up the ignored result ledger, the serial single-operator capture window, and how the final ledger head digest will be independently recorded.
10. The response if privacy, independence, provenance, critical-authority, or security controls fail: stop, retain evidence, investigate, and run a newly versioned study if validity is lost.

## Execute

1. Record approvals and verify the repository is at the intended commit with no real result ledger accidentally present.
2. Give each approved reviewer the accessible packet and assigned case order. Reiterate synthetic-only, independent work, data-minimization, and advisory/no-funds-authority boundaries.
3. Each reviewer prepares one bounded `reviewer_submission` matching `result-schema.json`. Use a random UUIDv4 submission ID, approved aliases, an actual UTC submission timestamp, `testOnly: false`, all five eligibility attestations, and exactly 15 responses. Do not include free text or personal data.
4. The operator validates and captures one file at a time from `apps/web` with `pnpm human-review:capture -- /absolute/path/to/bounded-result.json`. A rejected file is not appended; preserve it outside the repository for controlled correction and never reuse its submission ID after a successful append.
5. After both submissions, run `pnpm eval:offline`. Inspect `evaluation-reports/human-review-latest.json`, `human-review-latest.md`, `latest.json`, and `latest.md`. Confirm versions, 2 reviewers, 30/30 reviews, 15/15 cases, 14/14 partitions, 2/2 conflict labels, chain validity, threshold results, and zero network requests.
6. If there is disagreement, keep both submissions unchanged. If the disagreement is non-critical and the total rate is at most 10%, an approved independent adjudicator may produce one bounded adjudication record referencing both submission IDs. Capture it the same way, then rerun evaluation. A critical authority failure, excess disagreement, invalid independence, incomplete coverage, or provenance/privacy failure cannot be adjudicated away.
7. Independently compare the ledger head digest with the controlled record, review the Git commit and generated reports, and have the founder approve or reject closure. Do not commit the ignored real ledger or unnecessary personal data.

## Interpreting the outcome

`NOT_QUALIFIED` is the correct result for missing, partial, invalid, below-threshold, critical, or unresolved evidence. Do not edit thresholds, records, fixtures, or the manifest to force a pass. A valid `QUALIFIED` human-review gate is development evidence only: it does not authorize a provider call, production deployment, model enablement, settlement, funds movement, or legal/compliance conclusion.

After genuine results qualify, rerun the full offline evaluation, drift, security, database, build, dependency, and repository-integrity checks. Preserve the report and head digest according to the approved retention plan. Then make a separate founder decision on whether any tightly bounded synthetic live-provider canary is necessary; this sprint does not authorize one.
