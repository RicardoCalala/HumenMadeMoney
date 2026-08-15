# Sprint 6.5.4 Design — Authority-Boundary Comprehension Validation

Status: **DESIGN PROPOSAL — FOUNDER APPROVAL REQUIRED — NOT IMPLEMENTED**

## 1. Purpose and present state

Sprint 6.5.4 proposes a newly versioned way to validate whether a person conceptually understands Human Made Money's advisory-AI and consequential-authority boundary. It addresses construct validity, scoring reproducibility, and selection bias before any further candidate contact.

This document is design only. It does not approve implementation, recruitment, screening, orientation, scoring, aliases, presentation orders, result capture, provider calls, production use, or any change to the frozen Sprint 6.5.3 study.

The bounded Sprint 6.5.3 process history is that three candidates remained unverified after a repeated enumeration-sensitive eligibility outcome. Those attempts are process evidence only. They are not formal study observations, do not establish an error rate, do not qualify or disqualify the people for a future newly approved protocol, and must not be rescored or retried under v1. Recruitment under Sprint 6.5.3 is paused.

The controlling state remains:

- human-review gate: **`NOT_QUALIFIED`**;
- verified release-gating reviewers: **0/2**;
- genuine release-gating reviews: **0/30**;
- no operational reviewer aliases or presentation orders assigned; and
- no authority to use a provider, enable production, change an immutable assessment, clear Financial Safety, assign a reviewer, record a resolution, settle, release, refund, or move funds.

This proposal is governed by the product philosophy and AI policy in [`docs/product-bible.md`](../product-bible.md), the accessibility and truthful-interface rules in [`docs/design-bible.md`](../design-bible.md), the security and validation practices in [`docs/engineering-playbook.md`](../engineering-playbook.md), the existing human-review design in [`sprint-6.5-technical-design.md`](sprint-6.5-technical-design.md), and the frozen Sprint 6.5.3 records. Where this proposal differs from v1 operations, the difference is prospective and requires the two approvals in Section 14.

## 2. Goals, non-goals, and safety invariants

### Goals

1. Measure conceptual comprehension rather than exhaustive verbatim or unaided enumeration.
2. Preserve 100% of the existing authority-safety intent by testing every critical boundary through an appropriate mode.
3. Make semantic scoring reproducible across independent scorers.
4. Predeclare a finite validation cohort, denominator, attempt limit, and stopping rules.
5. Keep instrument-validation participants separate from eventual release-gating reviewers.
6. Minimize identity and response data while preserving attributable, tamper-evident provenance.

### Non-goals

- Weakening, averaging, or adjudicating away any critical authority boundary.
- Making HMM qualify, choosing thresholds from observed outcomes, or recruiting until two people pass.
- Testing memory for a fixed list of policy phrases.
- Retrospectively changing or interpreting Sprint 6.5.3 results.
- Defining candidate-facing coaching, publishing restricted answer keys, or implementing schemas, fixtures, scripts, ledgers, or reports.

### Invariants

An assessment remains advisory. It may compare accepted terms and evidence, explain sources, gaps, uncertainty, and recommend a next action. It never itself obtains or conveys consequential authority. Separate participant, human-review, deterministic authorization, dispute/review-window, and Financial Safety controls remain authoritative.

No wording equivalence may imply that an AI, model, automated assessment, confidence score, explanation, recommendation, or MCP tool may:

- clear or bypass Financial Safety;
- assign a reviewer, make a reviewer decision, or replace required human review;
- grant participant permission or `record_resolution` authority;
- decide, authorize, or record a resolution;
- create settlement authority or release, refund, settle, reserve, charge, hold, or move funds; or
- make another binding legal, financial, or consequential decision.

Current financial and settlement features remain simulated and must be described truthfully.

## 3. Construct definition

The target construct is **conceptual authority-boundary comprehension**: after a neutral orientation, a person can distinguish what an automated assessment may contribute from who or what may authorize consequential action, and can apply that distinction to materially different situations.

The construct has four required components:

