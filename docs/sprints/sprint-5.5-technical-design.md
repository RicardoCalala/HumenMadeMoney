# Sprint 5.5 Technical Design Summary — PostgreSQL and Prisma Persistence

## 1. Purpose and scope

Sprint 5.5 replaces disposable process-local agreement, membership, account, and session storage with durable PostgreSQL persistence behind Prisma adapters. The design preserves the repository contracts and application behavior established in Sprints 5.2–5.4.1: canonical agreement versions remain authoritative, accepted content is never edited in place, identity stays separate from agreement parties, authorization remains membership-backed and server-enforced, and agreement mutations combine concurrency, idempotency, membership, and audit effects atomically.

This is a persistence change, not a product or authority expansion. PostgreSQL becomes the durable system of record for the currently implemented agreement and development-authentication slice. Prisma is an adapter implementation detail and must not leak into domain, application, transport, or UI contracts.

### Goals

- Persist accounts, account state, development-profile mappings, sessions and token digests, agreements, immutable versions, memberships, acceptances, idempotency outcomes, audit records, and provenance across process restarts.
- Preserve `AccountRepository`, `SessionRepository`, `AgreementMembershipRepository`, and `AgreementRepository` behavior and existing API/UI contracts.
- Enforce important invariants with both application validation and database constraints.
- Make agreement create and version-append operations atomic, durable, retry-safe, and safe under concurrent requests.
- Define a minimal local database workflow, migration policy, test isolation model, and operational failure behavior without selecting production hosting.

### In scope

- PostgreSQL/Prisma schema and adapter design for the current Sprint 5.4.1 runtime model.
- Necessary normalized tables plus canonical JSON storage for agreement-language documents.
- Migration, local development, environment, indexing, cleanup, retention, test, and failure-handling design.
- A later implementation path that keeps in-memory adapters available for focused unit tests and explicitly selects one adapter at composition time.

### Out of scope

- Runtime code, Prisma installation, schema generation, migrations, containers, or database provisioning in this documentation-only step.
- Production database host, cloud, topology, replicas, pooling vendor, backup vendor, or deployment platform selection.
- KYC/AML providers, real payments, custody, banking data, settlement execution, or production financial records.
- Production OAuth, passkeys, identity recovery, invitations, ownership transfer, organizations, or delegated administration.
- Production AI/MCP, evidence ingestion, verification execution, disputes, notifications, or an event bus/outbox consumer.

No table in this sprint stores bank accounts, payment credentials, custody balances, card data, provider secrets, settlement destinations, or real-funds state. Existing protection and conditional-intent fields remain participant-reviewed agreement language only and must continue to be presented as non-operational/simulated.

## 2. Existing contracts and compatibility rules

The current application services depend on narrow ports:

- `AccountRepository`: `find` and `findByLocalProfile`.
- `SessionRepository`: `create`, `findByDigest`, `replace`, `revoke`, and `update`.
- `AgreementMembershipRepository`: active membership lookup, active agreement scope, and membership listing.
- `AgreementRepository`: atomic create, read, keyset list, and compare-and-swap version append with typed replay/conflict outcomes.

The Prisma adapters must implement these ports without changing their signatures or returning Prisma models. They map database rows to cloned domain records and map known database outcomes to the existing result unions. Application services continue to own use-case orchestration, authorization, canonical validation, amendment evaluation, ID generation, audit explanations, and safe API errors. The database owns durability, relational integrity, uniqueness, and transactional serialization.

Compatibility requirements:

1. The canonical `AgreementLanguageDocument` remains the persisted terms format; the Sprint 5.1 view remains a one-way projection.
2. `versionId`, not a mutable agreement row, identifies the exact terms accepted or audited.
3. `Account.accountId` and canonical `Party.partyId` remain distinct. Membership is the explicit binding.
4. Existing lifecycle/version-state restrictions, safe object-level 404 behavior, CSRF/origin checks, ETags, and API envelopes do not change.
5. Existing process-global in-memory repositories remain development/test options until the Prisma adapter reaches contract parity. A process uses one selected adapter; there is no dual-write mode.
6. Prisma clients, generated enums, transactions, filters, and errors never cross the persistence/composition boundary.

## 3. Proposed data model

