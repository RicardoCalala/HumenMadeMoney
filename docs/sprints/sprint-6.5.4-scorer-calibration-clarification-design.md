# Sprint 6.5.4 scorer-calibration clarification design

Status: **DESIGN ONLY — FOUNDER REVIEW REQUIRED — NO CALIBRATION OR RECRUITMENT AUTHORIZED**

HMM state: **`NOT_QUALIFIED`; 0/2 release reviewers; 0/30 genuine release-gating reviews**

Current execution baseline: `74c26e063c91c3b91772090f18d90f9aa82c786d` (**preserved; not repinned by this design**)

## 1. Purpose and boundary

The frozen Sprint 6.5.4 materials require two independent scorers to pass calibration before first participant contact, but they do not define an executable scorer-specific threshold, eligibility procedure, retry rule, administration/key-reveal sequence, or private evidence contract. This design closes that prospective governance gap without changing any participant-facing artifact, restricted fixture, approved digest, execution baseline, real-person record, or qualification result.

This document is not a calibration protocol and is not authority to implement or administer one. It does not authorize recruiting or contacting participants, assigning real aliases, exposing restricted materials, creating calibration results, contacting `A-01`, using a provider or API key, making network or database writes, enabling production, or changing Sprint 6.4, Sprint 6.5.3, or frozen Sprint 6.5.4 artifacts.

Section 10 of [`sprint-6.5.4-comprehension-validation-design.md`](sprint-6.5.4-comprehension-validation-design.md) defines cohort-level validation gates. Its 10/12, 2/3, 90% inter-rater agreement, and kappa thresholds are not scorer-calibration thresholds and must never be imported, inferred, or reused as such.

## 2. Calibration construct

Calibration is a role-eligibility control. It is intended to establish, before a scorer sees any participant response, that the scorer can independently and reproducibly apply the exact frozen four-label rubric to synthetic examples across:

- safe semantic equivalents and ordinary-language umbrella statements;
- omissions and partial demonstrations;
- ambiguity, hedging, conditional authority, and double negatives;
- direct and indirect unsafe autonomous authority;
- actor, authority, consequence, separate-control-path, and negation preservation; and
- the distinction between an exact four-label judgment and the binary `unsafe` versus `not unsafe` safety boundary.

Calibration does not prove general intelligence, employment suitability, legal expertise, product validity, participant comprehension, scorer agreement on real responses, or HMM qualification. A calibration pass only makes the scorer eligible to score under the approved protocol version. Calibration evidence can never enter a participant denominator, cohort aggregate, release-gating review count, or qualification decision.

## 3. Eligibility, conflicts, and separation

Before alias assignment or fixture access, the private administration record must capture a bounded true/false attestation from each proposed scorer and an administrator verification. Every item below must be true unless expressly marked as an exclusion:

1. The scorer is a real adult who voluntarily accepts the role and can access the frozen rubric and approved accessible fixture presentation without interpretation assistance.
2. The scorer has not authored, edited, approved, implemented, or tested the orientation, instrument, rubric, restricted calibration fixtures/key, evaluator, result schema, report logic, or this calibration implementation.
3. The scorer has not previously seen any calibration fixture, expected label, answer key, participant response, other scorer submission, cohort result, or desired outcome for this protocol version family.
4. The scorer is not the study operator, calibration administrator, key custodian, adjudicator, privacy/recovery owner acting on the same evidence, or the other scorer.
5. The scorer will not recruit, screen, schedule, orient, administer, capture, adjudicate, operate the ledger, reveal the key, or record the other scorer's result.
6. The scorer has no supervisory, financial, household, close personal, authorship, reporting-line, or outcome-contingent relationship that could reasonably pressure a result or impair independent judgment.
7. Compensation, if any, is fixed and independent of calibration outcome, participant labels, cohort outcome, or HMM qualification.
8. The scorer can work privately, will not collaborate or use external assistance, and will disclose any accidental exposure, uncertainty about identity/alias, or procedural deviation immediately.
9. The scorer agrees to use only the frozen rubric and presented restricted subset, to keep materials confidential, and not to copy, retain, photograph, transmit, summarize, or reproduce them outside the approved controlled location.
10. The scorer can submit a complete locked label for every presented fixture before key reveal and understands that no label can be edited after lock.
11. The scorer is blinded to real identities, contact slots, group, recruitment source, the other scorer's labels, cohort aggregates, desired outcome, and all participant responses during calibration.
12. The scorer has no undisclosed conflict or exposure and knows of no reason the independence claim would be misleading.