| Component | Demonstration required | Not required |
| --- | --- | --- |
| Advisory contribution | Recognizes evidence comparison, explanation, uncertainty, gaps, and recommendations as permitted assistance. | Reciting every permitted function or matching orientation wording. |
| No autonomous consequential authority | Understands that model output does not itself decide, authorize, bind, or execute consequential outcomes. | Unaided enumeration of every named prohibition in one free response. |
| Critical-domain application | Correctly applies the boundary to funds/settlement, Financial Safety, reviewer assignment/decision, participant or resolution authorization, and binding legal/financial outcomes. | Memorizing the order or exact labels of the domains. |
| Separate control path | Understands that required participant, human, deterministic-system, dispute/review-window, and Financial Safety controls remain independently necessary. | Describing implementation internals or every control in every answer. |

Conceptual equivalence is not omission. An accurate umbrella statement such as “the system may advise, but cannot authorize or carry out a binding consequential action” may satisfy the general no-authority concept in a free restatement. It does not remove the requirement to demonstrate each critical domain elsewhere in the instrument. Coverage moves from a single recall-heavy prompt into a predeclared measurement matrix; safety coverage does not disappear.

## 4. Recommended measurement design

### 4.1 Modes considered

| Mode | Strength | Principal risk | Proposed use |
| --- | --- | --- | --- |
| Free restatement | Shows unaided mental model and expressive understanding. | Language fluency and recall burden can masquerade as misunderstanding. | Required first measure, semantically scored. |
| Structured recognition | Efficiently covers every critical domain and reduces expressive burden. | Guessing and cueing can overstate understanding. | Limited coverage check with balanced choices and confidence-neutral wording. |
| Application scenarios | Tests transfer to concrete, varied situations. | Poor scenarios can embed clues or test reading complexity. | Primary critical-domain application measure. |
| Combination | Triangulates mental model, coverage, and transfer. | More administration and scoring complexity. | **Recommended.** |

### 4.2 Proposed instrument

Use one standardized, plain-language orientation followed, in order, by:

1. one unassisted free restatement collected before any recognition or scenario item;
2. a small balanced recognition block covering boundaries not reliably observable from a short restatement; and
3. four short application scenarios that collectively cover all critical authority domains, include both permitted advisory behavior and prohibited consequential authority, and require a bounded choice plus a short explanation.

The exact item count and coverage matrix must be frozen during implementation before human recruitment. Item order may be selected from pre-pinned counterbalanced orders, assigned without reference to performance. The instrument must not repeat an incorrectly answered item, provide correctness feedback, explain expected answers, or use a leading follow-up. A neutral request to repeat an inaudible or technically lost answer is not a new attempt; a semantic clarification is.

Why this combination: the free response protects against a recognition-only guessing test; structured and scenario items ensure all critical safety concepts are actually sampled without demanding that a person spontaneously list them; scenarios test transfer rather than phrase recall.

### 4.3 Neutral orientation and administration

The next orientation should retain the same product truth and complete safety boundary while using plain language, short sections, and accessible formatting. It may state the policy being taught; it must not disclose item wording, answer patterns, scoring tags, thresholds, or calibration examples. The same version is presented in full to every participant.

Administrators must:

- use a frozen script and one of the pinned orders;
- offer approved accessibility supports before the attempt;
- avoid emphasis, paraphrase, examples, evaluative reactions, or answer-specific prompts;
- record only a technical-interruption code when a response must be reacquired;
- provide no correctness feedback until the cohort is closed; and
- stop on coaching, answer-key exposure, identity/provenance uncertainty, or material deviation.

## 5. Semantic scoring model

### 5.1 Scoring units

Each response is coded against predeclared concept tags, not exact prose. A tag receives one of:

- `demonstrated`: meaning is clear and safe;
- `not_demonstrated`: relevant meaning is absent or incorrect without an affirmative unsafe claim;
- `ambiguous`: plausible readings cross the safety boundary or the scorer cannot determine the intended authority allocation; or
- `unsafe`: affirmatively gives prohibited authority to AI, model output, an automated assessment, confidence, recommendation, or a tool.

The general free-restatement tags are advisory contribution, no autonomous consequential authority, and separate control path. Critical-domain tags are funds/settlement, Financial Safety, reviewer assignment/decision, participant/resolution authorization, and binding legal/financial consequences. The implementation rubric must map every tag to at least two independent items or to one item plus the free restatement where appropriate, so one wording accident does not create a false conceptual conclusion.

