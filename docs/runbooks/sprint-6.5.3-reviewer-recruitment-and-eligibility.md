# Sprint 6.5.3 reviewer recruitment and eligibility package

Status: **RECRUITMENT AND VERIFICATION PENDING — 0/2 VERIFIED — NOT_QUALIFIED**

This package supports neutral recruitment and screening for the frozen `human-review-protocol-v1` product-development comprehension study. The study uses 15 synthetic scenarios. It is not medical or psychological research and grants no product, settlement, funds, reviewer-assignment, or Financial Safety authority.

The frozen protocol, rubric, study manifest, result schema, reviewer packet, founder decision record, and execution runbook remain the source of truth. This document does not change them.

## Neutral recruitment message

> We are looking for an adult volunteer or paid participant for a short product-development comprehension study involving 15 synthetic scenarios. You will read accessible study materials and independently identify the assessment result, relevant synthetic evidence, recommended next action, and limits on what an automated assessment may authorize. No real customer, financial, health, identity, agreement, or evidence data is used. You do not need to disclose a diagnosis or other sensitive personal information. Accessible formats, normal assistive technology, reasonable breaks, and extra time are available on request. Participation requires a brief eligibility, independence, conflict, and orientation check. If compensation is offered, it is a fixed amount for participation/completion and does not depend on answers or study outcome. Please reply privately to the founder/operator if you are interested; do not send sensitive information.

Do not add expected answers, scoring thresholds, qualification goals, the answer key, or language suggesting that Human Made Money needs to pass.

## Founder recruitment approach

Recruit through ordinary, private, non-coercive outreach rather than public disclosure of study materials:

1. For the first slot, approach an independent general digitally literate adult who is comfortable reading structured product scenarios but has not worked on Human Made Money.
2. For the second slot, approach an independent adult with somewhat stronger technical, business, or research experience who has not worked on Human Made Money.
3. Look outside the HMM development and scoring circle: personal referrals, local professional or community networks, alumni groups, research-participant communities, or a neutral participant-recruitment service are suitable sources if privacy is preserved.
4. Send only the neutral message above. Screen each interested person privately and separately. Do not reveal the answer key, expected answers, scoring thresholds, another candidate's identity or work, or pinned presentation orders.
5. Avoid recruiting anyone subject to pressure from the founder, operator, another reviewer, or a scoring author. Employment or investment is not automatically disqualifying, but it must be disclosed and assessed as a potential conflict.
6. Do not mark a slot filled until the candidate passes every criterion below. A declined, excluded, or unverified candidate does not receive an operational alias or study material.

The operator does not contact candidates through an automated workflow. The founder performs any real outreach and verification outside Git.

## Minimal private screening checklist

Record only a yes/no eligibility decision and the minimum evidence needed in the controlled external verification record. Do not place completed checklists or identifying information in this repository.

### Profile and basic eligibility

- [ ] Candidate is an adult.
- [ ] Candidate fits the open slot: general digitally literate adult for the first slot, or an adult with somewhat stronger technical, business, or research experience for the second.
- [ ] Candidate can read the packet in an available accessible format, with approved support if requested.
- [ ] Candidate completes the short product and AI-policy orientation.
- [ ] After orientation, candidate can correctly restate that an automated assessment is advisory only and cannot settle, release, refund, or move funds; clear Financial Safety; assign a reviewer; or make a binding legal or financial decision.

### Independence, exposure, and conflicts

- [ ] Candidate was not involved in HMM development and is not the study operator, an author of sampled answers, or an author of the scoring implementation.
- [ ] Candidate has not seen the answer key, expected answers, another reviewer's answers, or prohibited scoring material.
- [ ] Candidate can work separately and agrees not to discuss cases with the other reviewer until both submissions are sealed.
- [ ] Candidate has no direct incentive to force qualification and is not subject to supervisory or other pressure concerning answers or outcome.
- [ ] Candidate will receive no outcome-contingent compensation.
- [ ] Any employment, investment, close relationship, reporting line, or other potential conflict has been disclosed and assessed; none creates material influence, coordination, or outcome pressure.
- [ ] Candidate is separate from `OPR-HMM00001` and from the scoring authors and accepts that the operator cannot coach, review, adjudicate, or alter answers.

### Required attestations

- [ ] Candidate is willing and able to attest truthfully: `adult: true`.
- [ ] Candidate is willing and able to attest truthfully: `productFamiliarityAttested: true`.
- [ ] Candidate is willing and able to attest truthfully: `noConflictAttested: true`.
- [ ] Candidate is willing and able to attest truthfully: `independentWorkAttested: true`.
- [ ] Candidate is willing and able to attest truthfully: `noSensitiveDataIncluded: true`.

## Eligibility decision: explicit pass/fail rule

A candidate **passes** only when every checklist item above is truthfully satisfied, requested accessibility/support can be provided without materially changing the measured construct, and the operator has minimally documented verification outside Git. The candidate must match the applicable founder-approved profile, be an adult, complete orientation, correctly restate the advisory-only boundary, remain independent, have no disqualifying conflict or prohibited exposure, and be able to make all five frozen-schema attestations.

