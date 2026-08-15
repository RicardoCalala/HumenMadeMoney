# Sprint 6.5.4 Role & Custody Readiness Protocol design

Design version: `role-custody-readiness-protocol-design-v1`

Status: **DESIGN ONLY — FOUNDER APPROVAL REQUIRED — NO REAL ACCESS — BLOCKED**

Execution references: scorer-calibration implementation commit `1ffe312b53957379f9e75aecf28512a6c7580811`; governance HEAD at design start `08f9f677104e5e6166d7481b1bbfabec519a7504`.

Current state: **NO REAL SCORER CALIBRATION; NO A-01 CONTACT; 0/16 contacted; 0/12 enrolled; A/B/C/D 0/3 each; HMM `NOT_QUALIFIED`; 0/2 release reviewers; 0/30 genuine release-gating reviews.**

## 1. Purpose, authority, and non-goals

This document designs one prospective, versioned operational package for all remaining Sprint 6.5.4 private roles, storage, custody, recovery, integrity, and collective-readiness controls. It closes the current checklist gap without changing the implemented scorer-calibration rules or treating a partial role appointment as execution authority.

This document is not an operational protocol, role appointment, access grant, checkpoint approval, calibration record, participant record, or qualification result. It does not authorize contact, recruitment, real alias assignment, restricted-material access, key release, scoring, adjudication, provider/OpenAI use, API-key access, database or production writes, financial/custody/settlement action, or modification of Sprint 6.4, Sprint 6.5.3, frozen Sprint 6.5.4 artifacts, implementation commit `1ffe312...`, or the pending checkpoint at governance commit `08f9f67...`.

No real identity, path, provider, credential, passphrase, secret, fixture, key, response, score, or result belongs in this design or in Git. Examples in later implementation must use synthetic `TST-*` aliases and empty/synthetic evidence only.

## 2. Proposed package and normative terms

After founder approval of this design, implementation should create new versioned artifacts rather than edit frozen v1 artifacts in place:

1. `role-custody-readiness-protocol-v1` — executable role, separation, access, storage, custody, incident, retention, and ordering rules.
2. `role-eligibility-attestation-v1` — closed per-role attestation schema with role-specific profiles.
3. `role-assignment-v1` — private identity/alias mapping digest, role, separation, approval, access profile, version, validity, and revocation schema.
4. `custody-topology-v1` — private approved logical-location, controller, encryption, access, backup, recovery, and deletion metadata without secret values.
5. `readiness-evidence-v1` — closed evidence references for role, storage, access, restore, key-release, chain, retention, and incident-route controls.
6. `collective-readiness-v1` — deterministic `READY`/`BLOCKED` rollup described in Section 14.
7. `sprint-6.5.4-recruitment-execution-checklist-v3` — a later checklist referencing the readiness record and both scorer passes; v2 remains immutable history.
8. offline schema, policy, access, recovery, integrity, and non-qualification tests.

`MUST`, `MUST NOT`, `REQUIRED`, and `BLOCKED` are non-waivable unless a rule expressly names a conditional combination and the founder records the required approval. `MAY` never grants access by itself. An attestation is valid only if true, explicit, current, attributable, version-linked, and independently verifiable where required. False, missing, stale, uncertain, conflicting, or unverifiable is equivalent to failed.

## 3. Common role lifecycle and private record

Every proposed role follows the same order:

1. Identify a candidate privately without reserving an alias or granting access.
2. Present the bounded neutral role description, access profile, prohibited combinations, confidentiality/minimization duties, incident route, retention rule, and voluntary withdrawal route.
3. Collect only the applicable closed attestations in Sections 4–11 and verify conflicts and separation against every proposed assignment.
4. Record `eligible`, `ineligible`, or `uncertain`. Only `eligible` continues; no founder waiver can turn a required-separation or exposure failure into eligible evidence.
5. After eligibility and separation verification, but before first role access or action, generate a cryptographically random unique alias in the role namespace. It must not encode name, initials, email, employer, order, outcome, or conflict status.
6. Seal the minimum identity-to-alias mapping in the identity mapping store; put only its digest and closed metadata in other records.
7. Approve the exact access profile and validity interval. Access remains disabled until the final founder checkpoint.
8. Re-attest and reapprove after any role, person, conflict, protocol, artifact, access, storage, custody, incident, exposure, or material implementation change. Revoke immediately on withdrawal, disqualification, expiry, or incident.

Minimum private identity/alias mapping fields are: `mappingRecordId`; real name or equally reliable minimal local identifier; one private contact route only if operationally necessary; role; alias; eligibility-record digest; protocol and attestation versions; verified-at/verified-by; founder-approval reference where required; access-profile ID; valid-from/valid-until; status; revocation reason code/time if applicable; and mapping-record digest. Do not collect biography, demographics, diagnosis, employment file, unrestricted conflict narrative, government identifier, financial data, participant data, fixture/key content, score, or outcome. A bounded conflict reason code and separately access-controlled minimum incident detail replace free text.

## 4. Key custodian (`KEY-[A-Z0-9]{8,32}`)

Alias timing follows Section 3 and occurs only after every `KEY-*` item is true and separation is verified, before any key custody or access. The custodian may see approved key bytes, key/subset/version/digest metadata, release prerequisites, release receipt, and minimum incident evidence. The custodian may not see real participant/scorer identities, raw participant responses, another scorer's work, cohort outcomes, unrestricted conflict records, or change scores/keys/subsets.

Required attestations:

- `KEY-01` Adult, voluntary acceptance, understands confidentiality, least privilege, release, stop, and incident duties.
- `KEY-02` Did not author, edit, approve, implement, test, or validate restricted fixture content, expected labels, key rationales, comparison logic, or the submission being released against.
- `KEY-03` Has not disclosed, copied, retained outside the approved store, or exposed a key/presentation and knows of no prior compromise.
- `KEY-04` Is not a scorer, calibration administrator, independent calibration recorder, adjudicator, participant, primary submission author, or presentation operator for the same attempt.
- `KEY-05` Has no supervisory, financial, household, close-personal, reporting-line, authorship, or outcome-contingent conflict with a scorer, administrator, recorder, adjudicator, or desired result.
- `KEY-06` Can maintain keys deny-by-default in the approved restricted-key compartment and use only the approved access mechanism; no local copies, messages, screenshots, printouts, logs, or ad hoc exports.
- `KEY-07` Will verify protocol/dataset/subset/key versions and digests and release only the exact matching subset to the deterministic comparison boundary.
- `KEY-08` Will verify a complete valid locked submission, lock digest, eligibility digest, role separation, timestamp order, and approved attempt number before release.
- `KEY-09` Will keep the retry key and presentation inaccessible until a valid locked primary failure, bounded remediation, renewed attestations, non-exposure confirmation, and retry authorization all exist.
- `KEY-10` Will never reveal key text, expected labels, critical flags, or rationales to a scorer, operator/support person, presentation administrator, participant, or adjudicator; will not manually score or communicate correctness hints.
- `KEY-11` Will create an attributed release receipt containing only bounded IDs, versions, digests, aliases, UTC times, authorization reference, decision, and chain link.
- `KEY-12` Will stop and report identity/alias uncertainty, digest/version mismatch, early or excess request, substituted key, abnormal access, lost control, exposure, coercion, chain/clock uncertainty, or any attempt to bypass the comparison loader.

