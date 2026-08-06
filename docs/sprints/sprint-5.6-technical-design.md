# Sprint 5.6 Technical Design Summary — Evidence and Assessment Workflow

## 1. Purpose and scope

Sprint 5.6 adds the first durable workflow for submitting evidence, determining whether an exact evidence set is usable and sufficient under the accepted Agreement Language, producing explainable advisory assessments, and requesting attributable human review. It extends the existing transport → application → repository architecture and PostgreSQL/Prisma persistence without changing accepted agreement content or weakening membership authorization.

AI and MCP remain advisory. An assessment, regardless of actor or confidence, cannot accept terms, decide a dispute, record a resolution, create a settlement instruction, release funds, or otherwise authorize a consequential action. Reviewer decisions are separate records, and any future settlement service must independently enforce the accepted authorization policy, dispute/review window, Financial Safety gate, and idempotency.

### Goals

- Persist evidence metadata and immutable provenance against an exact `agreementId`, `versionId`, requirement, and criterion set.
- Enforce Agreement Language evidence requirements, allowed-source constraints, submitter scope, visibility, sensitivity, freshness, and distinct-source rules.
- Represent missing, conflicting, invalid, stale, inaccessible, revoked, and insufficient evidence without turning uncertainty into failure or success.
- Persist reproducible assessments that name the exact evidence revision set, policy version, findings, sources, confidence basis, limitations, and recommended next action.
- Provide deterministic and manual assessment adapters for local/test use; make a future advisory AI/MCP adapter replaceable.
- Support human-review requests, escalation, and reviewer decisions without conflating review authority with advisory assessment output.
- Preserve durable idempotency, optimistic concurrency, append-oriented audit, bounded pagination, privacy, and safe failures.

### In scope

- Evidence metadata, revisions, provenance events, lifecycle state, requirement-state derivation, and evidence-set snapshots.
- Assessment runs, criterion findings, source attribution, confidence/uncertainty, local/test adapters, and assessment status.
- Human-review requests, assignment boundary, reviewer decision records, challenge/escalation hooks, and audit records.
- PostgreSQL/Prisma design, repository/application/API contracts, transaction boundaries, migrations, tests, and agreement-detail UI integration points.

### Out of scope

- Production model calls, prompt infrastructure, external source retrieval, MCP servers, monitoring, webhooks, malware scanning services, OCR, or file/blob storage.
- Vector databases, embeddings, RAG pipelines, semantic search, or a general workflow/rules engine.
- Real settlement execution, real funds or custody, production payment providers, KYC/AML or identity-proofing providers, and automated legal adjudication.
- Production reviewer staffing, marketplace/organization queues, notifications, final retention periods, legal holds, appeals policy, or service-level guarantees.

## 2. Existing baseline and compatibility rules

Sprints 5.1–5.5 established a UI projection, canonical Agreement Language, application/repository/API seams, authenticated account context, active membership authorization, immutable agreement versions, PostgreSQL/Prisma adapters, durable scoped idempotency, append-oriented audit, and keyset pagination. Sprint 5.6 must preserve those contracts and conventions:

- canonical `EvidencePolicy` and `VerificationPolicy` define accepted rules; evidence, assessments, reviews, and lifecycle views remain separate operational records;
- every operational record references the exact agreement version it concerns, even if a newer version becomes current;
- evidence submission, assessment, and review require proof that the pinned version reached accepted state through its exact-version acceptance records. A formerly accepted version remains eligible for its historical workflow after being marked `superseded`; a draft, merely proposed, or withdrawn version is never eligible. The mutable agreement lifecycle/current-version pointer is not sufficient proof;
- the canonical source allowlist is authoritative, but URLs, uploaded names, metadata, retrieved content, model output, and tool instructions are untrusted data;
- active membership is necessary but action-specific authorization still applies; canonical party roles and client-visible capabilities are not authority by themselves;
- opaque IDs, UTC instants, stable error codes, server-derived actors, CSRF/origin protection, restrictive foreign keys, no silent fallback, and adapter selection by explicit environment configuration continue;
- Prisma types do not escape persistence adapters, and presentation components do not consume database entities; and
- existing agreement writes and reads remain compatible. Sprint 5.6 adds bounded operational resources rather than expanding the agreement aggregate with mutable evidence arrays.

The current `EvidenceItemRecord` and `AssessmentRecord` types are semantic starting points, not sufficient persistence or API contracts. Implementation may add operational fields described here while preserving their core meaning. Agreement Language changes are not required for this sprint.

## 3. Domain model and invariants

### 3.1 Evidence item and immutable revisions

An `EvidenceItem` is the stable identity and lifecycle envelope. An `EvidenceRevision` is an immutable submitted or corrected representation:

