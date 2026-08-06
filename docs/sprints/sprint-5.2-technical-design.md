# Sprint 5.2 Technical Design Summary — Canonical Agreement Language

## 1. Purpose

Sprint 5.2 defines the canonical, machine-readable Agreement Language that future UI, API, database, AI, and MCP layers share. It turns the presentation-oriented Sprint 5.1 model into an explicit, versioned contract for what participants agreed to, how evidence relates to success criteria, how uncertainty is handled, and who may authorize consequential outcomes.

This sprint produces a technical design only. It does not implement persistence, APIs, authentication, AI, MCP tools, custody, payments, or settlement. The schema describes intended domain semantics; it is not a claim that those capabilities exist.

### Goals

- Make an accepted agreement version a stable, inspectable statement of participant intent.
- Give every obligation, condition, criterion, evidence requirement, and policy a stable identifier so other layers reference exact meaning rather than copied prose.
- Separate participant claims, externally sourced facts, deterministic evaluation results, AI inferences, human reviews, and authorized decisions.
- Make uncertainty, missing or conflicting evidence, dispute, cancellation, expiry, and amendment first-class.
- Preserve explicit human authority for consequential actions, especially financial, legal, privacy-sensitive, or irreversible actions.
- Support useful non-financial agreements; protection and funding remain optional supporting concerns.
- Provide a compatibility path from Sprint 5.1 types and deterministic fixtures without forcing the UI to adopt persistence shapes.
- Prefer dependency-free TypeScript types and pure validation initially; add runtime schema tooling only when a real trust boundary justifies it.

### In scope

- The canonical document structure and its identifiers, references, enums, invariants, and version semantics.
- Structured policies for evidence, verification, authorization, protection/funding intent, and resolution.
- Provenance and audit requirements for future implementations.
- Structured validation errors and cross-object validation rules.
- Compatibility, migration, testing, security, privacy, accessibility, and AI/MCP boundaries.

### Out of scope

- A textual or executable domain-specific language (DSL), expression parser, rule engine, or general workflow engine.
- Runtime code, dependencies, database migrations, APIs, authentication, organizations, notifications, or production operations.
- Real evidence retrieval, monitoring, model calls, human-review operations, payment providers, custody, release, refund, or settlement.
- Legal enforceability, jurisdiction-specific contract templates, regulated adjudication, compliance certification, or universal identity assurance.
- Final confidence thresholds, dispute service levels, retention periods, provider selection, fee models, or financial authorization limits.

## 2. Design principles and language shape

Use a typed structured document rather than a speculative DSL. Most agreement semantics can be represented as versioned objects, discriminated unions, stable references, and deliberately small deterministic operators. Free text remains necessary for human intent and explanation, but it must not be the only representation of a rule that software is expected to evaluate.

The canonical document is transport-neutral. TypeScript interfaces may be the first executable representation, but TypeScript types are not themselves runtime validation, an API contract, or a database schema. Future JSON transport and persistence models should map to the same semantics without requiring identical shapes.

Core conventions:

- IDs are stable, opaque strings and unique within their defined scope.
- Timestamps are ISO 8601 UTC instants. Calendar deadlines also carry an IANA timezone and an explicit deadline interpretation.
- Money uses integer minor units and an ISO 4217 currency code; floating-point amounts are prohibited.
- References use IDs, not array positions or duplicated labels.
- Arrays whose order changes meaning declare that meaning; otherwise consumers must not infer priority from order.
- Unknown enum values fail safely at mutation boundaries. Readers may preserve unknown additive fields for forward compatibility but must not act on semantics they do not understand.
- Derived lifecycle state, next action, display labels, summaries, assessment results, and audit history are not accepted agreement content.

Conceptual top-level shape:

```ts
interface AgreementLanguageDocument {
  schemaVersion: string;
  agreementId: string;
  agreementVersion: number;
  versionId: string;
  versionState: "draft" | "proposed" | "accepted" | "superseded" | "withdrawn";
  purpose: AgreementPurpose;
  parties: Party[];
  terms: Terms;
  evidencePolicy: EvidencePolicy;
  verificationPolicy: VerificationPolicy;
  protectionPolicy: ProtectionPolicy;
  authorizationPolicy: AuthorizationPolicy;
  resolutionPolicy: ResolutionPolicy;
  privacyPolicy: AgreementPrivacyPolicy;
  financialSafetyPolicy: FinancialSafetyPolicy;
  effectiveAt?: string;
  createdAt: string;
  createdByPartyId: string;
}
```

`AgreementLanguageDocument` contains the versioned terms participants review and accept. Operational records—acceptances, evidence items, verification runs, assessments, reviews, disputes, authorization grants, resolution decisions, settlement attempts, lifecycle transitions, and activity events—reference `agreementId`, `versionId`, and relevant clause IDs but remain separate records. This prevents evidence or later events from silently rewriting accepted meaning.