### 5.2 Equivalence, omission, partial demonstration, and failure

- Semantic equivalents count when they preserve actor, authority, consequence, and negation. “Can suggest but cannot decide or execute the outcome” can demonstrate the umbrella boundary even without policy vocabulary.
- An umbrella statement does not automatically demonstrate a domain when another response contradicts it or when the domain is never tested.
- Merely saying “AI is advisory” without expressing lack of consequential authority is partial and `not_demonstrated` for the no-authority tag.
- Naming some prohibited domains while omitting others from the free response is not itself failure; the omitted domains must be demonstrated in the structured/scenario portion.
- Hedging such as “usually,” “for now,” or “unless confidence is high” is `ambiguous` or `unsafe` when it leaves open autonomous consequential authority.
- Any unsafe response on a critical-domain item is a critical failure for that candidate-level determination. It cannot be averaged against other correct answers.
- An `ambiguous` critical-domain tag fails closed as not demonstrated unless independent adjudication can classify the original response under the frozen rubric. Adjudication may interpret; it may not solicit a replacement response.

### 5.3 Calibration examples and restricted content

Calibration fixtures should include paraphrases, umbrella statements, partial statements, double negatives, conditional authority, anthropomorphic phrasing, uncertainty, and direct unsafe claims. Examples must be synthetic, versioned, and divided into positive, negative, ambiguous, and unsafe sets.

Calibration examples, tag-level expected labels, item keys, and case scoring content are restricted scorer materials. They are never candidate-facing, never included in recruitment text, and should not be reproduced in founder-facing reports beyond aggregate fixture IDs and pass/fail counts. The examples in this section define methodology only; they are not instrument items or a complete answer key.

### 5.4 Candidate-level determination

A candidate demonstrates the construct only when:

- advisory contribution, no autonomous consequential authority, and separate control path are each `demonstrated` across the predeclared evidence rule;
- every critical authority domain is `demonstrated` through the coverage matrix;
- no critical response is `unsafe` or unresolved `ambiguous`; and
- administration and provenance are valid.

No total score, majority vote, compensation, profile, or adjudicator may override a critical failure. Report tag counts and candidate-level determinations; do not turn the result into a psychological, intelligence, disability, or employment assessment.

## 6. Reproducible determination

1. Before recruitment, two scorers independently label all calibration fixtures and must meet the calibration gates in Section 10.
2. Each human response is independently scored by two eligible scorers who cannot see the other's labels, candidate identity, cohort aggregate, recruitment source, or desired outcome.
3. Software compares tag labels deterministically. Exact agreement requires the same label for every applicable tag.
4. A disagreement is routed to a separately approved adjudicator using only the original response, frozen rubric, item version, and the two blinded rationales. The adjudicator cannot edit the response, add concepts, lower a gate, or waive a critical requirement.
5. If no eligible adjudicator is available, the response remains unresolved and the validation cannot pass.
6. All initial labels, disagreement records, and adjudications are append-oriented. Corrections are new linked records with bounded reason codes.

The operator may administer and capture but may not score or adjudicate. Scorers, rubric authors, implementation authors, and the operator must have declared separation and conflict rules. If staffing makes full separation impossible, founder approval must identify the limitation before recruitment; the affected evidence is informative and cannot silently be treated as independent validation.

## 7. Finite orientation-validation cohort

### 7.1 Recruitment frame and size

Predeclare one finite frame of at most **16 people who may be contacted** to enroll **12 orientation-validation participants**:

- target stratum A: 6 general digitally literate adults;
- target stratum B: 6 adults with stronger technical, business, research, policy, or operational experience;
- no person involved in HMM development, instrument/rubric authorship, scoring implementation, operation, scoring, or adjudication;
- no answer-key, calibration-fixture, another participant-response, or prohibited-material exposure;
- no outcome-contingent compensation, material pressure, or incentive to make HMM qualify.

The frame and neutral selection method must be frozen before the first contact. Contact order should be randomized or otherwise mechanically predeclared within stratum. Source, nonresponse, ineligibility, withdrawal, and completion counts are reported by stratum without identity.

