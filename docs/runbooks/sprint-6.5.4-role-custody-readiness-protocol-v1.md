# Sprint 6.5.4 Role & Custody Readiness Protocol

Version: `role-custody-readiness-protocol-v1`
Implementation basis: founder-approved design commit `649a7e1f62a71b91523edc22d02f7c773c9ac62f`
Status: **IMPLEMENTED OFFLINE — PRIVATE OPERATIONAL FACTS ABSENT — FINAL FOUNDER CHECKPOINT PENDING — BLOCKED**

This protocol implements role eligibility, separation, least privilege, storage topology metadata, recovery evidence, append-only integrity, retention and holds, incident stopping, and the binary collective gate. It does not appoint anyone, assign a real alias, create a real storage location, release a calibration presentation or key, contact a scorer or participant, or affect HMM qualification.

The contracts live in `apps/web/tests/fixtures/ai-evaluation/role-custody-readiness/`; executable rules live in `apps/web/server/evaluation/role-custody-readiness.ts`. The existing `scorer-calibration-protocol-v1` remains controlling for scorer eligibility, lock, comparison, pass, retry, and replacement. After this package, the only approved release comparison entry point is the readiness-gated runner; the earlier runner remains test/development machinery and is not operational authority.

Implemented contract versions are `role-eligibility-attestation-v1`, `role-assignment-v1`, `custody-topology-v1`, `backup-restore-evidence-v1`, `role-custody-ledger-v1`, `retention-hold-v1`, `readiness-evidence-v1`, and `collective-readiness-v1`.

## 1. Common lifecycle and aliases

The exact order is: privately identify a candidate without access or alias; present the neutral role instrument; collect all closed attestations; independently verify eligibility and separation; record `eligible`, `ineligible`, or `uncertain`; only after an `eligible` result generate a cryptographically random role alias; seal the minimum identity-to-alias mapping outside Git; approve a bounded access profile; and keep access disabled until the final founder checkpoint produces a valid approval receipt and `collective-readiness-v1` evaluates `READY`.

Real aliases must match these release patterns and must not encode a name, initial, email, employer, sequence, outcome, or conflict. Tests add the `TST-` prefix.

| Role | Release alias | Assignment timing |
| --- | --- | --- |
| scorer | `SCR-[A-Z0-9]{8,32}` | Existing scorer protocol, after scorer eligibility and separation, before access |
| adjudicator | `ADJ-[A-Z0-9]{8,32}` | After frozen adjudicator eligibility plus `ADJ-01`–`ADJ-08`, before a disagreement packet |
| support operator | existing `OPR-HMM00001` | Preserved; not reassigned by this package |
| separate calibration administrator | `ADM-[A-Z0-9]{8,32}` | After `ADM-01`–`ADM-06`, before calibration administration |
| key custodian | `KEY-[A-Z0-9]{8,32}` | After `KEY-01`–`KEY-12`, before key custody/access |
| calibration recorder | `REC-[A-Z0-9]{8,32}` | After `REC-01`–`REC-12`, before observing/recording |
| privacy owner | `PRV-[A-Z0-9]{8,32}` | After `PRV-01`–`PRV-12`, before topology/access/retention approval |
| recovery owner | `RCV-[A-Z0-9]{8,32}` | After `RCV-01`–`RCV-12`, before backup or restore action |
| final-head recorder | `HDR-[A-Z0-9]{8,32}` | After `HDR-01`–`HDR-10`, before head confirmation |

Any false, missing, stale, expired, conflicting, uncertain, revoked, wrong-version, unverifiable, or incident-affected attestation is failed. No founder or operator waiver can convert it to eligible evidence. Re-attestation is required after any material person, role, conflict, protocol, artifact, access, topology, custody, incident, or exposure change.

## 2. Exact neutral eligibility instruments

The instrument is administered as closed true/false attestations. Every listed statement must be true. No free-text biography, conflict narrative, diagnosis, employment history, credentials, identity, participant data, fixture/key content, response, score, or desired outcome is admitted.

