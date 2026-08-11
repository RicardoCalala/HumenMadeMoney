# Founder decision record — Sprint 6.5.3 human-review study

Status: **ALL FOUNDER POLICY/DESIGN DECISIONS APPROVED — STUDY NOT READY TO EXECUTE — NOT_QUALIFIED**

Recorded at `2026-08-11T04:39:40Z` from the founder's completed governance decisions. This record approves the bounded study policy and design only. It does not establish that reviewers have been recruited or found eligible, assign presentation orders, recruit an adjudicator, create human submissions, complete independent digest verification, or qualify the study.

Operator-alias approval recorded at `2026-08-11T04:50:06Z`: the founder explicitly approved `OPR-HMM00001` for Ricardo's operator-only role. This approval changes no frozen protocol, schema, threshold, case, presentation order, or release-gate behavior.

Record only bounded aliases in this repository. Keep names, contact details, accommodation or diagnosis information, employment files, and real-person-to-alias verification outside Git and outside the study ledger. Genuine reviewer submissions are required. Fixtures, `TST-*` identities, and `testOnly: true` records are structurally invalid for release qualification.

## Frozen configuration checkpoint

Verified against intended execution baseline commit `4bf27d59613f80cca15f664026f0a2374b6b49fd` while recording these decisions:

- Protocol `human-review-protocol-v1`; rubric `human-review-rubric-v1`; study `hmm-comprehension-study-v1`; result schema `human-review-result-v1`; dataset `2.0.0` are approved unchanged.
- Two independent reviewers each complete all 15 cases: 30 reviews total, all 14 partitions, and both reviewers complete both conflict cases (four conflict-case reviews).
- Minimum comprehension, citation traceability, and action interpretation: 90% each. Authority safety: 100%. Maximum disagreement: 10%. Coverage: 100%.
- `reviewer-packet-v1` contains two blinded, pinned 15-case presentation orders (`orderA` and `orderB`). Both remain unassigned.
- No genuine result ledger is present. The fail-closed state is `NOT_QUALIFIED` with zero genuine reviewer submissions.

If the intended execution commit differs, or any frozen version, case set, order, threshold, or release-gate behavior differs, stop and prepare a newly versioned, newly approved study rather than changing this record or the frozen artifacts.

## Ten founder decisions

### 1. Frozen versions and thresholds

- **Status:** `APPROVED`
- **Decision:** Approve unchanged `human-review-protocol-v1`, `human-review-rubric-v1`, `hmm-comprehension-study-v1`, `human-review-result-v1`, and dataset `2.0.0`; minimum comprehension, citation traceability, and action interpretation of 90% each; 100% authority safety; maximum disagreement of 10%; and 100% coverage.
- **Recorded timestamp (UTC):** `2026-08-11T04:39:40Z`

### 2. Sample size and coverage

- **Status:** `APPROVED`
- **Decision:** Approve unchanged two independent reviewers × 15 cases = 30 reviews, all 14 partitions, and four required conflict-case reviews.
- **Recorded timestamp (UTC):** `2026-08-11T04:39:40Z`

### 3. Reviewer profiles, eligibility, and independence

- **Status:** `APPROVED — PROFILES ONLY; RECRUITMENT AND ELIGIBILITY PENDING`
- **`REV-001` profile label:** Independent general digitally literate adult.
- **`REV-002` profile label:** Independent adult with somewhat stronger technical, business, or research experience.
- **Decision:** Neither reviewer may have been involved with HMM. Both actual reviewers must pass the frozen eligibility, orientation, independence, and conflict checks before assignment or participation.
- **Actual reviewers recruited:** `NO`
- **Actual reviewer eligibility/orientation/conflict/independence verified:** `NO`
- **Operational reviewer aliases:** `PENDING`
- **Privacy note:** `REV-001` and `REV-002` are profile labels only, not claims that real people have been recruited or assigned. Do not store real names here. Operational aliases must satisfy the frozen `REV-[A-Z0-9]{8,32}` format.
- **Recorded timestamp (UTC):** `2026-08-11T04:39:40Z`

### 4. Operator and separation of duties

