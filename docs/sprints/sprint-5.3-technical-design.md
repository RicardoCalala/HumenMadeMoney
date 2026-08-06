# Sprint 5.3 Technical Design Summary — Agreement Persistence Boundary

## 1. Purpose and scope

Sprint 5.3 introduces a minimal server-side boundary for creating, reading, listing, and updating agreement drafts without selecting production infrastructure. The boundary makes the canonical Agreement Language from Sprint 5.2—not the Sprint 5.1 presentation model—the authoritative persisted content. It uses an in-memory development repository first, while keeping domain, application, transport, and persistence responsibilities explicit enough to replace that repository with PostgreSQL/Prisma later.

This document is an implementation blueprint. It does not claim durable storage, authentication, access control, production audit guarantees, or financial capability.

### Goals

- Define a narrow repository interface around agreement aggregates and immutable content versions.
- Define versioned server API contracts and route-handler responsibilities for create, read, list, and update.
- Validate every write through the canonical Agreement Language and return structured, non-sensitive errors.
- Prevent lost updates with explicit optimistic-concurrency preconditions tied to the current immutable `versionId`.
- Make retries safe through bounded idempotency behavior for creates and updates.
- Preserve the Sprint 5.1 UI through the existing one-way compatibility adapter.
- Establish pagination, filtering, permission, provenance, audit, observability, and migration seams without prematurely implementing production systems.

### In scope

- Repository, application-service, transport DTO, error, and request-context contracts.
- Conceptual Next.js route handlers under `/api/v1/agreements`.
- An isolated, deterministic in-memory development repository.
- Draft creation, authorized-view placeholders, bounded listing, read, and canonical draft update semantics.
- Test strategy and a future PostgreSQL/Prisma migration path.

### Out of scope

- PostgreSQL, Prisma, database migrations, caching, queues, event publication, or new dependencies.
- Authentication, invitations, real permission enforcement, organizations, or identity assurance.
- Acceptance, evidence submission, verification runs, disputes, lifecycle transitions, resolution, or amendment workflows for accepted agreements.
- Real funds, protection/custody providers, KYC/AML providers, production AI/MCP, settlement instructions, or settlement execution.

The implementation sprint must not expose generic arbitrary status updates or financial actions through these routes.

## 2. Architectural boundaries

Dependencies point inward. Transport and persistence depend on application/domain contracts; domain code never imports Next.js, HTTP, or repository implementations.

```text
Sprint 5.1 UI
    ↓ UI adapter/client
HTTP transport: route handlers + DTO parsing + response mapping
    ↓
Application: use-case services + authorization port + idempotency coordination
    ↓
Domain: Agreement Language + validation + version/amendment rules
    ↓ port implemented by
Persistence: in-memory repository (later PostgreSQL/Prisma)
```

### Domain layer

Owns `AgreementLanguageDocument`, structured validation, version semantics, and amendment classification. It knows nothing about callers, HTTP status codes, storage engines, pagination tokens, or UI types. The existing `validateAgreementDocument` remains the authoritative semantic validator for writes. `evaluateAmendment` informs whether renewed acceptance would be required, but Sprint 5.3 updates only mutable draft/proposed content; an accepted document is never edited in place.

### Application/service layer

Owns the create, get, list, and update use cases. It coordinates trust-boundary parsing, validation, permissions, repository calls, version construction, conflicts, idempotency intent, provenance, and audit metadata. The repository mutation remains responsible for atomically claiming an idempotency key and committing its state/audit effects. Application services return typed results or errors rather than `Response` objects.

### Transport layer

Next.js route handlers parse JSON and query parameters, apply size/content-type limits, construct a request context, call one application use case, and map results to versioned DTOs and HTTP responses. They contain no domain mutation rules and never access the repository directly.

### Persistence layer

Implements the repository port. The first implementation stores cloned values in process memory for deterministic development and tests. It does not claim durability, cross-process consistency, immutability, or production concurrency guarantees.

### Proposed implementation shape

