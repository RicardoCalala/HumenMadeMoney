# Sprint 6.5.4 orientation validation protocol

Version: `orientation-validation-protocol-v1`

Status: **OFFLINE IMPLEMENTATION COMPLETE; SECOND FOUNDER CHECKPOINT PENDING; NO RECRUITMENT**

## Fixed cohort and stopping rules

After and only after a second founder approval, freeze at most 16 contact slots in neutral order to enroll exactly 12 people: three each in A (general digital users), B (business/operations), C (technical/research), and D (finance/legal/compliance-adjacent). Store only A/B/C/D in study records—never employer, title, education, or detailed background. The same plain-language instrument applies to every group.

No favorable-result early stopping, frame expansion, retries, replacement outside unused frozen slots, or denominator removal is allowed. Everyone beginning orientation is enrolled. Stop at 12 enrolled, all 16 slots exhausted, founder withdrawal, material drift, or any privacy/integrity/validity incident. Sprint 6.5.3 Candidates 1–3 are excluded and remain unverified process evidence only. Validation participants are permanently excluded from later release gating.

## Administration, scoring, and gates

Administer orientation, then one unassisted restatement, balanced recognition checks, and four scenarios. One attempt; no corrective feedback or coaching. Two role-separated blinded scorers apply the frozen semantic rubric independently. Resolve ordinary disagreement only through a predesignated independent adjudicator applying the frozen rubric. Unsafe cannot be waived.

Pass requires: at least 10/12 demonstrate; at least 2/3 in each group; zero unsafe beliefs counted as demonstrated; at least 90% initial label agreement; Cohen's kappa at least 0.80 when informative; all disagreement bounded and resolved; and zero critical privacy, custody, integrity, credential, network, accessibility, or study-validity failures. Report exact counts and deterministic ordering. These gates validate orientation mechanics only and never qualify HMM.

## Privacy, custody, retention, and recovery

Use pseudonymous `VAL-*`, `SCR-*`, `ADJ-*`, and `OPR-*` aliases. Keep the operator-only real identity mapping separately from Git and the study system. Raw responses stay encrypted in a controlled location only through scoring/adjudication and are deleted 90 days after validation closure unless a documented necessary hold applies. The minimized permanent ledger retains tags, versions, response digests, aliases, times, dispositions, and chain provenance only.

Capture serially with SHA-256 previous/head chaining, duplicate/replay rejection, linked corrections, one separately controlled encrypted backup, a tested restore, and independent final head-digest recording. Never reconstruct lost evidence. Any uncertainty stops the study and preserves only necessary evidence. Recruitment/execution/retention locations, named roles, contact frame, compensation, incident route, deletion dates, backup location, and recovery owner remain unapproved until the second checkpoint.

Accessible formats, ordinary assistive technology, keyboard use, zoom/reflow, breaks, and extra time are available without diagnosis disclosure. Navigation/access help is allowed; interpretation, suggestions, and coaching are prohibited. Accommodation does not affect scoring.

There is deliberately no real-result capture command in this implementation. Offline tests use synthetic `TST-*` records, no provider SDK, no environment credential, no remote service, and no network.