Use application-generated opaque string IDs initially to preserve existing identifiers and fixtures. Store timestamps as PostgreSQL `timestamptz` in UTC and map them to ISO strings at the port boundary. Use database enum types only where the vocabulary is stable in current contracts; migration code must still tolerate rolling application deployments. Names below describe the logical model; final Prisma names may use conventional casing and explicit `@@map`/`@map` mappings.

### 3.1 Accounts and development authentication profiles

**`accounts`**

- `id` primary key (`accountId`).
- `state`: `active | suspended | disabled`.
- `display_name`.
- `primary_email` nullable; no uniqueness guarantee until normalization and verified-email semantics are approved.
- `created_at`, `updated_at`.

**`local_auth_profiles`**

- `profile_id` primary key.
- `account_id` foreign key to `accounts(id)` with restrictive deletion.
- `created_at`.
- Unique `account_id` for the minimal one-profile-per-account development seed.

This table exists only when local-development authentication is enabled. It is not a production credential model and stores no password or provider token. A future production `auth_identities` design requires a provider decision and is not introduced here.

Account state is stored on `accounts`, not inferred from session state. Disabling an account revokes its access logically on the next resolution even if a session row has not yet been cleaned up. Account deletion is not part of the current repository contract.

### 3.2 Sessions and token digests

**`sessions`**

- `id` primary key (`sessionId`).
- `account_id` foreign key to `accounts(id)` with restrictive deletion.
- `token_digest` unique and required; raw session tokens are never stored.
- `csrf_digest` required; raw CSRF tokens are never stored.
- `state`: `active | revoked | expired`.
- `assurance`: current value `development`.
- `created_at`, `last_seen_at`, `idle_expires_at`, `absolute_expires_at`, `revoked_at` nullable.
- `rotation` non-negative integer.
- Optional `replaced_session_id` self-reference for traceability; it does not change the existing port result.

Database checks should enforce non-negative rotation, `idle_expires_at <= absolute_expires_at`, `last_seen_at >= created_at`, and `revoked_at IS NOT NULL` when state is revoked. Application logic still determines expiry and bounded renewal.

Lookup uses the domain-separated SHA-256 digest already produced by the authentication service. Index the unique digest and `(account_id, state)`, plus a partial/compound expiry index suitable for active-session cleanup. Never index or log raw tokens because none are persisted.

`replace(previousId, record)` runs in one transaction: conditionally mark the prior active session revoked, insert the new session, and commit both or neither. `update` must not resurrect a revoked/expired session through a stale renewal; the adapter performs a conditional update based on the expected active state and persisted rotation. With the current void-returning port, a lost condition leaves the terminal database row unchanged but cannot tell the already in-flight resolver to retract the snapshot it previously accepted. A later port refinement may expose an explicit compare-and-swap outcome if same-request cancellation becomes a requirement; the first adapter must preserve today’s behavior without overstating that guarantee.

### 3.3 Agreements and immutable versions

**`agreements`** — mutable aggregate head

- `id` primary key (`agreementId`).
- `current_version_id` unique and non-null, identifying the current `agreement_versions` row. Because the version also references its agreement, creation has a circular foreign-key dependency. Implement both sides as transaction-deferred custom SQL constraints (or use an equally strict staging shape proven by migration tests), insert the head and version in one transaction, and require both references to be valid at commit. Do not temporarily commit a head without a version or weaken the final column to nullable merely to accommodate Prisma statement ordering.
- `lifecycle_state`: current values `draft | in_review | accepted`.
- `created_at`, `updated_at`.
- `created_by_actor_id`, `last_changed_by_actor_id`, `correlation_id`, `source` for aggregate provenance.
- Non-negative `revision` integer, initialized to zero and used internally to claim/serialize head mutation; `current_version_id` remains the public ETag/precondition.

**`agreement_versions`** — append-only canonical terms

- `id` primary key (`versionId`).
- `agreement_id` foreign key to `agreements(id)` with restrictive deletion.
- `agreement_version` positive integer.
- `previous_version_id` nullable self-reference.
- `schema_version`.
- `version_state`: `draft | proposed | accepted | superseded | withdrawn`.
- `amendment_kind` nullable: `material | cosmetic`.
- `created_at`, `created_by_party_id`.
- `document` PostgreSQL `jsonb`, containing the complete validated `AgreementLanguageDocument`.
- Denormalized, generated-at-write query columns required by current list filters: `protection_mode` and the already-listed state/timestamp values. These must be derived from the validated document by the adapter and checked against the JSON representation in repository tests.
- Optional `document_digest` for integrity diagnostics, calculated from a documented canonical serialization; it is not a participant signature and must not be marketed as one.