```text
apps/web/
├── app/api/v1/agreements/
│   ├── route.ts                       # POST create, GET list
│   └── [agreementId]/route.ts         # GET read, PATCH update draft
├── lib/agreement-language/            # Existing canonical domain types/rules
├── server/agreements/
│   ├── application/
│   │   ├── service.ts
│   │   ├── contracts.ts
│   │   └── errors.ts
│   ├── domain/
│   │   └── versioning.ts              # Narrow construction rules only if needed
│   ├── persistence/
│   │   ├── repository.ts              # Port
│   │   └── in-memory-repository.ts    # Development/test adapter
│   └── transport/
│       ├── api-contracts.ts
│       └── mapping.ts
└── lib/agreements/
    └── api-adapter.ts                 # Future UI data source; maps via compatibility adapter
```

Exact filenames may follow established repository conventions during implementation. Do not add a dependency-injection framework, generic base repository, ORM-shaped domain type, or command bus.

## 3. Aggregate and persistence model

The repository persists an `AgreementAggregate`, not the Sprint 5.1 `Agreement` view:

```ts
interface AgreementAggregate {
  agreementId: AgreementId;
  currentVersionId: VersionId;
  lifecycleState: "draft" | "in_review" | "accepted";
  currentDocument: AgreementLanguageDocument;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  provenance: RecordProvenance;
}

interface RecordProvenance {
  createdByActorId: string;
  lastChangedByActorId: string;
  correlationId: string;
  source: "api" | "development_seed";
}
```

`lifecycleState` is operational aggregate state; `currentDocument.versionState` is the state of the current canonical content version. They are related but are not aliases. Sprint 5.3 must define and validate the small permitted mapping (`draft` lifecycle → current `draft` version, `in_review` → current `proposed` version, and `accepted` → current `accepted` version) in one application/domain rule so the two values cannot drift. `currentVersionId` must equal `currentDocument.versionId`. The repository owns prior immutable versions internally; version IDs and integer sequences are unique within an agreement, predecessor links form one linear chain, and stored versions are ordered by increasing `agreementVersion`. Reads may include seeded accepted aggregates for compatibility, but this sprint exposes no transition into `accepted` and no version-history endpoint.

For Sprint 5.3, only `draft` and, if required by the existing UI, `in_review` are mutable through update. Accepted versions are append-only and are never replaced. Operational acceptances, evidence, assessments, authorization grants, disputes, financial-safety state, and audit records remain separate from accepted content, as required by Sprint 5.2.

The in-memory implementation may keep:

- one map keyed by `agreementId` for aggregates;
- one insertion-ordered index for deterministic listing;
- one bounded idempotency-record map for development behavior; and
- append-oriented audit-hook calls captured by a test adapter.

Every value is cloned on ingress and egress so callers cannot mutate repository state by reference. The repository accepts a fully validated replacement aggregate/version; it does not merge arbitrary partial objects.

## 4. Repository contract

Keep the port specific to this aggregate:

```ts
interface AgreementRepository {
  create(
    aggregate: AgreementAggregate,
    mutation: AgreementMutationMetadata,
  ): Promise<CreateRepositoryResult>;

  getById(agreementId: AgreementId): Promise<AgreementAggregate | null>;

  list(query: AgreementListQuery): Promise<AgreementPage>;

  saveNextVersion(
    agreementId: AgreementId,
    next: AgreementLanguageDocument,
    precondition: { expectedCurrentVersionId: VersionId },
    mutation: AgreementMutationMetadata,
  ): Promise<SaveRepositoryResult>;
}

interface AgreementMutationMetadata {
  idempotency?: {
    scope: { actorId: string; operation: "create" | "update"; agreementId?: AgreementId };
    key: string;
    requestFingerprint: string;
  };
  audit: AuditRecord;
}
```

`create` is insert-only. `saveNextVersion` accepts only the already-validated next document rather than an ever-growing aggregate history. It performs one compare-and-swap operation: compare the stored `currentVersionId` with `expectedCurrentVersionId`, then append the new immutable version and advance the current document/pointer atomically. Each mutation atomically claims or replays its scoped idempotency record and appends its required audit record; it either commits all required effects or none. A version mismatch returns a typed conflict and never partially writes. The service must not implement the comparison as a separate read followed by an unconditional save.