### Key custodian

- `KEY-01`: Adult, voluntary acceptance, and understanding of confidentiality, least privilege, release, stop, and incident duties.
- `KEY-02`: No authorship, edit, approval, implementation, testing, or validation of restricted fixture content, expected labels, rationales, comparison logic, or the submission.
- `KEY-03`: No disclosure, copying, outside retention, exposure, or known prior compromise of a key or presentation.
- `KEY-04`: Not a scorer, calibration administrator, recorder, adjudicator, participant, primary submission author, or presentation operator for the attempt.
- `KEY-05`: No supervisory, financial, household, close-personal, reporting-line, authorship, or outcome-contingent conflict.
- `KEY-06`: Can keep keys deny-by-default in the approved compartment with no local copy, message, screenshot, printout, log, or ad hoc export.
- `KEY-07`: Will verify protocol/dataset/subset/key versions and digests and release only the exact matching subset to the deterministic loader.
- `KEY-08`: Will verify complete lock, lock digest, eligibility digest, separation, time order, and attempt number before release.
- `KEY-09`: Will keep retry material inaccessible until a valid primary failure, bounded remediation, renewed attestations, non-exposure confirmation, and retry authority all exist.
- `KEY-10`: Will not disclose answer-bearing material, manually score, or communicate correctness hints.
- `KEY-11`: Will produce only the bounded attributed release receipt required by schema.
- `KEY-12`: Will stop and report uncertainty, mismatch, early/excess request, substitution, abnormal access, exposure, coercion, or bypass attempt.

### Independent calibration recorder

- `REC-01`: Adult, voluntary acceptance, and training on the frozen schema, sequence, correction, confidentiality, and stop rules.
- `REC-02`: No authorship, implementation, testing, administration, scoring, keying, approval, or answer-bearing exposure for the attempt.
- `REC-03`: Not scorer, administrator, key custodian, operator/presentation role, or adjudicator for the attempt.
- `REC-04`: No pressuring, outcome-contingent, reporting-line, close-personal, financial, authorship, or undisclosed conflict.
- `REC-05`: Will record only admitted facts from deterministic receipts/direct observation and never reinterpret a score.
- `REC-06`: Will verify aliases, uniqueness, versions/digests, lock-before-release, and deterministic comparison.
- `REC-07`: Will not edit a submission, key, comparison, prior record, threshold, disposition, or counter.
- `REC-08`: Will append exactly once with canonicalization, replay rejection, prior-head linkage, attribution, UTC time, and digest.
- `REC-09`: Will correct only by a new linked record and never overwrite, delete, backdate, reuse an ID, or silently repair.
- `REC-10`: Will preserve scorer/attempt blinding and approved need-to-know disclosure.
- `REC-11`: Will stop on missing receipts, inconsistent sequence, replay, gap, mismatch, unverifiable observation, unauthorized content, alteration pressure, or custody uncertainty.
- `REC-12`: Understands calibration evidence cannot change participant, release-review, or HMM qualification state.

### Privacy owner

- `PRV-01`: Voluntarily accepts minimization, purpose, access, retention, deletion, hold, and incident duties.
- `PRV-02`: Understands every storage class and confirms no operational store is Git, an application/provider, production, or unapproved personal location.
- `PRV-03`: Will approve only minimum fields, least privilege, attributed logs, encryption, bounded validity, and separate backup controls.
- `PRV-04`: Is not a scorer/adjudicator and does not recruit, coach, interpret, score, change results, or operate comparison.
- `PRV-05`: Has no conflict capable of distorting access, hold, deletion, or incident decisions.
- `PRV-06`: Will maintain the bounded inventory, purpose, controller, access, creation, deletion, backup, and hold metadata without secrets.
- `PRV-07`: Will deny unrestricted narratives and unnecessary identities, credentials, paths, fixture/key text, responses, or scores.
- `PRV-08`: Will issue only necessary, scoped holds with reason, owner, start, access, objective trigger, and review no later than 30 days.
- `PRV-09`: Will verify deletion from primary, temporary, export, rejected-input, log, and aligned backup copies.
- `PRV-10`: Will stop on leakage, unexplained access, inventory mismatch, overcollection, missed deletion, unreviewed hold, unapproved store/export, or uncertain erasure.
- `PRV-11`: Will preserve only minimum incident evidence and prevent incident detail becoming an unbounded store.
- `PRV-12`: Will re-review access and retention after relevant role, topology, protocol, incident, closure, or necessary-hold change.

