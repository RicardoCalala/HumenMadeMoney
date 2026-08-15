# Sprint 6.5.4 Role & Custody Readiness Protocol v2

Version: `role-custody-readiness-protocol-v2`

Status: **IMPLEMENTED OFFLINE — RANDOMIZED-ORDER FOUNDER CHECKPOINT PENDING — BLOCKED — NO REAL KEY+PRV SCREENING — NO REAL SCORER CALIBRATION — NO A-01 CONTACT**

Design authority: `sprint-6.5.4-key-prv-randomized-order-amendment-design-v1`, commit `bb6836e06f919265c51015b0a4dc68ab6cd555ab`, SHA-256 `2f896088b5f884c75ed3a1a61516a95b89db69ad1cf8517b04c462f5c736dced`.

This prospective protocol incorporates the unchanged v1 role-separation, custody, recovery, ledger, retention, scorer, counter, release, and qualification controls. It changes only administration order for a future person proposed for the conditionally combinable KEY+PRV roles. It creates no candidate, alias, assignment, access, result, contact, calibration, production record, or qualification evidence.

## Exact instrument and eligibility

`key-prv-closed-eligibility-instrument-v2` contains the same stable `KEY-01`–`KEY-12` and `PRV-01`–`PRV-12` statement UTF-8 bytes as Section 2 of v1. The version changes because presentation semantics change. The exact manifest is `apps/web/tests/fixtures/ai-evaluation/role-custody-readiness/key-prv-instrument-manifest-v2.json`.

The candidate sees the stable item ID, ordinal out of 24, exact statement, and plainly labeled `True` and `False` choices. Only an unequivocal boolean is admitted. No statement or answer is selected, defaulted, suggested, highlighted, transformed, inferred, interpreted, paraphrased, coached, or retried. The evaluator reconstructs separate KEY and PRV maps by stable ID. Both linked `role-eligibility-attestation-v2` results are eligible only when the one combined administration is valid and all 24 responses are `True`. A false response makes both ineligible. A missing, duplicate, unknown, ambiguous, non-boolean, out-of-order, unmapped, interrupted, incident-affected, wrong-version, or unverifiable response makes both uncertain and fail closed. No favorable 12-item subset may be reused.

## Random order method

`key-prv-order-hmac-sha256-fisher-yates-v1` starts with canonical KEY then PRV IDs. The lock operation obtains 32 bytes from Node's OS-backed `crypto.randomBytes`. HMAC-SHA-256 uses the seed as key and the ASCII domain `HMM-KEY-PRV-ORDER-V1`, one NUL byte, and an unsigned 64-bit big-endian block counter starting at zero. Consecutive unsigned 64-bit big-endian values drive Fisher-Yates from index 23 through 1. For bound `b`, values at or above `floor(2^64 / b) * b` are rejected. The order digest is SHA-256 of the UTF-8 compact JSON ID array.

The seed is generated inside the lock operation; an administrator cannot provide, preview, edit, or select it. The generator has no answer, identity, time, network, provider, database, scorer, counter, qualification, or desired-outcome input. `replayKeyPrvOrder` exists solely to validate already retained evidence and deterministic synthetic test vectors.

## Atomic lock and append-only lifecycle

The private store must atomically enforce uniqueness of `administrationRequestDigest` and durably append the complete locked snapshot before presentation. The implemented offline ledger models that requirement with one synchronous uniqueness boundary and an append-only immutable snapshot chain: `locked -> presenting -> completed`, with terminal `aborted` and `void_incident` paths. Each snapshot binds its predecessor digest. Capture accepts only the exact next stable ID in the locked sequence.

A second lock for the same request is rejected before or after presentation. Pause/resume preserves the order and response map and requires a linked correction authorization only when statement and response integrity are certain. Abort retains seed, order, responses, last completed ordinal, time, and bounded reason. An incident-affected record is void and cannot resume. A replacement requires a terminal prior record, a distinct new request digest, prior administration digest, incident digest, and explicit correction authorization registered before generation. Prior answers are never copied. The private identity-to-request registry must also reject a new unlinked request for the same candidate/proposal; an opaque digest alone cannot prove identity uniqueness.

Corrections are append-only and may repair only demonstrated mechanical metadata defects with intact source evidence. They cannot change a response, item ID, seed, order, instrument version, source digest, or outcome. Uncertainty remains blocked for incident review and, where validity is affected, a new version and approval.

## Fixed accessibility and physical selection assistance

`fixed_accessibility` must be selected before lock and records only `fixed_order_requested`. It uses canonical KEY-then-PRV order, method `canonical-key-then-prv-v1`, and no seed. Switching after exposure is an abort/incident/replacement process, never a reroll. Accommodation mode has no eligibility, role-combination, access, counter, release, or HMM effect.

The procedure must support keyboard-only use, screen readers, magnification, switch control, pause/resume at the exact ordinal, visible focus, and non-color choice labels. An approved physical selection assistant may repeat only the stable item ID, exact statement, and selected response for confirmation. The assistant cannot explain, paraphrase, recommend, infer, or select without an unequivocal instruction. Ambiguity invokes neutral repeat/stop and is never recorded as `True`.

## Minimal evidence and privacy

The `key-prv-eligibility-administration-v1` contract admits only opaque administration/request IDs; protocol, instrument, method and manifest/statement digests; the seed for randomized mode; ID sequence and digest; UTC lifecycle times; ordinal/ID/boolean response mappings; closed status/outcome/reasons; neutral accommodation code; prior/correction/incident digests; append-only chain digests; and constant zero-effect fields. The raw seed and any real record remain only in the approved restricted private operational store, never Git, chat, logs, fixtures, or candidate display.

Names, contacts, biographies, demographics, diagnoses, employers, narratives, actual paths or URLs, providers, credentials, secrets, keys, fixture content, scores, desired outcomes, and operational identity links are prohibited. Git contains schemas, executable policy, synthetic tests, documentation, and artifact digests only.

## Version and compatibility boundary

New contracts are `key-prv-closed-eligibility-instrument-v2`, `key-prv-eligibility-administration-v1`, `role-eligibility-attestation-v2`, `role-assignment-v2`, `readiness-evidence-v2`, and `collective-readiness-v2`. The explicit compatibility matrix is authoritative for the byte-identical v1 subcontracts reused by v2. No historical v1 response or record may be imported, reordered, mapped, rescored, upgraded, or mixed with a v2 combined chain.

`collective-readiness-v2` remains mechanically `BLOCKED` with `randomized_order_founder_checkpoint_pending`; real KEY+PRV screening, real scorer calibration, and `A-01` contact are false. A later approval must name the exact new checkpoint, implementation commit, governance HEAD, envelope digest, compatibility report, and required private evidence. It cannot be inferred from the design approval.

Current state is `0/16` contacted, `0/12` enrolled, A/B/C/D `0/3` each, release reviewers `0/2`, genuine reviews `0/30`, and HMM `NOT_QUALIFIED`.