The port must not expose `delete`, arbitrary field update, transaction objects, Prisma types, HTTP DTOs, or unrestricted predicates in Sprint 5.3.

## 5. Application use cases

### Create agreement

1. Require a request context and run the coarse create permission before revealing or writing data.
2. Parse a create command containing canonical draft content but not server-owned IDs/timestamps.
3. Resolve the authenticated/demo actor to an authorized canonical creator party, then generate opaque `agreementId` and `versionId`, set `agreementVersion = 1`, `versionState = "draft"`, `createdByPartyId` to that bound party, and server-controlled UTC timestamps.
4. Validate the complete `AgreementLanguageDocument` through `validateAgreementDocument`.
5. Prepare required audit/provenance metadata and store it atomically with the aggregate and optional idempotency record.
6. Notify optional post-commit observability hooks only after successful creation.

The client cannot choose another actor, overwrite `createdAt`, claim acceptance, or set operational state. An actor ID and a canonical party ID are distinct identifiers; the development access adapter must provide an explicit actor-to-party binding and creation fails safely when none exists.

### Read agreement

Run a coarse authenticated-context check, load by opaque ID, then apply object-level permission before returning the caller-appropriate representation. This two-stage check permits resource-aware policy without exposing whether the ID exists. Until authentication exists, the development policy is explicit and injectable; it must be labeled non-production and must not be confused with real authorization. Both unknown and unauthorized resources map to the same public `404` response unless a reviewed policy later requires otherwise.

### List agreements

Normalize and bound the query, derive caller scope before repository filtering, fetch one page, and return a stable cursor. The development policy may expose only records in the fixed demo actor's explicit scope, including records that actor creates during the process lifetime. No endpoint returns an unbounded array.

### Update agreement

`PATCH` means “submit the complete desired next canonical draft,” not JSON Merge Patch and not arbitrary property mutation.

1. Require `expectedVersionId` in the command and/or `If-Match` precondition; if both are present they must agree.
2. Load and authorize against the aggregate without trusting client role fields.
3. Reject updates to accepted/superseded/withdrawn versions through this endpoint. A future accepted amendment uses `POST /agreements/{id}/versions` as documented in the API architecture.
4. Construct a complete new document with the same `agreementId`, a server-generated `versionId`, monotonic `agreementVersion`, `previousVersionId` set to the current version, and controlled timestamps/state.
5. Validate the complete next document and evaluate materiality.
6. Atomically save only if the current stored version still equals `expectedVersionId`.
7. Atomically store the attributable audit metadata with the version/idempotency effects, then notify optional post-commit observability hooks.

Every change submitted through this canonical-content endpoint creates a new immutable content version, including a non-material canonical change. Materiality controls future renewed-acceptance behavior; it does not justify mutating an existing stored version. Purely cosmetic display metadata that is truly outside the canonical document does not create an agreement version, consistent with Sprint 5.2, and must be modeled through a separately authorized metadata operation if the product later needs it. That metadata operation is not part of Sprint 5.3. In particular, the current `evaluateAmendment` implementation treats changes outside its compared policy/terms fields as non-material; it does not make those fields non-versioned or safe to edit in place.

## 6. API contracts and routes

All routes are conceptual and versioned under `/api/v1`. Responses use JSON. Request bodies and query strings are allowlisted and bounded; unknown security-sensitive mutation fields are rejected. Transport parsing must establish the complete runtime shape before calling `validateAgreementDocument`; TypeScript types alone are not a network trust boundary, and malformed nested input must produce `INVALID_REQUEST` rather than an uncaught exception. Sprint 5.3 may implement focused dependency-free guards because no new dependency is justified yet.

### `POST /api/v1/agreements`

Creates one draft. Accepts a `CreateAgreementRequestV1` containing participant-authored canonical fields and optional `Idempotency-Key` header. Returns `201` with `AgreementResourceV1` and a version-aware `ETag`. A replay with the same key and equivalent request returns the original successful resource; the same key with different content returns `409 IDEMPOTENCY_KEY_REUSED`.

