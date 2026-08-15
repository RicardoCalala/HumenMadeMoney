# Sprint 6.5.4 KEY + PRV Randomized Order Amendment Design

Design version: `sprint-6.5.4-key-prv-randomized-order-amendment-design-v1`

Status: **DESIGN ONLY — FOUNDER DECISIONS PENDING — IMPLEMENTATION PROHIBITED — COLLECTIVE READINESS BLOCKED**

Implementation basis under amendment: `7d7d8c12f10e37b9872304e68a5f0a98a81a267f`

Governance checkpoint under amendment: `f73ab1b295cea501af4ea5f2b59da07c710d183c`

Integrated design parent: `bd1d611fa31ac2345ead6096cc0b1df30854e648`

This document designs a prospective amendment for a person proposed for the conditionally combinable key-custodian and privacy-owner roles. It does not amend, approve, or implement any artifact. No real screening has begun; no response, alias, access grant, key, private record, participant/scorer contact, provider request, API-key use, production/database action, or financial/custody/settlement action is created or authorized.

The current state remains **BLOCKED** and HMM remains **NOT_QUALIFIED**: no real scorer calibration; no `A-01` contact; `0/16` contacted; `0/12` enrolled; A/B/C/D `0/3` each; `0/2` release reviewers; and `0/30` genuine release-gating reviews.

## 1. Scope and invariants

The amendment changes only the presentation order of the combined `KEY-01`–`KEY-12` and `PRV-01`–`PRV-12` closed eligibility statements for a candidate proposed for both roles.

It must preserve these invariants:

- all 24 item IDs and statement UTF-8 bytes are copied exactly from Section 2 of `role-custody-readiness-protocol-v1`; punctuation, capitalization, spacing, and wording do not change;
- each statement is always displayed or read with its stable item ID;
- the only admitted candidate response to an item is unequivocal `True` or `False`;
- all 24 responses must be `True`; there is no score, threshold, weighting, averaging, waiver, inference, or favorable treatment of missing or uncertain answers;
- randomization selects only presentation order; it never selects, defaults, pre-fills, recommends, predicts, transforms, or visually emphasizes an answer;
- there is no coaching, paraphrasing, interpretation, correctness feedback, or retry to manufacture a pass;
- the role-separation matrix and C2 controls remain unchanged. Passing the combined instrument does not approve the KEY+PRV combination, create aliases, or grant either compartment access;
- no historical response may be reordered, remapped, rescored, converted, or imported; and
- the v1 design, protocol, schemas, evaluator, tests, checklist, digest envelope, and checkpoint remain immutable historical artifacts.

The implementation must materialize an exact 24-entry instrument manifest and test its exact-byte digest against the 24 statement lines in the frozen protocol. The new instrument version is required because administration semantics change even though the statement bytes and eligibility semantics do not.

## 2. Proposed presentation model

### 2.1 One mixed 24-item order

Use one randomized permutation of all 24 stable IDs for a combined KEY+PRV administration. Mixing the two roles is allowed because every response remains bound to its stable ID and the evaluator reconstructs the complete KEY and PRV maps before either role-specific validation occurs. Mixing does not alter or merge the meanings of the roles.

Two independently randomized 12-item blocks are not preferred: they preserve a visible role boundary and more of the mechanical pattern without improving validation. They become a future versioned option only if accessibility testing or implementation evidence shows that cross-role mixing creates an actual comprehension or assistive-technology defect.

The candidate is told, neutrally, that the items cover two proposed roles and will appear in a locked order. The administrator presents the item ID and exact statement, accepts only `True` or `False`, and gives no indication of the expected answer.

### 2.2 Role-specific validation remains separate and fail closed

After completion, the evaluator reconstructs:

- a KEY map containing exactly `KEY-01` through `KEY-12`; and
- a PRV map containing exactly `PRV-01` through `PRV-12`.

The proposed combined administration produces one sealed administration digest and two linked role-specific eligibility records. Both records reference the same administration digest and instrument manifest digest. For this combined path, neither record may be `eligible` unless all 24 items are present, uniquely mapped, unequivocally `True`, and otherwise valid. A false, missing, duplicate, malformed, uncertain, interrupted, wrong-version, unmapped, incident-affected, or unverifiable response makes the combined result ineligible or uncertain under the applicable closed reason code.

The system must not use the 12 answers from a failed combined administration to qualify the candidate for only one of the two roles. Any later single-role proposal follows a separately approved prospective administration and cannot silently reuse or select favorable answers.

## 3. Deterministic, auditable order generation