Any false, missing, uncertain, stale, or unverifiable attestation is disqualifying. So are prohibited authorship or exposure; overlapping operator, administrator, key-custody, scorer, or adjudicator duties; attempted collaboration or external assistance; copying or retaining restricted content; unblinding; identity/alias uncertainty; outcome-contingent incentives; refusal to attest; or a material protocol deviation. A disqualified person receives no fixture access, or access stops immediately if already begun. A founder cannot waive these conditions and still describe the resulting scoring as eligible independent validation. If staffing cannot satisfy them, the evidence remains informative only and recruitment stays blocked.

Eligibility must be re-attested if the protocol, rubric, fixture dataset, scorer role, access list, conflict facts, or custody arrangement changes, or if any exposure incident occurs.

## 4. Alias timing and format

No scorer alias is reserved during identification, invitation, conflict screening, or role discussion. After all eligibility attestations are completed and verified in the private identity record, but before any restricted fixture or key access, the administrator assigns a cryptographically random alias matching `SCR-[A-Z0-9]{8,32}`. The alias must be unique within the version family and must not encode a name, initials, email, employer, role, group, order, or pass/fail state.

The real identity-to-alias mapping remains in the separately controlled private identity record outside Git and outside the study system. Calibration submissions, eligibility ledgers, reports, and Git-tracked synthetic tests use only schema-valid aliases or `TST-SCR-*` test identities. Alias issuance does not establish eligibility; the scorer becomes eligible only after a recorded calibration pass.

## 5. Existing fixture-set sufficiency

Read-only structural inspection of the frozen restricted semantic dataset at `apps/web/tests/fixtures/ai-evaluation/orientation-validation/semantic-fixtures.json` found six synthetic fixtures: two keyed `demonstrated`, one `not_demonstrated`, one `ambiguous`, and two `unsafe`. The fixture text is not reproduced here.

That structure does **not** support both a representative primary subset and a genuinely separate remediation/recalibration subset. A non-overlapping split cannot give each attempt all four labels, more than one unsafe domain, both semantic-equivalence patterns, ambiguity, and partial-demonstration coverage. Reusing failed items would disclose their keys and convert retry into recall rather than calibration.

Implementation must therefore create a new restricted dataset version with two predeclared, non-overlapping subsets. The current six fixtures may remain frozen and may be migrated only by explicit item identity into at most one subset of the new version; no item may occur in both. Each subset must independently cover all four labels, both safe semantic-equivalence/umbrella behavior and unsafe authority behavior, ambiguity, partial demonstration, conditional language, and the applicable critical domains. Subsets must be comparable in difficulty and coverage, with their assignment and item order frozen before any scorer access.

Recommended minimum: **10 scorable fixtures per subset**, including at least two `unsafe`, at least two `ambiguous`, at least two safe semantic-equivalence or umbrella items, and at least one `not_demonstrated`, with no shared fixture, paraphrase pair, answer-bearing template, or substantively equivalent failed item across subsets. The final implementation review must justify any larger count and mechanically prove non-overlap and coverage.

## 6. Pass thresholds and critical errors

A scorer passes an attempt only when all of the following hold on that attempt's complete locked submission:

1. **100% binary unsafe-boundary accuracy:** every fixture is correctly classified as `unsafe` or `not unsafe`. Both unsafe false negatives and unsafe false positives fail the attempt.
2. **At least 90% exact four-label agreement** with the frozen key, using an integer numerator and denominator and no rounding up. With the recommended 10 fixtures this is at least 9/10; with 12 it is at least 11/12.
3. **Zero critical-boundary errors.** A critical-boundary error is: any binary unsafe mismatch; labeling a key-`ambiguous` critical-authority item `demonstrated`; labeling a response that lacks an actor, consequential boundary, separate control path, or required negation as `demonstrated` when the key marks that omission critical; or contradicting a predeclared non-waivable key constraint.
4. Every fixture has exactly one schema-valid label, the submission passes integrity checks, and every required attestation remains true.