## 3. Schema and agreement versioning

Two independent versions are required:

- `schemaVersion` identifies the Agreement Language contract. Use semantic major/minor versioning such as `1.0`. A minor version is additive and preserves prior meaning; a major version may change interpretation and requires an explicit migration and consumer compatibility plan.
- `agreementVersion` and `versionId` identify participant-authored content revisions for one agreement. `agreementVersion` is a monotonic display sequence; `versionId` is the opaque immutable reference used by records and acceptances.

Accepted versions are immutable. A material amendment creates a new proposed version, records its predecessor, provides a structured and plain-language diff, and requires renewed acceptance by every required party. Material changes include parties, obligations, success criteria, evidence, deadlines, money, authorization, privacy, or resolution behavior. Cosmetic metadata changes that do not alter participant-visible meaning or consequences do not create a new agreement version or reset acceptance. Existing evidence and decisions continue to reference the version under which they occurred. A superseded version remains readable according to retention and authorization rules.

Schema upgrades must not manufacture participant consent. A lossless technical normalization may produce an equivalent representation with recorded migration provenance. Any migration that changes participant-visible meaning, responsibility, evidence, money, authorization, or resolution behavior creates a new agreement version and requires renewed acceptance.

Canonical serialization and content hashes may be added later for integrity and deduplication, but no implementation should claim cryptographic immutability until canonicalization, signing, storage, and verification guarantees are specified and tested.

## 4. Identity and parties

Agreement identity consists of `agreementId`, `versionId`, `agreementVersion`, and `schemaVersion`. Human-readable titles and summaries are display content, never identifiers. Sensitive data must not appear in IDs or URLs.

Each `Party` contains:

- `partyId` and `partyType`: initially `person`, `organization`, or `external_participant`;
- `displayName` or a controlled display reference, with identity/account details held outside the agreement document;
- one or more agreement roles such as `creator`, `performer`, `recipient`, `reviewer`, or `observer`;
- responsibility references to obligations and review duties;
- whether acceptance is required for this version; and
- an optional external identity reference that reveals no provider credential or sensitive claim.

Roles communicate responsibilities but do not grant authority by themselves. Authority is derived only from the `AuthorizationPolicy` and future server-validated identity, membership, delegation, and consent records. The Sprint 5.1 `canAuthorizeResolution` boolean must not survive as a canonical security rule.

Acceptance is a separate attributable record containing the party, exact `versionId`, acceptance time, consent context, and authentication/assurance context appropriate to risk. All required parties must unanimously accept the same version before activation in the MVP. Observers are explicitly non-accepting. An organization policy may add constraints but cannot erase agreement-level consent.

Solo agreements are allowed, but remain non-financial in the MVP. Any outcome-contingent financial transfer requires at least two valid economic sides. HMM must never become a counterparty, beneficiary, or losing side merely because an agreement has only one participant; a future financial solo-commitment model requires separate founder, legal, compliance, and provider review.

## 5. Terms, obligations, conditions, deadlines, and success criteria

`Terms` contains structured `obligations`, optional `milestones`, shared `conditions`, `successCriteria`, and timing rules. Each item has a stable ID, a concise human-readable statement, and references to related items.

### Obligations

An obligation defines:

- `obligationId`, title, and plain-language description;
- one or more responsible `partyIds` and optional beneficiary party IDs;
- `required` or `optional` status;
- an optional deadline or milestone reference;
- prerequisite `conditionIds`;
- the `successCriterionIds` used to assess completion;
- permitted evidence requirement IDs; and
- an explicit outcome when the obligation is not applicable, waived, incomplete, or impossible.

Waiver is a consequential amendment or resolution action, not an arbitrary boolean update. It requires policy-defined authority and an audit record.

### Conditions

Conditions describe facts that must be established before an obligation, milestone, protection step, or resolution path applies. The initial operator set should remain deliberately small:

- presence or absence of an attributable event;
- comparison of a typed value (`equals`, `not_equals`, `greater_than`, `greater_than_or_equal`, `less_than`, `less_than_or_equal`);
- occurrence before or after a defined instant; and
- explicit `all`, `any`, and `not` composition over referenced conditions.

Every machine-evaluable condition also includes a plain-language explanation, expected value type and unit, and evidence requirement references. Arbitrary scripts, natural-language execution, nested code, provider queries, and model prompts are not condition operators. If a term cannot be represented safely, it remains `manual_assessment` and requires human review rather than pretending to be deterministic.

### Deadlines