Proposed method version: `key-prv-order-hmac-sha256-fisher-yates-v1`.

The approved offline generator performs these steps exactly:

1. Start from the canonical ID array `KEY-01` through `KEY-12`, followed by `PRV-01` through `PRV-12`.
2. Obtain one 32-byte seed from the operating system cryptographically secure random generator. The administrator cannot supply, edit, preview, or request candidate seeds.
3. Create a deterministic pseudorandom byte stream with HMAC-SHA-256, using the seed as the HMAC key and the ASCII message `HMM-KEY-PRV-ORDER-V1` followed by one NUL byte and an unsigned 64-bit big-endian counter beginning at zero.
4. Apply Fisher-Yates from array index 23 down to 1. Read unsigned 64-bit big-endian values from the stream. For a bound `b = i + 1`, reject any value at or above `floor(2^64 / b) * b`; use the accepted value modulo `b` as the swap index. Rejection sampling removes modulo bias.
5. Canonicalize the resulting item-ID sequence as a JSON array encoded in UTF-8 with no insignificant whitespace and compute its SHA-256 `orderDigest`.
6. Seal the complete pre-presentation lock record atomically in the approved append-only private ledger before any item is exposed.

Given the same method version, seed, and canonical instrument manifest, replay must produce the same ID sequence and digest on every supported platform. The raw seed is randomization evidence, not identity data or a credential. It is retained only in the restricted minimized administration record; it never belongs in Git, chat, logs, command output, source code, fixtures, or a candidate-facing screen.

The implementation may replace this method only through a new prospective method version, test vectors, security review, digest envelope, and founder approval. It must use the platform's approved cryptographic library and add no network or provider dependency.

## 4. Lock, anti-reroll, abort, and correction rules

An opaque `administrationRequestDigest` is created before generation and binds the requested instrument version, proposed role set `["KEY","PRV"]`, and approved administration mode without encoding identity. Any private identity link remains separately controlled outside Git.

The generator and ledger append are one logical operation:

- exactly one open order is admitted for an `administrationRequestDigest`;
- the lock record contains the generated order and is durable before `presentationStartedAt` can be set;
- the uniqueness constraint rejects a second generation request even if the first order is unfavorable, unseen, inconvenient, or interrupted;
- the administrator cannot delete, overwrite, relabel, replace, or choose among generated orders; and
- display and capture accept only the locked `administrationDigest` and exact next stable ID.

The state machine is `requested -> locked -> presenting -> completed`, with terminal `aborted` and `void_incident` paths. Resume uses the same locked order and response map only when the approved incident policy permits it, no statement or response integrity is uncertain, and the instrument remains current.

An abort appends the time, last completed ordinal, bounded reason code, and incident reference when required. It does not erase the seed, order, or responses already captured. A restart requires an appended disposition for the prior administration plus explicit correction/incident authorization and a new request digest. It never happens silently. A replacement order cannot make the earlier evidence favorable, and prior answers cannot be copied into the replacement.

Corrections remain append only. They may repair a demonstrated mechanical transcription defect only when source evidence is intact and authorization exists; they cannot change a candidate answer, order, item ID, seed, instrument version, result, or source digest. Any uncertainty is `BLOCKED` and requires incident review.

## 5. Minimum audit evidence

The proposed `key-prv-eligibility-administration-v1` record admits only:

- opaque administration ID and pre-existing `administrationRequestDigest`;
- `protocolVersion`, `instrumentVersion`, exact instrument manifest digest, statement-byte digest, and proposed roles `["KEY","PRV"]`;
- `orderMode`: `randomized` or `fixed_accessibility`;
- order method/version; for randomized mode, the 32-byte seed encoded as lowercase hexadecimal;
- the complete 24-item ID sequence and its SHA-256 digest;
- `generatedAt`, `lockedAt`, `presentationStartedAt`, and `completedAt` or `abortedAt` in UTC;
- the 24 response mappings, each containing only presentation ordinal, stable item ID, and boolean response;
- closed status, outcome, reason codes, bounded accommodation code if applicable, prior/correction/incident digests, and final administration digest; and
- the existing constant zero-effect fields: no access granted, participant counters changed `0`, release reviewers changed `0`, genuine release reviews changed `0`, and HMM status `not_qualified`.

Do not admit a name, contact, biography, demographic, diagnosis, employer, free-text accommodation detail, device/location path, URL, provider, credential, secret, key/fixture content, narrative response, score, or desired outcome. Real administration evidence stays in the approved private operational store and outside Git. Git contains only schema, evaluator, tests with synthetic `TST-*` data, documentation, and artifact digests.

