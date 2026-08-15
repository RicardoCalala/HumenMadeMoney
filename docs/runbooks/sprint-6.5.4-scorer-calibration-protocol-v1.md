# Sprint 6.5.4 scorer calibration protocol

Version: `scorer-calibration-protocol-v1`

Status: **IMPLEMENTED OFFLINE — FOUNDER CHECKPOINT PENDING — NO REAL SCORER ACCESS — NO A-01 CONTACT**

This protocol implements the eight founder-approved calibration decisions against frozen `authority-comprehension-rubric-v1`. It gates scorer eligibility only. It cannot contribute a participant, cohort, release reviewer, genuine review, validation pass, or HMM qualification result. `OPR-HMM00001` remains logistics/support only and cannot score, coach, interpret, change a result, or adjudicate.

## 1. Eligibility and disqualification

Before any alias or restricted access, a proposed scorer and administrator complete the closed `scorer-calibration-eligibility-v1` record in controlled private storage. All twelve attestations must be true and verified. A false, missing, uncertain, stale, or unverifiable answer; prohibited authorship/testing; prior fixture/key/participant exposure; role overlap; pressuring relationship; outcome-contingent compensation; collaboration; copying; unblinding; identity uncertainty; or material deviation disqualifies the person and stops access.

Only after verified eligibility may the administrator generate a cryptographically random, unique alias matching `SCR-[A-Z0-9]{8,32}`. It must encode no identity, employer, order, role, or result. The identity mapping stays separately controlled outside Git; only its digest enters calibration evidence. Re-attest after any protocol, rubric, dataset, role, access, custody, conflict, or exposure change.

## 2. Frozen restricted dataset and custody

`scorer-calibration-dataset-v1` contains two independent, preassigned, frozen ten-fixture subsets. Each independently covers all four semantic labels, safe semantic equivalence/ordinary-language umbrella statements, omission or partial demonstration, ambiguity, conditional authority, unsafe authority, and critical actor/consequence/control-path/negation patterns. IDs, raw-content digests, normalized-text digests, and substantive duplicate review establish non-overlap. The retry subset is not presented or made accessible unless a locked primary attempt fails and remediation/re-attestation is complete.

The scorer receives only the frozen rubric and the applicable restricted presentation file. Expected labels, unsafe flags, critical rules, rationales, the other subset, the other scorer's work/result, participant information, cohort status, and desired outcome remain hidden. A defective, leaked, or substantively duplicated fixture invalidates the dataset version; no item is dropped or reinterpreted after exposure.

## 3. Exact administration sequence

1. Verify private eligibility/conflict/role-separation attestations. No alias or restricted access exists yet.
2. Assign and seal one random `SCR-*` alias; record only the mapping-record digest.
3. Verify exact protocol, rubric, dataset, subset, key, schema, comparison, and presentation-order digests; verify access/custody and non-exposure.
4. Present only the primary subset and frozen rubric. The administrator may solve access mechanics only.
5. The scorer independently gives exactly one label for every fixture.
6. Run the lock operation. It rejects incomplete/invalid input, creates submission and lock digests, uses mode `0600`, refuses overwrite, and permits no post-lock edit.
7. Only after lock validation may the custodian make the matching key available to the comparison operation. The code validates eligibility, lock, attempt order, retry prerequisites, and timestamps before invoking its key loader.
8. The deterministic comparison records aggregate counts and PASS/FAIL. Neither the administrator nor CLI arguments can alter thresholds, labels, or disposition.

Preferred custody separates presentation administrator and key custodian. A founder must explicitly approve any combined non-scoring custody. Scorer workspaces remain mutually inaccessible. The adjudicator has no calibration role and cannot rescue a failure.

## 4. Exact pass calculation

An attempt passes only if its complete locked denominator simultaneously has:

- unsafe/not-unsafe correctness equal to `total/total` (both false positives and false negatives fail);
- exact four-label agreement satisfying `exactCorrect × 100 >= total × 90`, with integers and no rounding;
- zero critical-boundary errors; and
- valid versions, digests, order, attestations, custody, and integrity evidence.

A missing, extra, reordered, duplicate, or invalid label fails. Critical errors include any unsafe binary mismatch; critical `ambiguous` labeled `demonstrated`; or a critical actor, consequence, separate-control-path, or negation omission labeled `demonstrated`. Cohort Section 10 constants (`10/12`, `2/3`, inter-rater `0.90`, kappa `0.80`) are not calibration configuration and cannot replace this calculation.

## 5. Remediation, retry, and replacement

Attempt one always uses the primary subset. A failure records `remediation_required`. At most one remediation session may explain frozen rubric concepts, the decision process, and category-level error counts. It may not expose fixture text, item answers/rationales, retry material, answer-bearing paraphrases, or correctness coaching.

After remediation and renewed independence/non-exposure attestations, one retry may use only the unseen retry subset under the identical full thresholds. It requires a linked failed locked primary attempt, distinct attempt ID, non-overlap proof, and independent-retry confirmation. Attempts are never averaged or merged. Failed items never recur. There is no third attempt, waiver, threshold change, or repeat-practice route. A second failure records `ineligible_replace`; the scorer cannot score or adjudicate this version-family study and a newly screened replacement starts at attempt one. Failures never count against HMM qualification.

## 6. Private evidence and retention

Keep only fields admitted by `scorer-calibration-eligibility-v1` and `scorer-calibration-result-v1`: alias; bounded attestations and their digest; artifact versions/digests; attempt/timestamps; lock proof; aggregate exact/unsafe/critical counts; disposition; remediation/retry links; custody/blinding attestations; and append-only chain fields. Detailed locked submissions and item comparisons remain in controlled private storage only.

Never store names, contacts, employers, biography/background, diagnosis, narrative conflict notes, identity mapping, participant response, fixture/key text, unrestricted rationale, credentials, or storage paths in Git or minimized results. Inherit encrypted access control, attributed access, separate encrypted backup/recovery, append-only SHA-256 chaining, bounded holds, and deletion. Delete detailed submissions, item comparisons, conflict detail, identity mapping, and aligned backups 90 days after validation closure once reporting, final-head confirmation, incident resolution, and recovery verification finish, unless a necessary hold records scope, owner, reason, access, review date, and deletion trigger.

## 7. Offline commands

Run from `apps/web`. These commands are not authority to use real records before checkpoint approval.

```sh
node --experimental-strip-types scripts/run-scorer-calibration.ts lock --draft <private-draft.json> --out <private-locked.json>
node --experimental-strip-types scripts/run-scorer-calibration.ts compare --submission <private-locked.json> --eligibility <private-eligibility.json> --key <custodian-key.json> --key-revealed-at <UTC> --compared-at <UTC> --recorded-at <UTC> --out <private-result.json>
```

For an authorized retry, add `--history <private-primary-failure-and-remediation.json>`. New output files must not already exist. The runner has no provider, environment-secret, network, telemetry, database, production, financial, participant, or qualification dependency.

## 8. Closed gate

Until the founder approves the exact implementation commit and expanded digest envelope, no real scorer may receive an alias or see a fixture, key, answer, or result; no participant including `A-01` may be contacted. Counters remain 0/16 contacted, 0/12 enrolled, and A/B/C/D 0/3. HMM remains `NOT_QUALIFIED`, with 0/2 release reviewers and 0/30 genuine release-gating reviews.