Any false/missing/stale/uncertain item; prohibited role overlap; fixture/key authorship or test exposure; inability to enforce exact-subset release; unmanaged key copy; conflict; early/retry release; disclosure; manual scoring; digest mismatch; or incident nondisclosure disqualifies the custodian and blocks or invalidates affected attempts.

## 5. Independent calibration recorder (`REC-[A-Z0-9]{8,32}`)

Alias assignment occurs only after `REC-*` eligibility and separation pass, before observing or recording an attempt. The recorder may see protocol/version/digest metadata, role aliases, lock/release/comparison timestamps, aggregate deterministic counts, disposition, reason codes, receipts, and chain fields. By default the recorder may observe that a submission was locked but may not see item text, answers, expected labels, rationales, real identities, participant responses, the other scorer's record, or unrestricted remediation detail.

Required attestations:

- `REC-01` Adult, voluntary acceptance, trained on the frozen recording schema, sequence, correction, confidentiality, and stop rules.
- `REC-02` Did not author, implement, test, administer, score, key, or approve the attempt artifacts or restricted content and has no prior answer-bearing exposure.
- `REC-03` Is not the scorer, calibration administrator, key custodian, operator/presentation role, or adjudicator for the same attempt.
- `REC-04` Has no pressuring, outcome-contingent, reporting-line, close-personal, financial, authorship, or undisclosed conflict.
- `REC-05` Will record only schema-admitted facts from deterministic receipts and direct process observation, never infer or reinterpret a score.
- `REC-06` Will verify alias formats, role uniqueness, artifact/version/digest match, lock-before-release order, and deterministic-comparison attestation before accepting a record.
- `REC-07` Will not edit a locked submission, key, comparison output, prior chain record, threshold, disposition, or counter.
- `REC-08` Will append exactly once using canonicalization, duplicate/replay rejection, prior-head linkage, attributed UTC time, and a deterministic record digest.
- `REC-09` Will correct only through a new linked correction record; will never overwrite, delete, backdate, reuse an ID, or silently repair history.
- `REC-10` Will keep each scorer and attempt blinded from the other and disclose no result beyond the approved need-to-know route.
- `REC-11` Will stop on missing source receipt, inconsistent sequence, duplicate/replay, gap, digest mismatch, unverifiable observation, unauthorized content, pressure to alter, or custody uncertainty.
- `REC-12` Understands that calibration records cannot change participant counters, release-reviewer counts, genuine-review counts, or HMM status.

Disqualifiers are any failed item; recording or scoring authorship; role overlap prohibited above; restricted-answer exposure not necessary for the role; discretionary result alteration; chain edit authority; conflict; backdating; silent correction; or unverifiable source evidence.

## 6. Privacy owner (`PRV-[A-Z0-9]{8,32}`)

Alias assignment occurs after `PRV-*` checks and before approving any real-data topology, access list, retention clock, deletion, or hold. The privacy owner is a policy/controller role, not a default content reader. They may see topology metadata, data-class inventories, access/retention/deletion logs, mapping/result digests, incident metadata, and redacted samples. Content access requires an incident-specific necessity record, founder-approved or emergency-authorized scope, two-person access, and post-access review.

Required attestations:

- `PRV-01` Voluntarily accepts responsibility for minimization, purpose limitation, access review, retention, deletion, hold, and incident coordination.
- `PRV-02` Understands every artifact class in Section 12 and confirms no operational store is Git, an application/provider, production, or an unapproved personal location.
- `PRV-03` Will approve only the minimum fields, least-privilege access, attributed logging, encryption, bounded validity, and separate backup controls.
- `PRV-04` Is not a scorer or adjudicator and does not recruit, coach, interpret responses, score, change results, or operate deterministic comparison.
- `PRV-05` Has no outcome-contingent, supervisory, close-personal, financial, or undisclosed conflict that could distort access, hold, deletion, or incident decisions.
- `PRV-06` Will maintain a data inventory, purpose, controller, access list, creation event, deletion trigger/date, backup coverage, and hold state without storing secret values.
- `PRV-07` Will deny unrestricted narrative fields and unnecessary names, contacts, demographics, diagnoses, biographies, credentials, paths, fixture/key text, raw responses, or scores in ledgers/reports.
- `PRV-08` Will issue holds only when necessary, with scope, reason code, owner, start, next review no later than 30 days, access list, and deletion trigger; holds cannot silently become indefinite.
- `PRV-09` Will verify deletion from primary, temporary, export, rejected-input, log, and aligned backup copies, preserving only minimum non-content deletion proof.
- `PRV-10` Will stop on leakage, unexplained access, inventory mismatch, overcollection, missed deletion, unreviewed hold, unapproved store/export, or uncertain erasure.
- `PRV-11` Will preserve minimum incident evidence, coordinate containment through the approved route, and prevent incident detail from becoming a new unbounded sensitive store.
- `PRV-12` Will re-review access and retention after any role, topology, protocol, incident, closure, or legal/legitimate-hold change.

Disqualifiers are scoring/adjudication overlap; unmanaged operational content access; inability to enforce deletion/holds; conflict; deliberate overcollection; unapproved disclosure; or false access/deletion evidence.

The default is a distinct privacy owner. The founder may approve `PRV + KEY` only if compartment-specific credentials and audit logs remain separate, privacy duties do not grant response/identity content access, key duties grant no mapping access, two-person incident access applies, and the collective record states the staffing rationale and residual concentration risk. `PRV + RCV` is prohibited because it combines retention/primary-data governance with backup restore and erasure verification. One person may not hold `PRV + KEY + RCV`.

## 7. Recovery owner (`RCV-[A-Z0-9]{8,32}`)

Alias assignment occurs after `RCV-*` checks and before backup creation, secret-share receipt, or restore action. Recovery owns the separately controlled encrypted backup and restore procedure, not primary operational storage, scoring, or key release.