A deadline specifies an instant or local date/time, IANA timezone, inclusivity, and behavior when reached. It states whether expiry is automatic, whether a grace period exists, who may extend it, and whether extension creates an amendment. Business-day calculations are deferred until a calendar source, jurisdiction, and holiday behavior are approved; prose such as “within two business days” is manual until then.

### Success criteria

Each criterion includes `criterionId`, the obligation or milestone it evaluates, a measurable statement, evaluation mode (`deterministic` or `manual_assessment`), condition references where deterministic, required evidence references, and allowed results:

```ts
type CriterionResult =
  | "satisfied"
  | "not_satisfied"
  | "indeterminate"
  | "not_applicable";
```

`indeterminate` is not failure. It means available evidence cannot support a permitted conclusion. An agreement-level outcome is derived only by the documented aggregation policy and never by a model inventing weights or priorities.

## 6. Evidence Policy

`EvidencePolicy` defines what may be considered, not the evidence itself. It contains versioned `EvidenceRequirement` and `SourceConstraint` records.

An evidence requirement defines:

- `evidenceRequirementId`, related criterion IDs, and whether it is required or supporting;
- evidence class: `participant_claim`, `external_fact`, `document`, `media`, `system_event`, or `human_attestation`;
- who may submit or request it;
- permitted source constraint IDs;
- minimum distinct-source count and whether independence is required;
- collection window and staleness limit;
- required provenance and integrity metadata;
- permitted visibility and sensitivity classification; and
- behavior when missing, unavailable, revoked, expired, or challenged.

A source constraint defines a source category or an explicitly approved provider/reference, allowed retrieval method, authorization scope, permitted fields, geographic or temporal scope, freshness, and whether participant confirmation is required. An allowlist is preferred. A URL, file, webhook payload, MCP result, participant statement, or retrieved instruction is untrusted content and never expands the permitted scope.

Future `EvidenceItem` records must retain origin, submitter or retriever, captured and observed times, source reference, integrity/availability state, related requirement and criterion IDs, access classification, and chain-of-custody events where relevant. Payloads should be stored separately with controlled access; general logs and the Agreement Language document should reference rather than copy sensitive content.

Source independence cannot be inferred merely from different URLs or tool calls. If independence cannot be established, the assessment must say so and apply the policy’s uncertainty or review route.

## 7. Verification Policy

`VerificationPolicy` describes how exact criteria are evaluated. Verification runs and assessments are operational records, not accepted terms.

The policy contains:

- the criterion IDs in scope;
- an evaluation mode for each criterion;
- evidence sufficiency and aggregation rules;
- a confidence representation policy;
- safe behavior for missing, stale, inaccessible, or conflicting evidence;
- mandatory human-review triggers and review route;
- whether a participant confirmation is required after assessment; and
- the exact policy version/configuration reference used by a future run.

### Deterministic evaluation

A deterministic evaluator may only apply declared operators to validated typed values from permitted evidence. Each result records the criterion, input evidence IDs, normalized values and units, operator, result, evaluation time, rule/configuration version, and explanation. Invalid or unsupported input returns `indeterminate`; it never coerces to success or failure.

Aggregation must be explicit, initially one of:

- `all_required`: every required criterion must be satisfied;
- `any_required`: at least one designated criterion must be satisfied; or
- `manual`: no agreement-level result is computed automatically.

Weighted scoring and arbitrary formulas are deferred. They would require comprehensibility research, calibration, and safeguards against hiding important failures behind an aggregate score.

### Uncertainty and confidence

Confidence describes evidentiary support for an assessment, not probability that a person is truthful and not authorization to act. Use a structured representation:

```ts
interface ConfidenceRepresentation {
  level: "low" | "medium" | "high" | "not_assessed";
  basis: string[];
  limitations: string[];
  calibrationReference?: string;
}
```

Numeric scores may be added only with a defined scale, evaluation dataset, calibration evidence, and user-facing interpretation. A high confidence level can support a recommendation but can never alone authorize settlement or another consequential action.

### Missing and conflicting evidence

Missing required evidence yields `indeterminate` and the configured next step: request evidence, wait until a deadline, or request human review. Conflicting evidence records both supporting and contradicting item IDs, the affected criteria, source limitations, and unresolved questions. It must not silently choose the apparently more authoritative source unless the accepted policy defines that precedence deterministically and transparently.

### Mandatory human-review triggers

Human review is mandatory when any of the following applies:

- required evidence is missing at the decision deadline;
- permitted evidence materially conflicts;
- a required source is inaccessible, stale, revoked, or fails integrity checks;
- a criterion is `manual_assessment` or the evaluator cannot interpret it safely;
- confidence is low or not assessed, or a future calibrated threshold is not met;
- a participant challenges evidence, an assessment, authority, identity, or scope;
- the agreement is disputed or coercion, fraud, compromised-account, or abuse risk is flagged;
- a model, tool, provider, or policy evaluation fails or returns invalid output;
- the proposed outcome has financial, legal, privacy-sensitive, or irreversible consequences unless an accepted, separately reviewed deterministic policy permits the automated route and every dispute and compliance gate is clear; or
- the current agreement version, acceptance state, or authorization context cannot be proven.