```ts
type EvidenceLifecycle = "active" | "superseded" | "withdrawn" | "revoked";
type EvidenceAvailability = "available" | "missing" | "inaccessible" | "stale" | "revoked";
type EvidenceIntegrity = "unverified" | "verified" | "failed";
type EvidenceValidation = "pending" | "valid" | "invalid";

interface EvidenceItem {
  evidenceId: string;
  agreementId: string;
  versionId: string;
  evidenceRequirementId: string;
  currentRevisionId: string;
  lifecycle: EvidenceLifecycle;
  createdAt: string;
  createdByAccountId: string;
  revision: number;
}

interface EvidenceRevision {
  evidenceRevisionId: string;
  evidenceId: string;
  revisionNumber: number;
  supersedesRevisionId?: string;
  criterionIds: string[];
  evidenceClass: "participant_claim" | "external_fact" | "document" | "media" | "system_event" | "human_attestation";
  origin: "participant" | "external" | "system" | "human_reviewer";
  submittedByPartyId?: string;
  submittedByAccountId?: string;
  sourceConstraintId: string;
  sourceRefKind?: "https_url" | "provider_object" | "system_record" | "fixture";
  sourceRef?: string;
  sourceDisplayLabel?: string;
  observedAt?: string;
  capturedAt: string;
  receivedAt: string;
  availability: EvidenceAvailability;
  integrity: EvidenceIntegrity;
  validation: EvidenceValidation;
  validationReasons: string[];
  metadata: Record<string, string | number | boolean | null>;
  contentDigest?: string;
  payloadRef?: string;
}
```

The stable item and each revision are pinned to one `versionId`; evidence is never silently carried to a material amendment. A future explicit reassociation operation may propose reuse only after validating the new version's requirement, source, consent, visibility, and freshness rules and must create a new evidence item with provenance back to the prior item.

`payloadRef` is an opaque reference to a future restricted blob/content store. Sprint 5.6 does not store uploads or arbitrary document bodies in PostgreSQL. For local/test fixtures it may be absent or point to deterministic synthetic fixture content. `contentDigest`, when present, supports integrity comparison but is not proof of truth, authorship, safety, or independent origin.

`sourceRefKind` determines validation; `https` URL rules apply only to `https_url`. Provider object IDs, system-record IDs, and synthetic fixture IDs use separate bounded opaque formats and are never coerced into URLs. A display label is never treated as a retrievable reference.

Corrections append a new revision and atomically advance `currentRevisionId`; they never update prior revision fields. Withdrawal/revocation changes the item envelope with an attributable provenance event but does not delete history. Supersession means a newer revision is current, not that old evidence disappears from assessments that already referenced it.

### 3.2 Provenance and minimal metadata

Each revision records only fields required to establish origin, policy fit, timing, integrity state, and explanation. It must not collect arbitrary EXIF, device identifiers, precise location, contacts, credentials, access tokens, full email headers, or other sensitive fields unless a reviewed evidence requirement explicitly permits them. `metadata` keys are selected server-side from the source constraint's `permittedFields`; unknown, nested, dangerous, or oversized values are rejected, not stored “for later.”

Evidence provenance events are append-oriented and include actor, action, occurred/recorded times, correlation/causation IDs, source system, related evidence/revision IDs, policy version, and a non-sensitive explanation. Corrections link old and new revisions. Integrity and availability transitions are new events; they do not rewrite the originally submitted facts.

### 3.3 Requirement state

Requirement and criterion states are derived projections, not mutable assertions:

```ts
type EvidenceRequirementState =
  | "satisfied_for_assessment"
  | "missing"
  | "conflicting"
  | "invalid"
  | "stale"
  | "inaccessible"
  | "insufficient";
```

- `missing`: no eligible current revision exists.
- `invalid`: submitted evidence fails shape, reference, allowed-source, permitted-field, submitter, integrity, or policy validation.
- `stale`: otherwise eligible evidence falls outside the accepted freshness/window rule. Until the Agreement Language exposes a machine-readable freshness limit, no ad hoc limit is invented; a required freshness judgment routes to manual review.
- `inaccessible`: a referenced payload/source cannot be accessed within its authorized scope.
- `conflicting`: eligible evidence materially supports incompatible facts or criterion results; both sides remain referenced.
- `insufficient`: some eligible evidence exists but minimum distinct sources, independence, coverage, or required integrity is unmet.
- `satisfied_for_assessment`: the evidence requirement is eligible to be considered; it does not mean the related success criterion or agreement is satisfied.