The sequence is retained in addition to its digest because it is the minimal direct proof of item-to-response mapping; the seed and method independently permit replay. The evaluator must verify that the stored sequence, replayed sequence, and digest all agree before evaluating responses.

## 6. Accessibility and physical selection assistance

Random order must remain fully operable with keyboard-only input, screen readers, magnification, switch control, and an approved physical selection assistant. The interface or paper procedure must preserve item ID, current ordinal out of 24, exact statement text, and two plainly labeled `True` and `False` choices. It must not rely on color, spatial position, memory of earlier items, rapid timing, or drag-and-drop. Focus order follows presentation order; returning from an allowed pause resumes at the exact locked ordinal.

An approved physical selection assistant may repeat the item ID, exact statement, and the candidate's selected response for confirmation. The assistant may not explain, paraphrase, recommend, infer, or select an answer without an unequivocal candidate instruction. Ambiguity triggers the neutral repeat/stop rule and is never recorded as `True`.

If random order would create an accessibility barrier for that administration, `fixed_accessibility` is selected and recorded before lock. It uses the canonical fixed order `KEY-01` through `KEY-12`, then `PRV-01` through `PRV-12`; no seed is generated. Record only a neutral closed code such as `fixed_order_requested`, never a diagnosis or narrative. The accommodation has no effect on eligibility, role combination approval, later access, or status. An administrator cannot switch to fixed order after seeing a randomized order except through the explicit abort/incident process, and cannot use accessibility as a reroll mechanism.

## 7. Required implementation tests

Implementation is not acceptable until offline tests prove at least:

1. **Exact statement bytes:** all 24 IDs and statement bytes match the frozen v1 protocol source; wording and semantics are unchanged.
2. **Permutation completeness:** randomized output contains exactly the canonical 24 IDs, with no missing, unknown, or duplicate ID.
3. **Stable mapping:** every recorded response maps to the displayed stable ID independent of ordinal, and reconstructs exact KEY and PRV maps.
4. **Deterministic replay:** published test vectors reproduce the same permutation and digest across repeated runs and supported runtimes.
5. **Cryptographic sampling:** the method uses the approved CSPRNG/HMAC library, rejection sampling, correct counter/domain bytes, and no network, `Math.random`, timestamp, identity, answer, or administrator input.
6. **No answer influence:** identical order inputs yield the same order regardless of responses; order generation cannot read, prefill, suggest, style, or transform answers.
7. **Closed completeness:** false, missing, duplicate, unknown, ambiguous, non-boolean, out-of-order capture, or mismatched mapping fails closed.
8. **Unchanged eligibility:** only 24 `True` responses can produce both linked eligible results; no score or threshold path exists, and randomized/fixed modes evaluate identically.
9. **Lock and no reroll:** presentation cannot start before a durable lock; a second order for the same request digest is rejected before and after presentation, including concurrency tests.
10. **Abort/correction:** abort preserves prior evidence; resume cannot change the order; restart requires linked disposition/authorization; correction cannot change seed, order, source response, or outcome favorably.
11. **Accessibility fixed order:** preselected fixed mode produces the exact canonical order without a seed, remains fully equivalent for evaluation, and cannot be selected after random order exposure without an incident.
12. **Assistive operation:** item ID, ordinal, statement, focus, choice names, pause/resume, and confirmation remain perceivable and operable without order loss.
13. **Schema compatibility:** v2 orchestration accepts only the new combined administration/eligibility records where required, explicitly accepts still-current unchanged v1 subcontracts, and rejects cross-version mixtures not allowed by the compatibility matrix.
14. **Privacy and aggregation:** prohibited identity/sensitive fields fail; administration and eligibility records cannot change participant/reviewer counters, release qualification, or HMM status and are rejected by participant/release aggregators.
15. **Prospective-only boundary:** no v1 or pre-amendment record can be imported, reordered, remapped, rescored, or silently upgraded.
16. **Historical integrity:** every digest in the frozen v1 envelope and both named historical commits remains unchanged.

Property-based or exhaustive boundary tests should cover many synthetic seeds, every Fisher-Yates bound, rejection edges, and concurrent lock attempts. Test fixtures remain synthetic and must not resemble a real candidate or response record.

## 8. Exact versioning and artifact impact

Historical artifacts are not edited. A later approved implementation must create a parallel prospective envelope with these changes:

| Artifact | Required prospective version/action |
| --- | --- |
| This design | Keep `sprint-6.5.4-key-prv-randomized-order-amendment-design-v1` as design evidence. |
| Orchestrating protocol | Add `role-custody-readiness-protocol-v2`, incorporating unchanged v1 controls and replacing only the prospective combined KEY+PRV administration rule. |
| Instrument manifest | Add `key-prv-closed-eligibility-instrument-v2`; IDs and statement bytes are identical to v1, while presentation semantics permit locked random or accessibility-fixed order. |
| Administration schema | Add `key-prv-eligibility-administration-v1` with the closed fields in Section 5. |
| Eligibility schema | Add `role-eligibility-attestation-v2`, binding both role-specific outputs to one valid administration digest and prohibiting partial qualification on the combined path. |
| Role assignment schema | Add `role-assignment-v2` so an assignment under protocol v2 binds the v2 eligibility provenance; do not broaden access or C2 semantics. |
| Readiness evidence and rollup | Add `readiness-evidence-v2` and `collective-readiness-v2` with required randomization integrity, locked-order, accessibility-mode, prospective-only, and no-reroll controls. |
| Evaluator/generator | Add a versioned v2 policy path and offline generator; do not modify the frozen v1 evaluator bytes. No new dependency is expected because Node cryptography is already used. |
| Tests | Add v2 mechanics/security and governance suites covering Section 7; keep all v1 tests and digests unchanged. |
| Execution checklist | Add `sprint-6.5.4-recruitment-execution-checklist-v4`; it prospectively supersedes v3 only after approval and adds design, method, lock, accessibility, compatibility, and v2 envelope gates. |
| Digest manifest | Add an append-only randomized-order amendment envelope that pins the v1 historical digests plus every new v2 artifact and offline validation report. It must not rewrite the existing expanded manifest. |
| Founder governance | First add a pending design-decision record for Section 9. After implementation, add a separate pending implementation checkpoint that pins the clean implementation commit, governance parent, new envelope digest, compatibility report, and unchanged counters/status. |

The frozen `custody-topology-v1`, `backup-restore-evidence-v1`, `role-custody-ledger-v1`, and `retention-hold-v1` contracts may be incorporated unchanged as v1 subcontracts only if the v2 compatibility tests and protocol list that exact adoption explicitly. They are versioned only if their admitted fields or semantics must change. The scorer calibration protocol, dataset, fixtures, keys, presentation orders, participant instruments, thresholds, cohort frame, and financial/provider boundaries are unaffected.

No v2 operational path is enabled by a design commit. The current v1 path also remains blocked by its pending founder checkpoint and absent private evidence.

## 9. Founder decisions required before implementation

The founder must explicitly approve or change each decision prospectively:

1. **Mixed order:** one 24-item KEY+PRV permutation rather than two 12-item blocks.
2. **Combined fail-closed result:** both role-specific eligibility outputs require all 24 `True`; no favorable 12-item subset is reusable from a failed combined administration.
3. **Randomization method:** the exact OS-CSPRNG, HMAC-SHA-256, rejection-sampled Fisher-Yates method and evidence retention in Sections 3 and 5.
4. **Anti-reroll lifecycle:** one atomic locked order per request digest, with the stated abort, resume, restart, incident, and correction rules.
5. **Accessibility:** pre-lock neutral `fixed_accessibility` mode using canonical fixed order, with no eligibility consequence or diagnostic detail.
6. **Version plan:** protocol/instrument/administration/eligibility/assignment/readiness/checklist/evaluator/digest/checkpoint versions in Section 8 and explicit reuse of unchanged v1 subcontracts.
7. **Operational evidence location and retention:** the later private, non-Git store, access list, retention period, and audit authority for seeds, order sequences, response mappings, and incident/correction records.

Approval must identify the exact design commit and file digest. Conversation, silence, earlier C2 approval, the prior role/custody design approval, or a test pass is not approval of this amendment.

## 10. Stop conditions and present boundary

Stop on wording drift; unknown/duplicate/missing ID; seed, replay, digest, lock, mapping, order, timestamp, or version mismatch; answer influence; reroll attempt; unsupported accommodation; identity or sensitive-data leakage; correction uncertainty; historical digest change; network/provider access; or any attempt to treat design evidence as operational authority.

Preserve only the minimum linked evidence, do not overwrite or quietly restart, and remain **BLOCKED** / **NOT_QUALIFIED** pending incident review, a new version where validity may be affected, and fresh founder approval.

This design changes no counter, qualification, role, alias, access, approval, record, or authorization. Current counters remain exactly zero as stated at the start of this document.