Constraints:

- Unique `(agreement_id, agreement_version)`.
- Unique `(agreement_id, id)` to support composite ownership foreign keys from the head, parties, and audit records.
- Unique version `id` globally.
- `agreement_version > 0`.
- `previous_version_id` belongs to the same agreement. Because ordinary composite foreign keys and the nullable first version need careful SQL treatment, enforce this with a composite unique key plus a deferred constraint trigger or an adapter transaction check followed by a database constraint.
- Version 1 has no predecessor; later versions have exactly the immediately prior sequence and predecessor. The compare-and-swap transaction enforces this sequence.
- `agreements.current_version_id` must identify a version belonging to that agreement. Enforce with composite keys/custom SQL if Prisma’s generated relation cannot express it fully.

The JSON document is chosen deliberately for this sprint. The canonical language contains nested, versioned policy structures whose write unit is the whole immutable document. Normalizing every clause now would multiply migration surface without supporting a current query or mutation. Relational columns hold identity, lineage, authorization joins, lifecycle, filters, and integrity-critical references. Future clause-level tables may be added only for a demonstrated query or integrity requirement and must remain derived from or explicitly replace a versioned canonical format.

Once inserted, an agreement-version row is not updated or deleted by repository code. A new draft/proposed version is appended and the agreement head advances. Future transitions such as accepted-to-superseded may require append-oriented state events or narrowly controlled state columns; Sprint 5.5 must not invent those unimplemented lifecycle operations.

### 3.4 Canonical parties and memberships

Because relational membership and acceptance records need enforceable version/party references while the full party definition remains in canonical JSON, add a derived join table.

**`agreement_version_parties`**

- `agreement_id`, `version_id`, `party_id` composite primary/unique key.
- `acceptance_required`.
- `party_type` and minimal role metadata needed for validation/authorization diagnostics; no email or provider identity.
- Foreign key `(agreement_id, version_id)` to the version.

Rows are inserted from the validated document in the same transaction as the immutable version and never become an alternate authoring model. Their contents must match the JSON document.

**`agreement_memberships`**

- `id` opaque primary key, added even though the current TypeScript contract has no membership ID, to support stable audit references and partial uniqueness.
- `agreement_id` foreign key to `agreements(id)`.
- `account_id` nullable foreign key to `accounts(id)`; nullable only for `pending_invitation` compatibility, though invitations remain out of scope.
- `party_id`.
- `role`: `owner | participant | reviewer | observer`.
- `state`: `active | pending_invitation | revoked`.
- `created_at`, `created_by_account_id`, `activated_at`, `revoked_at`.

Membership party validity is checked against the agreement’s relevant canonical party set. Current draft updates must reject removal of any party referenced by a non-revoked membership, matching the in-memory repository. A foreign key to only the current version would break historical membership as versions advance, so the invariant is enforced in the version-append transaction and repository contract tests rather than by repointing membership rows.

Use PostgreSQL partial unique indexes for:

- one active owner per agreement: unique `agreement_id` where `role = 'owner' AND state = 'active'`;
- no duplicate non-revoked account/party binding: unique `(agreement_id, account_id, party_id)` where `state <> 'revoked' AND account_id IS NOT NULL`.

The owner index enforces **at most one** active owner. **At least one** is preserved by inserting the agreement head, first version, and owner membership in one creation transaction, and by exposing no owner-revocation, owner-replacement, or agreement-deletion operation in Sprint 5.5. The Prisma adapter must reject any generic membership mutation that would revoke the active owner. Invitations and ownership transfer require a later purpose-built transaction that establishes the successor while preserving the invariant; they must not be approximated with two ordinary membership writes. A deferred constraint trigger could enforce the cross-row “at least one” rule if those operations are later introduced, but adding one now would protect no authorized mutation path.

These indexes require custom SQL migration statements if Prisma schema syntax cannot express them. Foreign keys use restrictive deletion. Non-owner revocation changes state and timestamp; it does not erase history.

### 3.5 Acceptance and version state