Precedence for display is `invalid`/`inaccessible` → `stale` → `conflicting` → `insufficient` → `missing` → `satisfied_for_assessment`, while the full reason list is retained. Source independence is never inferred from distinct URLs, filenames, submissions, or connector calls. If it cannot be established deterministically, the state is `insufficient` and the limitation is explicit.

### 3.4 Evidence sets and assessments

An `EvidenceSet` is an immutable snapshot created for an assessment. Its members name exact `evidenceRevisionId` values in deterministic order and have a canonical digest. New or corrected evidence does not mutate a completed assessment; it requires a new assessment with a new evidence set and `supersedesAssessmentId` when appropriate.

```ts
interface AssessmentRecord {
  assessmentId: string;
  agreementId: string;
  versionId: string;
  evidenceSetId: string;
  supersedesAssessmentId?: string;
  adapterKind: "deterministic" | "manual" | "ai_advisory";
  adapterVersion: string;
  policyVersion: string;
  status: "pending" | "completed" | "failed" | "superseded";
  criterionFindings: CriterionFinding[];
  confidence: {
    level: "low" | "medium" | "high" | "not_assessed";
    basis: string[];
    limitations: string[];
    calibrationReference?: string;
  };
  limitations: string[];
  recommendedNextAction: "request_evidence" | "wait" | "request_human_review" | "participant_review" | "no_action";
  occurredAt: string;
}
```

Each finding contains one canonical `criterionId`, `result` (`satisfied`, `not_satisfied`, `indeterminate`, or `not_applicable`), supporting and conflicting evidence revision IDs, the relevant requirement IDs, a plain-language explanation, and limitations. Explanations attribute claims to sources and distinguish source facts, participant claims, deterministic derivation, reviewer input, and any future AI inference.

Confidence describes support for the assessment, not probability that a person is truthful, legal correctness, reviewer authority, or permission to act. `high` confidence still cannot authorize settlement. Numeric confidence is deferred until a scale, evaluation set, calibration evidence, and user interpretation are approved.

### 3.5 Local/test assessment adapters

`AssessmentAdapter` receives a validated exact agreement version, derived requirement states, and an immutable evidence set. It returns a typed draft assessment but never persists, authorizes, or invokes settlement.

- **Deterministic adapter:** applies only declared supported operators to validated typed synthetic evidence. Unsupported, missing, stale, conflicting, or invalid inputs return `indeterminate`. It records normalized inputs, operator/config version, and explanation. No heuristic weighting is allowed.
- **Manual adapter:** accepts fixture/operator-authored criterion findings through the same validation boundary for local/test workflows and always uses `confidence.level = "not_assessed"` unless a future reviewed manual-confidence policy exists. It must not label the operator as an authorized reviewer. A manual assessment is still advisory and is not a reviewer decision.

Production `ai_advisory` is an interface placeholder only. No model SDK, prompt store, connector, or production call is added.

### 3.6 Human review and reviewer decisions

A `HumanReviewRequest` is opened for an exact version, assessment/evidence set when available, reason codes, affected criteria, requester, and requested route. Reasons include missing required evidence at deadline, conflict, invalid/inaccessible/stale source, insufficient independence, low/unassessed confidence, manual criterion, participant challenge, dispute/risk flag, evaluator failure, consequential outcome, or unproven version/authority.

States are `open`, `assigned`, `in_review`, `completed`, `cancelled`, and `superseded`. Assignment confers queue responsibility only; it does not create canonical party authority or financial authority. For this local/test sprint, recording a decision requires an active `reviewer` membership bound to a party present in the pinned version, assignment of that request to the same account, and a request route equal to the accepted `VerificationPolicy.reviewRoute`; no account-wide or owner-derived reviewer authority is inferred. A future separately authorized operational reviewer grant requires its own design. A participant may not review their own challenged submission when the accepted policy or `selfApprovalProhibited` rule disallows it. Because `selfApprovalProhibited` is currently action-specific and has no reviewer-decision action, this sprint conservatively prohibits the assigned reviewer from deciding a challenge to evidence submitted by the same account or bound party.

`ReviewerDecisionRecord` is deliberately separate from `AssessmentRecord`:

- references the request, exact version, exact evidence set, evidence revisions considered, and any advisory assessments considered;
- records reviewer account/party, authority basis, decision type, criterion findings, explanation, limitations, created time, and appeal/challenge context;
- uses conservative decision types such as `request_more_evidence`, `confirm_assessment`, `reject_assessment`, `record_indeterminate`, or `escalate`;
- cannot itself record resolution, authorize a settlement instruction, or bypass canonical `AuthorizationPolicy`; and
- is append-only. Reconsideration or correction creates a linked superseding record.

Participant challenge creates or links a review request and freezes any future consequential route; it does not mutate or erase evidence or assessments. Appeals and production escalation levels remain policy decisions for a later sprint.