### `GET /api/v1/agreements/{agreementId}`

Returns `200` with the current authorized resource and `ETag`, or safe `404 RESOURCE_NOT_FOUND`. A future diagnostic distinction between missing and forbidden remains internal only.

### `GET /api/v1/agreements`

Accepts only:

- `limit`: default 20, maximum 100;
- `cursor`: opaque, repository-issued continuation token;
- `lifecycleState`: allowlisted exact value;
- `versionState`: allowlisted exact value;
- `protectionMode`: `none`, `protection`, or `conditional_intent`; and
- `updatedAfter`: validated UTC instant, if needed by the current UI.

Returns `{ data, page: { nextCursor, hasMore } }`. Default ordering is deterministic: `updatedAt` descending with `agreementId` as a tie-breaker. Pagination uses that tuple as a keyset, not a mutable array offset. A cursor is versioned, expires, and is bound to the normalized filters and caller-scope fingerprint so it cannot be replayed across queries or actors. Its transport representation is opaque and integrity-protected in production; the development codec may be simpler but must reject tampering and must not encode sensitive values. Concurrent updates can move records across the ordering boundary, so Sprint 5.3 promises deterministic continuation from the cursor, not a database snapshot; clients refresh from the first page to observe newer changes. Full-text search, arbitrary sort fields, participant-name filters, offsets, and complex predicates are deferred until authorization, indexing, privacy, and performance behavior are designed.

### `PATCH /api/v1/agreements/{agreementId}`

Accepts a complete next-draft request and requires the current immutable version as a precondition. Prefer `If-Match: "<versionId>"` for HTTP semantics and include `expectedVersionId` in the typed application command. Returns `200` with the new resource and `ETag`, `412 VERSION_PRECONDITION_FAILED` when the supplied precondition is stale, or `428 PRECONDITION_REQUIRED` when absent. If the implementation platform makes reliable `ETag` handling awkward, a required body field is acceptable for Sprint 5.3, but there must be exactly one authoritative comparison value.

Use `PATCH` only because the resource identity remains the same; the body is still a complete desired canonical draft. Document this explicitly for clients.

### Resource shape

Transport resources separate canonical content from server metadata:

```ts
interface AgreementResourceV1 {
  agreementId: AgreementId;
  currentVersionId: VersionId;
  lifecycleState: "draft" | "in_review" | "accepted";
  document: AgreementLanguageDocument;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  capabilities: {
    canRead: boolean;
    canUpdateDraft: boolean;
  };
}
```

`capabilities` are convenience hints derived by the server, never proof of authorization and never accepted back as mutation authority. Operational records can be added as separately permissioned resources later; do not silently embed them in accepted terms.

## 7. Structured API errors

All failures use one non-sensitive envelope:

```ts
interface ApiErrorResponseV1 {
  error: {
    code: string;
    message: string;
    requestId: string;
    retryable: boolean;
    fieldErrors?: Array<{
      code: string;
      path: string;
      message: string;
      category?: string;
    }>;
    conflict?: {
      expectedVersionId?: VersionId;
      currentVersionId?: VersionId;
    };
  };
}
```

Stable codes include `INVALID_REQUEST`, `AGREEMENT_VALIDATION_FAILED`, `RESOURCE_NOT_FOUND`, `PRECONDITION_REQUIRED`, `VERSION_PRECONDITION_FAILED`, `IDEMPOTENCY_KEY_REUSED`, `PERMISSION_DENIED` (normally mapped publicly to not found for resource reads), `UNSUPPORTED_MEDIA_TYPE`, `REQUEST_TOO_LARGE`, and `INTERNAL_ERROR`.

Canonical validation codes and JSON-pointer-like paths from Sprint 5.2 pass through `fieldErrors` after redaction. Errors state whether anything changed and the safe next action. Stack traces, repository details, submitted agreement content, identities, and sensitive values never appear in responses or default logs.

