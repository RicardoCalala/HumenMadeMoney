# Human Made Money Product Bible

## Purpose

This document is the durable product source of truth for Human Made Money. It explains what the product is, who it serves, the problems it solves, and the principles that govern roadmap and feature decisions. Architecture details belong in the architecture documents; visual execution belongs in the Design Bible; delivery practices belong in the Engineering Playbook.

## North star

**Human Made Money is the trust layer for human agreements.**

The product turns a human promise into a shared, inspectable process: people clarify terms, accept responsibilities, attach evidence, protect value when needed, understand progress, verify outcomes, and reach a recorded resolution.

Escrow is an important capability, not the company definition. Many agreements do not involve money, and some financial agreements do not need funds locked immediately.

## Mission and long-term vision

Our mission is to help people make commitments with greater clarity and complete them with greater confidence.

Long term, Human Made Money can become neutral infrastructure for agreements among individuals, organizations, communities, and authorized AI agents. The system should make trust more explicit without pretending that software can remove ambiguity, conflict, law, or human judgment.

## Product philosophy

1. **Agreement first.** Model the shared commitment before its payment mechanism.
2. **Trust through clarity.** Terms, roles, evidence, state, and next actions should be understandable to every participant.
3. **Shared truth.** Important actions and evidence belong in an attributable, chronological record.
4. **Human control.** Participants retain meaningful authority; consequential ambiguity has a human-review path.
5. **AI assistance, not invisible authority.** AI may explain, structure, monitor, compare, and recommend. Its inputs, confidence, and reasoning must be reviewable.
6. **Protection when appropriate.** Escrow and other safeguards are applied according to risk, not forced into every agreement.
7. **No house edge.** Product incentives must not depend on one participant losing or a dispute being created.
8. **Truthful capability claims.** Never imply legal judgment, guaranteed outcomes, custody, compliance, or automation that the system does not actually provide.
9. **Privacy by design.** Collect the minimum information needed and make its use understandable.
10. **Graceful uncertainty.** Disagreement, missing evidence, and inconclusive verification are normal states, not exceptions to hide.

## Who the product serves

### Initial users

- Individuals making clear commitments with friends, family, clients, or collaborators.
- Freelancers and clients agreeing on scope, milestones, evidence, and payment.
- Creators and sponsors tying commitments to observable outcomes.
- Small teams and businesses coordinating performance or milestone agreements.

### Later users

- Communities and organizations managing repeatable agreement policies.
- Enterprises needing controls, reporting, integrations, and delegated roles.
- Developers embedding agreement workflows through APIs.
- Authorized AI agents operating within explicit budgets, permissions, and human oversight.

DAOs, autonomous transactions, and regulated use cases are future possibilities, not current promises.

## Jobs to be done

People use Human Made Money to:

- turn an informal promise into terms everyone can understand;
- know who must do what, by when, and how completion will be shown;
- reduce disputes by agreeing on evidence and resolution rules in advance;
- protect funds or create a conditional funding intent when appropriate;
- follow progress without reconstructing conversations across multiple tools;
- receive an explainable assessment of evidence;
- approve, challenge, revise, cancel, expire, or settle an agreement safely;
- preserve a useful record of what was agreed and what happened.

## Core product model

The **Agreement** is the primary domain object. It contains or references:

- purpose and plain-language summary;
- participants, roles, permissions, and acceptance state;
- terms, obligations, milestones, conditions, and deadlines;
- evidence requirements and approved sources;
- funding mode: none, immediate protection, or conditional intent;
- verification policy, confidence expectations, and review route;
- lifecycle state and permitted transitions;
- settlement or non-financial resolution instructions;
- immutable or attributable activity history;
- privacy, retention, and jurisdictional context where applicable.

Supporting capabilities are **identity and access**, **evidence**, **verification**, **escrow/protection**, **intent monitoring**, **settlement**, **notifications**, **organizations**, and **audit history**. Their boundaries must remain explicit.

## Lifecycle

1. **Draft** — a creator describes the commitment, participants, terms, evidence, and optional protection.
2. **Review** — invited participants inspect changes, ask questions, or propose revisions.
3. **Accepted** — all required parties explicitly accept a specific version.
4. **Protected or active** — required funding is confirmed, or a non-funded/intent agreement begins.
5. **In progress** — milestones, evidence, and events are recorded.
6. **Verification** — evidence is assessed against the accepted terms.
7. **Decision** — participants approve the result, request review, or enter a dispute path.
8. **Resolution** — funds settle, obligations are recorded as complete, the agreement expires, or another declared outcome occurs.
9. **Closed** — the final record remains available according to retention rules.

State transitions must be explicit, authorized, idempotent where relevant, and captured in the history. Cancellation, expiry, amendment, insufficient evidence, and dispute are first-class paths.

## Primary user journeys

### Create and accept