## 4. Permissions and visibility

Authorization is checked on every application use case against active membership, canonical party binding, evidence policy, lifecycle, and sensitivity. Initial conservative matrix:

| Action | Owner | Bound participant | Bound reviewer | Observer/pending/revoked |
| --- | --- | --- | --- | --- |
| List/read standard evidence | Yes, subject to visibility | Yes, subject to visibility | Only when authorized for review | No |
| Submit evidence | Only if its bound party is allowed | Only for an allowed `submitterPartyId` | Only for reviewer/attestation requirements | No |
| Correct/withdraw own submission | Yes, if submitter and policy permits | Yes, if submitter and policy permits | Yes, if submitter and policy permits | No |
| Request assessment/review | Yes | Yes | Yes within review scope | No |
| Assign/take review | No implicit right | No implicit right | Explicit review scope required | No |
| Record reviewer decision | No implicit right | No; self-review prohibited where applicable | Explicit scope and authority basis required | No |

Owner is not a universal reader of `specified_parties` or highly sensitive evidence and is not automatically a reviewer. API list/read operations must apply row-level application policy before serialization and use a non-disclosing not-found response for inaccessible objects. Metadata and payload access are separate capabilities; listing evidence must not mint payload access or expose secret-bearing source references.

## 5. PostgreSQL and Prisma design

Add relational models rather than embedding operational arrays in agreement JSON:

- `EvidenceItem`: stable identity, agreement/version/requirement, current revision, lifecycle, creator, timestamps, CAS revision.
- `EvidenceRevision`: immutable revision with duplicated `agreement_id`/`version_id` consistency keys, predecessor, source constraint, class/origin, submitter references, timestamps, states, bounded JSON metadata, digest/payload reference. The duplicated scope keys exist to support composite foreign keys and are database-checked against the parent item; they are not independent mutable facts.
- join tables `EvidenceRevisionCriterion` and optionally normalized permitted metadata only if query requirements justify it; criterion references must be validated against the canonical JSON in the transaction.
- `EvidenceProvenanceEvent`: append-oriented evidence-specific chain, with general `AuditRecord` written for security/product history.
- `EvidenceSet` and `EvidenceSetMember`: exact version, canonical digest, creation context, ordered exact revision members; unique membership and digest within agreement/version.
- `Assessment`: exact version/evidence set, adapter/policy versions, status, confidence/limitations JSON, recommendation, supersession, timestamps. The row is a CAS-controlled envelope while `pending`; completion writes its result fields once. After `completed`, `failed`, or `superseded`, result content is immutable and later work creates a linked assessment.
- `AssessmentFinding`: assessment/criterion, result, explanation, limitations; supporting/conflicting revisions use join tables.
- `HumanReviewRequest`: exact version, optional assessment/evidence set, state, reason codes, requester, assignee, CAS revision, timestamps.
- `ReviewerDecision`: immutable request/version/evidence-set decision, reviewer, authority basis, explanation/limitations, optional superseded decision.
- a safe additive generalization of existing `IdempotencyRecord`, scoped by actor, operation, agreement, and resource target with key digest, request fingerprint, `result_resource_type`, and `result_resource_id`. Existing agreement create/update replay semantics remain intact. Raw keys are never stored, and replay reconstructs an authorized current DTO from the referenced resource rather than persisting a sensitive response body.

All foreign keys use `RESTRICT`; evidence history must not cascade away with account, agreement, version, assessment, or review deletion. Composite foreign keys enforce same-agreement/same-version references where Prisma cannot express the full invariant alone. Custom SQL constraints/triggers may enforce immutable evidence revisions, completed assessment results, and reviewer decisions; valid predecessor chains; current-revision consistency; no self-supersession; and review/evidence-set version alignment. They must still permit the explicitly modeled CAS transitions on item, pending assessment, and review-request envelopes. As in Sprint 5.5, Prisma schema and migration SQL are reviewed together and parity-tested.

Recommended indexes:

- evidence items: `(agreement_id, version_id, created_at DESC, id DESC)` and `(agreement_id, evidence_requirement_id, lifecycle)`;
- revisions: unique `(evidence_id, revision_number)`, unique predecessor successor where linear correction is required, and `(evidence_id, received_at DESC)`;
- evidence-set members: primary key `(evidence_set_id, evidence_revision_id)` and stable ordinal uniqueness;
- assessments: `(agreement_id, version_id, occurred_at DESC, id DESC)` and `(evidence_set_id, status)`;
- review requests: `(state, created_at, id)` for a future authorized queue and `(agreement_id, version_id, created_at DESC, id DESC)`;
- decisions and audit/provenance: `(review_request_id, created_at, id)` and `(agreement_id, occurred_at, id)`.