Human review produces an attributable review record with evidence considered, findings, limitations, outcome, reviewer authority, time, and appeal or override context. Review does not erase underlying evidence or prior assessments.

## 8. Optional Protection and Funding Intent

`ProtectionPolicy` is a discriminated union:

```ts
type ProtectionPolicy =
  | { mode: "none" }
  | { mode: "protection"; terms: ProtectionTerms }
  | { mode: "conditional_intent"; terms: FundingIntentTerms };
```

`none` is a complete first-class mode. `protection` may describe intended amount, currency, fees disclosure, custody/provider context, funding deadline, release/refund conditions, expiry, failure handling, and authorization requirements. `conditional_intent` records a future intention, trigger conditions, amount/currency, expiry, and confirmation requirements; it never represents held, reserved, available, or guaranteed money.

Sprint 5.2 defines intent only. No field in the language causes a charge, hold, transfer, release, refund, or settlement. Provider-observed funding state, transactions, settlement instructions, and attempts belong to separate future operational records. Every financial record must reference the accepted `versionId`, use idempotency and reconciliation, and revalidate authorization and current state at execution time.

Outcome-contingent financial transfers require at least two valid economic sides with permitted, fixed-before-outcome settlement destinations. Circular or self-dealing flows and arbitrary destination changes after the outcome are invalid. Solo agreements must use `none` in the MVP. HMM earns subscription or disclosed platform fees; participant losses never become HMM revenue and HMM never fills a missing economic side.

## 9. Authorization Policy

Authorization is explicit policy, not a UI flag, role label, model conclusion, or possession of an agreement link. `AuthorizationPolicy` maps named action types to requirements:

- eligible party IDs or policy-defined agreement roles;
- minimum number and combination of approvals;
- whether self-approval is prohibited;
- required accepted `versionId` and lifecycle state;
- authentication or step-up assurance required at action time;
- approval expiry and revocation behavior;
- separation-of-duties or human-review requirements; and
- the consequence the approval covers.

Consequential actions include accepting or materially amending terms, waiving obligations, extending consequential deadlines, changing evidence or resolution rules, accessing restricted evidence, deciding a dispute, approving cancellation, recording a binding resolution, and creating any settlement instruction.

An authorization record must be actor-specific, action-specific, version-specific, time-bounded where appropriate, attributable, and independently validated server-side. Approval for one consequence cannot be reused for another. AI and MCP tools are never eligible authorizers and never hold fund-release authority. An uncontested proposed resolution may later be executed by a separate deterministic settlement service when the accepted policy, review window, authorization requirements, lifecycle state, and Financial Safety gate all permit it. A dispute always freezes execution and requires explicit human review and authorization.

## 10. Resolution Policy

`ResolutionPolicy` defines permitted outcomes and routes without executing them. Each outcome has an ID, type, prerequisites, required authorizations, effects on agreement lifecycle, protection implications if relevant, required explanation, and whether appeal or reopening is allowed.

Required paths include:

- **completion:** record all or specified obligations as satisfied and close when authorized;
- **partial or alternative resolution:** use only when explicitly defined or introduced through an accepted amendment;
- **dispute:** freeze consequential execution, preserve each party’s claims without presenting them as fact, collect scoped evidence, assign an authorized human review route, and record appeal options;
- **expiry:** state what expires, what remains visible, whether protection or intent also expires, and whether a new draft is required;
- **cancellation:** define eligible initiators, consent requirements, effective time, treatment of incomplete obligations and evidence, and any separately authorized protection outcome;
- **insufficient evidence:** remain unresolved, request evidence, expire, or enter review as explicitly configured; and
- **withdrawal before acceptance:** retire the proposal without rewriting historical invitations or reviews.

Before acceptance, the creator may cancel or withdraw the proposal. After acceptance, cancellation follows the accepted cancellation policy and required consent; it is not unilateral by default. Cancellation, expiry, dispute, and verification failure are distinct states. None implicitly selects release or refund. A dispute freezes execution, produces an auditable human-reviewed outcome, and offers a bounded policy-defined escalation or appeal path.

### Automated settlement route

The future settlement sequence is: AI/MCP evidence assessment → proposed resolution → configurable dispute/review window → Financial Safety gate → deterministic execution only when uncontested and clear. The product default review window is 24 hours, represented as configurable policy (for example `reviewWindowSeconds: 86400`) rather than a schema invariant. A timely dispute pauses the timer and freezes funds until an authorized human review records an outcome and the required authorization. Compliance holds override review-window expiry and every automated route.