- **Status:** `APPROVED — PROTOCOL-COMPATIBLE ALIAS RECORDED`
- **Founder role:** Ricardo serves only as study operator, not as reviewer or adjudicator, and may distribute approved materials and capture one validated record at a time without altering answers.
- **Previously requested operator alias:** `OPR-001` (`INCOMPATIBLE`; retained as decision history).
- **Founder-approved operator alias:** `OPR-HMM00001`
- **Protocol compatibility:** `COMPATIBLE`. `OPR-HMM00001` has eight uppercase alphanumeric characters after `OPR-` and matches the unchanged frozen `OPR-[A-Z0-9]{8,32}` requirement in the protocol, result schema, and release validator.
- **Role compatibility:** `COMPATIBLE`. The frozen protocol permits the operator to distribute packets and capture records, while excluding the operator from reviewing or adjudicating. Ricardo remains limited to that operator-only role.
- **Fail-closed result:** Alias approval does not make the study executable. Keep the study `NOT_QUALIFIED` until every remaining genuine start prerequisite is complete; do not change the frozen protocol or schema.
- **Separation of duties:** `APPROVED` under `OPR-HMM00001`.
- **Original policy timestamp (UTC):** `2026-08-11T04:39:40Z`
- **Alias approval recorded timestamp (UTC):** `2026-08-11T04:50:06Z`

### 5. Adjudicator-selection process

- **Status:** `APPROVED — OPTION B; RECRUIT ONLY IF REQUIRED`
- **Decision:** Precommit selection of an independent adjudicator only if eligible non-critical disagreement requires adjudication. The adjudicator cannot be the operator or either reviewer, must pass independence and conflict checks, must have no outcome-contingent incentive, must use a protocol-compatible `ADJ-*` alias, and cannot waive 100% authority safety or lower any threshold.
- **Adjudicator recruited:** `NO — NOT CURRENTLY REQUIRED`
- **Failure rule:** If adjudication becomes necessary and no eligible independent adjudicator is available, remain `NOT_QUALIFIED`.
- **Recorded timestamp (UTC):** `2026-08-11T04:39:40Z`

### 6. Blinding and presentation orders

- **Status:** `APPROVED`
- **Decision:** Keep frozen `orderA` and `orderB` unchanged. After both actual reviewers are finalized and eligible, assign `orderA` to the first finalized eligible reviewer and `orderB` to the second. Do not use performance-based assignment. Keep the answer key, scoring thresholds, aggregation report, and the other reviewer's work hidden until both submissions are sealed.
- **Order assignment completed:** `NO`
- **Recorded timestamp (UTC):** `2026-08-11T04:39:40Z`

### 7. Accessibility and private operational support

- **Status:** `APPROVED`
- **Available formats and tools:** Accessible digital materials or an equivalent readable format; normal operating-system and browser accessibility technology; minimum operational notation.
- **Time and breaks:** Extra time on request without diagnosis disclosure, with reasonable breaks and no scoring disadvantage for accommodations.
- **Support boundary:** Private operational support may help with access and mechanics but cannot interpret cases, citations, findings, authority boundaries, or suggest answers.
- **Pause rule:** Pause if an accommodation would materially alter the measured construct.
- **Recorded timestamp (UTC):** `2026-08-11T04:39:40Z`

### 8. Alias verification and retention

- **Status:** `APPROVED`
- **External storage:** Keep the minimal real-person-to-`REV-*` verification mapping separately from Git and the study ledger.
- **Authorized access:** Operator only.
- **Retention and deletion:** Delete 90 days after Sprint 6.5 qualification closure unless a documented legitimate hold genuinely requires continued retention. Minimize evidence retained for the hold and resume the deletion rule when the hold ends.
- **Recorded timestamp (UTC):** `2026-08-11T04:39:40Z`

### 9. Ledger access, backup, capture, and head digest

- **Status:** `APPROVED — INDEPENDENT DIGEST RECORDER PENDING`
- **Primary access and storage:** The approved operator has primary access during execution. Keep the genuine ledger in a controlled local study location outside Git and inaccessible to the application/provider.
- **Backup and recovery:** Maintain one encrypted backup in a separate controlled location. The operator is recovery owner.
- **Capture:** Serial capture only, one genuine reviewer submission at a time, promptly after receipt.
- **Integrity:** Use append-only correction semantics. After all 30 reviews, an independent person who is not the operator records or confirms the final ledger-head SHA-256 digest without edit authority.
- **Retention:** Retain the pseudonymous ledger, qualification report, and integrity record for development/audit history. The real-person-to-alias mapping remains governed separately by Decision 8.
- **Failure rule:** Any uncertainty about ledger integrity, ordering, backup consistency, recovery, or result authenticity stops the study and keeps it `NOT_QUALIFIED`. Never reconstruct missing answers from memory.
- **Independent head-digest recorder selected/confirmed:** `NO`
- **Recorded timestamp (UTC):** `2026-08-11T04:39:40Z`