For stale updates, returning `currentVersionId` is allowed only after authorization and helps the UI fetch the current version and present a review/merge flow. The server never auto-merges canonical terms and never overwrites newer content.

## 8. Optimistic concurrency and conflict recovery

`versionId`, not the display-oriented integer `agreementVersion`, is the compare-and-swap token. The integer remains useful for human display but can be guessed and is not sufficient proof that the caller edited the exact representation.

The server generates every new opaque version ID. Content hashes may be added later for integrity or deduplication, but Sprint 5.3 must not call a version ID a cryptographic content hash unless canonical serialization and hashing are actually implemented.

When two clients edit version `V1`:

- the first valid save creates `V2` and succeeds;
- the second save with expected `V1` receives `412 VERSION_PRECONDITION_FAILED`;
- no data from the second request is applied;
- the client fetches the authorized current version and asks the user to review differences; and
- resubmission intentionally targets the new current version and receives a new idempotency key.

No last-write-wins behavior, silent field merge, or optimistic success is permitted for agreement terms.

## 9. Idempotency and retry behavior

Create and update accept a client-generated opaque `Idempotency-Key`, bounded in length and character set. The application supplies actor scope, operation, route/resource scope, a deterministic request fingerprint, and expiry intent; the repository atomically records the claim and successful result with the mutation. A key is never global across actors or operations. The fingerprint is computed from a normalized, validated transport command with object keys in a stable order and array order preserved, and includes the API contract version. It is an internal comparison token, not a `versionId` or a claim of canonical agreement-content hashing.

- Same scoped key and same fingerprint after success returns the original response without creating another agreement/version or duplicate audit event.
- Same scoped key and different fingerprint returns `409 IDEMPOTENCY_KEY_REUSED`.
- A failed validation may be retried after correction with a new key; implementations should not permanently cache client-correctable failures.
- An update fingerprint includes the expected `versionId`; a replay cannot accidentally target a later version.
- Concurrent same-key requests must converge on one write in the repository implementation.

The in-memory store demonstrates semantics only. Entries disappear on restart and do not coordinate across processes. Production durability, retention, cleanup, transactionality, and abuse limits are deferred to the database implementation.

## 10. Permission and authentication placeholders

Authentication is not implemented, but authority must still have a named seam:

```ts
interface AgreementAccessPolicy {
  authorize(context: RequestContext, action: AgreementAction, resource?: AgreementAggregate): Promise<AccessDecision>;
}
```

`RequestContext` contains server-derived `actorId`, optional organization/session references, `requestId`, `correlationId`, and source. Route handlers must never derive identity from request-body party IDs. The development adapter may use a fixed demo actor with explicit agreement/party scope, guarded so it cannot be mistaken for production configuration.

Every service method calls the policy: create/list receive a coarse action-and-scope decision, while read/update also receive the loaded aggregate for object-level authorization. Repository list queries require an authorization-derived scope and cannot express an unscoped scan. Replacing the development policy with authenticated membership/party authorization later must not change domain or repository contracts. Deny by default when the actor context is absent or the policy cannot decide.

## 11. Audit, provenance, privacy, and observability hooks

The application prepares an `AuditRecord` with actor, action, `agreementId`, old/new `versionId`, occurred/recorded times, request/correlation/causation IDs, source system, materiality, and non-sensitive explanation, then gives it to the repository mutation as required commit metadata. The in-memory repository records the state change, idempotency result, and audit entry as one synchronous critical section or makes no change. The future database writes agreement/version, idempotency record, and append-oriented audit event in one transaction or transactional-outbox flow. Optional observability sinks run only after commit and their failure does not retroactively report a completed mutation as failed.

Do not claim audit records are immutable in Sprint 5.3. Do not include full documents, participant names, evidence payloads, private terms, idempotency keys, or request bodies in general logs. Structured operational signals should cover request latency, validation failures by code, not-found/denial counts without resource detail, conflict rates, repository failures, and idempotency replays, keyed by request/correlation IDs.

Retention, deletion, subject access, legal holds, and production access logging need later founder/legal/security decisions. The repository and API should retain references rather than copying sensitive operational payloads.