The 100% unsafe boundary plus at least 90% exact agreement is appropriate because unsafe misclassification has asymmetric product-safety consequences, while one noncritical distinction among `demonstrated`, `not_demonstrated`, and `ambiguous` in a sufficiently broad set can be remediable without pretending that semantic scoring is purely mechanical. The additional zero-critical-error rule prevents a nominal 90% pass from hiding a safety-relevant ambiguous-to-demonstrated mistake. These thresholds are calibration-specific and require founder approval; they are not derived from cohort Section 10.

Denominators may not exclude skipped, ambiguous, challenged, timed-out, or incorrectly formatted items. Missing or invalid labels fail the attempt. No kappa, average between attempts, compensation, administrator judgment, other scorer result, or cohort threshold may replace or soften these gates.

## 7. Ambiguity and semantic equivalence

Scorers judge meaning, not vocabulary. A semantic equivalent is keyed `demonstrated` only when the original synthetic response preserves the relevant actor, the advisory-versus-decisional authority boundary, the consequential action, the separate human/deterministic control path where required, and negation. An umbrella statement may demonstrate multiple concepts only where the frozen fixture key explicitly maps it and no statement contradicts it.

`not_demonstrated` means evidence is absent or insufficient; it is not automatically unsafe. `ambiguous` applies when plausible readings cross the authority boundary or the actor, scope, condition, or negation is unresolved. `unsafe` requires an affirmative grant of independent consequential authority under the frozen rubric. An expected `ambiguous` label is a scored key, not permission for the administrator to accept multiple labels after seeing a submission.

Every fixture must have a pre-frozen expected label, binary unsafe status, critical-error flag, coverage tags, and concise restricted key rationale. No live semantic-equivalence ruling may be invented during comparison. If the administrator discovers a genuinely defensible alternate label, defective key, leaked item, or substantively duplicate cross-subset item, the attempt is `invalid_fixture_set`, not pass or fail. Stop all calibration, preserve minimum incident evidence, repair through a new dataset version and approval, and do not selectively drop the challenged item or recompute results after exposure.

## 8. Exact blinded administration sequence

The implemented protocol must enforce this order without shortcuts:

1. **Eligibility:** create and verify the private eligibility/conflict/separation attestation. No alias and no restricted access yet.
2. **Alias:** assign one random schema-valid `SCR-*` alias; seal the identity mapping separately; record only the mapping-record digest in the calibration ledger.
3. **Access preparation:** verify approved protocol/dataset/subset/key digests, subset non-overlap, access list, private workspace, no external assistance, and that the scorer has not seen either subset. The key remains inaccessible to the scorer and presentation operator.
4. **Restricted presentation:** present only the assigned frozen primary subset and frozen rubric in the approved order. Do not show expected labels, critical flags, rationales, retry subset, other scorer material, participant material, or outcome information.
5. **Independent scoring:** the scorer independently labels every fixture. The administrator may resolve access/mechanical problems only and may not interpret, hint, coach, confirm, or reject a label.
6. **Locked submission:** validate completeness and schema, record the item-order and submission digests, timestamp, attestations, and append-only chain link, then cryptographically or operationally lock the submission. No edit, correction, or withdrawal of a label is allowed after lock.
7. **Key reveal and deterministic comparison:** only after lock, the key custodian releases the exact subset key to the comparison function or non-scoring administrator. Compute binary unsafe accuracy, exact four-label accuracy, critical errors, and pass/fail deterministically. The scorer may receive bounded category-level remediation after the attempt, but never the retry subset or key.
8. **Pass/fail recording:** append a private result linked to the locked submission and key/dataset digests. A pass marks the alias eligible for the exact approved protocol/rubric/dataset version. A first failure marks it `remediation_required`; a second failure marks it `ineligible_replace`.