Do not index arbitrary metadata JSON or add vector indexes. Add a JSON/path index only after a concrete bounded query is measured and reviewed.

## 6. Transaction boundaries and concurrency

### Submit evidence

One transaction authenticates/authorizes, locks or validates the exact agreement version and membership, proves exact-version acceptance (including historical acceptance when the version is now superseded), resolves requirement/source constraints from canonical JSON, validates allowed fields and bounds, creates item and first immutable revision, advances the item head, appends provenance and audit, and commits idempotency outcome. A retry with the same scope/key/fingerprint returns the original resource after current read authorization; a different fingerprint returns `IDEMPOTENCY_CONFLICT`.

### Correct or change evidence lifecycle

Require `expectedCurrentRevisionId` or item revision. In one transaction validate submitter/authority and policy, append the correction revision or lifecycle event, compare-and-swap the item head/revision, append provenance/audit, and commit idempotency. Competing writes yield `EVIDENCE_VERSION_CONFLICT`; no last-write-wins behavior is allowed.

### Create an assessment

In one transaction prove exact-version acceptance, validate the requester, select eligible current evidence revisions under the canonical policy, materialize or reuse the digest-identical evidence set, create a `pending` assessment, and commit idempotency/audit. The evidence-set digest covers the agreement/version IDs, ordered evidence-revision IDs, and a versioned canonicalization format; adapter and accepted verification-policy versions remain separate assessment inputs. Adapter evaluation occurs outside a long database transaction. Completion uses compare-and-swap from `pending`, validates structured output and all evidence references, then atomically writes findings/links, status, audit, and any mandatory review request. Failure records a safe `failed` status and reason code; it never produces a partial completed assessment.

This two-phase shape permits a future asynchronous adapter without holding locks. A lease/outbox is unnecessary for the synchronous local/test implementation; add one only when a real worker boundary exists. Duplicate completion is idempotent, and stale completion after cancellation/supersession is rejected.

### Request and complete human review

Opening a review request validates the canonical trigger and `reviewRoute`, proves exact-version acceptance, validates scope and exact version/evidence set, deduplicates an equivalent active request, and writes audit/idempotency atomically. Assignment and state transitions use request revision CAS. Completing review atomically verifies the local/test reviewer-membership, assignment, and non-self-review rules, appends an immutable decision, closes the request through CAS, and writes audit. It does not mutate assessments or agreement resolution state.

## 7. Repository and application contracts

Keep narrow ports grouped by use case:

```ts
interface EvidenceRepository {
  submit(input: EvidenceSubmission, mutation: WorkflowMutation): Promise<SubmitEvidenceResult>;
  correct(input: EvidenceCorrection, precondition: EvidencePrecondition, mutation: WorkflowMutation): Promise<CorrectEvidenceResult>;
  getAuthorized(ref: EvidenceRef, scope: EvidenceReadScope): Promise<EvidenceResource | null>;
  list(query: EvidenceListQuery): Promise<EvidencePage>;
}

interface AssessmentRepository {
  prepare(input: AssessmentRequest, mutation: WorkflowMutation): Promise<PrepareAssessmentResult>;
  complete(input: AssessmentCompletion, precondition: AssessmentPrecondition, mutation: WorkflowMutation): Promise<CompleteAssessmentResult>;
  getAuthorized(ref: AssessmentRef, scope: AssessmentReadScope): Promise<AssessmentResource | null>;
  list(query: AssessmentListQuery): Promise<AssessmentPage>;
}

interface HumanReviewRepository {
  request(input: ReviewRequestInput, mutation: WorkflowMutation): Promise<RequestReviewResult>;
  transition(input: ReviewTransition, precondition: ReviewPrecondition, mutation: WorkflowMutation): Promise<ReviewTransitionResult>;
  recordDecision(input: ReviewerDecisionInput, precondition: ReviewPrecondition, mutation: WorkflowMutation): Promise<RecordDecisionResult>;
  list(query: ReviewListQuery): Promise<ReviewPage>;
}
```

`EvidenceAssessmentService` orchestrates `submitEvidence`, `correctEvidence`, `withdrawEvidence`, `get/listEvidence`, `requestAssessment`, `get/listAssessments`, `requestHumanReview`, and `recordReviewerDecision`. It receives the existing server-derived `RequestContext`, delegates action decisions to an extended access policy, validates canonical references and runtime inputs, and maps persistence outcomes to typed application errors. The service never accepts caller-supplied actor, visibility, authority, confidence, or policy fields as trusted facts.

