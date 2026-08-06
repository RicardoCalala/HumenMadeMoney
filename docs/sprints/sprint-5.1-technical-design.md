# Sprint 5.1 Technical Design Summary — Agreement Engine Foundation

## 1. Overview

Sprint 5.1 creates the first polished, clickable Agreement Engine experience using local mock data. The slice makes the Agreement—not escrow or AI—the central product object and lets a user browse agreements, create a draft, inspect an agreement, and understand its lifecycle.

Human Made Money is the trust layer for human agreements. An agreement captures a shared commitment, its participants, evidence expectations, timing, optional funding protection, verification approach, and attributable history. In this sprint, AI output is presented only as an explainable assessment or recommendation. It does not silently change terms or authorize consequential settlement. Any future release, refund, cancellation, or comparable high-impact action must require an explicitly authorized participant or a human-review path.

This document is an implementation blueprint, not a claim that backend, custody, verification, or settlement capabilities already exist.

### Sprint objective

Deliver a coherent front-end vertical slice that establishes:

- an application area distinct from the existing marketing page;
- an agreements dashboard with meaningful status and next-action summaries;
- a guided create-agreement form that remains local and non-operational;
- an agreement detail view with overview, participants, timeline, evidence, funding, and activity information;
- a typed mock domain boundary that can later be replaced by an API without rewriting presentation components; and
- a deterministic mock lifecycle for demonstrating normal and uncertain states.

### In scope

- Next.js App Router pages for the dashboard, create flow, and agreement detail.
- Reusable agreement, evidence, verification, funding, timeline, and activity components.
- Typed mock records covering funded and non-funded agreements.
- Client-side filtering and draft-form state.
- Human-readable lifecycle status, next action, exception, empty, and unavailable states.
- Responsive behavior and WCAG 2.2 AA-oriented accessibility requirements.
- Mock navigation after form submission; no durable write is implied.

### Out of scope

- Authentication, accounts, invitations, permissions enforcement, or identity verification.
- Database schemas, persistence, APIs, server actions, or external integrations.
- Real evidence upload, source retrieval, AI/model calls, or automated monitoring.
- Real escrow, custody, payment collection, funding intent, release, refund, or settlement.
- Legal enforceability, adjudication, dispute operations, or production human-review tooling.
- Notifications, organizations, subscriptions, analytics, or administrative tools.
- New dependencies or changes to the existing marketing experience beyond route separation needed during implementation.

## 2. Proposed route structure

Use route groups to keep marketing and application layouts separate without changing their public URLs. Move the existing landing page into the marketing group only when implementation begins; Sprint 5.1 itself does not require a URL change.

```text
apps/web/app/
├── layout.tsx                         # Root document, fonts, and global styles
├── (marketing)/
│   └── page.tsx                       # Existing landing page at /
└── (agreement)/
    ├── layout.tsx                     # Application shell and agreement navigation
    ├── dashboard/
    │   └── page.tsx                   # /dashboard: summary and attention items
    └── agreements/
        ├── page.tsx                   # /agreements: searchable/filterable collection
        ├── create/
        │   └── page.tsx               # /agreements/create: local guided form
        └── [id]/
            ├── page.tsx               # /agreements/:id: agreement home/detail
            └── not-found.tsx           # Safe unknown/mock-id state
```

`/dashboard` emphasizes urgent actions and recent agreements; `/agreements` is the complete collection. Both may reuse the same list and card components. Links must use stable opaque mock IDs, and sensitive agreement content must never be encoded in URLs.

## 3. Proposed folder structure

The current web app contains a single landing route, marketing components, shared UI primitives, and `lib/utils.ts`. Sprint 5.1 should extend those conventions without introducing a new dependency or speculative service layer.

```text
apps/web/
├── app/
│   ├── (marketing)/...
│   └── (agreement)/...
├── components/
│   ├── agreement/
│   │   ├── AgreementCard.tsx
│   │   ├── AgreementCollection.tsx
│   │   ├── AgreementHeader.tsx
│   │   ├── AgreementStatusBadge.tsx
│   │   ├── AgreementTimeline.tsx
│   │   ├── AgreementOverview.tsx
│   │   ├── AgreementTerms.tsx
│   │   ├── ParticipantList.tsx
│   │   ├── EvidenceList.tsx
│   │   ├── VerificationAssessment.tsx
│   │   ├── FundingPanel.tsx
│   │   ├── ResolutionPanel.tsx
│   │   ├── AuditTrail.tsx
│   │   └── CreateAgreementForm.tsx
│   ├── app/
│   │   ├── AppHeader.tsx
│   │   └── AppNavigation.tsx
│   ├── marketing/                     # Existing landing components
│   └── ui/                            # Existing shared primitives
├── lib/
│   └── agreements/
│       ├── selectors.ts               # Pure filtering, sorting, and display helpers
│       ├── status.ts                  # Labels, stage order, and allowed demo transitions
│       └── validation.ts              # Dependency-free form validation
├── mocks/
│   └── agreements.ts                  # Typed fixtures and mock repository functions
└── types/
    └── agreement.ts                   # Shared domain-facing UI types
```