### 10. Stop and incident handling

- **Status:** `APPROVED`
- **Stop conditions:** Stop for reviewer eligibility, independence, or conflict failure; reviewer collusion; exposure to the answer key, another reviewer's responses, or prohibited material; a frozen artifact, dataset, rubric, protocol, threshold, presentation order, or qualification-rule change after execution begins; operator coaching or material influence; uncertain attribution, authenticity, ledger/hash-chain integrity, ordering, backup consistency, or recovery; a fabricated or test result entering the genuine path; accessibility support that materially changes the measured construct; software defects that could affect presentation, recording, or scoring; lost or corrupt required evidence; or any other material uncertainty about independence, authenticity, provenance, or reproducibility.
- **On stop:** Stop capture, preserve only the minimum necessary evidence, do not alter existing submissions, do not reconstruct or manufacture answers, do not quietly restart, and remain `NOT_QUALIFIED`.
- **Authority and restart:** The operator has immediate stop authority. Founder governance decides whether a documented clean new study may later begin.
- **Incident evidence:** Privacy-minimized and access-limited.
- **Recorded timestamp (UTC):** `2026-08-11T04:39:40Z`

## Approval and execution-readiness gate

- **All ten founder policy/design decisions individually approved:** `YES`
- **Frozen protocol-compatible operator alias approved:** `YES — OPR-HMM00001`
- **Two actual eligible independent reviewers recruited and verified:** `NO`
- **Two protocol-compatible operational reviewer aliases recorded:** `NO`
- **Presentation orders assigned:** `NO`
- **Adjudicator process approved:** `YES`
- **Adjudicator recruited:** `NO — ONLY REQUIRED IF ADJUDICATION IS NEEDED`
- **Accessibility policy approved:** `YES`
- **External alias verification/retention policy approved:** `YES`
- **Ledger access/backup/capture/retention policy approved:** `YES`
- **Independent final head-digest recorder selected/confirmed:** `NO`
- **Stop and incident policy approved:** `YES`
- **Genuine reviewer submissions captured:** `NO`
- **Human-review qualification completed:** `NO`
- **Study ready to execute:** `NO`
- **Current release gate:** `NOT_QUALIFIED`

## Exact prerequisites before the genuine study may start

The intended execution baseline and unchanged frozen artifacts were reconfirmed while recording the alias approval. The founder-approved alias `OPR-HMM00001` satisfies the frozen schema. The remaining prerequisites are:

1. Recruit two actual adults matching the approved profiles; separately complete and document the frozen eligibility, orientation, independence, conflict, answer-key-exposure, and operator/scoring-author separation checks outside the repository; only after verification assign distinct protocol-compatible `REV-*` aliases without storing real names here. **This is the exact next blocker.**
2. Confirm requested accessible format and operational support can be provided without materially changing the measured construct; otherwise pause.
3. Confirm the controlled external alias-verification record, controlled local ledger location, separate encrypted backup, operator-only serial capture window, and recovery procedure are operational.
4. Select or confirm an independent person other than the operator who will record or confirm the final ledger-head SHA-256 digest after 30 reviews. This must be committed before start even though the digest is produced only at closure.
5. Only after prerequisites 1–4 are complete, assign frozen `orderA` to the first finalized eligible reviewer and `orderB` to the second, with no performance-based assignment, and distribute the blinded approved materials.

Adjudicator recruitment is not a start prerequisite under approved Option B; it becomes mandatory only if eligible non-critical disagreement requires adjudication. If then unavailable, the study remains `NOT_QUALIFIED`.

Until every start prerequisite is truthfully complete, do not contact or assign reviewers through this workflow, distribute packets, create or capture a human result, or begin adjudication. These approvals do not authorize provider calls, API-key access, production enablement or deployment, settlement, funds movement, immutable-assessment changes, or Sprint 6.4 audit-artifact changes.
