# Sprint 6.5.4 Empty Topology Bootstrap Amendment Design v1

Status: **FOUNDER-APPROVED DESIGN — OFFLINE IMPLEMENTATION AUTHORIZED — EMPTY/SYNTHETIC ONLY**

This prospective amendment records the five founder decisions approved on 2026-08-15. It does not edit, reinterpret, or approve any historical Sprint 6.5.4, Sprint 6.5.3, or Sprint 6.4 artifact. It creates no authority for real screening, identities, aliases, access, scorer calibration, participant contact, restricted fixture/key use, provider access, production/database activity, financial/custody/settlement action, counter change, release review, or Human Made Money qualification.

## Decision 1 — empty-only authority

Bootstrap may create and validate exactly eight empty logical classes: `IDMAP`, `RAW`, `LEDGER`, `CAL`, `PRES`, `KEYS`, `BACKUP`, and `INC`. It may create opaque `LOC-[A-Z0-9]{12,40}` references, synthetic non-person controller labels, deny-by-default templates, an empty/synthetic ledger, an operational synthetic backup/restore, and bounded digests. Bootstrap records are structurally inadmissible as role, scorer, participant, release-total, or qualification evidence.

Names, contacts, identity mappings, real aliases, responses, results, calibration keys, canonical or restricted fixtures, screening, real access, A-01 contact, study evidence, and qualification effect are prohibited.

## Decision 2 — private project storage

One HMM-only private root must be created inside the explicitly authorized repository area, never in an automatically selected external location. The actual root and LOC-to-path map remain outside Git. Tracked material may contain only opaque LOC references and bounded digests. A generic repository-local, untracked exclude guard and an exact pre-creation ignore check are mandatory. Primary storage and BACKUP use distinct control boundaries; a BACKUP directory under an ordinary primary compartment is insufficient.

Any path outside the project, under Git metadata or dependencies, or overlapping a declared off-limits area fails closed before creation.

## Decision 3 — cryptography and split control

Bootstrap uses fresh OS-CSPRNG AES-256-GCM material with 32-byte keys, 12-byte nonces, and 16-byte authentication tags. Each class receives distinct probe protection; `IDMAP`, `KEYS`, and `BACKUP` never share a universal decryption secret. Restore reconstructs the BACKUP secret through XOR 2-of-2 shares and proves that neither share alone authenticates/decrypts. No secret, share, key, passphrase, credential, or secret-derived key fingerprint enters Git, logs, or bounded evidence. Synthetic buffers are overwritten and synthetic ciphertext is deleted at completion.

## Decision 4 — retention and deletion

The versioned policy contains the approved IDMAP, role-mapping, RAW, CAL, PRES, KEYS, INC, LEDGER, aggregate-report, manifest, and head-confirmation periods. BACKUP never outlives source and source deletion propagates within 168 hours maximum. Holds require an objective release trigger, review within 30 days, and no automatic renewal. Real deletion later requires one executor and a distinct verifier. Empty/synthetic working artifacts are deleted immediately after required evidence is captured.

## Decision 5 — expiry and handoff

Authority expires at required evidence completion or material incident. Synthetic controller labels never prove PRV, RCV, KEY, or any other eligibility. Real PRV and RCV must later qualify independently, inspect and accept their topology, create new operational factors, and complete a human-separated restore. Any topology mismatch returns collective readiness to `BLOCKED`. Bootstrap completion alone never authorizes KEY+PRV screening.

Current counters remain 0/16 contacted, 0/12 enrolled, A/B/C/D 0/3 each, release reviewers 0/2, genuine reviews 0/30, and HMM `NOT_QUALIFIED`.