The AI assessment is advisory input. It may propose a resolution but cannot create release authority, contact a payment provider, or execute settlement. The settlement service independently revalidates the accepted version, evidence and resolution policy, elapsed window, absence of disputes, required authorizations, Financial Safety state, destination integrity, idempotency, and provider state.

## 11. Financial Safety and Compliance Policy

`FinancialSafetyPolicy` is a boundary between agreement resolution and any future funding or settlement system. Its operational gate states are `clear`, `review_required`, `held`, and `restricted`. Only `clear` may proceed to deterministic execution; all other states stop execution, and a compliance hold always overrides a settlement timer or otherwise eligible outcome.

The policy defines future hooks for identity/KYC status, sanctions screening, transaction monitoring, source-of-funds and funding-source controls, amount and velocity limits, risk flags, holds, destination-change controls, auditability, and human compliance review. It must detect or prevent circular and self-dealing flows, use of HMM as a counterparty, arbitrary post-outcome destination changes, and other obvious misuse paths. These signals support deterministic controls and accountable review; an opaque AI score does not independently clear or restrict funds.

Sprint 5.2 implements none of this infrastructure. Real KYC/AML services, custody, payments, provider integrations, and real funds remain out of scope. A real-money launch requires qualified legal and compliance review plus appropriate regulated payment and custody partners for every applicable jurisdiction.

## 12. Provenance and audit requirements

Future operational records must be append-oriented and attributable. They should include stable event ID, agreement and version references, actor type and ID, action, occurred-at and recorded-at times, correlation and causation IDs, source system, related object IDs, prior/resulting lifecycle state where applicable, policy/configuration version, and a non-sensitive explanation.

AI runs additionally record model and prompt/configuration versions, requesting actor and purpose, authorized input references, tool calls, source provenance, structured output, validation outcome, confidence, limitations, policy route, human override/review, latency, and errors. Store references instead of unnecessary raw private prompts or evidence.

Audit history is not part of the accepted document and must not be client-authored as truth. Corrections are new linked events rather than destructive edits. Logs must be access-controlled, redacted, retention-aware, and protected from cross-party disclosure. Use “append-oriented” and “attributable,” not “immutable,” until implementation guarantees immutability.

## 13. Validation and structured errors

Validation occurs at every trust boundary and in layers:

1. **Shape validation:** required properties, recognized discriminants, types, formats, safe sizes, and bounded collection depth/count.
2. **Reference validation:** uniqueness and existence of party, obligation, criterion, evidence requirement, condition, action, and outcome references.
3. **Semantic validation:** compatible value types/operators, timezone and deadline coherence, money/currency pairs, reachable resolution routes, and policy completeness.
4. **Consent and lifecycle validation:** exact version, acceptance requirements, allowed transition, current state, authority, and idempotency where relevant.
5. **Capability validation:** consumers reject or safely ignore unsupported schema features and never execute partially understood terms.

Validation returns all safe, actionable document errors when practical:

```ts
interface AgreementValidationError {
  code: string;
  path: string;
  message: string;
  category: "shape" | "reference" | "semantic" | "policy" | "authorization" | "compatibility";
  severity: "error" | "warning";
  relatedIds?: string[];
  safeNextAction?: string;
}

interface AgreementValidationResult {
  valid: boolean;
  errors: AgreementValidationError[];
}
```

Codes are stable and machine-readable, such as `REFERENCE_NOT_FOUND`, `DUPLICATE_ID`, `DEADLINE_INVALID`, `CRITERION_UNEVALUABLE`, `EVIDENCE_POLICY_INCOMPLETE`, `AUTHORITY_MISSING`, and `SCHEMA_VERSION_UNSUPPORTED`. Paths use a documented JSON Pointer-compatible notation. Messages contain no secrets or inaccessible record details. Warnings may flag ambiguity or optional omissions but cannot downgrade a failed invariant. User interfaces translate codes into plain language, focus the relevant field, state whether anything changed, and offer the safest recovery.

Initial validation can be implemented with TypeScript types, type guards, and pure functions using existing tooling. Before accepting untrusted network, database, model, or MCP data, add runtime contract validation. A new schema dependency should be considered only after comparing the project’s existing libraries, JSON Schema/OpenAPI interoperability needs, error quality, bundle/runtime placement, maintenance, and migration cost.

## 14. Sprint 5.1 compatibility and migration

Sprint 5.1’s `apps/web/types/agreement.ts` is a presentation model. Preserve it initially and introduce a future adapter from the canonical document plus operational records into that UI view model. Do not make components consume database entities or the full canonical graph.

