# Sprint 6.5.4 Empty Topology Bootstrap Validation v1

Status: **PASS FOR EMPTY/SYNTHETIC BOOTSTRAP MECHANICS — COLLECTIVE READINESS BLOCKED**

Implementation commit: `3f1c9cf0715117162fc171e00452ca60d7c5a177`

Bounded evidence digest: `1bcd2aeca84b55733cb202732aa15854a2fa0e00b4991f998879cebbf45ef57f`

## Repository validation

- Focused bootstrap suite: 13/13 passed.
- Complete repository suite: 182 tests, 174 passed, 8 PostgreSQL-dependent tests skipped by the repository harness, 0 failed.
- Randomized KEY+PRV, role/custody, scorer-calibration, orientation, governance, privacy, security, digest, historical-byte, tamper, correction, and deterministic-output regressions passed in the complete suite.
- TypeScript typecheck: passed.
- ESLint: passed.
- Provider-disabled production-shaped build: passed with every AI/provider kill switch enabled and no provider call.
- `git diff --check`: passed.
- No database or migration code changed; PostgreSQL/migration execution was therefore not applicable.

## Contract and privacy validation

- Runtime closed-shape validator: passed.
- Strict JSON Schema Draft 2020-12 validation with installed Ajv 8.20.0 and format checks: passed.
- Unknown top-level and nested evidence fields: rejected.
- Prohibited real identity, alias, contact, response/result, key material, fixture, secret, provider, and database fields: rejected.
- Secret/high-entropy credential and actual-path scan over tracked amendment artifacts: passed.
- Historical Sprint 6.5.4, Sprint 6.5.3, and Sprint 6.4 digest regressions: passed.

## Operational empty/synthetic validation

- The dedicated private root was created only inside the authorized project after an ignore pre-check; its actual path is omitted.
- Root, primary boundary, separate BACKUP boundary, and all eight compartments use mode `0700`.
- LOC mapping and private bounded evidence use mode `0600` outside Git.
- Eight unique opaque LOC references validated.
- All access templates were synthetic non-person, deny-by-default, and zero-grant.
- AES-256-GCM passed with 32-byte keys, 12-byte nonces, 16-byte tags, distinct class protection, and separate IDMAP/KEYS/BACKUP keys.
- XOR 2-of-2 recovery passed; either share alone failed authenticated decryption.
- The actual encrypted synthetic BACKUP was restored to an isolated non-overwrite target; manifest, record count, independent head, and permissions matched exactly.
- Synthetic append-only ledger, correction, incident, independent-head, and chain-tamper checks passed.
- Restore target, access templates, ciphertext, ledger/incident records, and all other synthetic working material were deleted.
- Synthetic secret/share/plaintext/ciphertext buffers were overwritten before completion.
- Final IDMAP, RAW, LEDGER, CAL, PRES, KEYS, BACKUP, and INC compartment counts are all zero.
- Private root ignore and non-tracking checks passed.
- Network requests: 0.

Bootstrap authority is `EXPIRED_COMPLETE`. Real PRV/RCV qualification, real topology acceptance, new operational factors, human-separated handoff restore, randomized-order checkpoint approval, and final bootstrap checkpoint approval are absent. HMM remains `NOT_QUALIFIED`; all counters remain zero.
