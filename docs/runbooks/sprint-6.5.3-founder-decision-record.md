# Founder decision record — Sprint 6.5.3 human-review study

Status: **PENDING — STUDY MUST NOT START**

This packet prepares the governance checkpoint required by the [execution runbook](sprint-6.5.3-human-review-execution.md). It does not record founder approval, identify or assign reviewers, authorize contact with anyone, or authorize result capture. The founder must personally complete every decision below before the operator assigns either blinded order.

Record only the bounded aliases requested below in this repository. Keep names, contact details, accessibility or diagnosis information, employment files, and the alias-to-person verification record outside the repository in the founder-approved access-limited location. Genuine reviewer submissions are required. Fixtures, `TST-*` identities, and `testOnly: true` records are structurally invalid for release qualification.

## Frozen configuration checkpoint

Verified against repository commit `7941aacc2c9aab39d250819240a73fabe365fe12` during packet preparation:

- Protocol `human-review-protocol-v1`; rubric `human-review-rubric-v1`; study `hmm-comprehension-study-v1`; result schema `human-review-result-v1`; dataset `2.0.0`.
- Two independent reviewers each complete all 15 cases: 30 reviews total, all 14 partitions, and both reviewers complete both conflict cases (four conflict-case reviews).
- Minimum comprehension, citation traceability, and action interpretation: 90% each. Authority safety: 100%. Maximum disagreement: 10%. Coverage: 100%.
- `reviewer-packet-v1` contains two blinded, pinned 15-case presentation orders (`orderA` and `orderB`). Both remain unassigned.
- No genuine result ledger is present. The fail-closed status is `NOT_QUALIFIED` with zero genuine reviewer submissions.

If the intended execution commit differs, or any frozen version, case set, order, threshold, or release-gate behavior differs, stop and prepare a newly versioned study rather than approving this record.

## Ten founder decisions

For each item, the founder must change `PENDING` to `APPROVED` or `REJECTED`, supply the bounded choice requested, and add a UTC decision timestamp. A blanket signature does not replace the ten individual decisions.

### 1. Frozen versions and thresholds

- **Status:** `PENDING`
- **Recommended default:** Approve the versions and thresholds exactly as listed in the configuration checkpoint; do not weaken them after seeing results.
- **Founder choice required:** `APPROVED` / `REJECTED`
- **Decision timestamp (UTC):** `PENDING`
- **Founder note (optional; no sensitive data):** `PENDING`

### 2. Sample size and coverage

- **Status:** `PENDING`
- **Recommended default:** Approve 2 independent reviewers × 15 cases = 30 reviews, all 14 partitions, plus four required conflict-case reviews.
- **Founder choice required:** `APPROVED` / `REJECTED`
- **Decision timestamp (UTC):** `PENDING`
- **Founder note (optional; no sensitive data):** `PENDING`

### 3. Reviewer eligibility and independence

- **Status:** `PENDING`
- **Recommended default:** Approve only after two real adults separately pass the eligibility, orientation, independence, and conflict checks in the frozen protocol. Each must understand the agreement/evidence/assessment/human-review distinctions and restate that assessments are advisory only. Exclude the operator, sampled-answer or scoring authors, anyone with answer-key or another reviewer's answer access, anyone unable to attest to independent work, and anyone with a direct qualification incentive or other disqualifying conflict.
- **Founder choice required:** Confirm two eligible real people outside the repository, then record only two distinct aliases matching `REV-[A-Z0-9]{8,32}` here.
- **Reviewer alias 1:** `PENDING`
- **Reviewer alias 2:** `PENDING`
- **Eligibility/orientation/conflict/independence checks completed outside repository:** `PENDING`
- **Decision timestamp (UTC):** `PENDING`

Each reviewer must attest in the bounded submission that they are an adult; received the required product orientation; had no answer-key access; worked independently without seeing the other submission; and disclosed no disqualifying conflict. Employment or investment must be assessed as a potential conflict; outcome-contingent compensation, supervisory pressure, coordination, operating/scoring this run, or answer-key access is disqualifying.

### 4. Operator and separation of duties

- **Status:** `PENDING`
- **Recommended default:** Select one operator who is neither reviewer nor adjudicator, did not author the sampled answers or scoring implementation, and has no authority to change answers. The operator distributes approved materials and captures one validated record at a time.
- **Founder choice required:** Identify the real operator outside the repository and record only an alias matching `OPR-[A-Z0-9]{8,32}` here.
- **Operator alias:** `PENDING`
- **Separation confirmed:** `PENDING`
- **Decision timestamp (UTC):** `PENDING`

### 5. Adjudicator-selection process