### Recovery owner

- `RCV-01`: Voluntarily accepts backup, restore, minimization, deletion propagation, stop, and incident duties.
- `RCV-02`: Is not scorer, administrator, key custodian, privacy owner, primary-store administrator, ledger writer, adjudicator, or final-head recorder.
- `RCV-03`: Has no outcome-contingent, supervisory, close-personal, financial, authorship, or undisclosed conflict.
- `RCV-04`: Controls no complete decryption route; factors are outside Git/logs/messages/evidence and require approved split/two-person control.
- `RCV-05`: Will keep backup independently controlled and restrict use to approved restore/delete operations.
- `RCV-06`: Will verify scope, encryption, version, manifest, head, time, access log, and deletion alignment without browsing content.
- `RCV-07`: Will restore only to an isolated empty/synthetic target and never overwrite or merge operational evidence.
- `RCV-08`: Will verify manifest, counts, head, digests, permissions, deterministic source comparison, and cleanup.
- `RCV-09`: Will not reconstruct evidence, fabricate records, reuse production/personal credentials, or call uncertainty success.
- `RCV-10`: Will propagate approved deletion/hold changes on the bounded schedule and produce non-content proof.
- `RCV-11`: Will stop on partial restore, secret loss/exposure, unlogged access, mismatch, corruption, overwrite risk, uncertain deletion, or lost independence.
- `RCV-12`: Will preserve minimum recovery incident evidence and require containment, root cause, and fresh approval before reuse.

### Independent final-head recorder

- `HDR-01`: Voluntarily accepts independent read-only verification and incident duties.
- `HDR-02`: Did not create, append, correct, delete, administer, restore, or approve the confirmed chain.
- `HDR-03`: Is not scorer, operator/administrator, key custodian, recovery owner, adjudicator, or a person with ledger/storage edit/delete authority.
- `HDR-04`: Has no outcome-contingent, supervisory, close-personal, financial, authorship, or undisclosed conflict.
- `HDR-05`: Will independently verify genesis, canonical digests, links, order, count, head, replay absence, corrections, and incidents.
- `HDR-06`: Will confirm only after expected records, dispositions, closure, and deletion/hold state exist.
- `HDR-07`: Will record exact versions, manifest/chain/head/count/time/method and only `confirmed` or `mismatch`.
- `HDR-08`: Has no source-edit ability and will not accept a supplied digest without independent verification.
- `HDR-09`: Will stop on truncation, reorder, duplicate, broken link, unexplained correction, missing incident, mismatch, inaccessibility, or time/version uncertainty.
- `HDR-10`: Understands head integrity is not substantive truth, eligibility, calibration/cohort pass, release review, or HMM qualification.

### Adjudicator, operator, and administrator

- `ADJ-01`–`ADJ-08`: Meet the frozen adjudicator eligibility; remain distinct from all administration/scoring/custody/recovery/head functions; have no recruitment, coaching, capture, initial scoring, calibration, key, or comparison role; see only the exact blinded disagreement packet; cannot edit responses, add concepts, waive critical gates, average unsafe, or consult calibration material; record one bounded determination; stop on exposure/conflict/drift/pressure; and have no other study authority.
- `OPR-01`–`OPR-06`: Provide neutral logistics only; never score, hint, coach, adjudicate, or operate comparison; remain distinct from scorer, adjudicator, key, recorder, recovery, and head roles; keep identity/contact mapping separate; record only closed mechanical codes; and stop on any coaching, answer-bearing, identity, conflict, access, leakage, accommodation, drift, or routing uncertainty.
- `ADM-01`–`ADM-06`: Are trained and four-way distinct from scorer/key/recorder; verify eligibility, aliases, profiles, artifacts, workspace, and non-exposure; present only the assigned frozen material; cannot see a pre-lock key or alter answers/thresholds/results; invoke only approved offline operations; and stop on invalidity, exposure, coaching, collusion, early key request, mismatch, runner error, or sequence uncertainty.

