# Sprint 6.5.2 synthetic evaluation labeling protocol

Ambiguous, conflicting-evidence, and human-escalation labels become release-gating only after two qualified human reviewers independently record the acceptable result set, required/prohibited citations, acceptable action set, escalation route, limitations, privacy classification, and authority boundary. Reviewer identifiers must be bounded internal aliases; the dataset never stores reviewer notes containing evidence values or secrets.

Disagreement remains `pending_human_review`. It is not resolved by model output, majority voting, or repository maintainers changing an expectation to obtain a pass. Until two distinct reviewers agree, Gate A and the overall release gate report `not_qualified`; real-provider metrics remain `not_measured` throughout Sprint 6.5.2.

The founder must approve reviewer eligibility, sample size, accessibility accommodations, and the comprehension-study protocol before human review begins. This repository supplies protocol metadata only and does not fabricate review completion.
