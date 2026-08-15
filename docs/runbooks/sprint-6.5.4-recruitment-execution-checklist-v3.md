# Sprint 6.5.4 Recruitment Execution Checklist v3

Version: `sprint-6.5.4-recruitment-execution-checklist-v3`
Status: **PENDING — BLOCKED — NO REAL SCORER CALIBRATION — NO A-01 CONTACT**

This checklist prospectively supersedes v2 only for future execution gating. V2 remains immutable historical evidence. Nothing here completes an old checkbox, converts a conversational approval into an operational approval, or changes the frozen cohort/scorer protocols.

## Gate 1 — implementation and immutable history

- [x] Founder approved the five Role & Custody design decisions.
- [x] Offline versioned protocol, schemas, evaluator, access/separation controls, chain, restore simulation, and regression tests implemented.
- [ ] Exact clean implementation commit and expanded digest envelope verified against the final governance parent.
- [ ] Frozen Sprint 6.4, Sprint 6.5.3, historical Sprint 6.5.4, prior manifests/checkpoints, scorer fixtures/keys, and participant-facing bytes independently reverified unchanged.
- [ ] Provider-disabled production-shaped build and complete offline validation attached by digest.

Any unchecked item blocks every later gate.

## Gate 2 — private role eligibility and assignment

- [ ] Two distinct scorer eligibility records pass the existing `scorer-calibration-eligibility-v1` contract.
- [ ] `ADJ`, `OPR`, `ADM`, `KEY`, `REC`, `PRV`, `RCV`, and `HDR` exact neutral instruments are complete/current/eligible.
- [ ] Real random aliases were generated only after eligibility and separation, and minimum mappings were sealed outside Git.
- [ ] Exact pairwise separation passes; any `C1`, `C2`, or `C4` combination has the required founder decision and capability/compartment proof.
- [ ] Access profiles are bounded, disabled until approval, digest-bound, current, revocable, and least privilege.

No real identities, aliases, or assignment facts belong in Git.

## Gate 3 — private topology, custody, retention, and incident route

- [ ] Opaque private records identify approved actual `IDMAP`, `RAW`, `LEDGER`, `CAL`, `PRES`, `KEYS`, `BACKUP`, and `INC` locations/controllers outside Git.
- [ ] Identity mapping, raw response, ledger, calibration, presentation, key, backup, and incident compartments meet the protocol controls.
- [ ] Exact access lists, authentication, encryption, attributed logging, validity, revocation, and controller separation are verified.
- [ ] No single uncontrolled encryption/passphrase bypass exists; split/two-person custody and emergency routing are verified without recording secret values.
- [ ] Bounded retention policy includes the 90-day post-Sprint-6.5-qualification-closure identity/alias default, other justified positive durations, deletion actors, and backup propagation maximum.
- [ ] Any hold is necessary, scoped, owned, access-restricted, objectively releasable, and reviewed within 30 days; no expired/unexplained hold exists.
- [ ] Private incident route, availability, severity, containment, revocation, and backup contacts are verified; open incidents are zero.

## Gate 4 — recovery and integrity

- [ ] Approved private topology has a successful operational empty/synthetic encrypted backup-and-restore record.
- [ ] Restore proves coverage, split control, source manifest/head, isolated non-overwrite, exact count/digest/head/permissions, deletion/hold propagation, and cleanup.
- [ ] Append-only chain, stale-head rejection, replay rejection, correction links, incident links, and independent final-head confirmation pass against the approved configuration.
- [ ] No uncertain access, restore, custody, integrity, deletion, or hold fact exists.

The repository’s synthetic in-memory restore test is implementation evidence only and does not satisfy this operational gate.

## Gate 5 — collective readiness and final founder approval

- [ ] Pre-checkpoint candidate record binds the exact implementation commit, governance parent, expanded envelope, topology, role assignments, control evidence, restore, retention, holds, and zero-incident state.
- [ ] Every control in `collective-readiness-v1` is `PASS` and current; counters/status remain zero/`NOT_QUALIFIED`.
- [ ] Founder explicitly approves the fresh role/custody checkpoint and exact private/digest evidence.
- [ ] Immutable founder decision receipt is recorded and a new linked evaluation mechanically returns `READY`.

Until all four items are complete: **NO REAL SCORER CALIBRATION**.

## Gate 6 — real scorer calibration

- [ ] Readiness-gated runner validates current `READY` before any key is read.
- [ ] Scorer 1 independently passes the frozen calibration protocol.
- [ ] Scorer 2 independently passes the frozen calibration protocol.
- [ ] Both pass records remain current, distinct, intact, incident-free, and digest-bound.

`READY` by itself never completes this gate and never authorizes `A-01`.

## Gate 7 — deterministic pre-contact decision

- [ ] Frozen 16-slot frame/order and private recruitment-frame location remain verified; no slot has been contacted or assigned a participant alias.
- [ ] Contact method, compensation facts, privacy/minimization, accessibility, support, withdrawal, and incident controls remain approved/current.
- [ ] Both scorer passes and every v3 pre-contact item are valid/current with no relevant change or incident.
- [ ] Deterministic pre-contact function returns authorized for still-uncontacted private slot `A-01`.

Only Gate 7 can authorize first contact. It cannot be inferred from a prior founder approval, `READY`, or one/both calibration passes.

## Current counters and qualification

- Contacted: `0/16`
- Enrolled: `0/12`
- Groups A/B/C/D: `0/3`, `0/3`, `0/3`, `0/3`
- Release reviewers: `0/2`
- Genuine release-gating reviews: `0/30`
- HMM: `NOT_QUALIFIED`