**`agreement_acceptances`**

- `id` primary key (`acceptanceId`).
- `agreement_id`, `version_id`, `party_id` with a composite foreign key to `agreement_version_parties`.
- `accepted_at`.
- `consent_context` and `assurance_context`, bounded text.
- `account_id` nullable foreign key to `accounts(id)` for attributable authenticated acceptance when that use case is implemented.
- `session_id` nullable foreign key to `sessions(id)` using restrictive/no-action deletion.
- `recorded_at`, `correlation_id`.

Unique `(version_id, party_id)` prevents duplicate effective acceptance. Retried acceptance should return the existing result through its mutation idempotency record rather than insert another consent. Acceptances never move to a new version and are never updated to manufacture consent. Material amendment creates a new version with no copied acceptance rows. Cosmetic handling follows the existing domain rule and must be explicit; a database migration cannot reinterpret consent.

The table is included because acceptance/version state is a required durable boundary, but Sprint 5.5 does not add an acceptance API. Until that use case exists, no adapter method writes it. Agreement/version state transitions remain application-controlled and must atomically validate unanimous exact-version acceptance when acceptance runtime work is authorized.

### 3.6 Durable idempotency

**`idempotency_records`**

- `id` primary key.
- `actor_id`, `operation` (`create | update`), `agreement_scope_id` nullable, and `key_digest`. The adapter derives a domain-separated digest for lookup; raw client idempotency keys are never persisted or logged.
- `request_fingerprint`.
- `agreement_id`/resource reference for reconstructing the existing replay result.
- `result_version_id` nullable for diagnostics and future exact-response reconstruction.
- `created_at`, `expires_at`.

Unique `(actor_id, operation, agreement_scope_id_normalized, key_digest)`. PostgreSQL null uniqueness does not make create scopes collide, so use a non-null normalized scope column (for example the agreement ID or a reserved create sentinel) or separate partial unique indexes. Do not rely on Prisma’s treatment of nullable compound keys.

Within the mutation transaction, attempt to insert the idempotency row before domain writes and fill its result reference before commit. The row is not visible to other transactions until the entire mutation commits. A competing insert on the same unique scope therefore waits on the unique-key lock up to a bounded transaction/lock timeout, then either observes the committed record or receives a retryable unavailable outcome. After a uniqueness conflict, the adapter reads the existing record:

- different fingerprint → existing `idempotency_conflict`;
- same fingerprint → load and return the current aggregate as `replayed`, matching current behavior.

Agreement, first/next version, owner membership when creating, audit record, and idempotency result commit together. A rollback removes all effects, including the attempted reservation. No committed `in_progress` state or background takeover protocol is needed for the current synchronous, database-only mutation boundary. This makes retries durable across process restart and multiple application workers without adding a speculative workflow.

Retain committed records for a documented window longer than any supported client retry horizon. A conservative development default is 7 days, configurable through non-secret environment configuration; production retention requires operational/privacy approval. Cleanup deletes only expired records in bounded batches. Financial idempotency is explicitly not designed here and must never reuse this short retention without separate review.

### 3.7 Audit and provenance

**`audit_records`**

- `id` primary key (`eventId`).
- `agreement_id`, `version_id` composite foreign key to the referenced agreement version.
- `actor_type`, `actor_id`, `action`.
- `occurred_at`, `recorded_at`.
- `correlation_id`, `causation_id` nullable, `source_system`, `policy_version` nullable.
- `related_object_ids` as bounded `jsonb` or a child table only when relational querying is required.
- `explanation` bounded text.
- Optional `previous_event_id` and `event_digest` reserved only if a reviewed hash-chain implementation is added; do not claim tamper-proof or immutable audit today.

Repository permissions expose insert and select only for this table; application adapters never update/delete audit rows. Corrections are new linked events. Required domain audit insertion is in the same transaction as the mutation it describes. Operational/security telemetry stays a separate stream even if it shares correlation IDs.

Aggregate provenance remains on `agreements` for efficient reconstruction, while each mutation’s attributable history is in `audit_records`. Database triggers may reject update/delete on versions and audit in a later hardening migration, but first implementation should avoid privileged trigger complexity unless adapter-only permissions cannot provide the guarantee. Backups, DBA access, retention, and legal holds mean the correct current claim is “append-oriented and attributable,” not “immutable.”