Mapping plan:

| Sprint 5.1 field | Canonical destination or treatment |
| --- | --- |
| `id`, `version` | `agreementId`, `agreementVersion`, plus a new opaque `versionId` and `schemaVersion` |
| `title`, `description`, `plainLanguageSummary` | `purpose`; summaries remain human-facing content and may be derived only when clearly labeled |
| `participants` | `parties`; acceptance becomes separate version-specific records |
| `canAuthorizeResolution` | Remove as authority; map demo intent into an explicit `AuthorizationPolicy` only for fixtures |
| `obligations` | Structured obligations with stable IDs, responsible parties, timing, criteria, and evidence references |
| `successConditions` | Structured success criteria; ambiguous prose maps to `manual_assessment` |
| `evidenceExpectations`, `approvedSources` | `EvidencePolicy` requirements and source constraints |
| `verification` | Split accepted `VerificationPolicy` from operational verification state and assessments |
| `evidence` | Separate operational `EvidenceItem` records referencing requirements and criteria |
| `funding` | Accepted `ProtectionPolicy` plus separate future provider/funding operational state; retain `isSimulated` in Sprint 5.1 views only |
| `resolution` | Structured `ResolutionPolicy`; `declaredOutcome` becomes an authorized operational resolution record |
| `status`, `timeline`, `nextAction`, `exceptionState` | Operational or derived lifecycle views, not accepted agreement content |
| `auditEvents` | Separate append-oriented activity records |
| `visibility` | Expand into privacy/access policy; do not treat `private_link` as authorization |

Each deterministic fixture should receive stable clause IDs and be migrated through an explicit adapter. Preserve current rendered meaning during the compatibility window. Add fixtures for multi-obligation references, missing evidence, conflict, manual assessment, amendment/re-acceptance, dispute, expiry, cancellation, non-financial resolution, simulated protection, and conditional intent.

Migration should proceed additively: define canonical types and validators, create fixture representations, adapt to the existing UI model, compare normalized snapshots and key screens, then retire duplicated Sprint 5.1 semantics only after all consumers move. No persisted data exists in Sprint 5.1, so no database migration is needed now. Future persisted migrations require forward/backward compatibility, consumer inventory, validation, observability, and rollback or roll-forward plans.

## 15. Future AI and MCP boundaries

AI may help structure a draft, identify ambiguity, suggest criteria or sources, summarize accepted terms, normalize permitted evidence, compare evidence with exact criteria, and produce an assessment or recommendation. Every suggestion remains visibly reviewable; AI cannot silently alter accepted terms.

AI assessments must reference exact `versionId`, criterion IDs, evidence IDs, sources, matched and conflicting information, missing information, confidence basis, limitations, configuration version, and recommended next action. Structured output is validated before use. Invalid, low-confidence, contested, unsupported, or failed output routes to safe no-action or human review.

MCP tools are deny-by-default and read-oriented initially. Each tool receives only the minimum authorized clause and source scope; uses allowlisted operations, validated parameters, least-privilege credentials, timeouts, rate and result limits; and returns provenance. Retrieved content is untrusted and cannot instruct the model to broaden access, call another tool, expose data, or change authorization.

Neither AI nor MCP may:

- accept or amend an agreement on behalf of a human;
- decide truth, guilt, legal liability, or a dispute as an opaque verdict;
- create an authorization or pretend confidence is consent;
- create release authority, directly execute a settlement instruction, contact a payment provider, or mutate custody state;
- bypass domain authorization, lifecycle, privacy, retention, or audit rules; or
- reuse private agreement data for unrelated training or memory without explicit purpose-limited consent.

Any future write-capable MCP tool requires separate threat modeling, a narrow action contract, deterministic server-side policy checks, policy-required human confirmation, idempotency, revocation, and auditability. It is not implied by this schema.

## 16. Security and privacy

Future implementation must threat-model broken object authorization, confused deputy behavior, forged acceptance or evidence, replay and race conditions, malicious files and URLs, prompt injection, source spoofing, compromised accounts, insider access, denial of service, and duplicate financial actions.

Required design controls include:

- deny-by-default server authorization independent of UI roles;
- data minimization and separation of identity, evidence payloads, agreement terms, and general logs;
- explicit per-record visibility and purpose, with field-level redaction where parties have different access;
- encryption in transit and appropriate protection at rest;
- bounded document size, nesting, text length, reference count, and evaluator work;
- file type/size checks, malware controls, safe rendering, and short-lived access for future uploads;
- source authenticity and integrity metadata without overstating certainty;
- step-up confirmation, version binding, expiry, replay defense, idempotency, and reconciliation for consequential actions;
- retention, deletion, export, legal-hold, and AI-use policies by data class; and
- safe structured errors, access logs, and observability without sensitive payloads.