Both six-person enrollment targets are required for a passing validation. Exhausting the frame without enrolling six in each stratum is a transparent feasibility failure, not permission to change the frame or denominator.

### 7.2 Attempts, denominator, exclusions, and replacements

- One post-orientation instrument attempt per person, ever, for the version family. No coaching and retry.
- Everyone who begins the orientation is in the enrolled denominator.
- A person who declines or is found ineligible before orientation is reported in the contacted frame but is not enrolled.
- Withdrawal, technical loss, protocol deviation, or post-enrollment exclusion stays in the enrolled denominator and receives a bounded disposition; it is never silently removed.
- Replacement is allowed only from the unused predeclared 16-person frame and only until 12 people have enrolled. There is no frame expansion.
- The three Sprint 6.5.3 candidates are excluded from the validation cohort and release-gating study because of prior orientation/process exposure. They remain unverified process evidence only. This is an exposure-control rule, not a judgment about their comprehension.

### 7.3 Stopping rules

Stop recruitment permanently for this protocol version at the earliest of:

- 12 people enrolled;
- all 16 predeclared contacts exhausted;
- a privacy, independence, coaching, key-exposure, provenance, security, or material accessibility incident;
- any post-start change to orientation, instrument, rubric, thresholds, frame, scoring rules, or report logic; or
- founder withdrawal of authorization.

Do not stop early for favorable or unfavorable scores. Do not add candidates to improve a rate. A material instrument defect requires a documented stop, immutable preservation of existing evidence, a new version, fresh frame, and fresh participants.

## 8. Separation from release-gating review

Orientation-validation participants can validate the instrument only. They cannot fill either of the two later release-gating reviewer positions, contribute any of the 30 required reviews, establish conflict labels, or be reused as adjudicators.

After orientation validation passes and a separate founder recruitment approval is recorded, the later release-gating study uses two fresh candidates with no validation-instrument, key, fixture, scorer, or prior Sprint 6.5.3 exposure. The release-gating case study remains independently blinded and retains its own eligibility, independence, coverage, scoring, disagreement, and ledger requirements. No validation-cohort response is copied into a release ledger.

## 9. Accessibility and support

Founder-approved Decision 7 remains the policy baseline:

- provide accessible digital material or an equivalent readable format, normal operating-system/browser accessibility technology, keyboard operation, zoom, reflow, and minimum operational notation;
- allow reasonable breaks and extra time without scoring disadvantage or diagnosis disclosure;
- allow private support for access and mechanics only, never interpretation, authority boundaries, cases, choices, or suggested answers;
- record only that support was provided and a bounded support-mode code when operationally necessary, outside content responses; and
- pause before administration if support would materially change the measured construct.

Implementation validation should target WCAG 2.2 AA for any rendered materials and test plain-text/screen-reader, keyboard-only, 200% zoom/reflow, focus/order, headings, labels, errors, and non-color-dependent meaning. Differences in accessible format must preserve wording, item order rules, and response options.

## 10. Proposed validation gates and rationale

### 10.1 Instrument/orientation-validation gates

The 12-person cohort is a bounded product-development pilot, not a population estimate or clinical validation. It is large enough to exercise two predeclared profiles, expose administration/scoring failures, and prevent “recruit until success,” while keeping disclosure and participant burden proportionate. Exact counts and two-sided 95% intervals must be reported; percentages alone are prohibited.

The version validates only if all of the following were predeclared and pass:

| Gate | Proposed threshold |
| --- | --- |
| Critical-domain coverage | 100% of critical domains mapped and administered as frozen. |
| Administration fidelity | 100% of completed administrations use the approved version/order with no material deviation. |
| Analyzable completion | At least 10 of 12 enrolled participants complete valid analyzable instruments; all 12 dispositions remain reported. |
| Candidate-level construct demonstration | At least 10 of 12 enrolled participants demonstrate the construct, and at least 4 of 6 target enrollments in each profile stratum do so. Missing/withdrawn/invalid enrolled attempts count as not demonstrated for this gate. |
| Critical unsafe claims | No participant counted as demonstrated has an unsafe or unresolved ambiguous critical tag. All unsafe counts are reported regardless of aggregate result. |
| Initial inter-rater exact tag agreement | At least 90% overall and at least 90% across critical tags, with raw numerator/denominator. |
| Chance-corrected agreement | Cohen's kappa at least 0.80 overall when mathematically informative; prevalence-adjusted agreement and label distribution also reported. Kappa never overrides critical exact-agreement review. |
| Adjudication | 100% of disagreements resolved under the frozen rubric; zero critical safety requirement waived. |
| Privacy, provenance, integrity, network | 100% pass; zero identity leakage, chain failure, credential access, or network requests. |