## 12. Compatibility with Sprint 5.1

The current UI remains a presentation consumer. A thin server/UI adapter:

1. fetches `AgreementResourceV1`;
2. combines the canonical document with separately supplied operational/demo records;
3. calls the existing `toSprint51Agreement` compatibility function; and
4. passes the resulting Sprint 5.1 `Agreement` to unchanged presentation components.

The direction stays canonical-to-view only. The server must not persist Sprint 5.1 fields such as `nextAction`, display status labels, `canAuthorizeResolution`, derived timelines, or simulated funding status as accepted terms. During incremental adoption, the current mock adapter may remain the selected data source behind the same UI-facing interface. Switching to the API should be explicit and reversible; do not silently mix mock and API writes.

Create-form mapping needs a deliberate input adapter because the Sprint 5.1 form does not necessarily collect every canonical field. The adapter may supply truthful development defaults only where Sprint 5.2 permits them, and must surface missing required terms as validation errors rather than invent participant intent.

## 13. In-memory repository behavior

The development repository is deterministic and isolated per test or server instance:

- accept a clock and ID generator as constructor dependencies using small function ports;
- seed only explicit cloned fixtures;
- return cloned data;
- enforce unique agreement/version IDs;
- enforce compare-and-swap and idempotency semantics inside the mutation method;
- sort and paginate deterministically;
- reject invalid cursor/filter combinations with structured errors; and
- provide a reset helper only in test code, not through an HTTP route.

Do not export a mutable singleton array. A process-local singleton may be used for a local demo only if its restart and multi-worker limitations are visibly documented and production startup fails closed or uses a different configured adapter.

## 14. Test strategy

### Domain unit tests

- Existing canonical validation and policy tests continue to pass.
- Version construction preserves `agreementId`, advances the integer sequence, creates a new `versionId`, records `previousVersionId`, and never mutates the prior document.
- Invalid schema, references, financial-side rules, money, authority, or policy fields fail before persistence.
- Accepted versions cannot be updated through the draft endpoint.

### Application-service tests

- Create, read, list, and update success paths with deterministic IDs/time.
- Permission is checked for every use case and body-supplied actor/authority fields are ignored or rejected.
- Validation errors retain stable codes and paths.
- Stale updates preserve stored data and return the authorized current version reference.
- Same-key/same-payload retries produce one write and one audit event; different-payload reuse fails.
- Audit/provenance hooks are attributable and exclude payload content.

### Repository contract tests

Run one shared suite against the in-memory adapter and, later, PostgreSQL/Prisma. Cover insert uniqueness, cloned ingress/egress, atomic compare-and-swap, concurrent conflicts, stable ordering, cursor continuation without duplicates, filtering, limits, idempotency scope, and repository error mapping.

### Route/contract tests

- Method, media type, body size, malformed JSON, unknown fields, and invalid query handling.
- HTTP status and `ApiErrorResponseV1` mapping.
- `ETag`/precondition behavior, safe 404 behavior, pagination metadata, and idempotency headers.
- Responses do not expose stacks, storage details, or sensitive request fields.
- Contract fixtures verify compatibility mapping into the current UI model and preserve simulated-money labeling.

No dependency is required for the initial tests: use the repository's existing TypeScript/Node and Next.js test capabilities. Add runtime-schema or API-generation tooling only after measuring a concrete gap at the HTTP trust boundary and reviewing bundle, maintenance, and migration cost.

## 15. Migration path to PostgreSQL/Prisma

Later persistence should implement the same repository contract rather than leaking ORM models upward. A likely relational shape is:

- `agreements`: aggregate identity, current version reference, lifecycle state, owner/organization scope, timestamps;
- `agreement_versions`: unique immutable `version_id`, `agreement_id`, sequence, schema version, canonical document, predecessor, timestamps/provenance;
- `idempotency_records`: actor/operation/resource scope, key digest, fingerprint, stored result reference, expiry;
- `activity_events`: append-oriented attributable mutation metadata; and
- separate tables for participants, acceptances, evidence, assessments, disputes, and other operational records when those sprints begin.

