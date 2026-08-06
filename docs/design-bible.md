# Human Made Money Design Bible

## Purpose and experience promise

This document defines how Human Made Money should feel and behave across marketing and product surfaces. The experience should turn consequential commitments into calm, legible steps. Every participant should be able to answer: What did we agree to? What happens next? What evidence matters? Who can act? Is money involved? What happens if the outcome is uncertain?

The Product Bible defines what we build. This Design Bible defines how people experience it.

## Design principles

1. **Agreement before mechanism.** Lead with purpose, people, terms, and next action. Funding is prominent only when it needs attention.
2. **Calm clarity.** Use progressive disclosure, strong hierarchy, and plain language to reduce cognitive load.
3. **Shared understanding.** Give every party a consistent view of accepted terms and clearly identify private or role-specific information.
4. **Evidence near decisions.** Place sources, timestamps, confidence, and missing information beside the conclusion they support.
5. **Consequences are explicit.** Confirm irreversible or financial actions with outcome-specific language.
6. **Uncertainty is designed.** Pending, incomplete, contested, expired, and human-review states receive full designs.
7. **Accessible by default.** Accessibility is part of trust and is required from the first implementation.
8. **Truth over spectacle.** Motion, color, data, and AI language must clarify reality rather than manufacture confidence.

## Experience hierarchy

1. Agreement purpose and current state.
2. Participant responsibilities and next actions.
3. Terms, deadlines, and evidence.
4. Verification and review.
5. Protection, funding, and settlement when relevant.
6. Activity and supporting detail.

## Voice and content design

The voice is calm, precise, respectful, and human. Write for a capable person who may be unfamiliar with escrow, AI, or legal language.

- Use “create an agreement,” “review the evidence,” and “protect funds.”
- State who acts: “Alex submitted evidence,” not “Evidence was received.”
- Pair status with meaning: “Awaiting Jordan’s acceptance” instead of “Pending.”
- Explain consequences before the action, not only in an error afterward.
- Avoid hype, shame, adversarial framing, and unsupported words such as guaranteed, unbiased, instant, or legally binding.
- Label AI output as an assessment or recommendation, not a verdict.

Error messages should say what happened, whether anything changed, and the safest next action. Empty states should teach the purpose of a surface rather than decorate it.

## Information architecture

Primary navigation should scale from Home, My Agreements, Wallet/Protection, Verification, Organizations, and Settings. Hide unavailable sections rather than showing inert promises.

An agreement detail view should use a stable structure: Overview, Terms, Participants, Evidence, Protection, Activity, and Resolution. Overview carries status and next action; the activity log is the chronological record, not a substitute for a current-state summary.

## Core journeys and screens

### Onboarding

Explain the agreement-first model in one short sequence, collect only necessary identity information, and distinguish account creation from later verification. Users should reach a meaningful draft quickly.

### Agreement builder

Use a guided structure: purpose, participants, obligations, success conditions, evidence, timing, protection, verification, resolution, and review. Provide a plain-language preview throughout. Flag ambiguity as advice; never silently rewrite intent. Save drafts and make abandonment safe.

### Invitation and acceptance

Invitees see the full relevant agreement, their role, obligations, financial exposure, evidence rules, and resolution path before accepting. Material revisions reset affected acceptance and offer a readable comparison.

### Agreement home

Show a one-sentence purpose, human-readable state, next action, participants, upcoming deadlines, and recent activity. Evidence and protection summaries link to detail. Do not turn every agreement into a financial dashboard.

### Evidence and verification

Evidence items show origin, submitter, captured time, relevant condition, and integrity/availability state. Assessments show matched terms, sources, gaps, confidence, limitations, and review options. Visually separate facts, claims, and AI inference.

### Funding and settlement

Show amount, currency, fees, funding status, custody/provider context, release/refund conditions, and expected timing. Confirmation language names the exact consequence. Receipts and failures remain accessible in the agreement history.

### Dispute and human review