The exact scorer instrument remains `scorer-calibration-eligibility-v1`; this protocol does not restate or weaken it.

## 3. Deterministic separation

`D` is required distinct, `C` is allowed only with exact founder decision and proof, and `S` is the same role. The two scorers are distinct from each other.

| Role | SCR | ADJ | OPR | ADM | KEY | REC | PRV | RCV | HDR |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCR | D | D | D | D | D | D | D | D | D |
| ADJ | D | S | D | D | D | D | D | D | D |
| OPR | D | D | S | C1 | D | D | D | D | D |
| ADM | D | D | C1 | S | D | D | D | D | D |
| KEY | D | D | D | D | S | D | C2 | D | D |
| REC | D | D | D | D | D | S | D | D | C4 |
| PRV | D | D | D | D | C2 | D | S | D | D |
| RCV | D | D | D | D | D | D | D | S | D |
| HDR | D | D | D | D | D | C4 | D | D | S |

- `C1`: `OPR-HMM00001 + ADM`, mechanical administration only; scorer/administrator/key/recorder remain four-way distinct.
- `C2`: `PRV + KEY`, only with compartment-specific credentials, permissions, and logs; no cross-granted content access; two-person incident access.
- `C4`: `REC + HDR`, only when recorder is a read-only witness with no append/edit/delete/restore/input-selection authority.

Every other pair and every three-role concentration is prohibited. The evaluator compares private mapping-record digests, not names.

## 4. Storage and least privilege

The eight required logical classes are `IDMAP`, `RAW`, `LEDGER`, `CAL`, `PRES`, `KEYS`, `BACKUP`, and `INC`. Git stores only schemas, code, opaque `LOC-[A-Z0-9]{12,40}` references, controller aliases, versions, control flags, and digests. Actual paths, URLs, providers, accounts, identities, credentials, passphrases, factors, keys, responses, and incident content stay outside Git.

`IDMAP` is separately encrypted and controlled; `RAW` is pseudonymous and encrypted; `LEDGER` is minimized and append-only; `CAL` is private and separate from participant evidence; `PRES` and `KEYS` are separate restricted compartments; `BACKUP` is encrypted and independently controlled; and `INC` is isolated and minimized. Every restricted operation is attributed, scoped, current, and logged.

The executable matrix uses `R` read admitted content, `A` append/create only, `M` metadata/redacted oversight, and `X` controlled execution without content read. No listed permission means deny. Row/object scoping in the approved private access list narrows these maxima. Privacy-owner content reading requires an incident-specific necessity digest, founder/emergency approval digest, two-person access, and post-access review. `HDR` append permission is only to an external confirmation and never source-ledger edit authority.

## 5. Key release and calibration gate

Existing lock/key/retry sequencing remains unchanged. A release comparison additionally requires a current, digest-valid `collective-readiness-v1` record with `decision: READY`, an exact final founder decision receipt, all controls `PASS`, no open/conflicting/stale evidence, unchanged zero counters, and `a01ContactAuthorized: false`. The gated runner validates readiness before reading a key. No parameter can override readiness, thresholds, or disposition.

`READY` authorizes real scorer calibration only. It never authorizes `A-01`. The separate pre-contact function requires two distinct current scorer-pass digests, every versioned checklist-v3 control, and no relevant change or incident.

## 6. Backup and restore