A candidate **fails or remains unverified** if any required item is false, uncertain, incomplete, or cannot be documented without violating privacy. Disqualifying conditions include HMM-development involvement; being the operator or an author of sampled answers or scoring implementation; answer-key or other-reviewer-answer exposure; inability to restate the advisory-only boundary; inability or unwillingness to attest eligibility; coordinated work; direct incentive to force qualification; outcome-contingent compensation; supervisory pressure; responsibility for operating and scoring this run; or support that materially changes the measured construct. Employment or investment alone requires conflict assessment and is disqualifying when it creates material influence or outcome pressure.

Do not waive, average, or adjudicate an eligibility failure. Exclude the candidate or pause verification. The study remains `NOT_QUALIFIED`.

## Accessibility and support language

Tell every candidate:

> Accessible digital materials or an equivalent readable format are available. You may use normal operating-system and browser accessibility technology, keyboard-only access, zoom, and reflow. Reasonable breaks and extra time are available on request without scoring disadvantage. You may request support or an accommodation without disclosing a diagnosis. Private support may help with access and mechanics, but cannot interpret scenarios, citations, findings, authority boundaries, or suggest answers. If support would materially change what the study measures, the study will pause so an appropriate approach can be decided.

The founder chooses a private support contact. If operationally necessary, record only that support was provided, outside the result ledger; do not record diagnosis or disability details.

## Compensation guidance

Compensation is optional. If used, set and disclose a fixed amount or fixed completion-based amount before participation. Pay for agreed participation or completion under the disclosed terms, independent of the candidate's answers, scores, agreement with another reviewer, qualification status, or HMM outcome. Never offer a bonus, penalty, refund condition, future opportunity, investment benefit, or other incentive tied to particular answers or the study passing. Assess whether employment, investment, reporting relationships, or compensation could create pressure; exclude the candidate if independence is materially compromised.

## Candidate privacy and data minimization

- Keep names, contact details, the real-person-to-alias mapping, screening evidence, accommodation information, and conflict details outside Git and outside the study ledger.
- The operator alone may access the minimal external alias-verification record.
- Do not collect demographics, diagnoses, disability details, employment files, free-text biographies, secrets, or real agreement/evidence data.
- During recruitment, collect only what is necessary to contact the person and determine the checklist outcome. Prefer yes/no attestations and a bounded conflict decision over narrative notes.
- Store the verification mapping in a separate access-limited location. Delete it 90 days after Sprint 6.5 qualification closure unless a documented legitimate hold requires minimal continued retention; resume deletion when the hold ends.
- Do not put candidate responses, names, emails, completed screening forms, or accommodation details in repository issues, commits, chat logs, or study files.

## Operator instructions for `OPR-HMM00001`

`OPR-HMM00001` is protocol-compatible and operator-only. Ricardo may distribute approved materials after all start prerequisites are met and may later validate and serially capture one bounded submission at a time. He may not serve as a reviewer or adjudicator, coach candidates, suggest or alter answers, expose scoring materials, waive eligibility, or assign himself any decision authority.

For recruitment and screening:

1. Use the neutral message without expected answers, thresholds, or pass-oriented language.
2. Keep each candidate interaction private and separate. Apply the checklist consistently to both profiles.
3. Offer approved accessibility options and extra time without requesting diagnosis disclosure.
4. Record the minimum verification evidence outside Git; keep access operator-only.
5. Stop on uncertainty, conflict, prohibited exposure, privacy failure, pressure, or material influence. Preserve only minimal necessary evidence and keep the candidate unverified.
6. Report only aggregate readiness in repository documentation: currently `0/2` verified.

## Pre-assignment boundary

Until a real candidate passes verification, do **not**:

- create or assign an operational `REV-*` alias;
- assign `orderA` or `orderB`;
- distribute a study packet or synthetic case presentation;
- reveal or distribute an answer key, expected answers, scoring thresholds, another reviewer's work, or an aggregation report; or
- create, prepare, capture, or infer a human-result record or submission ID.

After a candidate passes, any operational reviewer alias must be distinct and match `REV-[A-Z0-9]{8,32}`: the literal `REV-` followed by 8–32 uppercase ASCII letters or digits. `REV-001` and `REV-002` in the founder decision record are profile labels only and do not satisfy this operational schema. Do not pre-create or reserve aliases.

Even after both reviewers pass, do not start until every other founder-recorded prerequisite is complete. Only then assign frozen `orderA` to the first finalized eligible reviewer and `orderB` to the second, without performance-based assignment.

## Current state

- First reviewer profile: not recruited; not verified; no operational alias; no order assigned.
- Second reviewer profile: not recruited; not verified; no operational alias; no order assigned.
- Verified reviewers: **0/2**.
- Study readiness: **not ready to execute**.
- Human-review gate: **NOT_QUALIFIED**.

Recruitment documentation does not authorize provider calls, API-key access, production enablement, immutable-assessment changes, Sprint 6.4 artifact changes, human submissions, presentation-order assignment, settlement, or funds movement.