Required attestations:

- `RCV-01` Voluntarily accepts backup, restoration, minimization, deletion propagation, stop, and incident duties.
- `RCV-02` Is not a scorer, calibration administrator, key custodian, privacy owner, primary-store administrator, ledger writer, adjudicator, or final-head recorder.
- `RCV-03` Has no outcome-contingent, supervisory, close-personal, financial, authorship, or undisclosed conflict.
- `RCV-04` Controls no complete single-person decryption path: passphrase/secret components are generated outside Git/logs/messages, are not copied into evidence, and require the approved split-control or two-person procedure.
- `RCV-05` Will keep backup media/account/location independently controlled from the primary store and restrict access to approved restore/delete operations.
- `RCV-06` Will verify backup scope, encryption, version, manifest digest, source head, creation time, access log, and deletion alignment without browsing content.
- `RCV-07` Will run only approved restore tests into an isolated empty/synthetic target; no restore may overwrite or merge with operational evidence.
- `RCV-08` Will verify restored manifest, record counts, chain head, content digests, permissions, and deterministic comparison with the source test manifest, then securely remove the test restore.
- `RCV-09` Will never reconstruct lost evidence, fabricate missing records, reuse production/personal credentials, or treat an uncertain restore as successful.
- `RCV-10` Will propagate approved deletions/hold changes to backup according to the bounded schedule and produce non-content proof.
- `RCV-11` Will stop on failed/partial restore, secret loss/exposure, unlogged access, source/backup mismatch, corruption, overwrite risk, uncertain deletion, or loss of independent control.
- `RCV-12` Will preserve minimum recovery incident evidence and require containment, root-cause review, and fresh approval before reliance resumes.

Any failed item, prohibited overlap, sole decryption power, primary-and-backup control, conflict, destructive restore, fabricated recovery, secret disclosure, or uncertain restore disqualifies the recovery owner and blocks readiness. Recovery cannot combine with privacy owner, key custodian, operator/administrator, calibration recorder, or final-head recorder.

## 8. Independent final head-digest recorder (`HDR-[A-Z0-9]{8,32}`)

Alias assignment occurs after `HDR-*` checks and before accepting the final-head task. The final-head recorder receives read-only canonical chain verification evidence, the computed terminal digest, record count, genesis/version identifiers, correction/incident link summary, finalization time, and implementation/checkpoint references. They receive no real identities, raw content, restricted keys, secrets, or edit capability.

Required attestations:

- `HDR-01` Voluntarily accepts independent, read-only final verification and incident duties.
- `HDR-02` Did not create, append, correct, delete, administer, restore, or approve records in the chain being confirmed.
- `HDR-03` Is not a scorer, operator/administrator, key custodian, recovery owner, adjudicator, or any person with ledger/storage edit or delete authority.
- `HDR-04` Has no outcome-contingent, supervisory, close-personal, financial, authorship, or undisclosed conflict.
- `HDR-05` Will independently recompute or verify canonical record digests, previous links, genesis, terminal head, count, order, duplicate/replay absence, and linked corrections/incidents.
- `HDR-06` Will perform confirmation only after all expected records, corrections, incident dispositions, closure marker, and deletion/hold state required for that finalization point exist.
- `HDR-07` Will record exact versions, manifest/chain digest, terminal head, record count, observed-at UTC, verification method/version, and `confirmed` or `mismatch`; never a discretionary pass.
- `HDR-08` Has no ability to change source records or make a mismatch disappear and will not accept a digest supplied without independent verification.
- `HDR-09` Will stop on truncation, reorder, duplicate, broken link, unexpected correction, missing incident link, mismatch, inaccessible evidence, or time/version uncertainty.
- `HDR-10` Understands that head confirmation proves integrity of the observed chain only, not truth, eligibility, calibration pass, cohort pass, release review, or HMM qualification.

Disqualifiers are ledger/storage edit or deletion authority, source-record authorship, prohibited role overlap, inability to recompute, conflict, or accepting unverifiable evidence.

Default and recommended: `HDR` is a distinct person. `HDR + REC` is conditionally allowed only if implementation makes `REC` a read-only process witness that cannot append, edit, correct, administer, delete, restore, or choose ledger inputs; an independent append service/administrator must create the record, and the founder must approve this architecture. If `REC` has any ledger write authority, `HDR + REC` is prohibited. Separation is therefore required by capability, not merely by title.

## 9. Adjudicator (`ADJ-[A-Z0-9]{8,32}`)

Reuse the frozen Sprint 6.5.4 adjudicator role; do not create a calibration adjudicator. Alias assignment occurs only after the existing cohort eligibility/conflict checks plus these clarifications pass, before any assigned participant disagreement is shown.

Required attestations:

- `ADJ-01` Meets the frozen adjudicator eligibility, independence, confidentiality, blinding, and conflict requirements.
- `ADJ-02` Is not the participant, operator/support person, cohort administrator, either scorer, calibration administrator, key custodian, calibration recorder, privacy/recovery owner acting on the evidence, or final-head recorder.
- `ADJ-03` Did not recruit, orient, coach, capture, score initially, calibrate a scorer, create restricted keys, or operate scoring/comparison for the study.
- `ADJ-04` Sees only the original pseudonymous response, frozen rubric/item version, and two blinded rationales necessary for an eligible disagreement.
- `ADJ-05` Cannot edit/add to the response, add missing concepts, change initial scores, lower/waive a critical gate, average unsafe, or consult calibration keys/results.
- `ADJ-06` Records one bounded determination and rationale code under the frozen protocol; unresolved/unavailable independence blocks validation.
- `ADJ-07` Stops on identity exposure, coaching/collusion, conflict, missing evidence, protocol drift, unblinding beyond the approved packet, or pressure to reach a desired outcome.
- `ADJ-08` Understands the role has no calibration, recruitment, support, key-custody, ledger-correction, release-gating, or qualification authority.

Any failed existing or listed condition disqualifies. `ADJ` is required distinct from all operator/administrator, scorer, scoring, calibration, key-custody, recovery, and final-head functions. No conditional combination is allowed.

## 10. Support contact/operator and calibration administrator

Preserve `OPR-HMM00001` as the logistics/support alias. It already matches `OPR-[A-Z0-9]{8,32}` and is not reassigned or treated as a new identity here. A separately staffed calibration administrator uses `ADM-[A-Z0-9]{8,32}`. Existing code permits an `OPR-*` alias in the administrator field, so `OPR + ADM` is a conditional combination, not a new scoring permission.

Required operator/support attestations:

- `OPR-01` Provides only neutral scheduling, access, navigation, format, break/extra-time, and incident-routing support under the frozen scripts.
- `OPR-02` Does not score, adjudicate, interpret, hint, coach, remediate toward answers, reveal correctness, alter results, or manually operate key comparison.
- `OPR-03` Is not a scorer, adjudicator, key custodian, calibration recorder, recovery owner, or final-head recorder and has no prohibited conflict.
- `OPR-04` Keeps real identity/contact mapping separate from responses, scoring, keys, ledgers, and Git; accesses only the minimum mapping needed for logistics.
- `OPR-05` Records support using closed access/mechanical codes, never diagnosis, disability narrative, answer content, or evaluative impressions.
- `OPR-06` Stops on coaching request, answer-bearing question, identity/alias uncertainty, conflict/coercion, unauthorized access, leakage, unsupported accommodation, protocol drift, or incident-route failure.

Required calibration-administrator attestations:

- `ADM-01` Is eligible, trained on the frozen mechanical sequence, and is distinct from scorer, key custodian, and calibration recorder as the current runner requires.
- `ADM-02` Verifies eligibility digest, alias, access profile, exact artifact digests/order, private workspace, and non-exposure before presentation.
- `ADM-03` Presents only the applicable frozen subset/rubric and resolves access mechanics only.
- `ADM-04` Cannot see a key before lock, cannot interpret or reject an answer, cannot edit after lock, and cannot alter comparison thresholds/results.
- `ADM-05` Invokes only approved offline lock/comparison operations and preserves receipts; no provider, network, secret-environment, database, telemetry, production, or qualification dependency.
- `ADM-06` Stops on incomplete/invalid identity or eligibility, access failure, exposure, coaching, collusion, early key request, mismatch, runner error, or sequence uncertainty.

`OPR + ADM` is allowed only by explicit founder approval when the administrator remains mechanical, has no key access, and the implemented four-way uniqueness among scorer/administrator/key custodian/recorder remains enforced. Otherwise they are distinct. Neither role may combine with adjudicator or scorer. Any interpretive/coaching/scoring act disqualifies the affected evidence.

## 11. Scorers (`SCR-[A-Z0-9]{8,32}`)

Scorer eligibility, alias timing, access, blinding, thresholds, retry, replacement, evidence, and disqualification remain exactly those in `scorer-calibration-protocol-v1` and its implemented `scorer-calibration-eligibility-v1` schema. This package references those controls and does not restate or weaken them.

Each scorer must be distinct from the other scorer and every operator, administrator, key custodian, calibration recorder, privacy/recovery owner acting on the same evidence, adjudicator, and final-head recorder. A scorer sees only the frozen rubric and assigned presentation during calibration, then only the pseudonymous participant response packet permitted by the cohort protocol after both scorers pass and the contact gate opens. A scorer never sees keys, real identities/contact slots/groups/sources, the other scorer's work/result, cohort outcome, desired outcome, unrestricted incidents, or other participant responses except the exact assigned response under the frozen cohort procedure. No role combination is allowed.

### 11.1 Exact private evidence by role

All role evidence uses closed reason codes, IDs, aliases, UTC times, versions, and SHA-256 digests; unrestricted prose is prohibited. Detailed evidence stays in its controlled private class and the ledger receives only the minimized digest/provenance subset.

| Role | Minimum private evidence fields | Fields expressly excluded |
| --- | --- | --- |
| `KEY` | alias; eligibility/assignment/access-profile digests; request/attempt/subset/key/version digests; lock and prerequisite receipt digests; request/release/deny UTC times; release target `deterministic_comparison_loader`; decision/reason code; previous/record digest; incident ID if any | key text/rationale in ledger, scorer identity/contact, participant response, manual score, free-text explanation |
| `REC` | alias; eligibility/assignment digests; observed attempt ID; lock/release/comparison receipt digests; aggregate counts/disposition source digest; append UTC time; prior/new head; record ID/digest; correction/incident link | item text, answer, expected label, rationale, real identity, discretionary score narrative |
| `PRV` | alias; eligibility/assignment digest; inventory/access-list/topology/retention-policy digests; review time/outcome; deletion class/digest/time/executor/verifier; hold reason code/scope/review/trigger; incident/action IDs | routine raw content, keys, secret values, unrestricted identity/conflict/incident narrative |
| `RCV` | alias; eligibility/assignment digest; backup/procedure/manifest/source-head digests; covered-class codes; split-control attestation; restore start/end; isolated-target/test-only attestation; restored count/head/digest comparison; permission check; cleanup/deletion proof; result/reason; incident ID | passphrases/factors, real paths/credentials in Git/ledger, routine content, reconstructed evidence |
| `HDR` | alias; eligibility/assignment digest; chain/schema/canonicalization versions; genesis/source-manifest/expected-head digests; record count; recomputed head; correction/incident summary digests; observed-at; verification method/version; confirmed/mismatch; external confirmation digest | edit token/capability, raw content, identities, keys, claim that records are substantively true |
| `ADJ` | alias; frozen eligibility/assignment digest; pseudonymous disagreement packet/response/rubric/item-version digests; two blinded-rationale digests; bounded determination/rationale code; UTC time; previous/record digest; incident ID | real identity, calibration fixture/key/result, participant contact/source, outcome target, unrestricted rationale |
| `OPR` | fixed alias; role/assignment/access-profile digests; logistics/support event code; pseudonymous slot/alias only when needed; start/end; neutral-support/no-coaching attestation; mapping digest; incident ID | answer content, score, diagnosis/accommodation narrative, key, other identity, interpretive notes |
| `ADM` | alias; eligibility/assignment/access-profile digests; artifact/access/non-exposure checklist digest; attempt/subset/order IDs/digests; presentation/lock/key-request/comparison receipt digests; runner version; ordered UTC times; no-manual-score attestation; incident ID | key contents, expected labels, score edits, coaching narrative, real identity, participant evidence |
| `SCR` | exactly the fields admitted by existing `scorer-calibration-eligibility-v1`, locked-submission, and `scorer-calibration-result-v1` contracts, plus later frozen cohort scoring schema fields | everything those closed schemas reject, including names/contacts, other scorer work, key/rationale, participant-source identity, unrestricted prose |

Eligibility/conflict detail, access logs, release/restore receipts, raw role mappings, and incident content follow the detailed-evidence deletion clocks in Section 13.4. Only assignment/eligibility digests, aliases needed to interpret the chain, bounded dispositions, artifact/version digests, times, and integrity links may survive in the minimized ledger for its founder-selected bounded duration. A role's evidence does not expand that role's content access.