Before final approval, private topology must prove separate encrypted backup control, split/two-person secret custody, documented coverage, source manifest/head, isolated non-overwriting target, exact digest/count/head/permission comparison, deletion/hold propagation, cleanup, and attribution. Evidence contains only opaque references and digests.

The automated test uses synthetic in-memory records, ephemeral AES-256-GCM material, two XOR shares, an empty target, exact manifest/head/count comparison, and buffer cleanup. It makes no operational-storage claim. A real operational empty/synthetic restore using the later approved private topology remains required. Partial, corrupt, mismatched, stale, destructive, uncleared, secret-exposed, or uncertain restore is `BLOCKED`.

## 7. Integrity, corrections, incidents, and head confirmation

The versioned genesis is `GENESIS:role-custody-ledger-v1`. Each record digest is `SHA-256(previousDigest + "\n" + canonicalRecordWithoutDigests)`. Appends reject a stale head, duplicate ID, and replayed source digest. No record is overwritten.

A correction is a new linked record with target ID/digest, bounded reason, corrected closed fields, authorization digest, unchanged raw-source digest, optional incident link, prior head, and new digest. It cannot rewrite source, change source digest, or turn invalid/ineligible evidence favorable without the complete new process. Incidents are minimized linked records; any missing link blocks.

`HDR` independently recomputes the chain. Confirmation records count, expected/recomputed head, correction/incident summaries, time, versions, and `confirmed` or `mismatch`; they cannot edit the ledger. Later confirmation links to the prior confirmation.

## 8. Retention and holds

`IDMAP` identity/alias verification material is deleted 90 days after Sprint 6.5 qualification closure, subject only to a necessary documented hold. Role mappings use 90 days after last operational need and related incident/hold closure. Detailed `RAW` and `CAL` use the approved 90-day closure default. Backup follows the earliest source trigger and must not resurrect expired data.

`LEDGER`, aggregate report, manifest, head confirmation, and detailed incident evidence require positive, bounded, founder-approved durations in the private policy. `permanent`, `indefinite`, zero, and unspecified fail. The private policy must also set a positive maximum backup-deletion propagation interval.

A hold requires scope, reason code, owner, approving authority, start, affected digests, restricted access-list digest, objective release/deletion trigger, and review within 30 days. It cannot expand access or auto-renew. Expired/unreviewed, unexplained, conflicting, or indefinite holds are `BLOCKED` incidents.

## 9. Binary collective readiness

The evaluator outputs only `READY` or `BLOCKED`; there is no partial state or bypass. Exact role cardinality is two scorers and one each of `ADJ`, `OPR`, `ADM`, `KEY`, `REC`, `PRV`, `RCV`, and `HDR`, with approved combinations represented by the same private mapping digest plus exact proof.

Every role, separation, access, mapping, storage, encryption, custody, restore, chain, correction, head, retention, hold, incident, offline validation, zero-network, no-qualification, implementation, governance, envelope, topology, and founder-approval control must be valid and current at the same evaluation time. Missing, stale, uncertain, conflicting, incident-affected, expired, or unverifiable evidence is `BLOCKED`. The record expires at the earliest constituent expiry. A relevant change/incident appends a linked `BLOCKED` record.

Readiness records always state: participant counters changed `0`; release reviewers changed `0`; genuine reviews changed `0`; HMM `not_qualified`; and `a01ContactAuthorized: false`. Participant/release aggregators reject these record types.

## 10. Present boundary

No real role assignment, alias, private topology, secret custody, incident route, operational restore, scorer pass, participant record, or founder approval receipt has been created. The current pre-checkpoint evaluation is necessarily `BLOCKED` because the final approval and private evidence are absent.

Current state: **NO REAL SCORER CALIBRATION; NO A-01 CONTACT; 0/16 contacted; 0/12 enrolled; A/B/C/D 0/3 each; 0/2 release reviewers; 0/30 genuine release-gating reviews; HMM `NOT_QUALIFIED`.**