- **Status:** `PENDING`
- **Recommended default:** Precommit a selection process, not an unnecessary assignment. If eligible non-critical disagreement requires adjudication, the founder selects a qualified human independent of both reviewers and the operator, with no answer-changing authority. Critical authority, privacy, provenance, eligibility, independence, or excess-disagreement failures cannot be adjudicated into a pass.
- **Founder choice required:** Choose either a provisionally verified alias matching `ADJ-[A-Z0-9]{8,32}` or describe the bounded selection/eligibility process without personal information.
- **Provisional adjudicator alias or selection process:** `PENDING`
- **Decision timestamp (UTC):** `PENDING`

### 6. Blinding and presentation orders

- **Status:** `PENDING`
- **Recommended default:** Approve the frozen `orderA` and `orderB`, assign one per approved reviewer only after all ten decisions are approved, and keep the answer key, scoring thresholds, aggregation report, and the other reviewer's work hidden until both submissions are sealed.
- **Founder choice required:** Approve/reject this method. Do not record person-to-order assignment in this checkpoint.
- **Decision timestamp (UTC):** `PENDING`

### 7. Accessibility and private support

- **Status:** `PENDING`
- **Recommended default:** Offer the existing Markdown/plain-text packet with headings and text equivalents, keyboard-only use, zoom/reflow, a screen-reader-friendly or tagged accessible version on request, and additional time without penalty or a default time limit. Never require diagnosis disclosure.
- **Founder choice required:** Identify outside the repository who will privately receive accommodation requests, which accessible formats can actually be supplied, and the extra-time policy. Record only the bounded process/support alias here, not a name, contact detail, diagnosis, or request details.
- **Available formats:** `PENDING`
- **Extra-time policy:** `PENDING`
- **Support process or non-sensitive alias:** `PENDING`
- **Decision timestamp (UTC):** `PENDING`

### 8. Alias verification and retention

- **Status:** `PENDING`
- **Recommended default:** Maintain one encrypted or equivalently access-controlled alias-to-person eligibility record outside this repository, accessible only to the founder and one named backup custodian if operationally necessary. Retain through study closure and any defined challenge window, then securely delete on the founder-approved date unless a documented legal/security hold applies.
- **Founder choice required:** Specify the approved external record location/system, authorized roles, retention/challenge period, deletion trigger/date, and any hold process. Do not enter names, contact details, or sensitive path contents here.
- **External system/location description:** `PENDING`
- **Authorized roles:** `PENDING`
- **Retention and deletion rule:** `PENDING`
- **Decision timestamp (UTC):** `PENDING`

### 9. Ledger access, backup, capture, and head digest

- **Status:** `PENDING`
- **Recommended default:** Keep the append-only ledger only at ignored `apps/web/human-review-results/`; permit the approved operator to capture serially in a single-operator window; grant read access only to the founder and a necessary independent verifier; make an access-controlled backup after each accepted append; and have a person other than the operator independently record the final SHA-256 head digest in an approved external controlled record. Never commit the real ledger.
- **Founder choice required:** Identify outside the repository the access holders, backup destination and recovery owner, capture window/control, independent digest recorder, and final retention/deletion rule. Record only roles or bounded aliases here.
- **Ledger access roles/aliases:** `PENDING`
- **Backup destination/control and recovery owner role:** `PENDING`
- **Serial capture window/control:** `PENDING`
- **Independent head-digest recorder role/alias:** `PENDING`
- **Retention/deletion rule:** `PENDING`
- **Decision timestamp (UTC):** `PENDING`

### 10. Stop and invalidation conditions

- **Status:** `PENDING`
- **Recommended default:** Stop immediately, preserve bounded evidence, restrict access, investigate, and keep `NOT_QUALIFIED` if privacy, independence, eligibility, provenance/chain, critical-authority, security, blinding, version, coverage, or submission-integrity controls fail. Do not repair immutable submissions, weaken thresholds, or adjudicate invalidity away. If validity is lost, close the run and execute only a newly versioned, newly approved study.
- **Founder choice required:** Approve/reject the stop response and identify the founder-controlled incident decision role and evidence-retention location/process outside the repository using no personal details here.
- **Incident decision role:** `PENDING`
- **Bounded evidence-retention process:** `PENDING`
- **Decision timestamp (UTC):** `PENDING`

## Approval completeness gate

- **All ten decisions individually approved:** `NO`
- **Two eligible reviewer aliases recorded:** `NO`
- **Operator alias and separation confirmed:** `NO`
- **Adjudicator candidate/process approved:** `NO`
- **Accessibility resources/process confirmed:** `NO`
- **External alias verification/retention approved:** `NO`
- **Ledger access/backup/digest controls approved:** `NO`
- **Stop conditions approved:** `NO`
- **Study assignment authorized:** `NO`

Until every line above is truthfully complete, do not contact or assign reviewers, distribute packets, create or capture a human result, or run adjudication. Founder approval of this checkpoint authorizes only the synthetic, offline human-review study described by the frozen artifacts. It does not authorize provider calls, API-key access, production enablement/deployment, settlement, funds movement, or changes to immutable assessments or Sprint 6.4 artifacts.