Keep tone neutral. Explain what is disputed, what evidence is available, who reviews, what actions are allowed, and expected timing. Preserve each party’s voice without presenting allegations as fact.

## Component principles

- **Agreement summary:** purpose, participants, state, next action, and deadline.
- **Lifecycle timeline:** completed, current, and possible next states; exceptions are visible.
- **Status badge:** short supporting label, never the sole explanation.
- **Evidence card:** type, source, submitter, timestamp, relation to term, and availability.
- **AI assessment:** label, summary, citations, confidence/uncertainty, limitations, and review action.
- **Money panel:** amount, currency, fees, protection state, provider context, and permitted actions.
- **Activity item:** actor, action, object, time, and resulting state.
- **Confirmation dialog:** specific consequence, affected agreement/value, reversibility, and explicit action label.

Build variants from shared primitives rather than one-off cards. Components must support loading, empty, error, disabled, permission-denied, and stale-data states.

## Visual system

Use a restrained, trustworthy palette. Neutral surfaces carry most content; semantic colors communicate success, warning, danger, information, and review. Never use color alone to encode state.

Typography should prioritize readable body copy and obvious hierarchy. Use a limited scale, comfortable line length, and tabular numerals for financial data. Spacing follows a consistent token scale. Borders, radius, elevation, and icon weight should be systematic and quiet.

Dense financial and audit data may use tables on wide screens, with accessible responsive alternatives. Dates include timezone where ambiguity matters; amounts always include currency. Icons support labels rather than replace them for consequential actions.

## Interaction and motion

Make the primary next action obvious without hiding alternatives. Preserve drafts, prevent double submission, and indicate whether operations are pending, complete, or failed. Optimistic updates are inappropriate where a false success state could cause financial or agreement harm.

Motion should explain transition, hierarchy, or causality; respect reduced-motion preferences. Avoid celebratory motion for transfers, disputes, or other serious outcomes.

## Responsive design

Design mobile layouts around the next action and essential agreement context. Reflow rather than shrink tables and multi-column comparisons. Keep consequential summaries visible near action controls. Verify keyboard, touch, zoom, long names, large currency values, translated copy, and small screens.

## Accessibility standard

Target WCAG 2.2 AA for user-facing experiences. Use semantic HTML, logical headings, keyboard operation, visible focus, descriptive names, sufficient contrast, error identification, status announcements, reduced motion, and 200% zoom support. Do not rely on placeholder text, hover, color, or fine motor precision. Test representative journeys with keyboard and screen-reader workflows, not only automated tooling.

## Privacy and safety in the interface

Reveal sensitive identity, financial, and evidence data only to authorized roles. Explain why information is requested and who can see it. Mask where full values are unnecessary. Avoid putting sensitive details into URLs, notifications, analytics events, or screenshots by default. Session expiry and permission loss should fail safely without discarding a user’s unsaved explanation.

## Design system governance

Tokens and shared components are the default. A new primitive needs a documented unmet need, accessibility behavior, responsive behavior, and all relevant states. Changes to shared semantics require review across marketing, agreement, evidence, and money surfaces. Keep examples in the component environment current when one exists.

## Design QA checklist

- Is the agreement purpose and next action obvious?
- Are terms, roles, evidence, and consequences understandable to every participant?
- Are facts, claims, and AI inference distinct?
- Are uncertainty and human review visible?
- Does financial information include amount, currency, fees, status, and consequence?
- Are loading, empty, failure, permission, dispute, and recovery states designed?
- Does it work with keyboard, screen reader, zoom, reduced motion, and narrow screens?
- Does the copy describe only implemented capabilities?
- Does the screen remain useful when no escrow is involved?

## Anti-patterns

Do not center locked money as the universal measure of success; show unexplained AI scores; hide key terms behind tooltips; use green as proof of correctness; reset acceptance without explanation; treat disputes as system errors; introduce dark patterns around funding or cancellation; or let polished visuals imply legal, security, or financial guarantees.