The assessment adapter receives a minimal immutable input projection, not repositories, sessions, Prisma, raw unrestricted payloads, network access, or settlement capabilities. Future connector results enter through a separate evidence-ingestion port and must pass the same submission validation and provenance transaction as participant evidence.

## 8. API contracts and pagination

Proposed authenticated routes:

- `POST /api/v1/agreements/{agreementId}/evidence`
- `GET /api/v1/agreements/{agreementId}/evidence`
- `GET /api/v1/agreements/{agreementId}/evidence/{evidenceId}`
- `POST /api/v1/agreements/{agreementId}/evidence/{evidenceId}/corrections`
- `POST /api/v1/agreements/{agreementId}/evidence/{evidenceId}/withdrawal`
- `POST /api/v1/agreements/{agreementId}/assessments`
- `GET /api/v1/agreements/{agreementId}/assessments`
- `GET /api/v1/agreements/{agreementId}/assessments/{assessmentId}`
- `POST /api/v1/agreements/{agreementId}/review-requests`
- `GET /api/v1/agreements/{agreementId}/review-requests`
- `POST /api/v1/agreements/{agreementId}/review-requests/{reviewRequestId}/decisions`

All mutations require authenticated active accounts, exact-origin/CSRF checks, `Idempotency-Key`, bounded bodies, runtime validation, authorization, and `Cache-Control: no-store`. Corrections and review transitions require an expected revision precondition. Responses expose safe DTOs, not raw metadata JSON, internal source references, digests, policy implementation details, or payload access credentials.

Lists use opaque signed/versioned keyset cursors, stable descending `(createdAt, id)` ordering, default 20, maximum 100, and server-enforced agreement/version/membership scope. Filters are allowlisted: exact version, requirement, lifecycle/requirement state, assessment status, or review state. Cursor/query mismatch returns `INVALID_CURSOR`; no offset pagination or unbounded evidence-set expansion. Assessment resources may include bounded findings and citations; large histories use separate paginated endpoints when needed.

Add stable errors including `EVIDENCE_NOT_ALLOWED`, `EVIDENCE_INVALID`, `EVIDENCE_VERSION_CONFLICT`, `SOURCE_NOT_ALLOWED`, `METADATA_FIELD_NOT_PERMITTED`, `EVIDENCE_SET_CHANGED`, `ASSESSMENT_INDETERMINATE`, `ASSESSMENT_ALREADY_COMPLETED`, `HUMAN_REVIEW_REQUIRED`, `REVIEW_CONFLICT`, and existing authentication/authorization/idempotency codes. Messages are non-disclosing and never echo untrusted content.

## 9. Security, privacy, and data minimization

- Bound request bytes, string lengths, metadata keys/count/depth, evidence count per request, URL length, redirects, and processing time before expensive work.
- Treat filenames, media types, extensions, metadata, URLs, redirect targets, source labels, document text, and connector/model output as untrusted. Escape on display; never render unsanitized HTML or Markdown.
- Accept only `https` source URLs when `sourceRefKind` is `https_url` and the accepted source constraint permits a URL-shaped reference. Parse with a standards-based URL parser, reject credentials, fragments when unnecessary, encoded host ambiguity, non-allowlisted ports/schemes, and canonicalization mismatches. Other reference kinds use their own opaque-format validators. Do not fetch URLs in this sprint.
- Future fetchers must independently prevent SSRF and DNS rebinding, block loopback/private/link-local/cloud-metadata destinations, constrain redirects and response size/type/time, scan hostile files, isolate parsing, and use least-privilege egress. A source URL or retrieved instruction never authorizes another request or tool call.
- Store source references separately from display labels; redact query strings and secret-bearing identifiers. Never store raw tokens, credentials, signed URLs, or cookies in evidence metadata, audit, errors, analytics, or model inputs.
- Apply visibility and sensitivity at serialization and payload-access boundaries. Highly sensitive evidence defaults to the narrowest allowed audience and is excluded from general activity summaries.
- Private evidence is not used for model training by default. Future AI inputs use the minimum authorized excerpts/references, with purpose and model/config provenance.
- Logs contain IDs, state transitions, reason codes, sizes, timings, and correlation IDs—not evidence bodies, canonical documents, metadata values, source URLs, explanations containing private content, or Prisma query parameters.

Retention is policy-owned and not finalized here. Models include `retentionClass`, optional `eligibleForDeletionAt`, and tombstone/redaction hooks only if they can be added without implying automatic deletion. Future export/deletion must preserve agreement integrity, legal/security holds, reviewer accountability, and the fact that an assessment used a particular evidence revision while removing payloads or direct identifiers where policy permits. Destructive deletion is never a normal evidence correction.

## 10. Future MCP and external-source boundary