Acceptance, identity, audit, and evidence provenance claims must match implemented assurance. Launching custody, payments, identity verification, jurisdiction-specific legal behavior, or automated settlement requires specialist legal, security, privacy, and operational review.

Private evidence defaults to access by participants and authorized reviewers only, subject to least privilege and differences in party visibility. Collect and expose only what the agreement and review purpose require, preserve provenance, and design future participant export and deletion controls. Private agreement evidence is not used for model training by default. Retention remains configurable by data class pending applicable legal, privacy, dispute, and provider requirements.

## 17. Accessibility implications

Structured terms must produce a human-readable view, not expose raw JSON as the primary experience. The UI should preserve the Design Bible hierarchy: purpose and state, responsibilities and next actions, terms/deadlines/evidence, verification, optional protection, then activity and resolution.

- Render obligations and criteria as semantic lists with stable headings and links between related terms and evidence.
- Provide plain-language summaries alongside exact structured values; clearly label generated summaries and let the accepted source wording remain available.
- Present version, amendment, and acceptance differences in reading order with added, removed, and changed text described without color alone.
- Show dates with timezone context, amounts with currency, and confidence with basis and limitations rather than an unexplained score.
- Distinguish claims, external facts, deterministic results, AI inferences, and human decisions visually and programmatically.
- Keep validation summaries focusable, associate each error with its field, retain user input, and announce save/validation state without excessive live-region output.
- Reflow dense relationships into grouped cards or definition lists on narrow screens; do not require horizontal table scrolling to understand core terms.
- Support keyboard navigation, visible focus, 200% zoom, screen readers, reduced motion, long text, localization, and non-color status cues.
- Ensure source and clause links have descriptive names and do not reveal restricted content through labels, URLs, or error messages.

Schema naming must not dictate user-facing jargon. Content design and accessibility review remain required when the language is implemented.

## 18. Test and validation strategy

### Design-document validation for Sprint 5.2

- Confirm every requested topic is addressed and terms align with the repository guidance, Product Bible, Design Bible, Sprint 5.1 design, and current implementation.
- Confirm Agreement remains primary; protection is optional; intent is not guaranteed funds; AI is advisory and explainable; and deterministic settlement cannot bypass dispute, authorization, or compliance gates.
- Review examples for accidental runtime, custody, legal, security, or AI capability claims.
- Run `git diff --check` and inspect the documentation diff for unrelated changes.

### Future implementation validation

- **Type and contract tests:** valid documents, every discriminated union, additive schema versions, unsupported versions, round-trip serialization, and bounded input.
- **Validator unit tests:** duplicate/missing references, cycles, invalid operators/types, deadlines/timezones, money/currency, incomplete policy routes, and stable error codes/paths.
- **Domain tests:** unanimous exact-version acceptance, material amendment and re-acceptance, cosmetic metadata edits, allowed transitions, authorization combinations, solo/non-financial constraints, two-sided financial constraints, cancellation before and after acceptance, expiry, dispute, bounded appeal, and safe no-action behavior.
- **Evidence/verification tests:** sufficient, missing, stale, revoked, inaccessible, forged, and conflicting evidence; source independence; deterministic normalization; `indeterminate`; mandatory review triggers; and assessment provenance.
- **AI/MCP contract tests:** invalid structured output, prompt injection, tool-scope escape, excessive output, timeouts, source attribution, privacy filtering, deterministic fallback, and proof that no model or tool holds release authority.
- **Financial-safety policy tests:** each gate state, hold precedence over timers, disputes racing window expiry, circular/self-dealing flows, destination changes, amount/velocity controls, and deterministic execution only when every gate is clear.
- **Compatibility tests:** migrate every Sprint 5.1 fixture, compare adapter snapshots and rendered semantics, and verify non-funded and simulated modes remain truthful.
- **Security tests:** resource authorization, cross-party disclosure, replay, race/idempotency, malicious files/URLs, sensitive errors/logs, compromised authorization, and denial-of-service bounds.
- **Accessibility tests:** automated checks plus keyboard, screen-reader, focus/error recovery, amendment comparison, 200% zoom, narrow viewport, long/localized content, and non-color distinctions.
- **Migration tests:** old/new reader compatibility, lossless transformations, rejected lossy changes, rollback or roll-forward, and audit linkage to original versions.

Tests use fixed clocks, explicit timezones and currencies, deterministic IDs, and no live provider or model dependency.

## 19. Implementation sequence