Keep route files focused on composition and data selection. Components receive typed values and callbacks; they must not import fixture arrays directly. Pure status and display rules live outside React, which keeps them testable and makes a later data-source replacement smaller.

### Shared types

All identifiers are opaque strings and all timestamps are ISO 8601 UTC strings. Money, when present, uses integer minor units plus an explicit ISO currency code. Types should distinguish facts, participant claims, and AI assessments rather than collapsing them into generic text.

Suggested shared aliases and unions:

```ts
type AgreementId = string;
type ParticipantId = string;
type ISODateTime = string;

type FundingMode = "none" | "protection" | "conditional_intent";
type FundingStatus =
  | "not_applicable"
  | "not_started"
  | "intent_recorded"
  | "funding_required"
  | "protected"
  | "authorized"
  | "settled"
  | "failed";

type EvidenceKind = "participant_claim" | "external_fact" | "document";
type VerificationMethod = "participant_confirmation" | "source_check" | "human_review";
type AssessmentConfidence = "low" | "medium" | "high";
type AgreementVisibility = "participants" | "private_link";
```

`private_link` is only a mock visibility choice; implementation copy must not imply production-grade access control. `conditional_intent` represents a future commitment, never reserved or guaranteed funds.

## 4. Data model

The mock model is deliberately richer than the minimum card props so the detail view exposes domain boundaries. It remains a presentation model, not the future persistence schema.

### Agreement

The aggregate used by the UI:

- `id`, `version`, `title`, `description`, and `plainLanguageSummary`;
- `status`, `createdAt`, `updatedAt`, `deadline`, and optional `closedAt`;
- `participants` and `currentUserParticipantId` for role-aware mock copy;
- obligations or success conditions expressed as structured strings for this slice;
- `verification`, `timeline`, `funding`, and `auditEvents`;
- `visibility`, `nextAction`, and `nextActionParticipantId`;
- optional `exceptionState` for cancellation, expiry, dispute, or insufficient evidence.

The accepted version should be visible in the detail view even though version comparison and amendment are out of scope. This avoids implying that accepted terms can be edited in place.

### Participant

- `id`, `displayName`, and optional initials/avatar presentation data;
- `role`: `creator`, `participant`, `reviewer`, or `observer`;
- `acceptanceStatus`: `not_invited`, `invited`, `accepted`, `changes_requested`, or `not_required`;
- `acceptedVersion` and `acceptedAt` when accepted;
- `responsibilitySummary` and permission-oriented display flags.

Email addresses and other personal data are unnecessary for this mock and should not be included.

### Verification

- `method`, `criteria`, `approvedSources`, and `reviewRoute`;
- `state`: `not_started`, `collecting_evidence`, `assessment_ready`, `human_review`, or `complete`;
- optional assessment with `summary`, `matchedCriteria`, `missingInformation`, `sourceEvidenceIds`, `confidence`, `limitations`, and `recommendedAction`;
- `requiresHumanReview` and an explanation of why.

An assessment is advisory. The type must not expose a `decision` or direct settlement callback.

### Timeline

A `TimelineEvent` or stage contains:

- `id`, `status`, `label`, and plain-language `description`;
- `state`: `complete`, `current`, `upcoming`, or `exception`;
- optional `occurredAt`, `actorParticipantId`, and `auditEventId`.

The lifecycle visualization is derived from agreement status and recorded events. It should show the normal path plus exceptions without suggesting every agreement follows an identical financial flow.

### Funding

- `mode`: `none`, `protection`, or `conditional_intent`;
- `status` and a human-readable explanation;
- optional `amountMinor` and `currency` only when money is involved;
- optional mock `feesMinor`, `providerLabel`, `releaseConditions`, and `refundConditions`;
- `isSimulated: true` for every Sprint 5.1 fixture.

For `mode: "none"`, omit amounts and present “No funding protection selected.” For conditional intent, clearly state that funds are neither held nor guaranteed. No mock control should resemble an operative transfer action.

### AuditEvent

