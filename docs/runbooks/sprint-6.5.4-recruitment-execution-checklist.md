# Sprint 6.5.4 recruitment execution checklist

Operator: `OPR-HMM00001`

Authority: [`sprint-6.5.4-second-founder-checkpoint-approval.md`](sprint-6.5.4-second-founder-checkpoint-approval.md)

Execution baseline: `74c26e063c91c3b91772090f18d90f9aa82c786d`

Starting counters: **0/16 contacted; 0/12 enrolled; A 0/3, B 0/3, C 0/3, D 0/3**

HMM state: **`NOT_QUALIFIED`; 0/2 release reviewers; 0/30 genuine release-gating reviews**

This checklist administers recruitment under the already frozen orientation, instrument, rubric, protocol, schemas, report logic, and digest manifest. It does not reproduce or change restricted scoring answers. Candidate-facing materials must never include the rubric, calibration fixtures, coverage tags, expected labels, thresholds, scorer rationales, or another person's response.

## 1. Complete before the first contact

- [ ] Confirm Git resolves the approved execution baseline and every SHA-256 in [`sprint-6.5.4-artifact-digests.md`](sprint-6.5.4-artifact-digests.md) still matches its path at that baseline. A later governance commit is not a replacement baseline.
- [ ] In a separately controlled private administration record outside Git, name the operator, support contact, two independent scorers, independent adjudicator, privacy owner, recovery owner, and independent final head-digest recorder. Confirm prohibited exposure, independence, role separation, access, and conflicts before contact. `OPR-HMM00001` may recruit, administer, and capture but may not score or adjudicate.
- [ ] In that private record, confirm the approved contact method, non-outcome-contingent compensation or no compensation, incident route, identity-map location, raw-response location, minimized-ledger location, encrypted backup location, access list, restore result, deletion dates, necessary-hold procedure, and recovery procedure. Do not put locations, names, contact details, credentials, or secrets in Git.
- [ ] Confirm the encrypted backup is separately controlled and a restore has succeeded. Confirm serial append-only capture, previous/head SHA-256 chaining, duplicate/replay rejection, immutable response digests, linked corrections, and an independent final head-digest recorder are ready.
- [ ] Confirm the two scorers independently passed the frozen calibration gates before recruitment and cannot see each other's labels, candidate identity, recruitment source, group, cohort aggregate, or desired outcome.
- [ ] Confirm accessible digital or equivalent readable formats, keyboard access, zoom/reflow, ordinary assistive technology, breaks, extra time, and private access-only support are ready without requiring diagnosis disclosure.
- [ ] Create the real 16-person maximum frame only in the private operator record. Do not invent people or placeholders. Exclude Sprint 6.5.3 Candidates 1–3 and anyone involved in HMM development, authorship, implementation, operation, scoring, or adjudication, or exposed to restricted materials or another participant's response.

If any item is incomplete or uncertain, do not contact anyone. Resolve it through the approved private governance route; do not improvise, weaken, or edit the frozen materials.

## 2. Freeze the contact frame and order

Use four private strata with no more than four fresh people predeclared in each: `A-01..A-04`, `B-01..B-04`, `C-01..C-04`, and `D-01..D-04`. These are contact-slot labels, not participant aliases. Predeclare each real person's single slot and the within-group order before the first outreach. The mechanical global order is:

`A-01, B-01, C-01, D-01, A-02, B-02, C-02, D-02, A-03, B-03, C-03, D-03, A-04, B-04, C-04, D-04`.

Skip an uncontacted reserve slot once its group has three enrollments. Never replace a named slot with someone outside the frozen frame, reorder based on responses or scores, add a seventeenth contact, or continue after 12 total enrollments. Store only the coarse A/B/C/D code in study records; detailed background stays out of the study record.

## 3. Exact first-contact action

After Section 1 is complete and the private frame is frozen, `OPR-HMM00001` takes private slot `A-01`, rechecks that the real person is fresh, eligible for the general-digital stratum, not Candidate 1–3, and not prohibited by exposure or role conflict, then sends the approved one-to-one neutral invitation through the predeclared contact method.

Use this candidate-facing invitation without adding scoring clues:

> Human Made Money is inviting a small number of people to help check whether short plain-language materials are understandable. If eligible and you choose to participate, you will read one short orientation and complete one set of questions in a single attempt. This is product-development validation, not a test of intelligence, disability, employment, legal knowledge, or suitability. Accessible formats, ordinary assistive technology, breaks, and extra time are available without diagnosis disclosure. Participation is voluntary, and participation cannot qualify the product for release. Please reply only whether you are interested in the private eligibility and scheduling step.

Communicate only the compensation term, if any, that was predeclared in the private administration record. Compensation must never depend on answers, scoring, completion quality, or whether HMM passes.