## 4. Transaction boundaries and atomicity

Use short interactive Prisma transactions only where multiple statements must share a decision. Do not call external systems, AI, email, or network services inside transactions.

### Create agreement

In one transaction:

1. Reserve/check idempotency scope when supplied.
2. Insert the agreement head and version 1 in the creation sequence supported by the deferred circular constraints; neither may be validly committed alone.
3. Insert the derived version-party rows.
4. Validate `current_version_id`, version ownership, and aggregate consistency before commit.
5. Insert exactly one active owner membership.
6. Insert one audit record.
7. Fill the idempotency resource reference before commit.

Any unique or validation failure rolls back all rows. Known constraint failures map to `duplicate` or `idempotency_conflict`; unknown failures remain non-sensitive internal errors.

### Append next version

In one transaction:

1. Reserve/check idempotency scope when supplied.
2. Claim the head with a conditional update such as `UPDATE agreements SET revision = revision + 1 WHERE id = ? AND current_version_id = expectedVersionId`, checking the affected-row count. This serializes contenders without pointing `current_version_id` at a row that does not yet exist.
3. If no row updates, distinguish `not_found` from `version_conflict` with a scoped reload; roll back so no version, audit, or idempotency effect remains.
4. Validate sequence, predecessor, aggregate state, and that all non-revoked membership party IDs remain present while the claimed head row is locked.
5. Insert the immutable next version and version-party rows, then update the already-claimed head to the new `current_version_id`, lifecycle, timestamps, and provenance.
6. Insert exactly one audit record and fill the idempotency resource reference before commit.

Concurrent updates from the same expected version allow exactly one commit. The loser returns the current version ID through the existing `version_conflict` result. Prefer PostgreSQL’s default `READ COMMITTED` plus conditional writes and unique constraints; use `SERIALIZABLE` only if contract tests expose an invariant that conditional updates cannot protect, and then retry serialization failures a small bounded number of times.

### Session operations

- Create is one insert.
- Replace/rotation revokes the known prior session and inserts the new session atomically.
- Revoke is conditional and idempotent.
- Renewal/expiry is a conditional update on the persisted active state (and current rotation where applicable), so a stale resolver cannot overwrite a concurrent revoke or terminal expiry. The current `SessionRepository.update(record): Promise<void>` port does not report a lost compare-and-swap: the adapter can prevent resurrection, but the already in-flight resolver may finish using the session snapshot it read before revocation. Subsequent resolution fails closed. If the product later requires revocation to cancel the same in-flight request, refine the port to return an explicit applied/current-state outcome and make the service act on it; do not imply that guarantee from the current contract.

## 5. Queries, indexing, pagination, and cursors

Authorization must remain membership-backed. Sprint 5.5 preserves the existing repository signatures, including `listActiveAgreementIds(accountId)` and the authorization scope passed to `list`; the Prisma adapter must not reinterpret `accountId` as a client-supplied authority. For the current bounded development profiles, it may materialize those authorized IDs exactly as the existing service expects, then apply the agreement query in PostgreSQL. This is contract parity, not a production-scale claim. Before unbounded production membership sets are supported, a separately reviewed additive port evolution should let `list` express the active, non-observer membership join directly and remove the intermediate ID list without changing the API response contract.

Current ordering is `updated_at DESC, agreement_id ASC`. Continue keyset pagination using both fields, never offset pagination. The cursor remains opaque, versioned, signed with a secret outside source, expires after the existing 15-minute window, and is bound to account authorization scope plus filters. Do not encode membership inventories. Membership changes must invalidate scope binding or make the subsequent query fail closed.

Minimum indexes:

- `sessions(token_digest)` unique; active expiry and account/state indexes.
- `agreement_versions(agreement_id, agreement_version)` unique and `(agreement_id, created_at)`.
- `agreements(updated_at DESC, id ASC)` and selective filter-supporting indexes based on measured queries.
- `agreement_memberships(account_id, state, agreement_id)` for list scope and `(agreement_id, account_id, state)` for reads.
- Partial membership uniqueness indexes described above.
- `idempotency_records` scope uniqueness plus `expires_at` for cleanup.
- `audit_records(agreement_id, occurred_at, id)` and `correlation_id`.
- `agreement_acceptances(version_id, party_id)` unique and `(agreement_id, version_id)`.