- `id`, `agreementId`, `occurredAt`, and `actor`;
- `type`, `summary`, and optional `fromStatus`/`toStatus`;
- `agreementVersion` and `source`: `participant`, `system`, or `ai_assessment`;
- optional references to related evidence, never copied sensitive payloads.

These records are an attributable activity history. UI copy should not call them immutable because the mock implementation cannot guarantee immutability.

### AgreementStatus

Use canonical domain states that align with the Product Bible rather than purely visual board labels:

```ts
type AgreementStatus =
  | "draft"
  | "in_review"
  | "accepted"
  | "active"
  | "in_progress"
  | "verification"
  | "awaiting_decision"
  | "resolved"
  | "closed"
  | "cancelled"
  | "expired"
  | "disputed";
```

Dashboard groups can translate these into user-facing labels such as “Draft,” “Awaiting acceptance,” “Ready,” “Monitoring,” “Verification,” “Authorization needed,” and “Completed.” This preserves the desired product vocabulary without baking presentation labels into the domain model.

The mock transition table should permit only plausible forward or exception paths, for example `draft → in_review`, `in_review → accepted`, `accepted → active`, `active → in_progress`, `in_progress → verification`, `verification → awaiting_decision`, `awaiting_decision → resolved`, and `resolved → closed`. Cancellation, expiry, dispute, and return-to-evidence paths must be explicit. The UI may demonstrate transitions locally, but it must label them as previews and never imply server authorization.

## 5. Mock data strategy

`apps/web/mocks/agreements.ts` exports fixtures through a narrow repository-shaped interface rather than exposing a mutable array:

```ts
listAgreements(): Promise<AgreementSummary[]>
getAgreementById(id: AgreementId): Promise<Agreement | null>
createAgreementPreview(input: CreateAgreementInput): Promise<Agreement>
```

The Promise-shaped API makes loading, empty, success, and not-found states explicit and provides a future seam for HTTP calls. The route or a small data adapter invokes it and passes results into presentational components. Components never know whether values came from fixtures or an API.

Fixture coverage should include:

- at least one agreement in each primary dashboard group;
- a non-financial agreement with `funding.mode = "none"`;
- a protected-funds example clearly marked simulated;
- a conditional-intent example clearly marked not funded or guaranteed;
- pending acceptance, missing evidence, low-confidence/human-review, disputed, expired, and completed examples;
- long titles/names, a near deadline, and empty evidence/activity collections for layout checks.

Fixtures must be deterministic: fixed IDs and ISO timestamps, with a single exported “demo now” value for relative-time helpers. Do not use `Math.random()` or the current clock in rendered output, which would make screenshots and tests unstable.

Later, replace the repository functions with an API adapter, add runtime response validation at the boundary, and map transport DTOs into the same UI model. Real authorization, transitions, audit writes, AI traceability, and financial operations remain server responsibilities; the mock interface is not their implementation.

This interface is intentionally limited to the three operations required by the slice. Do not add generic base repositories, dependency-injection containers, transport DTO hierarchies, caching layers, or mutation abstractions for hypothetical endpoints. A future list endpoint must add server-enforced ownership, bounded pagination, and non-sensitive structured errors; authentication and organization context should be introduced at that boundary without changing component props.

## 6. UI component inventory

### Application shell

- **AppHeader** — product identity, current section, and non-functional profile placeholder.
- **AppNavigation** — links only to implemented dashboard and agreement surfaces; mobile sheet uses the existing UI primitive.
- **PageHeader** — page title, explanation, and one clear primary action.

### Dashboard and collection

- **DashboardSummary** — counts by meaningful lifecycle group, with text and icons in addition to color.
- **AttentionList** — upcoming deadlines and participant actions, ordered by urgency.
- **AgreementCollection** — accessible list/grid, filters, result count, and empty state.
- **AgreementFilters** — status and funding-mode controls with visible labels and reset behavior.
- **AgreementCard** — title, human-readable status, participants, deadline, verification method, funding status, and next action.
- **AgreementStatusBadge** — compact semantic cue that always accompanies explanatory text.
- **EmptyAgreementsState** — explains what agreements do and links to creation.

### Create flow

- **CreateAgreementForm** — orchestrates local fields and a review step.
- **ParticipantFields** — repeatable participant names and responsibilities.
- **VerificationFields** — method, success criteria, evidence sources, and human-review route.
- **FundingFields** — none, optional protection, or conditional intent, with truthful explanatory copy.
- **ResolutionFields** — expected non-financial outcome or simulated release/refund policy, plus the review route for uncertain or contested outcomes.
- **AgreementPreview** — plain-language summary before the local mock submission.
- **FormErrorSummary** — links errors to fields and receives focus after invalid submission.