## 12. Storage topology and access matrix

Implementation must instantiate the following logical compartments. The final checkpoint records private opaque location IDs, controller aliases, provider/type, encryption and authentication evidence, access-list digest, logging evidence, retention/deletion dates, backup coverage, and approval references. It must not place actual paths, URLs, provider credentials, passphrases, recovery secrets, or content in Git or the minimized ledger.

| Class | Required contents | Required controls |
| --- | --- | --- |
| `IDMAP` identity↔alias mapping | Minimum Section 3 fields and bounded eligibility/conflict references | Separate encrypted primary store; operator-only row-limited logistics access; privacy metadata oversight; no Git/study-system/result/key co-location |
| `RAW` encrypted raw responses | Pseudonymous response, item/instrument version, capture/source digest, time | Encrypted controlled store; scorer/adjudicator per-assignment read only; no key/identity data; shortest scoring window |
| `LEDGER` minimized append-only ledger | Aliases, closed tags/dispositions, versions/digests/times, chain/correction/incident links, counters fixed by record type | Canonical append only; no raw content/identity/key; attributed writes; independent read-only head verification |
| `CAL` calibration eligibility/results | Closed eligibility, locked submission, aggregate comparison, receipts, remediation links | Separate private store; scorer own draft only until lock; role-separated lock/key/record paths; no participant evidence |
| `PRES` restricted presentations | Exact primary/retry subset bytes and order | Administrator presentation access to current subset only; scorer view-only; retry inaccessible until prerequisites |
| `KEYS` restricted keys | Expected labels, flags/rationales, key/version/subset digests | Key-custodian-only pre-release; exact matching loader boundary; no operator/scorer/adjudicator/manual access |
| `BACKUP` encrypted backup | Encrypted covered classes plus manifest and source-head metadata | Separate controller/location; recovery split-control; no routine browsing; isolated restore; deletion/hold alignment |
| `INC` incident evidence | Minimum event ID, type/severity, aliases, affected digests/classes, times, containment, approvals, disposition, deletion/hold | Separate restricted case access; no unnecessary content; immutable links from affected chain; bounded retention |

Access symbols below are maximum permissions: `R` read admitted content, `A` append/create without overwrite, `M` metadata/redacted oversight only, `X` execute controlled operation without content read, `—` denied. Conditional access is footnoted and must be narrower in the private access list.

| Role | IDMAP | RAW | LEDGER | CAL | PRES | KEYS | BACKUP | INC |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| participant | — | own submission input only | — | — | — | — | — | own notice only |
| scorer | — | R assigned only | R own finalized disposition only | R/A own draft; R own bounded result | R assigned subset only | — | — | A report; R own instructions only |
| `OPR` support | R minimum logistics rows; A logistics status | X capture transport only; no content read | A logistics events only | M status only | X delivery only | — | — | A report; R routing status |
| `ADM` calibration | M alias/eligibility digest | — | A calibration process events | R eligibility/locked metadata; X lock/compare; no key/result alteration | R assigned presentation | X exact loader only after lock; no content read | — | A report; R process case |
| `KEY` | — | — | A release receipt only | R lock/prerequisite metadata | M subset ID/digest only | R matching key; X release | — | A report; R key case |
| `REC` | — | — | A calibration result only, or R in witness-only combination | R bounded receipts/aggregate result | — | — | — | A report; R recording case |
| `PRV` | M inventory/access/deletion; content only incident exception | M by default | M | M | M | M | M | R privacy cases; A governance action |
| `RCV` | — | — | R source-head metadata only | — | — | — | X backup/restore/delete; no routine content read | A report; R recovery case |
| `HDR` | — | — | R canonical chain only; A external confirmation only | — | — | — | — | R linked summary only |
| `ADJ` | — | R exact disputed packet only | A adjudication record only | — | — | — | — | A report; R adjudication case |
| founder | M approval evidence, not routine content | — by default | R minimized ledger/report | M readiness evidence | — | — | — | M decision summary; scoped incident access only if necessary |

No participant or scorer gets another identity, another scorer's work/result, calibration key, cohort desired outcome, unrestricted incident, backup, or access-list data. Access expires automatically at the earliest role end, validity end, deletion trigger, revocation, or incident stop. Every read/write/execute of restricted classes is attributed and reviewed; absence or uncertainty in logging is `BLOCKED`.

## 13. Custody, restore, integrity, retention, and incident controls

### 13.1 Locked-submission/key-release sequence

The implemented `scorer-calibration-protocol-v1` order remains controlling:

1. Verified current eligibility and four-way role uniqueness exist; alias and mapping digest are valid; access profile is enabled only after final checkpoint.
2. Administrator verifies exact protocol/rubric/dataset/subset/presentation/schema/comparison digests and presents only the assigned subset.
3. Scorer completes every label independently. The offline runner validates and locks the complete submission, records submission/lock digests and UTC `lockedAt`, refuses overwrite, and permits no post-lock edit.
4. Key custodian verifies lock, eligibility digest, attempt order, version/digest match, release authority, and retry prerequisites. No key loader call occurs before all checks.
5. Custodian releases only the matching subset key to the deterministic comparison loader. A key digest/subset/version mismatch fails closed. The operator/administrator cannot supply a substitute, manually score, or change thresholds/disposition.
6. Recorder accepts only bounded deterministic output and release/lock receipts, appends once, and links the prior head.
7. Retry presentation/key remain inaccessible until a valid locked primary failure, permitted remediation, renewed eligibility/non-exposure, and independent retry confirmation. Early exposure invalidates the version for the affected scorer and triggers incident handling.

### 13.2 Backup and restore

Before the final founder checkpoint and before first contact, the implemented topology must pass a credential-free, offline restore using only an empty operational structure or synthetic `TST-*` records. The test must never copy or expose real/restricted content. It must prove: independently controlled encrypted backup; documented coverage/exclusions; split/two-person secret procedure; source manifest and head capture; isolated non-overwriting target; exact file/record count and digest comparison; chain verification; access permissions; deletion/hold propagation simulation; test-target cleanup; and attributed evidence.

Secret/passphrase values are generated and stored outside Git, source, command history, logs, screenshots, chat, evidence records, and the primary data store. Evidence stores only secret-control method/version and a verification digest/reference, never the value. No single recovery owner may possess all factors. Loss, exposure, partial restore, mismatch, uncertain provenance, unexpected content, cleanup failure, or inability to reproduce the procedure yields `restoreStatus: BLOCKED`; evidence is never reconstructed from memory.

### 13.3 Append-only/tamper-evident chain