The two proposed cohort scorers complete calibration separately and cannot see each other's fixtures, order, labels, rationales, scores, result, or remediation. Passing one scorer cannot compensate for the other.

## 9. Remediation, retry, and replacement

Maximum attempts per scorer per calibration version family: **two**—one primary attempt and one recalibration attempt. There is no third attempt, averaging, best-item merge, threshold reduction, or founder waiver.

After a first failure, remediation is limited to one documented review of the frozen rubric, label definitions, decision procedure, and category-level error counts. It must not reproduce failed fixture text, disclose item-by-item answers or key rationales, rehearse the retry subset, create paraphrases of retry items, or coach toward a known answer. The scorer must re-attest independence and non-exposure before retry.

Retry requires the separately frozen remediation subset described in Section 5. It must share no fixture, failed item, substantive paraphrase, answer-bearing template, or revealed key with the primary subset. The same full pass thresholds apply independently to the complete retry submission; the first attempt is not averaged or combined with it. Any failed-item reuse, overlap, premature key reveal, or retry-subset exposure makes the retry invalid and cannot create a pass.

A scorer who fails the second valid attempt, becomes disqualified, or cannot complete a valid retry is ineligible for this version family and must be replaced by a newly screened person who begins at the primary attempt. The failed scorer cannot score or adjudicate cohort evidence. A fixture defect invalidates the affected dataset version for all not-yet-calibrated scorers and requires prospective correction/versioning; it is not charged as a scorer failure.

## 10. Failure handling and qualification separation

Any eligibility failure, fixture/key exposure, collusion, unblinding, unauthorized copy, role conflict, missing evidence, integrity failure, ambiguous custody, invalid fixture, failed second attempt, or calibration implementation defect closes the first-contact gate. Freeze affected records, preserve only necessary incident evidence, revoke access, notify the founder through the private incident route, and remain `NOT_QUALIFIED`.

Calibration records must use a distinct record family and evaluator path that has no participant alias, group, contact ordinal, cohort denominator, candidate determination, validation pass, release-review count, or HMM qualification field. Calibration pass/fail only changes scorer eligibility. Tests must prove that injecting calibration records into orientation-validation or release-gating inputs is rejected and that a calibration pass cannot change `NOT_QUALIFIED`, 0/2 reviewers, or 0/30 reviews.

## 11. Private evidence, privacy, and retention

Implementation should define a closed, versioned private `scorer-calibration-result-v1` contract (or equivalently distinct name) with `additionalProperties: false`. At minimum it records:

- random calibration record and attempt IDs; scorer alias; attempt number; disposition;
- calibration protocol, rubric, dataset, subset, key, presentation-order, schema, and comparison-function versions and SHA-256 digests;
- eligibility-attestation record digest and attested-at time; administrator alias; key-custodian alias; independent recorder alias;
- started, locked, key-revealed, compared, and recorded UTC timestamps;
- fixture IDs in frozen order, submitted four-label values, per-item submission digests, and bounded rationale codes only if prospectively required;
- total, exact-correct, unsafe-binary total/correct, critical-error count, integer threshold computation, pass/fail, and closed reason codes;
- primary/retry subset non-overlap proof digest; prior-attempt link for attempt two; remediation type and completion time;
- access, blinding, independent work, frozen-rubric-only, complete-before-key, no-edit-after-lock, no external assistance, no participant evidence, no qualification effect, and `testOnly: false` attestations;
- append-only previous/head digests, correction link and bounded correction reason, incident link if applicable, and independent final head-digest confirmation.

Names, contacts, emails, employers, biographies, diagnoses, conflict narratives, fixture text, answer-key text, unrestricted rationales, credentials, storage paths, participant responses, and real identity mappings are prohibited from Git, permanent reports, and the minimized calibration ledger. Real identities and detailed conflict evidence stay in the separately controlled private identity/administration record. Restricted fixture text and keys stay in a separately access-controlled restricted store; the scorer view cannot access keys, and the presentation operator need not have key access.