For list filters on current version state/protection mode, either denormalize these onto the agreement head within the same transaction or join the current version. Start with the join and add head columns only if query plans justify it; correctness and a single write path matter more than speculative optimization. Verify all intended indexes with representative `EXPLAIN` output before production-scale claims.

## 6. Local development and environment

Do not choose a cloud vendor. The later implementation should provide one documented, disposable local PostgreSQL path, preferably a pinned major version through the project’s existing local-container convention if one exists when implementation begins. If no convention exists, add the smallest reviewed Compose file only when runtime implementation is authorized. Developers may also use an equivalent local PostgreSQL instance.

Expected configuration:

- `DATABASE_URL`: runtime connection URL; required when the Prisma adapter is selected.
- `DIRECT_DATABASE_URL`: optional direct connection used only if the eventual deployment/pooling topology requires migrations; do not require it locally without need.
- `HMM_PERSISTENCE_ADAPTER=in_memory|prisma`: explicit composition choice. Default to `in_memory` in test; development may opt into Prisma. Production must fail closed unless an approved durable adapter is selected.
- `HMM_CURSOR_SIGNING_SECRET`: high-entropy secret for durable cursor signatures outside source. Development may use a clearly labeled local value in an ignored example workflow, never a production fallback.
- `HMM_IDEMPOTENCY_RETENTION_HOURS` and `HMM_SESSION_CLEANUP_BATCH_SIZE`: bounded operational tuning with validated defaults.

Provide `.env.example` names and comments only during implementation, never real credentials. Keep `.env*`, database dumps, and generated secrets ignored. Application runtime roles should not own schema or have broad destructive privileges in production-shaped environments; migration credentials are separate when operational design exists.

Local workflow for the implementation sprint should be: start disposable PostgreSQL, set a local-only URL, apply checked-in migrations, run a deterministic development seed, start the app with the Prisma adapter, and use an explicit reset command only against a URL positively identified as test/local. Reset tooling must refuse ambiguous or production-shaped hosts/databases.

## 7. Migration strategy

### Initial durable cutover

The current stores are documented as disposable development state, so Sprint 5.5 does not promise to migrate live user data from process memory. Preserve deterministic development fixtures by recreating them through a versioned seed using stable IDs and timestamps. Never scrape a running process or infer owner bindings from display names.

Implementation sequence:

1. Freeze shared repository contract tests and add parallel account/session adapter contract tests.
2. Add Prisma tooling and a pinned PostgreSQL compatibility target only in the separately authorized runtime sprint.
3. Create schema/migrations, including reviewed custom SQL for partial indexes, checks, deferrable/composite constraints, and append-only permissions where used.
4. Implement row/domain mappers and Prisma adapters behind existing ports.
5. Run the shared contract suites against in-memory and an isolated PostgreSQL database.
6. Add deterministic local seed data, including explicit account-to-party owner mappings.
7. Select the adapter explicitly in composition and exercise restart, multi-process/concurrency, auth, authorization, pagination, and idempotency scenarios.
8. Keep an emergency configuration rollback to the disposable in-memory adapter for local development only. Do not dual-write or silently fall back from Prisma after a database failure.

### Forward-only policy

Committed migrations are append-only and forward-only. Never edit a migration already shared. Prefer expand → backfill/validate → switch reads/writes → contract in a later release. Destructive changes require a separately reviewed retention/export decision, verified backup/restore capability, and explicit authorization.

Application rollback means deploying code compatible with the expanded schema, not automatically running down migrations. If a migration fails before commit, fix forward or restore the disposable local/test database. For a future non-disposable environment, rollback planning must be migration-specific and may require restore or a compensating forward migration; Prisma’s migration history alone is not a data rollback strategy.

Before applying any future non-local migration: inspect generated SQL, test on a representative copy without customer data exposure, estimate locks/table rewrites, validate constraints, back up, verify restore, define abort criteria, and record migration provenance. None of those actions is authorized by this design document.

## 8. Test isolation, reset, and seed strategy

Keep most pure domain and application tests on fresh in-memory repositories for speed. Run the same repository contract suite against PostgreSQL to prove behavioral equivalence.

Database tests should:

- use a dedicated test database URL that is never accepted by runtime production composition;
- apply real checked-in migrations once per test worker/setup;
- isolate tests with a unique schema/database per worker or a transaction rolled back after each test where the code under test does not open independent transactions;
- avoid shared mutable seed rows unless each test treats them as read-only;
- use injected clocks/IDs and no wall-clock sleeps;
- reset with `TRUNCATE ... RESTART IDENTITY CASCADE` only through a guarded test helper against an allowlisted database name, or drop the worker-specific schema after the suite;
- cover actual concurrent connections for compare-and-swap, idempotency, session revoke-vs-renew, and uniqueness races;
- verify process restart by constructing a new Prisma client and adapter against the same database, not by relying on module globals.

Seeds are explicit application-level fixtures, idempotent by stable key, and separated into minimal test seeds and clearly labeled local demo seeds. They contain synthetic `.invalid` emails only, no personal or production data. Seed changes are reviewed like migrations because they affect authorization assumptions.

Required adapter contract coverage includes mapping fidelity, JSON round-trip, uniqueness, foreign keys, immutable-version behavior, owner atomicity, bound-party protection, exact replay/conflict outcomes, cursor binding and stable ordering, session expiry/rotation/revocation, cleanup bounds, transaction rollback, and safe error mapping. Existing 22 web tests, lint, typecheck, build, root Turbo checks, and browser behaviors must remain green during implementation.

## 9. Session expiry, cleanup, retention, and deletion

Request-time resolution remains authoritative: an expired session is denied immediately even if cleanup has not run, and the adapter may mark it expired conditionally. Cleanup is operational hygiene, not a security boundary.

A later bounded cleanup command/job should:

- mark active rows expired when idle or absolute expiry has passed;
- delete or archive expired/revoked sessions only after a configurable security/support retention window;
- delete expired idempotency records in small batches;
- use indexed predicates, limits, metrics, and a single-run advisory lock if concurrent schedulers are possible;
- never delete agreements, versions, acceptances, memberships, or audit records.

Soft deletion is not added to agreements because no deletion use case or policy exists and a boolean flag would create misleading privacy behavior. Membership and session revocation use explicit state/timestamps. Account disablement preserves attributable shared-agreement history. Agreement retention, participant export/deletion, identity erasure/anonymization, legal hold, and audit/security-event retention require privacy/legal/product decisions before implementation. Until then, use restrictive foreign keys and no general purge API.

## 10. Failure handling and observability

- Database unavailable or transaction timeout: return the existing non-sensitive internal response (or a future stable `SERVICE_UNAVAILABLE` code), emit a redacted structured operational event, and do not fall back to memory.
- Known uniqueness/precondition conflicts: map deterministically to existing `duplicate`, `idempotency_conflict`, or `version_conflict` results.
- Serialization/deadlock: retry only the whole idempotent transaction a small bounded number of times with jitter; never retry arbitrary statements after a partial external effect.
- Unknown Prisma/database error: log error class, operation, correlation ID, and safe constraint identifier; never log connection URLs, tokens, email, canonical agreement JSON, participant lists, or SQL parameter values.
- Post-commit response loss: the client retries with the same key and receives a durable replay.
- Audit insertion failure: required mutation rolls back. Optional telemetry failure after commit does not turn success into apparent failure.
- Mapping/schema-version failure: fail closed, identify the record internally, and do not silently coerce participant terms.
- Pool exhaustion or slow queries: bound connection acquisition/query time, measure latency/error/lock-wait/connection saturation, and investigate query plans before adding caches or replicas.

Health checks should distinguish process liveness from database readiness and avoid mutating data. Migration version mismatch must be visible at startup/deployment, not repaired automatically by the web process.

## 11. Security and privacy boundaries

- Use TLS and appropriate at-rest protection in any future non-local environment; provider selection is deferred.
- Use least-privilege runtime and migration roles; Prisma migration tooling does not run on ordinary web requests.
- Parameterized Prisma queries do not replace authorization, runtime validation, or output minimization.
- Digests protect bearer-token lookup but are still sensitive authentication material; restrict database/log access and rotate sessions after suspected exposure.
- Do not persist request bodies, raw headers, cookies, CSRF/session tokens, IP addresses, or user agents by default.
- Keep email/provider claims out of canonical parties, memberships, audit explanations, idempotency scopes, and cursors.
- Backups and replicas inherit the same privacy/retention obligations; detailed production backup and disaster-recovery policy waits for hosting and legal decisions.
- No schema here authorizes money movement. JSON fields describing protection or intent are agreed terms only and cannot be treated as balances or execution instructions.