A future `EvidenceSourceConnector` may retrieve only an accepted `SourceConstraint` through an explicit participant/system authorization grant with bounded purpose, fields, scope, cadence, and expiry. It returns a typed candidate with provenance; it cannot persist evidence directly. The application service validates and records the candidate through the same evidence transaction.

Connectors and MCP tools receive least-privilege credentials and no Prisma/session/settlement access. Tool output and embedded instructions are data. Calls require allowlisted operations, validated parameters, timeouts, rate/output/concurrency limits, source attribution, audit context, and revocation. Write-capable connectors require separate threat modeling and approval.

No vector database or RAG layer is justified for exact-ID policy evaluation and a bounded evidence set. If later discovery across large authorized corpora becomes a measured requirement, retrieval design must preserve access filtering, deletion, provenance, deterministic citations, evaluation quality, and cost before adoption.

## 11. UI integration points

Extend the agreement detail experience rather than creating a separate authority dashboard:

- **Evidence summary:** requirement-by-requirement state, allowed source and submitter guidance, deadline/freshness context, and a role-aware submit action.
- **Evidence list/card:** class, origin, submitter, captured/observed time, related requirement/criteria, availability/integrity/validation, sensitivity-safe source label, correction history, and superseded marker.
- **Submission/correction flow:** explain why each field is requested, who can see it, accepted types/fields, and that correction preserves history. Never imply upload support if only metadata is implemented.
- **Assessment panel:** advisory label; exact agreement version and assessment time; criterion findings; supporting/conflicting citations; missing information; confidence basis and limitations; adapter attribution; and request-review action. Facts, claims, reviewer statements, deterministic results, and future AI inference are visually distinct.
- **Human-review panel:** neutral reason, evidence set under review, status, assigned-reviewer disclosure only when permitted, expected next step without invented SLA, participant challenge action, and separately labeled reviewer decision history.
- **Activity:** attributable evidence, assessment, and review events without sensitive payload/metadata leakage.

Every surface supports loading, empty, permission-denied/non-disclosing, stale-data/conflict, validation failure, adapter failure, and retry states. Do not optimistically show a completed assessment or reviewer decision. Status uses text plus icons/patterns, keyboard and screen-reader flows are tested, focus moves to actionable errors, long source labels wrap safely, and timestamps expose timezone where relevant.

## 12. Test strategy

### Domain and policy tests

- exact version/requirement/criterion/source references, submitter policy, permitted fields, visibility, sensitivity, and bounded input;
- all requirement states, including multiple simultaneous reasons and conservative source-independence handling;
- immutable correction chains, lifecycle transitions, stale/inaccessible/revoked evidence, and evidence-set canonical digest/order;
- deterministic evaluator operators, typed normalization, unsupported/manual criteria, aggregation, conflicts, and `indeterminate` fail-safe behavior;
- confidence semantics, mandatory-review triggers, reviewer self-review/authority rules, and proof that no assessment/decision grants settlement authority.

### Application, authorization, and transport tests

- owner/participant/reviewer/observer/pending/revoked and specified-party visibility matrix, including cross-agreement ID probing;
- CSRF/origin, authentication/account state, body bounds, malicious metadata/URLs, output escaping, safe errors, and log redaction;
- idempotent replay/conflict, CAS races for correction/review, duplicate assessment completion, changed evidence sets, and participant challenge;
- cursor stability, scope/filter binding, page bounds, inaccessible rows, and no cross-party leakage;
- UI empty/error/stale/permission states, source attribution, advisory labels, keyboard/screen-reader behavior, and no false-success optimism.

### Repository and real PostgreSQL contract tests

Run shared contracts against in-memory and Prisma adapters. Real PostgreSQL tests cover restart durability, restrictive foreign keys, composite version integrity, immutable rows/predecessors, current-head CAS, evidence-set uniqueness, concurrent idempotency, assessment completion atomicity, review transition races, audit/provenance co-commit, keyset pagination, and rollback on injected failure. Migration-safety tests inspect custom SQL and schema/migration parity.

Fixtures are deterministic, synthetic, non-sensitive, and include missing, conflicting, invalid, stale, inaccessible, insufficient, corrected, challenged, low-confidence, manual, failed-adapter, and completed-review cases. No network, model, payment, identity, or KYC provider is required.

## 13. Migration, rollout, and rollback

Use a new forward-only checked-in migration. It adds nullable-independent operational tables and indexes without rewriting agreement JSON or existing rows. No backfill is required; existing agreements begin with no evidence. Seeds add only synthetic evidence/assessment/review examples.

Implementation sequence should be: types/validators and shared contracts; in-memory adapter and tests; additive migration and Prisma adapter; application/transport routes; read-only UI projection, then mutations behind an explicit local/test feature flag. Adapter selection remains `in_memory | prisma`; there is no dual write or fallback. Startup/readiness fails clearly on schema mismatch.