Form fields cover purpose, participant responsibilities, obligations, success conditions, evidence sources, timing, optional protection, verification method, resolution approach, deadline, and visibility. Submission validates locally, constructs a temporary preview record, and navigates only within the demo. A persistent banner states that the agreement is not saved and no funds move.

### Agreement detail

- **AgreementHeader** — purpose, version, state, next action, deadline, and participant context.
- **AgreementOverview** — plain-language purpose, current state, next action, deadlines, verification summary, and exception messaging.
- **AgreementTerms** — accepted-version obligations, success conditions, evidence expectations, and timing; visually read-only outside a draft preview.
- **ParticipantList** — roles, responsibilities, and acceptance against a version.
- **AgreementTimeline** — completed/current/upcoming/exception stages using semantic ordered content.
- **EvidenceList / EvidenceCard** — kind, source, submitter, timestamp, criterion, and availability.
- **VerificationAssessment** — labeled recommendation, sources, gaps, confidence, limitations, and review path.
- **FundingPanel** — optional money/protection context; remains useful and explicit when funding is absent.
- **AuditTrail / AuditEventItem** — actor, action, time, version, and resulting state.
- **ResolutionPanel** — declared outcome and allowed review/dispute path; settlement-like actions remain descriptive or explicitly simulated.
- **DetailSectionNavigation** — anchored section navigation for Overview, Terms, Participants, Evidence, Protection, Activity, and Resolution; the lifecycle timeline remains visible in Overview. Do not hide essential content behind inaccessible tabs.
- **AgreementNotFound** — safe unknown-ID message and return path without leaking record existence details relevant to a future authenticated system.

Existing `Button`, `Card`, `Badge`, `Input`, `Dialog`, `Avatar`, `Separator`, and `Sheet` primitives should be reused. Add primitives only when the existing set cannot meet a documented semantic or accessibility need.

Every data-bearing component must define loading, empty, unavailable/error, disabled, permission-denied, and stale-data behavior appropriate to its surface. Mock routes exercise loading, empty, error, and not-found states; permission-denied and stale-data states are documented component variants for later authenticated/API implementation and must not claim enforcement today.

## 7. State-management approach

Prefer server-rendered routes and derived state. Avoid a global store for this mock slice.

- Route components load fixture data through mock repository functions.
- URL search parameters hold shareable collection filters when practical.
- Local component state holds transient form fields, review-step position, dialog visibility, and demo-only transition previews.
- Pure selectors derive status groups, next-action lists, timeline state, and display labels; do not duplicate derived values in state.
- A reducer may manage the multi-step form if field interactions become difficult to reason about, but React context should remain scoped to that form.
- Do not use optimistic success for acceptance, verification, authorization, or funding-like actions. In Sprint 5.1 these controls are either read-only or explicitly labeled simulations.

The future API version should use server-authoritative status and permission results. The client must never infer authorization from a role label or perform arbitrary status writes.

## 8. Accessibility and responsive behavior

Target WCAG 2.2 AA from the first implementation.

- Use one logical `h1`, nested headings, landmarks, real lists, buttons, links, labels, and `fieldset`/`legend` groups.
- Make every workflow operable by keyboard with visible focus and predictable focus order.
- Associate instructions and validation errors programmatically; on failed submission, focus an error summary and link each error to its field.
- Announce filter-result counts and local save/preview status through appropriately restrained live regions.
- Never communicate lifecycle, funding, confidence, or errors by color alone; pair color with text and/or icons.
- Keep status copy human-readable: for example, “Awaiting Jordan’s acceptance,” not only “Pending.”
- Implement the lifecycle as ordered semantic content before adding visual connectors; preserve reading order on mobile.
- Meet contrast and touch-target requirements, support 200% zoom, and test long names, long summaries, narrow screens, and reflow without horizontal scrolling.
- Respect reduced-motion preferences and avoid celebratory motion for financial or disputed outcomes.
- Ensure dialogs have accessible names, initial focus, focus containment, Escape behavior, and focus restoration.
- Use explicit dates; include timezone when ambiguity matters. Always show currency beside amounts.
- Visually and programmatically distinguish participant claims, external facts, and AI inferences.

