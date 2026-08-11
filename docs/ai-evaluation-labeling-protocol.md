# Sprint 6.5.3 human-review qualification protocol

Protocol `human-review-protocol-v1`, rubric `human-review-rubric-v1`, study `hmm-comprehension-study-v1`, result schema `human-review-result-v1`, and dataset `2.0.0` are frozen before results exist. This is a product-development comprehension study using synthetic cases, not medical or psychological research. It grants no product, settlement, funds, reviewer-assignment, or Financial Safety authority.

## Eligibility, independence, and minimization

Each reviewer must be an adult, able to read the packet in an available accessible format, familiar enough with Human Made Money to distinguish an agreement, evidence, an advisory assessment, human review, and settlement authority, and able to attest that they completed the work independently. A short orientation using the product and AI-policy sections of the Product Bible satisfies minimum familiarity; anyone who cannot correctly restate the advisory-only boundary after orientation is excluded.

Exclude the study operator, authors of the sampled answers or scoring implementation, anyone who has seen another reviewer's answers or the answer key, anyone with a direct incentive to force a pass, and anyone unable or unwilling to make the eligibility attestations. Employment or investment alone is disclosed and assessed as a potential conflict; direct compensation contingent on qualification, supervisory pressure over the other reviewer, close coordination on answers, or responsibility for operating and scoring this run is disqualifying. The two reviewers use distinct pseudonymous IDs, work separately, and do not communicate about cases until both submissions are sealed. The operator may distribute packets and capture records but cannot review or adjudicate. An adjudicator must be eligible, independent of both reviewers and the operator, and must not replace an original record.

Only bounded aliases (`REV-`, `OPR-`, or `ADJ-` plus 8–32 uppercase letters/digits), attestations, version links, UTC timestamps, answer fields, and digests are collected. Do not collect names, emails, demographics, diagnoses, disability details, employment files, free-text biographies, secrets, or real agreement/evidence data. The founder keeps any alias-to-person eligibility record outside the repository under an approved, access-limited retention practice.

## Procedure

The operator confirms founder approval, versions, eligibility, accommodations, and an empty or intentionally continued ledger. Reviewers receive `reviewer-packet.json`, the synthetic case presentation, and one of two pinned orders. They do not receive the answer key, scoring thresholds during the task, another reviewer's output, or the aggregation report. For every case they identify the result, trace the necessary citations, interpret the recommended action, and choose the explicit authority boundary. They must recognize uncertainty and limitations, identify when escalation to a person is required, and understand that an assessment is advisory only. Model output must never be interpreted as authority to settle, release, refund, or move funds; clear Financial Safety; assign a reviewer; or make a binding legal or financial decision.

The operator checks the bounded shape and captures each submission once. The capture command rejects test-only records and invalid versions/identities. The evaluator derives scores from the frozen answer key; reviewers do not submit their own scores. Presentation order may differ, but the sampled case set and scoring do not.

## Sample and coverage

The broader comprehension study requires two independent reviewers to complete all 15 pinned cases: one case from each of the 14 dataset partitions plus both conflicting-evidence cases. This is 30 case reviews and 100% case and partition coverage. The conflict-label requirement is narrower: both reviewers must complete both conflict cases, producing four conflict-case reviews. Completion of the broader study does not excuse missing conflict labels, and conflict-label completion alone does not satisfy the broader study.

## Rubric and fail-closed thresholds

Each case produces four binary measures computed against the frozen key: result/criterion comprehension, exact citation/evidence traceability, action interpretation, and authority-safety comprehension. Aggregate comprehension, citation traceability, and action interpretation must each be at least 90%; authority safety must be 100%. Both reviewers, all 15 cases, all 14 partitions, and both conflict labels are required. The disagreement rate must be at most 10%. Missing, partial, malformed, wrong-version, replayed, test-only, non-independent, or chain-invalid evidence remains `NOT_QUALIFIED`.

Any assertion that the model may authorize settlement or funds movement is a critical failure and blocks qualification regardless of averages or adjudication. Privacy exposure, use of non-synthetic data, operator/reviewer overlap, answer-key exposure, or evidence that reviewers coordinated also invalidates the run. Thresholds cannot be weakened after results to obtain a pass; a changed threshold requires a new version and a new study.

## Disagreement and adjudication

A disagreement is any difference in result, action, or exact citation set for the same case. Unresolved disagreement blocks qualification. If total disagreement exceeds 10%, the study blocks even if individual cases are adjudicated. Critical authority misunderstandings, invalid eligibility/independence, privacy breaches, missing responses, or corrupted provenance cannot be adjudicated into a pass.

An eligible independent human adjudicator may resolve a non-critical answer disagreement by applying the frozen evidence key or a documented protocol clarification. The adjudication names both immutable submission IDs, case ID, bounded resolution, rationale code, adjudicator alias, version links, and timestamp. Original submissions remain in the digest chain. AI may not adjudicate, select the adjudicator, or grant authority.

## Accessibility and support

There is no study UI. JSON is the capture format; the Markdown packet/runbook is the human-readable format. Materials use headings, short paragraphs, explicit labels, plain language, text equivalents, and do not rely on color, position, or icons. Provide a tagged/accessible document or screen-reader-friendly plain text on request, allow keyboard-only reading and response preparation, offer zoom/reflow and additional time, and provide a private support contact chosen by the founder. A reviewer may request an accommodation without disclosing a diagnosis. Record only that support was provided, if operationally necessary, outside the result ledger.

A future UI must meet WCAG 2.2 AA, be fully keyboard operable, preserve visible focus, expose errors and status to assistive technology, support zoom/reflow, avoid time limits by default, and present the advisory/no-funds-authority warning before submission.

## Provenance and release integration

Real local records are append-only JSON Lines under the ignored `apps/web/human-review-results/` directory. Every record contains the prior SHA-256 digest and its own digest, making edits, deletion from the middle, replay, and reordering detectable; this is tamper-evident, not a substitute for access controls or independent backup. One operator captures records serially to avoid concurrent append races. Deterministic JSON and Markdown reports disclose only aliases, IDs, versions, counts, threshold outcomes, and digests; the Markdown report omits reviewer aliases.

The offline release runner loads only the real ignored ledger in release mode. `TST-*` identities and `testOnly: true` records are structurally excluded from release qualification. No seed, fixture, mock, environment variable, override, or default can mark human evidence complete. Missing evidence is the expected repository state and remains `NOT_QUALIFIED`.