Before non-local use, rehearse migration against a restored representative database, measure locks/index creation, verify backup/restore and abort criteria, and define operational ownership. Rollback means disable new routes/feature, deploy code compatible with the additive tables, and roll forward with a corrective migration. Do not drop evidence/history tables as an emergency rollback. A later contract migration may remove superseded columns only after compatibility and retention review.

## 14. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Advisory output is treated as authority | Separate assessment, reviewer decision, authorization, resolution, and settlement records; no settlement-capable port; explicit UI labels and tests. |
| Evidence silently changes after assessment | Immutable revisions and evidence-set snapshots; new assessment required for changed evidence. |
| Different URLs are mistaken for independent sources | Independence is explicit/proven or marked insufficient; never inferred from URL/tool-call count. |
| Sensitive or malicious metadata leaks | Allowlisted minimal fields, strict bounds, redacted logs/DTOs, safe rendering, and separate payload access. |
| URLs enable SSRF or prompt injection | No fetch in this sprint; strict parsing now and isolated allowlisted connector boundary later. |
| Owner/reviewer roles overreach | Action-specific policy, sensitivity visibility, explicit review scope, and self-review restrictions. |
| JSON becomes an unqueryable dumping ground | Small bounded metadata JSON only; relational identity/reference/state and measured indexes. |
| Assessment jobs become partially durable | Prepare/evaluate/complete phases, CAS completion, atomic findings/audit/review creation, deterministic retry. |
| Retention conflicts with historical explainability | Payload/reference separation, future tombstone/redaction hooks, exact revision IDs, and founder-approved policy before deletion. |
| Scope expands into AI/RAG infrastructure | Local deterministic/manual adapters only; no SDK, connector, embeddings, or vector store. |

## 15. Founder decisions

No founder approval is required to implement the local/test workflow using synthetic metadata, deterministic/manual adapters, conservative authorization, append-oriented records, and no payload storage or external calls.

The following decisions genuinely require founder approval, with legal, privacy, security, operations, and domain advice as applicable, before production use:

- evidence retention, payload deletion/anonymization, export, legal/security holds, backup deletion, and treatment of assessments whose source payload is removed;
- which evidence classes and sensitivity levels the product will store, maximum payloads, prohibited categories, regional/data-residency rules, and participant disclosure/consent language;
- production human-review operating model: reviewer eligibility/independence, conflicts of interest, assignment, escalation/appeal, service levels, access, compensation, and accountability;
- any calibrated confidence scale or threshold and any route that lets deterministic output reduce required human review for consequential outcomes;
- production AI/model providers, private-data use, training policy, prompt/model retention, evaluation thresholds, and incident/override process;
- external-source/MCP connector providers, credential/consent model, monitoring cadence, source allowlists, and write-capable operations; and
- any workflow connecting assessments or reviewer decisions to real funds, custody, KYC/AML, legal adjudication, resolution authorization, or settlement execution.

These are production gates, not blockers to the minimal reversible Sprint 5.6 implementation. The current product default remains: low, unassessed, missing, conflicting, invalid, stale, inaccessible, insufficient, challenged, or consequential evidence states route to more evidence, no action, or human review; AI/MCP never authorizes settlement.

## 16. Future implementation acceptance criteria

When runtime implementation is separately authorized, Sprint 5.6 is complete only when:

- exact-version evidence, immutable revisions/provenance, requirement states, evidence sets, assessments, review requests, decisions, audit, and idempotency persist through the selected adapter;
- canonical evidence/source constraints and membership/visibility rules are enforced server-side with safe non-disclosing errors;
- deterministic/manual adapters produce explainable, cited, validated advisory outputs and fail to `indeterminate`/review without partial success;
- assessment completion references an immutable exact evidence set, concurrent changes are conflict-safe, and corrected evidence never alters historical findings;
- reviewer decisions remain distinct from advisory assessments and cannot authorize resolution or settlement;
- PostgreSQL transactions, custom invariants, restart durability, pagination, idempotent replay, concurrent CAS behavior, migration safety, and redaction pass their contract suites;
- UI states clearly separate facts, claims, deterministic findings, future AI inference, and reviewer decisions while meeting accessibility and privacy requirements;
- root/web test, lint, typecheck, build, Prisma format/validate/generate, migration parity/status, real PostgreSQL contracts, `git diff --check`, and documentation consistency checks pass; and
- no production AI call, external connector, vector/RAG infrastructure, payload storage, real settlement, funds/custody, KYC/AML provider, or commit/push is introduced without separate authorization.