Count `A-01` as **contacted** once the first outbound invitation attempt is made, whether or not it is delivered or answered: total contacted changes **0 to 1** and enrolled remains **0**. Follow-ups to that same person do not add contacts. A decline, nonresponse, or ineligibility before orientation remains one contact and zero enrollments. Record only the bounded disposition and group count in the minimized study administration record; keep identity and contact details in the separate operator mapping.

## 4. Eligibility, alias, and enrollment boundary

- Ask only the minimum necessary eligibility, prior-exposure, conflict, voluntariness, group-code, scheduling, and access-support questions. Prefer bounded attestations; do not collect biography, employer, education, diagnosis, disability detail, legal/financial file, real agreement/evidence data, or narrative screening notes.
- Do not show the orientation, instrument, rubric, fixtures, answer key, coverage tags, thresholds, or another response during recruitment or screening.
- Do not assign or reserve a `VAL-*` participant alias merely because a person was contacted, replied, scheduled, declined, or was found ineligible.
- After eligibility and voluntary participation are confirmed, assign a random schema-valid `VAL-*` alias only when the person is ready to begin the orientation. Put the identity-to-alias mapping only in the separately controlled operator record.
- The moment the person begins the frozen orientation, count the person as enrolled and increment total and group enrollment. For the first `A-01` administration, counters become **1 contacted, 1 enrolled, A 1/3, B 0/3, C 0/3, D 0/3**. Withdrawal, technical loss, deviation, or later exclusion remains in the enrolled denominator with a bounded disposition.
- Assign `order-a` or `order-b` only by a predeclared mechanical rule unrelated to candidate characteristics or performance. Never select an order after seeing an answer.

## 5. Administration and scoring controls

- Present [`human-review-orientation-v2`](../human-review-orientation-v2.md) in full, then administer [`authority-comprehension-instrument-v1`](../authority-comprehension-instrument-v1.md) once. Use the same plain-language instrument for A/B/C/D.
- Give no corrective feedback, interpretation, semantic clarification, coaching, leading follow-up, repeated item, or retry. A neutral repeat is allowed only for technically lost or inaudible content. Access and navigation help may not suggest meaning or answers.
- Score meaning rather than required vocabulary. Evidence comes from the full frozen instrument. Ordinary-language umbrella statements can demonstrate the general boundary; `not_demonstrated` means insufficient evidence. Ambiguity may be resolved only through another predeclared item or bounded adjudication of the original response.
- Two eligible scorers independently apply the restricted frozen rubric. Route disagreement only to the predesignated independent adjudicator. An affirmative belief that the computer has autonomous consequential authority is an unsafe hard fail and cannot be averaged, waived, or adjudicated away.
- Validation passes only with at least 10/12 demonstrated overall, at least 2/3 in A/B/C/D, at least 90% initial exact agreement overall and on critical tags, Cohen's kappa at least 0.80 when informative, complete bounded adjudication, no unsafe waiver, and zero critical operational failures. Do not stop early based on favorable or unfavorable results.

## 6. Privacy, integrity, retention, and stopping

- Keep names, contacts, identity mappings, screening details, access details, recruitment source, raw responses, and role identities outside Git and outside permanent reports. Keep only pseudonymous aliases, coarse group code, bounded dispositions/tags, versions, digests, timestamps, and chain provenance in minimized study records.
- Capture one administration at a time. Append; never overwrite. Use tamper-evident previous/head digests, replay rejection, linked correction records, encrypted controlled storage, and the separately controlled encrypted backup. Never reconstruct a lost response from memory.
- Delete raw responses and the identity mapping 90 days after validation closure once scoring, adjudication, reporting, final-head confirmation, and recovery verification are complete, unless a documented necessary hold applies. Retain only the minimized evidence for its separately approved duration.
- Stop immediately for identity/alias uncertainty, coercion, conflict, collusion, coaching, prohibited exposure, material drift, scorer unblinding, unsupported accommodation, privacy leakage, forgery/replay, chain/order/backup/recovery uncertainty, scoring/report defect, credential or network access, evidence loss/corruption, 12 enrollments, all 16 contacts exhausted, or founder withdrawal.
- On stop, preserve only the minimum necessary evidence, freeze existing records, do not overwrite or quietly restart, notify the founder through the approved private route, and remain `NOT_QUALIFIED`.

## 7. Prohibited authority

Recruitment approval does not authorize release-gating candidates or reviews, reuse of validation participants for release gating, provider/OpenAI calls, API-key or environment-secret access, remote MCP or telemetry, database writes, production AI, production enablement, real financial/custody/settlement action, or changes to frozen Sprint 6.5.4 artifacts or immutable Sprint 6.5.3/Sprint 6.4 artifacts.