Each admitted record uses deterministic canonicalization and `recordDigest = SHA-256(previousDigest + "\n" + canonicalRecordWithoutRecordDigest)`, beginning at the versioned `GENESIS`. IDs and source digests are unique; duplicates/replays are rejected. Serial append uses the currently observed head and fails on concurrent/stale head. The ledger records artifact/protocol/schema versions, attributed alias, UTC time, source digests, and record type without private content.

A correction never mutates a source record. It appends a closed correction containing new ID, prior head, target record ID/digest, reason code, corrected closed fields, authorizing alias/reference, UTC time, and its own digest. It must preserve the original, cannot change raw-source digest, cannot convert ineligible/invalid evidence into eligible evidence without the required new process, and links any incident. Deletion of content leaves only a minimized tombstone/deletion-proof record where approved.

At the defined finalization point, `HDR` independently verifies the complete chain and writes an external confirmation. Any mismatch, gap, truncation, reorder, duplicate, unexplained correction, missing incident link, or unverifiable head stops the study. A new confirmation after a legitimate later append references the prior confirmation; it does not overwrite it.

### 13.4 Retention, deletion, and holds

- `RAW` participant responses: delete from primary, temporary/export, logs, rejected-input remnants, and aligned backup 90 days after final validation closure, once scoring/adjudication, report, final-head confirmation, incident resolution, and recovery verification are complete, unless a necessary hold applies.
- Detailed `CAL` locked submissions, item comparisons, conflict detail, and calibration identity mappings: same 90-day-after-validation-closure default and prerequisites. Aggregate minimized calibration dispositions may remain only in `LEDGER` for the founder-approved ledger duration.
- `IDMAP` participant mapping: preserve the prior approved default—delete 90 days after Sprint 6.5 qualification closure, subject to the same necessary-hold rule. Until closure is defined, the final checkpoint must record the exact event definition and projected/deletion review date; uncertainty blocks readiness.
- Role mappings: delete 90 days after the last operational need for the role and closure of related incidents/holds; retain only a non-identifying assignment/digest tombstone if required for chain interpretation.
- `INC`: retain content only for the founder-approved bounded incident period or active necessary hold, then minimize/delete; permanent ledger keeps only event ID/type, affected digest, disposition, and chain link.
- `LEDGER`, aggregate report, artifact/digest manifest, and final-head confirmations: founder must choose a bounded retention period before implementation. “Permanent,” “indefinite,” and unspecified are invalid values.
- `BACKUP`: follows the source class's earliest deletion trigger. The implementation must define maximum deletion propagation time, verify deletion, and prevent a restored backup from resurrecting expired data.

A hold requires scope, lawful/legitimate necessity reason code, owner, approving authority, start, affected class/digests, restricted access list, review date no later than 30 days, and objective release/deletion trigger. A hold cannot broaden access or silently renew. At every review it is released, narrowed, or affirmatively renewed with evidence. Deletion uncertainty, missed deadline, expired unreviewed hold, or backup divergence is an incident and `BLOCKED`.

### 13.5 Common incident/stop behavior

All roles stop affected access and operations for identity/alias uncertainty; eligibility or separation failure; conflict, coercion, collusion, or coaching; unauthorized/excess access; fixture/key/response leakage; early/wrong key release; substitution; manual scoring; protocol/version/digest mismatch; runner, clock, chain, ordering, replay, backup, restore, retention, deletion, or hold uncertainty; credential/network/provider/database/production activity; lost/corrupt evidence; or result/report defect.

Preserve minimum necessary evidence, revoke/disable affected access, freeze rather than overwrite existing records, append incident links where safe, notify through the privately approved route, and remain `BLOCKED`/`NOT_QUALIFIED`. Restart requires containment, root cause, scope, affected evidence disposition, recovery verification, new artifact version if validity may be affected, renewed role attestations, and fresh founder approval. No quiet restart, reconstruction, selective item dropping, favorable recomputation, or retroactive approval is allowed.

## 14. Separation matrix and safe minimum staffing

`D` means required distinct person; `C` means combination allowed only under the named founder-approved condition; `S` means same role/not applicable. Scorer means either scorer; each scorer is also `D` from the other.

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

- `C1`: `OPR + ADM` only for neutral mechanical administration; four-way scorer/administrator/key/recorder uniqueness remains enforced.
- `C2`: `PRV + KEY` only with compartmented credentials/logs, no mapping/response access from key duty, no key access from privacy duty, and two-person incident access.
- `C4`: `REC + HDR` only in the read-only witness architecture in Section 8; otherwise `D`.

Required distinct capabilities, regardless of titles, are: two independent scorers; adjudication; scoring administration; key release; deterministic-result witnessing/recording; primary privacy governance; independent backup recovery; and read-only final-head verification. The implementation's current four-way uniqueness makes scorer, administrator, key custodian, and recorder unconditionally distinct.

Default staffing uses nine people: two scorers plus one person for each of `ADJ`, `OPR/ADM`, `KEY`, `REC`, `PRV`, `RCV`, and `HDR` (ten if `OPR` and `ADM` are separate). A safe minimum of seven is possible only with founder-approved `OPR+ADM`, `PRV+KEY`, and read-only-witness `REC+HDR`. If the implementation gives `REC` append authority, the safe minimum is eight. Staffing burden never justifies a forbidden combination or partial readiness.

## 15. Collective readiness record and deterministic rollup

`collective-readiness-v1` must be a closed, private schema with `additionalProperties: false`. It contains no people, paths, secrets, fixture/key text, raw responses, or scores. Required top-level fields:

```text
recordType = "sprint_6_5_4_collective_readiness"
schemaVersion = "collective-readiness-v1"
protocolVersion = "role-custody-readiness-protocol-v1"
recordId, evaluatedAt, expiresAt, implementationCommit, governanceHead
artifactEnvelopeDigest, roleMatrixVersion, topologyRecordDigest
founderCheckpointDecisionDigest
roleAssignments[]: role, alias, eligibilityDigest, assignmentDigest,
  accessProfileDigest, verifiedAt, validUntil, status
approvedConditionalCombinations[]: roles, founderDecisionDigest,
  rationaleCode, compartmentProofDigest, validUntil
controls: roleCoverage, separation, accessControl, identityMapping,
  encryptedRawStorage, minimizedLedger, calibrationEvidence,
  restrictedPresentationCustody, keyCustody, backupCustody,
  syntheticRestore, appendOnlyChain, correctionSemantics,
  independentHead, retentionDeletion, holdProcedure, incidentRoute,
  offlineValidation, zeroNetwork, noQualificationEffect
each control: status, evidenceDigest, verifiedAt, validUntil, verifierAlias
openIncidents[], conflictingEvidence[], staleEvidence[]
participantCounters = { contacted: 0, enrolled: 0, A: 0, B: 0, C: 0, D: 0 }
releaseGate = { reviewers: 0, genuineReviews: 0, hmmStatus: "not_qualified" }
decision: "READY" | "BLOCKED"
reasonCodes[], previousDigest, recordDigest, testOnly
```