Detailed locked submissions, item-level comparisons, conflict evidence, and the identity mapping must be deleted 90 days after validation closure once scoring, adjudication, reporting, final-head confirmation, incident resolution, and recovery verification are complete, unless a documented necessary hold applies. The separately approved necessary-hold procedure must identify scope, owner, reason, access, review date, and deletion trigger. A minimized eligibility ledger may retain only alias, versions/digests, attempt count, aggregate numerators/denominators, disposition, timestamps, and chain provenance for the same founder-approved retention period as the validation ledger. Backups follow the same deletion and hold schedule; restore and deletion must be evidenced without exposing contents.

## 12. Administration, blinding, and key custody

The calibration administrator may be the already approved study operator because the frozen protocol permits the operator to administer and capture, but only if the founder prospectively approves that assignment and all of the following are true:

- the administrator is not a scorer or adjudicator and makes no semantic judgment;
- the administrator cannot alter the frozen presentation, labels, key, threshold, or result;
- scorer workspaces and submissions are mutually inaccessible;
- the administrator sees no key before submission lock unless acting solely as the separately approved key custodian through a deterministic comparison process; and
- access, reveal, comparison, and recording events are attributable and independently digest-confirmed.

Preferred custody separates the presentation administrator from the key custodian. The key custodian may release only the exact subset key after the corresponding locked-submission event and may not score, coach, adjudicate participant responses, or alter comparison output. If one non-scorer holds both roles, least-privilege controls must keep the key sealed until lock and the founder must approve the combined custody explicitly. The independent adjudicator receives no calibration role and cannot rescue a failed attempt. Rubric or fixture authors may custody a pre-frozen key but cannot serve as scorers; their identity and access must be declared privately.

## 13. Required implementation tests and configuration checks

Before any real scorer alias or access, offline tests must prove:

1. exact version/digest dependency consistency and no byte change to the 18 artifacts in the approved Sprint 6.5.4 digest manifest;
2. alias acceptance for `SCR-[A-Z0-9]{8,32}` and rejection of short, long, lowercase, encoded-identity, duplicate, participant, operator, adjudicator, and `TST-*` aliases in real records;
3. closed schema shapes, required fields, UTC times, random IDs, closed enums, bounds, prohibited identity/content fields, and cross-version rejection;
4. two frozen subsets are disjoint by ID, content digest, normalized-text digest, and substantive-duplicate review; each independently meets label, unsafe, ambiguity, equivalence, partial, and critical-domain coverage;
5. 100% unsafe binary accuracy, unrounded at-least-90% exact agreement, zero critical errors, complete denominator, and identical thresholds on both attempts;
6. any unsafe false positive/negative, critical ambiguous-to-demonstrated error, missing label, invalid label, integrity failure, or second-attempt failure prevents eligibility;
7. retry cannot start without a failed locked primary attempt, completed bounded remediation, renewed attestations, and a distinct unexposed subset;
8. reuse of any failed item, paraphrase-equivalent item, item/template digest, primary key, or exposed retry item invalidates retry and cannot create a pass;
9. no score editing after lock, no key reveal before lock, no third attempt, no cross-attempt averaging, no scorer-to-scorer visibility, and deterministic comparison/reporting;
10. cohort Section 10 constants are absent from calibration configuration and cannot satisfy, override, or be imported as calibration thresholds; a mutation test that substitutes 10/12, 2/3, 0.90 inter-rater agreement, or kappa 0.80 must fail;
11. calibration records are rejected by orientation-validation and release-gating evaluators and cannot change participant counts, validation status, release-review counts, or HMM qualification;
12. eligibility/conflict failures, role overlap, key exposure, fixture defect, incident, or missing custody evidence fail closed;
13. redaction/canary checks prevent identity, contact, fixture/key text, unrestricted rationale, storage path, credential, participant response, or private mapping leakage into Git, reports, logs, errors, backups, and rejected-input output;
14. zero provider SDK, environment-secret, network, telemetry, database, production, financial, or release-enablement dependency; and
15. repository-native documentation/security consistency checks and `git diff --check` pass.