A creator starts from a plain-language intent, selects participants, defines success and evidence, chooses whether funds need protection, reviews an understandable summary, and sends an invitation. Invitees can compare revisions and explicitly accept the same version.

### Fund or register intent

When money is involved, participants see amount, currency, fees, custody status, release conditions, refunds, and failure handling before acting. Immediate escrow protects committed funds; future intent records a conditional commitment and must never be represented as guaranteed money.

### Monitor and submit evidence

The agreement home shows current state, next action, deadlines, funding status when relevant, and a chronological record. Participants add evidence with source and timestamp context; integrations clearly distinguish retrieved facts from participant claims.

### Verify and review

The system compares evidence with agreed conditions and produces an explainable assessment. Participants see sources, missing information, confidence, and recommended next action. Low-confidence or contested outcomes route to human review rather than automatic certainty.

### Resolve and settle

Authorized parties approve, dispute, cancel, expire, refund, release, or otherwise close the agreement according to its policy. Every consequential action receives a clear confirmation and durable record.

### Repeat through organizations

Teams can reuse approved templates, roles, policies, and evidence sources while preserving agreement-level consent and auditability.

## Information architecture

- **Home:** urgent actions, active agreements, recent events, and understandable status.
- **My Agreements:** drafts, invitations, active work, review, disputes, and closed records.
- **Agreement detail:** overview, terms, participants, evidence, protection, activity, and resolution.
- **Wallet / Protection:** balances, deposits, releases, refunds, and transaction history where enabled.
- **Verification:** assessments requiring attention, evidence gaps, and human-review queues.
- **Organizations:** members, roles, templates, policies, integrations, and reporting.
- **Settings:** identity, security, notifications, privacy, and connected services.

Navigation should reflect only capabilities that exist and that a user may access.

## AI product policy

AI may help users translate intent into structured terms, identify ambiguity, suggest evidence criteria, summarize activity, monitor authorized sources, compare evidence with conditions, flag risk, and draft explanations.

AI must not silently change accepted terms, fabricate evidence, imply certainty unsupported by sources, expose one party's private information to another, or make irreversible financial or legal decisions outside an explicit policy. Outputs should identify sources, relevant agreement terms, uncertainty, and whether a human can override or appeal. Model and prompt changes that affect decisions require evaluation and traceability.

## Trust, safety, and business principles

- Require explicit consent for terms and material amendments.
- Separate identity claims, participant assertions, third-party facts, and AI inferences.
- Use least privilege and step-up confirmation for sensitive actions.
- Make fees and incentives visible before commitment.
- Do not monetize dispute outcomes or optimize for locked funds.
- Provide reporting and escalation paths for abuse, fraud, coercion, and compromised accounts.
- Design for applicable legal and regulatory review before launching custody, payments, identity, or automated settlement in a jurisdiction.

## Success measures

North-star measurement should reflect **successfully resolved agreements with informed participant consent**, not raw money locked.

Supporting measures include acceptance completion, time to activation, milestone completion, evidence sufficiency, verification-to-resolution time, dispute and appeal rates, reversal/failure rates, participant comprehension, repeat usage, accessibility, support contacts, and security/privacy incidents. Metrics must be segmented to reveal harm, not merely growth.

## Roadmap

### Phase 1 — Agreement foundation

Deliver accounts, profiles, agreement drafting and versioned acceptance, invitations, lifecycle tracking, evidence, optional escrow, AI-assisted verification, settlement records, notifications, and transaction history. Establish security, audit, accessibility, and observability baselines.

### Phase 2 — Dynamic intent funding

Support conditional funding commitments, authorized source monitoring, trigger detection, explicit funding requests, expiry, and failure handling. Clearly distinguish intent from reserved or guaranteed funds.

### Phase 3 — Human Agreement Network

Add reusable templates, organizations, delegated roles, richer review and dispute operations, creator/freelance/business workflows, integrations, and permissioned APIs.

### Phase 4 — Trust infrastructure

Expand jurisdictionally and operationally only after controls are proven. Potential capabilities include enterprise administration, global payment support, developer infrastructure, AI-agent permissions, and white-label agreement services.

Each phase requires evidence of user value, safe operation, and legal feasibility before the next. Roadmap language is directional, not a promise of availability.

## Product decision checklist

- Does this strengthen a real agreement journey?
- Is the agreement still primary, with funding and AI in supporting roles?
- Can every participant understand the state, responsibility, evidence, and next action?
- Are consent, uncertainty, failure, dispute, and recovery represented?
- Is the feature useful without unsupported capability claims?
- Can it be operated securely, privately, accessibly, and observably?
- What measurable behavior would prove that it improved trust?

## Non-goals for the current foundation

- replacing lawyers, courts, regulated adjudicators, or human judgment;
- promising universal enforceability or guaranteed outcomes;
- autonomous custody or settlement without explicit controls;
- speculative financial products, wagering, or a platform advantage in outcomes;
- broad infrastructure built before a validated agreement workflow needs it.