The 10/12 comprehension floor is a prospective feasibility signal that the neutral orientation and instrument usually produce a demonstrable boundary across profiles; it is not evidence that 83.3% is an acceptable product safety rate. Failure does not justify lowering the floor. The founder must choose this threshold before seeing cohort results. A larger follow-up is required before making population-wide claims.

### 10.2 Later release-gating thresholds

Orientation validation does not qualify the human-review release gate. The later study remains a separate requirement with two fresh eligible independent reviewers completing all 15 cases each: 30/30 genuine reviews, 15/15 cases, 14/14 partitions, and both conflict labels by both reviewers. Proposed release-gating floors remain 90% each for comprehension, citation traceability, and action interpretation; 100% authority safety and coverage; no critical authority failure; maximum 10% disagreement; valid provenance; and a valid append-only ledger chain. Any later change must be separately justified, versioned, and approved before recruitment—not imported from orientation-validation outcomes to make HMM pass.

## 11. Privacy, provenance, ledger, retention, and incidents

### 11.1 Data minimization

Keep names, contact information, real-person mappings, screening evidence, conflicts, accessibility details, and recruitment-source detail outside Git, instrument records, and result ledgers. Do not collect demographics, diagnoses, disability details, employment files, biographies, secrets, or real agreement/evidence data.

Use pseudonymous, role-specific aliases only after eligibility is established. Validation aliases must use a distinct namespace from release reviewers, such as a future schema-approved `VAL-[A-Z0-9]{8,32}`; scorer aliases should use `SCR-*`. Do not create or reserve aliases during design. The external mapping remains operator-only and should inherit the approved deletion rule: delete 90 days after Sprint 6.5 qualification closure unless a documented legitimate hold requires minimal continued retention, then resume deletion.

### 11.2 Response storage and result records

Raw semantic responses are necessary for independent scoring but should not become permanent repository content. Store them in a controlled encrypted study location, separate from Git and the application/provider, for the shortest approved scoring/adjudication window. The permanent pseudonymous validation ledger should retain normalized tag labels, item and rubric versions, response digests, scorer/adjudicator aliases, timestamps, disposition/reason codes, and chain provenance—not names, contact data, diagnosis, support narrative, or unrestricted scorer prose.

The founder must approve a bounded raw-response deletion point. Proposed default: delete raw validation responses 90 days after final validation closure once the report, adjudications, ledger head, and backup recovery have been verified, unless a documented legitimate hold applies. Retain the minimized pseudonymous ledger, aggregate report, artifact digests, and integrity record for development/audit history under a separately approved duration.

### 11.3 Integrity and backup

Use serial append-only capture, deterministic canonicalization, per-record previous/head SHA-256 digests, duplicate/replay rejection, immutable source response digests, and linked correction records. Maintain one encrypted backup in a separate controlled location and test restore before recruitment. An independent person without edit authority confirms the final head digest. Never reconstruct lost responses from memory.

### 11.4 Incident and stop rules

Stop immediately for identity/alias uncertainty; coercion, conflict, collusion, coaching, or prohibited exposure; material protocol drift; scorer unblinding; unsupported accommodation; privacy leakage; result forgery/replay; hash-chain, ordering, backup, or recovery uncertainty; scoring/report defect; credential or network access; or loss/corruption of required evidence. Preserve minimum necessary evidence, freeze existing records, do not overwrite or restart quietly, notify the founder through the approved private channel, and remain `NOT_QUALIFIED`. Restart requires root-cause review, documented containment, a new version when validity could be affected, and fresh approval.

## 12. Result-schema review and versioning plan

### 12.1 Current-schema finding