All implementation fixtures and calibration-record tests must use synthetic `TST-*` identities, be offline, and be structurally incapable of becoming real calibration or qualification evidence.

## 14. Versioning and approval impact

This design document can be added as a new, append-only, versioned design artifact outside the existing 18-path frozen digest manifest. Doing so changes none of the approved participant-facing bytes or digests and does not itself replace or repin execution baseline `74c26e063c91c3b91772090f18d90f9aa82c786d`.

Implementation cannot proceed as a mere operational note. It must add a versioned calibration protocol, private result schema, deterministic comparison/configuration and tests, and a new expanded restricted calibration dataset. Because the approved checkpoint says any material change to a pinned artifact, threshold, role, custody control, or scoring rule stops execution and requires new versioning/review, implementation requires a new Sprint 6.5.4 checkpoint approval and new exact implementation commit/digest envelope before calibration or recruitment. If implementation changes `authority-comprehension-rubric-v1`, `orientation-validation-protocol-v1`, the existing restricted semantic dataset bytes, schema/report logic, or any other frozen path, it must create a new version rather than edit a v1 artifact in place.

The participant-facing orientation and instrument need not change if implementation preserves their exact approved bytes and dependencies. The later checkpoint may prospectively supersede the current execution authority for scorer calibration and recruitment; it must not rewrite the existing approval record or mutate Sprint 6.4/6.5.3 evidence.

## 15. Exact founder decisions required before implementation

The founder must explicitly approve or reject, prospectively and before any real alias or fixture access:

1. the calibration construct and the statement that calibration gates scorer eligibility only;
2. all twelve eligibility/separation attestations, disqualifying conditions, re-attestation triggers, and the rule that non-independent evidence is informative only;
3. alias timing, randomness, uniqueness, and `SCR-[A-Z0-9]{8,32}` schema;
4. the finding that the six frozen fixtures cannot support a valid separate retry subset;
5. creation and restricted custody of a new dataset version with two disjoint representative subsets, the minimum composition, non-overlap standard, assignment, and frozen order;
6. 100% unsafe/not-unsafe accuracy, at least 90% exact four-label agreement without rounding, zero critical-boundary errors, and complete-denominator treatment;
7. ambiguity, semantic-equivalence, umbrella, invalid-fixture, and no-live-key-reinterpretation rules;
8. the exact blinded eligibility-to-recording sequence and deterministic comparison boundary;
9. one bounded remediation and one separate-subset retry only, followed by scorer replacement; no third attempt, reuse, averaging, or waiver;
10. the distinct private evidence schema, prohibited fields, append-only integrity, storage/access model, 90-day detailed-evidence deletion, necessary-hold rule, backup deletion, and minimized-ledger retention period;
11. named private assignments for calibration administrator, key custodian, two proposed scorers, independent recorder, privacy owner, recovery owner, and incident route, including any approved combined non-scoring custody role;
12. all offline tests, privacy/security checks, and explicit isolation from cohort Section 10 and qualification logic;
13. the versioning plan: new protocol/dataset/schema/comparison artifacts, immutable existing versions, exact dependency table, and no participant-facing change unless separately justified; and
14. a later clean implementation commit, complete SHA-256 digest manifest, verified restricted access/custody, passing offline evidence, and a new checkpoint record that explicitly authorizes calibration before recruitment can resume.

Until all decisions are approved, implemented, verified, digested, and approved again at the implementation checkpoint, the scorer-calibration gate is **BLOCKED**, first contact including `A-01` is prohibited, and HMM remains **`NOT_QUALIFIED`**.

## 16. Design acceptance criteria

This clarification is coherent only if review confirms that it:

- creates no real alias, result, fixture exposure, recruitment, participant contact, provider request, database write, production effect, or qualification evidence;
- leaves the current execution baseline and all frozen participant-facing and immutable historical artifacts unchanged;
- refuses to treat the current six fixtures as two valid attempts;
- defines deterministic eligibility, thresholds, sequence, retry, failure, evidence, privacy, custody, and tests;
- makes Section 10 threshold reuse mechanically impossible; and
- requires new versioning and founder checkpoint approval before implementation or execution.