## 9. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Mock screens imply real persistence, custody, or settlement | Persistent demo language; simulated funding flag; no operative money controls; truthful empty/error copy. |
| Visual statuses drift from the canonical lifecycle | Central mapping from `AgreementStatus` to dashboard labels; one transition table; tests for mappings. |
| AI assessment appears to be a verdict | Label it “assessment” or “recommendation”; show sources, gaps, confidence, limitations, and human-review action. |
| Consequential transitions appear autonomous | Keep them read-only or preview-only; state that explicit authorization/human review is required; no direct settlement callback. |
| Funding dominates non-funded agreements | Include first-class `none` fixtures and layout; place funding after agreement, participants, terms, and evidence context. |
| Client-side mock permissions are mistaken for security | Document that authorization is not implemented; avoid claims of private/secure sharing; plan server enforcement later. |
| Accepted terms appear editable | Display agreement version and acceptance state; creation is draft-only; no edit-in-place flow in this slice. |
| Fixture data couples UI to a future API | Repository-shaped adapter, shared UI model, pure selectors, and no component imports from raw fixtures. |
| Dense detail content fails on mobile or assistive tech | Semantic sections, reflowed layouts, anchored navigation, keyboard/screen-reader/manual zoom validation. |
| App-route work unintentionally changes marketing behavior | Preserve `/`; isolate app layout using route groups; compare landing page before and after implementation. |
| A mock API seam grows into speculative infrastructure | Keep three feature-local functions; forbid generic repositories, caching, dependency injection, and unused mutation layers until a real boundary requires them. |

## 10. Validation plan

### Documentation design review for this summary

- Confirm every requested section is present and terminology matches the Product Bible and Design Bible.
- Check that the Agreement remains primary, escrow/protection is optional, AI is advisory and explainable, and consequential settlement requires explicit authorization or human review.
- Compare proposed folders and routes with the current `apps/web` structure and existing primitives.
- Run `git diff --check` and inspect the final diff for unrelated files or unsupported capability claims.

### Implementation validation for the future build

- **Static checks:** run the web workspace lint and typecheck first, then the repository build, lint, and typecheck scripts as appropriate.
- **Unit tests:** status-label mappings, transition rules, selectors, deadline ordering, currency formatting, and form validation.
- **Component tests:** card variants, funding modes, assessment source/gap rendering, empty/error states, and form error focus.
- **Route tests:** dashboard, full collection, create flow, known agreement, and unknown agreement ID.
- **Accessibility:** automated checks plus manual keyboard traversal, visible focus, screen-reader landmarks/headings/forms, 200% zoom, contrast, reduced motion, and narrow viewport reflow.
- **Content review:** no “guaranteed,” “AI decision,” operative custody, or enforceability claims; participant-specific next actions are clear.
- **Scenario review:** non-funded, protected, conditional intent, pending acceptance, insufficient evidence, low confidence/human review, dispute, expiry, completed, empty, and not-found states.
- **State review:** loading, unavailable/error, disabled, permission-denied, and stale-data variants use truthful recovery copy without implying authentication or persistence exists.
- **Diff review:** verify no dependency, lockfile, generated output, backend, or unrelated marketing changes.

Because Sprint 5.1 uses mock data only, backend authorization, persistence, idempotency, reconciliation, security, payment, and model-evaluation testing are deferred—not considered satisfied.

## 11. Implementation sequence

1. **Establish domain vocabulary.** Add shared agreement types, canonical statuses, display-label mappings, and deterministic fixtures. Review fixture language for product truthfulness.
2. **Create the application boundary.** Introduce marketing and agreement route groups, preserving `/`, then add the application shell and navigation only for implemented routes.
3. **Build collection primitives.** Implement status badge, agreement card, selectors, filters, empty states, and the complete `/agreements` collection.
4. **Compose the dashboard.** Add lifecycle summaries, attention/next-action items, and recent agreements using the same typed collection components.
5. **Build agreement detail.** Implement header, overview, read-only accepted terms, participant list, lifecycle timeline, evidence, explainable assessment, optional funding panel, resolution, activity trail, and not-found handling.
6. **Build the create flow.** Add dependency-free validation, accessible field groups for obligations, success conditions, evidence, optional protection, verification and resolution, a review preview, clear demo/persistence messaging, and local navigation.
7. **Exercise lifecycle and exception variants.** Verify normal, disputed, expired, insufficient-evidence, and human-review fixtures; ensure no preview suggests authorization or real fund movement.
8. **Validate and refine.** Run focused tests and workspace checks, complete manual accessibility/responsive review, inspect all user-facing claims, and review the diff before requesting approval for the next sprint.

This order delivers reusable vertical slices while keeping domain language, accessibility, and truthful capability boundaries visible throughout implementation.
