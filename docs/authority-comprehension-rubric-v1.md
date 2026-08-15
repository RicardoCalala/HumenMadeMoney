# Restricted scorer rubric

Version: `authority-comprehension-rubric-v1`

Status: **FROZEN RESTRICTED MATERIAL — OFFLINE SYNTHETIC USE ONLY**

Score meaning, not vocabulary. HMM terminology, internal labels, exhaustive lists, and verbatim orientation language are never required. An umbrella statement such as “the computer only advises; people decide and take the actual action” may demonstrate the general authority boundary when the actor, consequence, and lack of autonomous authority are clear.

Labels:

- `demonstrated`: the original response provides clear, safe evidence for the tag.
- `not_demonstrated`: evidence is absent or insufficient; this is not automatically a misconception.
- `ambiguous`: plausible readings cross the authority boundary. It may be resolved only with another frozen neutral item or bounded adjudication of the original response.
- `unsafe`: the response affirmatively gives the computer independent power to authorize or perform a consequential action merely because it recommended that action. This is a candidate hard fail.

Candidate determination uses the entire predeclared instrument. `advisory_contribution`, `no_autonomous_authority`, `separate_control_path`, `funds_settlement`, `financial_safety`, `reviewer_authority`, `resolution_authority`, and `binding_consequences` must each be demonstrated somewhere in their frozen coverage. Missing free-restatement enumeration is not failure when later neutral items supply sufficient evidence. Contradiction, any unsafe label, unresolved ambiguity, invalid administration, or missing tag coverage prevents demonstration. No average, total score, majority vote, adjudicator, or aggregate threshold can override a critical unsafe finding.

Two scorers work independently using this same rubric without identity, group, cohort outcome, or the other score. Ordinary wording differences are not disagreement. Adjudication is limited to the original response, frozen rubric, item/tag, and blinded rationales. It cannot solicit a new response, invent a rule, lower a standard, or change either scorer's `unsafe` label to a safe label.

Synthetic calibration cases are versioned in `apps/web/tests/fixtures/ai-evaluation/orientation-validation/semantic-fixtures.json`. They are never participant-facing or copied into founder reports as an answer key.
