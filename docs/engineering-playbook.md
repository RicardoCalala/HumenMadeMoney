# Human Made Money Engineering Playbook

## Purpose

This playbook defines how product work moves from intent to dependable software. It applies to humans, AI assistants, and Codex. Use it with the Product Bible, Design Bible, architecture documents, workspace guidance, and the repository’s actual tooling.

## Operating principles

1. **Agreement first.** Keep the agreement engine central; funding, verification, intent, and settlement are explicit supporting capabilities.
2. **Secure and private by default.** Minimize data, privileges, exposed surfaces, and irreversible behavior.
3. **Small, reversible delivery.** Prefer narrow changes with clear validation and rollback paths.
4. **Evidence over confidence.** Decisions, tests, logs, and source references matter more than assertions.
5. **Explicit boundaries.** Domain ownership, authorization, state transitions, and external-system responsibilities must be clear.
6. **Human accountability.** AI can accelerate work but cannot silently redefine requirements or approve its own consequential decisions.
7. **Operate what we ship.** Reliability, observability, support, migration, and recovery are part of feature design.

## Sources of truth

Use the following precedence when guidance conflicts:

1. user-approved requirements and applicable legal/security constraints;
2. repository and nearest scoped `AGENTS.md` instructions;
3. `docs/product-bible.md` for product intent;
4. `docs/design-bible.md` for experience behavior;
5. architecture and data/API documents for technical boundaries;
6. this playbook for workflow and quality;
7. existing code patterns and tests.

Surface conflicts rather than quietly choosing the most convenient source.

## Work lifecycle

### 1. Frame

Define the user problem, affected agreement stage, success measure, non-goals, risks, and whether funding is required, optional, or irrelevant. Identify sensitive data and consequential actions early.

### 2. Inspect

Read local guidance, relevant documents, code, tests, package scripts, and recent changes. Check working-tree state before editing and preserve unrelated work. Prefer existing components and conventions.

### 3. Plan

Choose the smallest coherent change. Record acceptance criteria, authorization rules, state transitions, failure/retry behavior, observability, migration/rollback needs, accessibility behavior, and validation commands.

### 4. Implement

Keep domain logic separate from transport and presentation. Validate at trust boundaries. Make financial and lifecycle mutations idempotent where retries are possible. Avoid speculative abstractions and new dependencies without a clear benefit.

### 5. Verify

Run focused tests first, then repository lint, typecheck, test, and build commands relevant to the scope. Review the diff, generated files, user-visible copy, and dependency changes. Exercise unhappy paths proportionate to risk.

### 6. Handoff

Report the outcome, files changed, checks run, known limitations, and any follow-up. Do not commit, push, deploy, migrate production data, or contact third parties unless explicitly requested.

## Branch and change discipline

- Start by inspecting `git status`; never overwrite user changes.
- Keep commits conceptually focused when commits are requested.
- Do not mix opportunistic refactors with a product change.
- Treat lockfile, schema, generated, and infrastructure changes as intentional artifacts requiring review.
- Use non-destructive migrations and compatibility windows for persisted data or APIs.
- Keep secrets, credentials, personal data, and environment files out of source control.

## Architecture expectations

- Model agreement versions and acceptance explicitly.
- Centralize authorization policy and enforce it server-side.
- Represent lifecycle transitions as validated domain operations, not arbitrary field updates.
- Separate agreement, evidence, verification, escrow/protection, intent, settlement, identity, and notification responsibilities.
- Use stable identifiers, UTC storage, explicit currency units, and precise decimal/minor-unit handling.
- Treat external payment, identity, model, and data providers as unreliable dependencies with timeouts, retries, idempotency, reconciliation, and audit context.
- Publish or consume events only with defined ownership, ordering assumptions, duplication handling, and versioning.

## API and data quality

Validate inputs at boundaries and return structured, non-sensitive errors. APIs must enforce resource ownership and role permissions independent of the UI. Use pagination and bounded queries. Avoid logging payloads by default.

Schema changes need forward/backward compatibility, a migration and rollback/roll-forward plan, data validation, and consideration of old clients or jobs. Audit records should be attributable and append-oriented; never claim immutability unless the implementation guarantees it.

## Security and privacy standard

Threat-model new agreement, evidence, identity, payment, and AI flows. At minimum consider broken authorization, confused deputy behavior, injection, forged or replayed webhooks, duplicate settlement, race conditions, malicious files/URLs, prompt injection, data leakage, account takeover, insider access, and denial of service.

Required practices include:

- least privilege and deny-by-default authorization;
- secure session management and step-up confirmation for sensitive actions;
- encryption in transit and appropriate protection at rest;
- secret management outside source and logs;
- strict upload type/size handling and malware controls where files are accepted;
- verified webhook signatures, replay defense, and idempotency;
- dependency and supply-chain review;
- data minimization, retention/deletion policies, and access logging;
- safe error messages and redacted structured logs;
- documented incident detection, containment, recovery, and notification paths.

Regulated payment, custody, identity, tax, or legal capabilities require specialist review before launch. Documentation must distinguish current controls from intended ones.

## AI and Codex workflow

AI assistants should begin by reading scoped guidance and the three foundational documents. They must inspect before editing, state important assumptions, keep changes narrow, preserve uncommitted work, and use repository-native tools.

For each AI-assisted change:

1. define the requested outcome and prohibited actions;
2. provide only necessary context and never place secrets or private production data in prompts;
3. inspect generated changes line by line for correctness, security, accessibility, and unsupported claims;
4. run deterministic tooling and relevant tests;
5. record limitations and unresolved risks;
6. require human approval for consequential product, security, financial, legal, deployment, and data-migration decisions.

AI used in the product requires versioned prompts/configuration, source attribution, structured outputs where possible, input/output validation, evaluation datasets, regression thresholds, abuse testing, cost/latency limits, and observability that respects privacy. Treat retrieved content as untrusted. Prompt injection must not expand tool permissions or data access. Provide deterministic fallbacks and human review for low-confidence or high-impact outcomes.

## Quality strategy

Testing follows risk rather than a vanity coverage number:

- unit tests for domain rules, state transitions, calculations, and policy;
- integration tests for persistence, authorization, providers, webhooks, and queues;
- end-to-end tests for create/accept, protect/fund, evidence, verify/review, dispute, and resolve journeys;
- contract tests for external and internal interfaces;
- accessibility checks plus representative manual keyboard/screen-reader testing;
- security tests for authorization boundaries, replay/idempotency, injection, uploads, and sensitive-data exposure;
- migration and reconciliation tests for data and money movement.

Every defect fix should add a regression test when practical. Tests must be deterministic, isolated, and explicit about time, timezone, currency, and external services.

## Baseline validation

Use the pinned package manager and existing scripts. For this repository the expected root checks are:

```sh
pnpm build
pnpm lint
pnpm typecheck
```

Run narrower workspace checks during iteration. Install dependencies only when missing or stale. If a script is absent or blocked by environment limitations, report that precisely; do not claim success or invent a replacement toolchain. Documentation-only changes still require a diff review and, when requested, the baseline checks.

## Reliability and observability

Define service-level expectations for critical journeys. Instrument request and job health, state-transition failures, provider latency/errors, webhook handling, reconciliation differences, AI quality signals, and user-visible failures. Use correlation identifiers without exposing sensitive content. Alerts must map to an owned response playbook. Test backup restoration and settlement reconciliation, not merely backup creation.

## Performance and cost

Set budgets for user-perceived latency, bundle size, database queries, provider calls, and model usage. Avoid unbounded lists, polling, retries, or prompt context. Cache only with clear freshness and authorization semantics. Optimize after measuring, but do not ship known unbounded behavior on critical paths.

## Accessibility and UX quality

Meet the Design Bible and target WCAG 2.2 AA. Review semantic structure, keyboard behavior, focus, status announcements, contrast, zoom, reduced motion, responsive layouts, error recovery, and plain-language consequences. Automated checks are a floor, not proof.

## Release and operations

Before release, confirm acceptance criteria, validation, security/privacy review proportional to risk, migration and rollback plans, feature-flag behavior, monitoring, support notes, and ownership. Roll out risky changes progressively. Never use a feature flag as a substitute for authorization. Financial or lifecycle actions require reconciliation after deployment.

## Definition of done

A change is done when the requested behavior works; agreement semantics and authorization are correct; success, failure, empty, and recovery states are handled; relevant tests and baseline checks pass; accessibility and observability are addressed; documentation reflects reality; the diff contains no unrelated work; and remaining risk is clearly reported.

## Review checklist

- Does the change match the Product and Design Bibles?
- Are state transitions and permissions explicit and tested?
- Can retries duplicate an invitation, charge, release, or settlement?
- Could logs, analytics, URLs, AI context, or errors leak private data?
- Are external inputs and retrieved content treated as untrusted?
- Are evidence and AI conclusions attributable and explainable?
- Are failure, dispute, expiry, cancellation, and recovery paths covered?
- Are accessibility, performance, observability, migration, and rollback adequate?
- Do build, lint, typecheck, and relevant tests pass?
- Are current capabilities distinguished from roadmap intent?