`human-review-result-v1` should not be reused for orientation validation. It only accepts `reviewer_submission` or `adjudication`, requires the v1 study/rubric/dataset constants, assumes exactly 15 release-gating case responses, and has no provenance for semantic tag scoring, two independent scorers, instrument/order version, administration disposition, response digest, disagreement, or validation adjudication. Forcing orientation records into it would conflate instrument validation with release evidence and invite unnecessary free text or personal data.

Implementation should propose a separate `orientation-validation-result-v1` schema (or an equivalently distinct name), not mutate `human-review-result-v1`. It should use closed record types such as administration, blinded score, and adjudication; closed enums and bounded arrays; `additionalProperties: false`; version constants; random record IDs; pseudonymous aliases; UTC timestamps; item IDs; response digests; semantic tag/label codes; scorer independence attestations; protocol-deviation/disposition codes; previous-record digest; and `testOnly`. It must not accept names, emails, demographics, diagnoses, accommodation narratives, unrestricted biographies, unrestricted rationales, or release-gating reviewer submissions.

### 12.2 Artifacts requiring new versions after approval

Implementation would create or version, at minimum:

- `human-review-orientation-v2` — neutral, accessible presentation;
- `authority-comprehension-instrument-v1` — free response, recognition, scenarios, coverage matrix, and pinned orders;
- `orientation-validation-protocol-v1` — frame, administration, attempts, scoring, gates, and stopping rules;
- `authority-comprehension-rubric-v1` — semantic tags and restricted scorer calibration rules;
- `orientation-validation-result-v1` — distinct validation/provenance schema;
- `orientation-validation-report-v1` — deterministic aggregate/report contract;
- `hmm-comprehension-study-v2` and an appropriate new dataset/profile version for the later release-gating study if eligibility, packet linkage, manifests, or report linkage changes;
- `human-review-protocol-v2`, `human-review-rubric-v2`, `human-review-result-v2`, and `reviewer-packet-v2` only where the later study contract actually changes; and
- new recruitment, execution, privacy/retention, ledger-recovery, and founder-decision runbooks for 6.5.4.

The final implementation plan must produce a dependency table showing which artifact references which exact versions and digests. It must not reuse a v1 name for changed content.

### 12.3 Immutable v1 history and execution commit

All Sprint 6.5.3 v1 artifacts, decisions, attempts, hashes, and reports remain immutable historical evidence. Do not edit them, append a reinterpretation that changes their outcome, or treat v2 approval as retroactive.

The Sprint 6.5.3 founder record pins intended execution baseline commit `4bf27d59613f80cca15f664026f0a2374b6b49fd`, while this design was prepared from later repository state. Sprint 6.5.4 must not inherit or silently update that pin. After implementation and all pre-human offline validation pass, record the exact clean implementation commit, artifact versions and SHA-256 digests, schema/report versions, dataset/profile versions, and zero-network test evidence in a newly approved founder decision record. That explicit commit becomes the sole intended execution baseline. Any later difference stops execution and requires review and, for a material change, a new version.

## 13. Pre-recruitment offline validation

No person may be contacted until implementation passes credential-free, zero-network checks covering:

1. cross-document constants, links, digests, counts, thresholds, frame, roles, retention, stop rules, and version dependency consistency;
2. schema positive/negative fixtures, `additionalProperties: false`, bounds, closed enums, alias patterns, UTC time, UUIDs, replay/duplicate rejection, and cross-version rejection;
3. scorer calibration fixtures for safe semantic equivalents, umbrella statements, omissions, partial demonstrations, ambiguity, conditional/unsafe authority, contradictions, and inaccessible/empty input;
4. deterministic double-scoring comparison, disagreement routing, adjudicator constraints, inability to waive critical gates, and reproducible aggregate counts;
5. item/coverage-matrix proof that every critical domain is sampled without leaking expected answers into participant materials;
6. deterministic reports with raw numerators/denominators, enrolled/contacted dispositions, profile strata, exact intervals, agreement measures, adjudication counts, artifact/commit digests, and stable ordering;
7. redaction/canary tests across records, errors, reports, logs, backups, and rejected inputs; no names, contacts, diagnoses, support narratives, keys, raw unrestricted rationales, or raw responses in permanent reports;
8. ledger hash-chain, correction, tamper, truncation, reordering, backup/restore, and independent-head verification tests;
9. a process-level network-deny assertion and proof of `networkRequests: 0`, with no provider SDK construction, environment-secret read, remote MCP, telemetry, database write, or production configuration;
10. accessibility review of all participant materials: semantic headings/labels, logical order, keyboard workflow, screen-reader/plain-text equivalence, zoom/reflow, contrast where rendered, error identification, no color-only meaning, and extra-time/break mechanics; and
11. security review of restricted-key access, scorer blinding, local permissions, temporary raw-response deletion, backup custody, incident containment, and accidental Git inclusion.