The evaluator sets `READY` if and only if all of these are mechanically true at one evaluation time:

1. Exact required role cardinality exists, aliases match role schemas, every assignment is eligible/current/approved, and no alias/person duplication violates Section 14.
2. Every conditional combination has the exact founder decision and capability/compartment proof; all other combinations are absent.
3. Every required control is `PASS`, has a valid digest, independent verifier where required, `verifiedAt <= evaluatedAt < validUntil`, and matches the exact implementation commit/protocol/artifact envelope/topology.
4. The restore test is synthetic/empty, passed, current, cleaned up, and covers the approved topology; chain/head/correction tests passed.
5. Access lists equal the matrix-derived approved profiles, logging is complete, secrets are not present in evidence, and no unapproved store/export exists.
6. No open incident, conflict, stale/missing/uncertain/unverifiable evidence, digest/version mismatch, expired role/control, or pending deletion/hold breach exists.
7. Offline validation and explicit zero-network/no-provider/no-database/no-production evidence pass.
8. Counters remain exactly 0/16 contacted, 0/12 enrolled, A/B/C/D 0/3; release reviewers 0/2; genuine reviews 0/30; HMM `not_qualified`; and every role/control record proves zero qualification effect.
9. The final founder-checkpoint approval receipt approving the exact implementation commit, expanded digest envelope, private assignments/topology/restore/incident route, and pre-checkpoint candidate evidence is present and its digest matches `founderCheckpointDecisionDigest`. A pre-checkpoint evaluation is necessarily `BLOCKED`; after the single approval event, a new linked evaluation references that immutable receipt and may be `READY`.

Any other state is `BLOCKED`; there is no partial, provisional, assumed, inherited, manual, or “ready except” state. Missing and unknown are failures. The record expires at the earliest assignment/control/evidence expiry. A material change or incident immediately supersedes `READY` with a linked `BLOCKED` record. `READY` opens only the real scorer-calibration gate; it does not authorize A-01 contact.

After `READY`, both separately eligible scorers must independently pass the existing calibration protocol. Only after both passes are valid/current, all pre-contact checklist v3 items remain complete, no incident/change exists, and a deterministic pre-contact gate verifies them may A-01 be contacted. Calibration failure/replacement follows the existing protocol and cannot be treated as partial contact readiness.

## 16. Required pre-implementation tests

Implementation is not complete until offline, credential-free, synthetic-only tests cover:

1. Positive/negative schema tests for every role profile, exact fields, closed enums, `additionalProperties: false`, IDs, UTC timestamps, digests, alias patterns, validity, version and test/release mode.
2. Complete pairwise separation-matrix tests, two-scorer uniqueness, current runner four-way uniqueness, every forbidden combination, each conditional combination without/with exact approval proof, and prohibited three-role concentration.
3. False, missing, stale, expired, conflicting, uncertain, revoked, unverifiable, wrong-version, wrong-role, and post-incident attestations; re-attestation triggers and fail-closed rollup.
4. Authorization simulation for every matrix cell, including row/object scoping, denied reads/writes/exports, privilege escalation, stale access, role revocation, privacy incident exception, attributed logging, and redacted error output.
5. Alias/identity isolation, data-minimization canaries, mapping digest linkage, accidental Git inclusion, log/temp/export/rejected-input leakage, and no real-looking identifiers in fixtures.
6. Lock-before-release, missing/incomplete/edited submission, early key release, wrong subset/version/digest, key substitution, direct/manual key access, duplicate release, presentation/key leakage, and retry-key access before every prerequisite.
7. Proof the operator/administrator cannot manually score, change thresholds, choose a favorable key, alter disposition, or access item correctness.
8. Backup creation/manifest, split-secret controls, isolated empty/synthetic restore, exact digest/count/permission/head verification, non-overwrite, cleanup, secret loss/exposure, partial/corrupt/mismatched restore, stale backup, and fail-closed restore uncertainty.
9. Chain genesis, canonicalization, append race/stale head, duplicate/replay, tamper, truncation, reorder, deletion, source-digest immutability, linked corrections, correction-of-correction, invalid favorable correction, incident linkage, and final-head mismatch/reconfirmation.
10. Retention clock, each closure definition, primary/temp/log/export/backup deletion, deletion proof, backup resurrection prevention, hold creation/scope/30-day review/release/expiry, missed deletion, and conflicting hold.
11. Collective rollup truth table proving every absent/failed/stale/uncertain/conflicting element produces only `BLOCKED`, exact all-pass inputs produce `READY`, expiry returns `BLOCKED`, and a post-ready incident/change appends `BLOCKED`.
12. Cross-document/version/digest/dependency consistency; unchanged hashes for frozen Sprint 6.4, 6.5.3, historical Sprint 6.5.4, calibration implementation, and prior manifests.
13. Process-level network denial and proof of zero provider/OpenAI construction, API/environment-secret read, remote MCP, telemetry, database write, production configuration, financial/custody/settlement operation, or external side effect.
14. Structural proof every role, eligibility, readiness, calibration, custody, restore, incident, and test artifact has `participantCountersChanged: 0`, `releaseReviewersChanged: 0`, `genuineReleaseReviewsChanged: 0`, `hmmStatus: not_qualified`, is rejected by participant/release result schemas and aggregators, and cannot satisfy any HMM qualification denominator or gate.

Run repository-native documentation/security consistency checks, targeted role/custody tests, existing orientation and scorer-calibration regression tests, `git diff --check`, and documentation link/secret/content review. Baseline build/lint/typecheck should run after implementation, not be claimed by this design-only change unless independently requested and completed.

## 17. Exact founder decisions before implementation

The founder must explicitly approve or reject, prospectively and as one design decision set:

1. The package scope, version names, design-only boundary, and rule that readiness opens calibration only, never participant contact or qualification.
2. Every role definition, checklist, disqualifier, alias namespace/timing, minimum mapping field, access boundary, re-attestation trigger, and incident duty in Sections 3–11.
3. The separation matrix, capability-based independence, default staffing, and whether to permit each of `C1`, `C2`, and `C4`; silence means distinct.
4. The storage classes/topology metadata, least-privilege matrix, attributed logging, encryption, compartment boundaries, and no-real-path/provider/secret-in-Git rule.
5. The exact lock/release/retry sequence and confirmation that the implemented scorer protocol, thresholds, fixtures/keys, and scorer eligibility remain unchanged.
6. Separate encrypted backup, recovery-owner separation, split/two-person secret control, empty/synthetic restore standard, non-overwrite, cleanup, and fail-closed uncertainty.
7. Canonical append-only chain, linked correction semantics, incident linkage, capability-independent final-head confirmation, and no silent repair.
8. The 90-day raw/calibration/identity defaults and closure prerequisites; choose a bounded minimized-ledger/report/digest retention period, bounded incident retention period, maximum backup-deletion propagation time, and role/control freshness periods.
9. Necessary-hold scope, authority, 30-day maximum review interval, narrowing/release/deletion rules, and prohibition on indefinite/unspecified holds.
10. The `collective-readiness-v1` fields, exact all-or-nothing algorithm, expiry/change behavior, and rule that the final checkpoint is itself required before `READY`.
11. Every required test in Section 16 and the structural exclusion from participant, release-review, and HMM qualification logic.
12. The ordering and clean governance supersession plan in Section 19, including no retroactive use of the earlier conversational approval.

Until all twelve are explicit, implementation remains unauthorized and the readiness record is `BLOCKED`.

## 18. Exact private facts after implementation and before final checkpoint

These are operational facts, not design decisions, and must be supplied privately only after approved implementation. They must never be filled into this Git document:

1. Minimal identity and private contact route for each proposed `OPR`, optional separate `ADM`, two scorers, `KEY`, `REC`, `PRV`, `RCV`, `HDR`, `ADJ`, and incident contact.
2. Completed current role-specific attestations, verifier identity/alias, conflict reason codes if any, eligibility/disqualification outcome, dates, expiry, and mapping/attestation digests.
3. Random real aliases assigned only after eligibility; exact person-to-role separation comparison and any founder-approved conditional-combination decision/proof.
4. Private opaque IDs and actual locations/providers/types for `IDMAP`, `RAW`, `LEDGER`, `CAL`, `PRES`, `KEYS`, `BACKUP`, and `INC`; controllers, administrators, physical/account ownership, and jurisdiction if relevant.
5. Exact access lists, authentication method, encryption-at-rest/in-transit evidence, filesystem/object permissions, logging location/retention, access-profile digests, and activation/expiry/revocation procedure.
6. Secret/passphrase generation and split-custody method, factor holders, recovery quorum, sealed verification references, emergency access route, and proof no secret value entered Git/log/chat/evidence.
7. Backup coverage/exclusions, schedule, source manifest/head, independently controlled location/controller, deletion propagation maximum, and successful empty/synthetic restore evidence including cleanup.
8. Final retention dates/event definitions for each class, founder-selected minimized-ledger and incident periods, deletion executor/verifier, backup deletion alignment, and any active hold with its next review/trigger.
9. Private incident route, primary/backup contacts, response availability, severity codes, revocation/containment mechanism, and current confirmation of zero open incidents.
10. Exact clean implementation commit, complete expanded SHA-256 envelope, offline test/security/privacy reports, zero-network proof, unchanged historical digests, and collective-readiness record digest.
11. Frozen 16-slot frame/order location and contact method/compensation facts already required by the cohort checkpoint, without contacting or aliasing any participant.

Any missing, stale, uncertain, conflicting, unverified, overbroad, or incident-affected fact prevents final approval and yields `BLOCKED`.

## 19. Ordering, checkpoint supersession, and versioning

Required order is exact:

1. Founder approves this design and its pre-implementation decisions only.
2. Implement the new package offline with synthetic data; do not edit frozen artifacts or enable real access.
3. Run all offline validation, security/privacy consistency, non-qualification, and regression checks; create a clean implementation commit and expanded digest envelope.
4. Privately complete actual role assignments, aliases, separation, access lists, locations, secret custody, retention dates, incident route, and successful empty/synthetic restore. Produce a pre-checkpoint `BLOCKED` readiness record because final approval is not yet present.
5. Create a new governance-only checkpoint in a later commit. It pins the exact clean implementation commit, expanded manifest, private evidence digests, and pre-checkpoint candidate-readiness digest without self-reference or private values. One explicit founder approval event produces an immutable decision receipt referencing that checkpoint. Then append a `READY` record referencing the receipt if and only if every other condition remains valid; this post-approval computation is not a second discretionary checkpoint.
6. Only then administer real scorer calibration. If either scorer has not passed, recruitment remains closed; replace/retry only under the frozen calibration protocol.
7. Only after both scorer passes and every checklist-v3 pre-contact item remain complete may the deterministic gate authorize first contact with still-uncontacted private slot `A-01`.

The new checkpoint should be named and versioned as a fresh expanded Sprint 6.5.4 role/custody readiness checkpoint. It prospectively supersedes `sprint-6.5.4-scorer-calibration-founder-checkpoint.md` and, for the overlapping execution gate only, `sprint-6.5.4-second-founder-checkpoint.md`. Those records remain byte-for-byte historical `PENDING` evidence. The new record must cite their status, explain supersession, and say that no prior checkbox or conversational statement is being changed, completed, inferred, or silently retrofitted.

The expanded digest manifest is append-only beside both historical manifests and includes the new protocol, schemas, access/separation policy, tests, checklist v3, unchanged dependency digests, and exact implementation commit. The checkpoint is committed afterward and pins the parent implementation commit to avoid a self-referential Git hash. Any material later change to role, person, combination, artifact, access, topology, key/release path, recovery, retention, incident route, test result, or digest immediately closes the gate and requires a new version/review.

## 20. Design acceptance criteria and present decision

This design is coherent only if it is reviewed as one package and confirms:

- every remaining role has a closed neutral eligibility, disqualification, alias, access, separation, evidence, retention, and incident contract;
- the storage topology, access matrix, key-release sequence, restore, chain, correction, and final-head rules are complete without naming people, providers, paths, or secrets;
- conditional combinations never violate the implemented scorer/administrator/key/recorder separation or primary/backup independence;
- the readiness rollup is all-or-nothing, expiring, version/digest bound, incident-sensitive, and structurally unable to qualify HMM;
- frozen history is preserved and superseded only prospectively through a fresh checkpoint; and
- no real alias, fixture/key disclosure, result, contact, provider request, database/production action, financial action, or qualification evidence was created.

Present decision: **`BLOCKED`**. Real scorer calibration: **NO**. `A-01` contact: **NO**. HMM: **`NOT_QUALIFIED`**. Counters remain unchanged.