1. Treat the founder-approved defaults in Section 21 as the product-policy baseline without broadening Sprint 5.2 into runtime work.
2. Define dependency-free canonical TypeScript types, stable enums, ID/reference conventions, and example version `1.0` documents in a future implementation sprint.
3. Implement pure shape, reference, semantic, and policy validators with structured errors and safety bounds.
4. Model Sprint 5.1 fixtures canonically and add a one-way adapter into the existing UI types; compare rendered semantics before changing components.
5. Separate agreement content from operational acceptance, evidence, assessment, lifecycle, authorization, resolution, and audit records at the API/database design boundary.
6. Add runtime boundary validation when the first API or persisted/untrusted source is introduced; select a dependency only if existing tools are insufficient and the interoperability case is documented.
7. Implement version creation, amendment comparison, exact-version acceptance, and server-enforced authorization before consequential lifecycle mutations.
8. Add evidence and deterministic verification flows with mandatory review routing before introducing AI or MCP retrieval.
9. Introduce advisory AI and read-oriented MCP only after evaluation, provenance, privacy, injection defense, and safe fallback requirements are testable.
10. Design protection, Financial Safety, provider integration, and deterministic settlement separately with legal/compliance/security review, configurable review windows, dispute and hold precedence, idempotency, reconciliation, and operational readiness.

Each step is independently reviewable and must not imply later capabilities are available.

## 20. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Structured terms become an unreadable pseudo-programming language | Keep a small operator set, require plain-language statements, use `manual_assessment` for ambiguity, and test comprehension. |
| Free text remains too vague for deterministic verification | Require structured references for machine-evaluated rules; flag ambiguity; route unsupported criteria to human review. |
| Schema version is confused with participant agreement version | Separate `schemaVersion`, `agreementVersion`, and opaque `versionId`; bind acceptances and events to `versionId`. |
| Technical migration is mistaken for renewed consent | Permit only lossless normalization without re-acceptance; any semantic change creates a new version. |
| UI roles or `canAuthorizeResolution` become security controls | Remove the boolean from canonical authority; centralize explicit server-validated action policies. |
| Confidence becomes an unexplained verdict or automatic trigger | Store basis and limitations; require calibration for numeric scores; prohibit confidence-only authorization. |
| Conflicting or absent evidence is coerced into success/failure | Use `indeterminate`, retain both sides, and route through configured evidence or human-review paths. |
| Protection fields imply real custody or intent implies available funds | Separate policy from provider state, preserve simulation labels during migration, and prohibit executable money behavior. |
| Canonical document absorbs operational state and becomes mutable | Keep acceptance, evidence, runs, decisions, lifecycle, and audit records separate and version-referenced. |
| AI or retrieved content expands permissions | Treat all content as untrusted; use allowlists, minimal context, output validation, and deterministic server authorization. |
| Sensitive evidence leaks through documents, URLs, logs, errors, or AI context | Reference payloads, classify access, redact by role, minimize context, and apply retention/access logging. |
| Solo or circular agreements turn HMM into a counterparty or laundering path | Keep solo agreements non-financial, require two valid economic sides for contingent transfers, fix destinations before outcomes, and gate settlement through Financial Safety. |
| A dispute or compliance hold loses a race with a settlement timer | Freeze execution atomically, make holds override timers, and revalidate every gate immediately before idempotent execution. |
| Schema flexibility creates denial-of-service or validator complexity | Bound sizes, depth, references, and operator set; reject cycles and unsupported features. |
| Premature dependency or standards choice creates lock-in | Start with existing TypeScript tooling and pure validators; evaluate runtime/schema tooling at a real boundary. |

## 21. Founder-approved defaults and deferred implementation decisions

Founder-approved MVP defaults are: unanimous acceptance by all required parties; renewed acceptance for material amendments but not cosmetic metadata changes; creator cancellation before acceptance and policy/consent-governed cancellation afterward; human-reviewed disputes with an auditable outcome and bounded escalation/appeal; a configurable review window with a 24-hour product default; and automated deterministic settlement only when uncontested, authorized by accepted policy, and clear at the Financial Safety gate. Solo agreements are non-financial, outcome-contingent transfers require two valid economic sides, and HMM revenue comes from subscriptions/platform fees rather than participant losses.

Deferred implementation and legal decisions include reviewer eligibility, binding authority and conflict rules; exact appeal count and service levels; retention periods and legal-hold behavior; export/deletion mechanics; KYC vendors and identity assurance levels; sanctions and transaction-monitoring providers and thresholds; source-of-funds controls; amount/velocity limits; jurisdiction availability; regulated custody/payment partners; fee schedules; runtime schema library or JSON Schema generation; canonical serialization/signing; business-day calendars; numeric confidence scales; weighted criteria; provider/source trust tiers; organization/delegation semantics; and monitoring cadence. No real-money capability launches until qualified legal/compliance review and appropriate regulated partners approve the applicable jurisdictional model.