Run repository-native documentation/security consistency checks and `git diff --check`. Implementation tests must use only synthetic `TST-*`/fixture identities and must be structurally incapable of qualifying release evidence.

## 14. Founder decisions required

### Gate A — approve before implementation

- [ ] Approve the construct definition and the distinction between semantic equivalence and missing critical-domain evidence.
- [ ] Approve the combined measurement mode, instrument sequence, neutral-administration boundary, and no-feedback/no-retry rule.
- [ ] Approve the semantic tags, four labels, candidate-level fail-closed rule, restricted calibration content, and no averaging of critical failures.
- [ ] Approve independent double-scoring, scorer/operator separation, adjudicator limits, and the response to unavailable independent staffing.
- [ ] Approve the 16-person contact frame, 12-person enrollment target, two 6-person profile strata, one-attempt cap, denominator, exclusions, replacement rule, and fixed stopping rules.
- [ ] Approve exclusion of Candidates 1–3 from validation and release gating as prior-exposure process evidence only.
- [ ] Approve the validation gates and sample-size rationale, including 10/12 overall and 4/6 per target stratum, without reference to observed outcomes.
- [ ] Reaffirm Decision 7 accessibility/support policy and approve the proposed accessibility validation scope.
- [ ] Approve separate validation aliases, minimized raw/permanent data split, mapping and response deletion defaults, ledger retention decision owner, access, encrypted backup, restore, independent digest, and incident rules.
- [ ] Approve a distinct orientation-validation schema/report and the version-family plan; confirm v1 artifacts remain immutable.
- [ ] Approve implementation work as offline, credential-free, zero-network, synthetic-only, and non-qualifying.

### Gate B — approve after implementation/validation and before any cohort recruitment

- [ ] Approve the exact orientation, instrument, coverage matrix, protocol, rubric, restricted calibration set, schema, report, runbooks, versions, and SHA-256 digests.
- [ ] Approve all offline validation evidence, accessibility review, security/privacy review, deterministic reports, ledger/backup restore result, and zero-network proof.
- [ ] Pin and approve the exact clean intended execution commit; resolve the old baseline discrepancy by supersession in the new record, not by editing v1.
- [ ] Approve the frozen 16-person recruitment frame and neutral contact order/method, compensation if any, operator, support contact, two scorers, adjudicator, privacy owner, recovery owner, and independent final-digest recorder.
- [ ] Confirm no named person has prohibited exposure or conflicting roles and that restricted materials/access controls are operational.
- [ ] Approve the external mapping location/access/deletion date, raw-response scoring window/deletion date, minimized-ledger retention, encrypted backup location, recovery procedure, and private incident route.
- [ ] Reconfirm that the cohort cannot qualify HMM, that no validation participant may become a release-gating reviewer, and that later release-gating recruitment needs separate approval and fresh candidates.

Until both gates are satisfied in sequence, remain `NOT_QUALIFIED` and do not implement beyond the approved scope, recruit, contact, orient, alias, order, score, or capture any real participant result.

## 15. Recommendation

Approve Sprint 6.5.4 for implementation only if the founder accepts the combined comprehension instrument, finite 12-person validation cohort within a 16-contact frame, independent semantic double-scoring, strict critical-domain fail-closed rules, separate minimized validation schema/ledger, and explicit post-implementation execution-commit pin.

This design preserves the full authority-safety boundary while relocating coverage from exhaustive free recall into a reproducible combination of restatement, recognition, and applied scenarios. It does not change the current release-gating state: **`NOT_QUALIFIED`, 0/2 verified reviewers, 0/30 genuine reviews**.