The database adapter must use one transaction for compare-and-swap, version append, current-pointer update, idempotency record, and required audit/outbox record. Enforce unique `(agreement_id, agreement_version)`, unique `version_id`, and scoped idempotency constraints. A conditional update on the expected current version, checked by affected-row count, prevents lost writes across processes.

Migration sequence:

1. Freeze and test the repository contract against the in-memory implementation.
2. Design Prisma schema and SQL constraints from domain invariants, not vice versa.
3. Add the database adapter behind configuration while retaining the in-memory adapter for isolated tests.
4. Run the shared contract suite against both adapters.
5. Add forward/backward-compatible migrations, seed/export tooling for development data only, and rollback/roll-forward validation.
6. Switch environments explicitly; never dual-write without reconciliation and an approved recovery plan.

In-memory data is disposable and is not automatically migrated. Production introduction requires authentication/authorization, privacy/retention rules, backup/restore testing, monitoring, rate limits, threat review, and operational ownership.

## 16. Risks and mitigations

- **Process-local storage can look durable.** Label the adapter development-only, expose no production claim, and fail closed outside allowed environments.
- **Canonical JSON can become an unqueryable blob.** Keep the repository contract domain-oriented; initially index only bounded list fields and normalize operational entities later when real queries require it.
- **Update semantics may accidentally rewrite accepted terms.** Restrict this endpoint to draft/proposed content, always append versions, and reserve accepted amendments for a dedicated future use case.
- **Version numbers can be mistaken for concurrency tokens.** Require the opaque current `versionId` and treat the integer as display metadata.
- **Idempotency without durable coordination is incomplete.** Test semantics now and document restart/multi-process limits; require transactional storage later.
- **Authorization placeholders can become accidental policy.** Use an explicit replaceable port, fixed development scope, deny-by-default behavior, and no client-derived identity.
- **List filters may leak membership or sensitive metadata.** Apply actor scope first, use safe not-found behavior, allowlist filters, and avoid names/free-text until privacy and indexing are designed.
- **API and UI models may drift.** Keep the canonical-to-Sprint-5.1 adapter one-way and add mapping contract tests.
- **Audit hooks can diverge from successful writes.** Fail safely in-memory and later make the mutation, idempotency record, and audit/outbox atomic.

## 17. Founder decisions

No founder decision is required to approve this documentation-only design within the stated Sprint 5.3 scope. The design deliberately chooses conservative, reversible defaults: complete-next-draft updates, an opaque `versionId` precondition, bounded cursor pagination, development-only access policy, and no new dependency.

Before production persistence or authenticated use, founder approval will be required for:

- participant/organization ownership and permission rules, including invitees and reviewers;
- retention, deletion, export, legal-hold, and audit-access policy;
- whether any display metadata may change without creating a canonical content version;
- public API compatibility/deprecation commitments and idempotency retention duration; and
- production infrastructure, jurisdiction, security/compliance review, and operational ownership.

These decisions should not block the in-memory Sprint 5.3 implementation as long as it remains non-production and does not claim enforcement or durability.

## 18. Implementation acceptance criteria

When Sprint 5.3 implementation is authorized, it is complete only when:

- create/read/list/update flow exclusively through transport → application → repository boundaries;
- all writes build and validate complete canonical documents server-side;
- accepted versions cannot be edited and every successful draft edit creates a new immutable version;
- stale writes and missing preconditions fail without changing data;
- idempotent retries do not duplicate agreements, versions, or audit events;
- list queries are caller-scoped, allowlisted, bounded, and deterministically paginated;
- the in-memory adapter is explicitly development-only and passes the shared repository contract suite;
- the current UI can consume API resources through the canonical compatibility path without treating mock/UI fields as authority;
- structured errors and logs do not leak sensitive content;
- no authentication, PostgreSQL/Prisma, real-money, KYC/AML, production AI/MCP, or settlement capability is introduced; and
- focused tests plus repository lint, typecheck, tests, build, diff review, and documentation consistency checks pass.