## 12. Operational risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Prisma schema becomes the domain model | Keep ports and explicit mappers; no generated types outside persistence. |
| JSON and query columns drift | Derive in one transaction, validate in adapter tests, and use database checks where practical. |
| Concurrent updates create two successors | Conditional head update, sequence uniqueness, predecessor constraints, and real multi-connection tests. |
| Idempotent retry duplicates side effects | Reserve and complete the key in the same transaction as all current database effects. |
| Session renewal resurrects a revoked session | Conditional state-aware update prevents persisted resurrection; subsequent resolution fails closed. The current void-returning port does not cancel a resolver already in flight. |
| Agreement has zero or multiple owners | Atomic creation, partial unique active-owner index, and no generic owner revocation/replacement path. |
| Membership references a party removed by a draft | Validate all non-revoked bindings inside the append transaction. |
| Database outage silently loses durability | No fallback or dual-write; safe failure and explicit readiness signal. |
| Migration locks or destroys data | Forward-only expand/contract, reviewed SQL, validation, backup/restore and abort plan before non-local use. |
| Unbounded audit/idempotency/session growth | Indexed bounded cleanup for ephemeral records; policy approval before shared-history deletion. |
| Audit is overstated as immutable | Append-only adapter permissions and honest “append-oriented” language; corrections are new events. |
| Development data is mistaken for production readiness | Local-only auth profile model, environment guards, synthetic seed data, no hosting/security/compliance claim. |
| Connection count grows across Next.js bundles/workers | One process-global Prisma client in development, controlled production pooling after topology selection, and connection metrics. |
| Sensitive data leaks through errors/query logs | Redacted error mapping; disable parameter/payload logging; never log secrets or canonical documents. |

## 13. Implementation acceptance criteria

When runtime implementation is separately authorized, Sprint 5.5 is complete only when:

- checked-in migrations establish the reviewed relational and JSON model with all custom SQL constraints/indexes inspected;
- Prisma adapters satisfy the existing ports without Prisma types leaking outward;
- shared repository/session/account contract suites pass against in-memory and PostgreSQL;
- agreement creation atomically commits agreement, version, derived parties, owner membership, audit, and idempotency outcome;
- next-version writes are immutable, compare-and-swap safe, membership-safe, and return existing conflict/replay results under real concurrency;
- sessions, account states, token digests, memberships, acceptances if exercised, audit, and idempotency survive process/client restart;
- session rotation/revoke/renew races never resurrect terminal persisted state, subsequent resolution fails closed, and cleanup is bounded and non-authoritative;
- authorization lists preserve current membership scope and keyset pagination behavior; production-scale direct membership joins remain an explicit readiness gate;
- local setup, guarded reset, deterministic seeds, environment validation, and migration workflow are documented and tested;
- database outages, constraint errors, migration mismatch, and post-commit retries produce safe behavior and redacted diagnostics;
- existing application/API/UI behavior and validation suites remain green; and
- no real funds/custody data, production auth/provider, invitation/transfer, KYC/AML, production AI/MCP, settlement, cloud-host selection, or production migration is introduced.

## 14. Founder decisions

No founder approval is required for this technical design, for preserving the current repository contracts, or for a local/test PostgreSQL implementation using synthetic data and the conservative defaults above.

No decision about production hosting should be made in Sprint 5.5. The implementation may pin a locally supported PostgreSQL major version without committing the company to a vendor.

Founder approval, with appropriate security/legal/operational advice, is genuinely required before production use for:

- production database hosting, regions/data residency, availability target, backup/restore objectives, disaster recovery, encryption/key ownership, pooling/topology, monitoring, and operational on-call ownership;
- retention, deletion/anonymization, export, legal hold, audit/security-event access, and backup deletion policy;
- production authentication identity/recovery and session lifetime/rate-limit policy;
- invitation/ownership-transfer or organization/delegation semantics; and
- any schema or workflow for real payments, custody, KYC/AML, financial providers, settlement execution, or production AI/MCP.

Those decisions are gates for later production capabilities, not blockers to a reversible local implementation of the durable persistence boundary.
