# Sprint 5.4 Technical Design Summary — Authentication and Agreement Ownership

## 1. Purpose

Sprint 5.4 replaces Sprint 5.3's fixed development actor with a minimal, server-derived account and session boundary, then makes agreement access depend on explicit ownership and participant bindings. The Agreement remains the primary domain object; authentication establishes who is acting, while authorization determines what that actor may do.

This is a technical design only. It does not implement authentication, persistence, invitations, production identity assurance, or runtime changes. It does not claim production-grade account security, durable sessions, verified identity, or legal identity.

### Goals

- Provide a development-only sign-in and sign-out flow with a current-user identity.
- Resolve API actors from a server-validated session rather than a fixed or caller-supplied actor header.
- Model agreement ownership and participant-to-account bindings without putting credentials or contact details in canonical agreement content.
- Protect agreement pages and API routes with clear authentication and object-authorization boundaries.
- Define session lifecycle, CSRF, session-fixation, privacy, audit, migration, and test requirements.
- Keep identity-provider integration replaceable and ready for passkeys or OAuth without production credentials.
- Extend the Sprint 5.3 application and repository seams with small, reversible contracts and no dependency unless implementation demonstrates a concrete security gap.

### In scope

- Development account, session, current-user, participant binding, and ownership boundaries; invitation acceptance is specified only as a deferred safety boundary.
- Server/client session access rules and protected route behavior.
- Unauthorized, forbidden/non-disclosing, suspended, disabled, and session-expired behavior.
- Safe removal of the fixed `demo-actor` request context.
- Audit/provenance hooks, privacy and data-minimization rules, tests, and a future production-provider path.

### Out of scope

- Production OAuth credentials, production passkey registration, identity proofing, KYC, sanctions or AML providers.
- PostgreSQL, Prisma, durable multi-process sessions, production email delivery, organizations, delegated administration, or account recovery operations.
- Real funds, custody, settlement execution, production AI/MCP, or production deployment.
- Final retention periods, legal-name requirements, provider selection, account-recovery policy, or step-up rules for future financial actions.

## 2. Existing baseline and constraints

Sprint 5.1 established server-rendered agreement surfaces, safe not-found language, role-aware presentation, and a mock `currentUserParticipantId`; none is authorization. Sprint 5.2 separated account identity from canonical `Party`, made roles non-authoritative, and required future acceptances to record authentication/assurance context. Sprint 5.3 implemented transport → application → repository boundaries, a server-created `RequestContext`, a replaceable `AgreementAccessPolicy`, explicit actor-to-party binding for creation, caller-scoped listing, non-disclosing object reads, version concurrency, idempotency, and attributable mutation records.

The current runtime still has deliberately temporary behavior:

- `requestContext()` always assigns `actorId: "demo-actor"`;
- `DevelopmentAgreementAccessPolicy` binds that actor to `party-demo`;
- read and update authorization equate access with `provenance.createdByActorId`;
- repository list scope is actor-based;
- `RequestContext.actorId` is required, so unauthenticated requests cannot be represented distinctly; and
- account, session, participant membership, invitation, and account-state records do not exist.

Sprint 5.4 must replace those assumptions without changing canonical Agreement Language semantics or trusting `Party.roles`, body fields, UI capabilities, URLs, cookies, or headers as authorization by themselves.

## 3. Architecture and trust boundaries

```text
Browser
  → route/HTTP boundary
      → session resolver
          → SessionRepository + AccountRepository
      → authenticated RequestContext
          → AgreementService
              → AgreementAccessPolicy
                  → AgreementMembershipRepository
              → AgreementRepository
```

Responsibilities remain explicit:

- **Transport/routes:** parse cookies and request metadata, enforce origin/CSRF rules, map typed errors, and redirect only browser page requests.
- **Authentication application layer:** sign in, sign out, resolve/refresh sessions, expose a minimal current user, and apply account-state policy.
- **Identity persistence ports:** store development accounts, credential references, and sessions. Initial adapters are cloned, process-local, and disposable.
- **Agreement authorization:** derive agreement scope and actions from authenticated account-to-party membership records and aggregate state.
- **Agreement domain:** remains unaware of cookies, credentials, providers, accounts, sessions, and HTTP.
- **Client UI:** consumes a minimal session projection and server-derived capabilities; it never parses session cookies or decides authority.

Authentication answers “which account controls this session?” Agreement participant binding answers “which agreement party, if any, is represented by this account?” Authorization answers “may that actor perform this action on this resource now?” These must not collapse into one boolean.

## 4. Minimal identity model and ports

Use opaque, unrelated identifiers. Do not reuse email addresses, provider subject identifiers, party IDs, or session tokens as `accountId`.

```ts
type AccountState = "active" | "suspended" | "disabled";

interface Account {
  accountId: string;
  state: AccountState;
  displayName: string;
  primaryEmail?: string; // development sign-in only; not copied into agreements/logs
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

interface AuthIdentity {
  authIdentityId: string;
  accountId: string;
  provider: "local_development" | string;
  providerSubject: string;
  assurance: "development" | "single_factor" | "multi_factor" | "phishing_resistant";
  createdAt: ISODateTime;
}

interface SessionRecord {
  sessionId: string;
  accountId: string;
  tokenDigest: string;
  state: "active" | "revoked" | "expired";
  assurance: AuthIdentity["assurance"];
  createdAt: ISODateTime;
  lastSeenAt: ISODateTime;
  idleExpiresAt: ISODateTime;
  absoluteExpiresAt: ISODateTime;
  revokedAt?: ISODateTime;
  rotation: number;
}

interface CurrentUser {
  accountId: string;
  displayName: string;
  state: AccountState;
  sessionExpiresAt: ISODateTime;
  assurance: AuthIdentity["assurance"];
}
```

`AccountRepository`, `AuthIdentityRepository`, and `SessionRepository` should expose narrow use-case methods rather than a generic identity store. Session lookup accepts only a digest of a validated bearer token. Raw tokens are returned only once by session creation/rotation and are never stored or logged.

An `AuthenticationService` owns `signInDevelopment`, `resolveSession`, `signOut`, and later `revokeAllSessions`. A replaceable `IdentityProviderAdapter` converts a provider-verified result into an internal identity assertion:

```ts
interface VerifiedIdentityAssertion {
  provider: string;
  providerSubject: string;
  verifiedEmail?: string;
  displayName?: string;
  assurance: AuthIdentity["assurance"];
  authenticatedAt: ISODateTime;
}
```

Only a trusted adapter constructs this assertion. Route bodies and headers cannot. The internal account, session, and agreement authorization contracts remain the same when a production passkey or OAuth adapter is introduced.

## 5. Development sign-in strategy

Provide an explicit local-only sign-in page and endpoint backed by a small allowlisted set of deterministic development identities. Prefer account selection or a development-only identifier over a realistic password system: building password storage, reset, email verification, and brute-force defenses solely for a disposable demo would add risk and scope without improving the production path.

Required guards:

- The local adapter is selectable only in an explicit development/test environment and startup fails closed if selected in production.
- No production secret, third-party call, magic-link email, or OAuth redirect is required.
- The sign-in UI clearly says the identity is a local development profile and is not identity verification.
- Arbitrary account creation, caller-selected `accountId`, and impersonation query parameters are not exposed.
- Development identities and session state are cloned/process-local, deterministic in tests, and disposable on restart.
- Any local sign-in mutation is rate-bounded in the route/application seam even though the initial implementation is not production authentication.

No new dependency is justified for this design. Implementation may use Web Platform/Node cryptographic random generation, SHA-256/HMAC primitives, constant-time comparison where applicable, and existing Next.js cookie APIs. Before implementation, read the installed Next.js 16.3 documentation for the exact async cookie and route APIs. If secure token handling cannot be implemented and reviewed with platform primitives, select one narrowly scoped, maintained authentication/session library through a separate dependency review rather than inventing cryptography.

## 6. Session lifecycle and cookie policy

Use an opaque random bearer token in a host-only cookie. The cookie contains no account profile, roles, agreement IDs, provider claims, or authorization data.

Recommended development contract:

- cookie name uses a host-only form such as `__Host-hmm_session` when HTTPS permits; local HTTP uses a clearly development-only fallback name;
- `HttpOnly`, `Path=/`, `SameSite=Lax`, and `Secure` outside local HTTP development;
- no `Domain` attribute;
- a short bounded idle lifetime and a separate absolute lifetime, with exact durations configuration-owned and tested;
- server-side expiry and revocation checks on every resolution;
- bounded renewal only after authentication, never beyond absolute expiry;
- token rotation after sign-in and any future privilege/assurance change;
- deletion of the cookie plus server-side revocation on sign-out;
- session repositories index a digest, not the raw token; and
- responses containing session or current-user data use `Cache-Control: no-store` and must not be shared-cached.

Sign-in never adopts an existing session ID. It creates a fresh session and invalidates any pre-authentication token, preventing session fixation. Rotation must invalidate the old token before or atomically with issuing the new one. Concurrent use of a rotated/revoked token fails as unauthenticated. Process-local development revocation is demonstrative only; production requires durable, cross-instance coordination.

Invalid, missing, expired, revoked, malformed, or unknown tokens resolve to an anonymous principal. They do not reveal which condition occurred externally. Expired-cookie cleanup may be included in the response path, but identity resolution itself should remain read-only and deterministic.

## 7. CSRF and request-origin protection

Because the session is cookie-authenticated, every state-changing browser request requires layered CSRF protection:

- `SameSite=Lax` is a baseline, not the sole defense.
- Reject unsafe methods when `Origin` is missing or does not exactly match the configured application origin; use tightly reviewed development origins only.
- Require a session-bound CSRF token for unsafe authenticated API requests. A synchronizer token may be stored as a digest/reference with the session and sent to the client through a minimal bootstrap response or server-rendered form. Compare it in constant time.
- Sign-in and sign-out are also state-changing and receive origin checks; login CSRF must not be ignored. Because sign-in has no authenticated session yet, protect it with an exact-origin check plus a short-lived, single-use pre-authentication CSRF value bound to the browser interaction (or an equivalently reviewed login-CSRF mechanism), then discard it when issuing the fresh authenticated session. Sign-out uses the authenticated session-bound token.
- GET/HEAD/OPTIONS remain side-effect free. Never sign out, accept invitations, or mutate agreements through GET.
- Do not allow wildcard CORS or credentialed cross-origin API access in this sprint.

The CSRF token is not an identity or authorization credential and must not appear in URLs, logs, analytics, or canonical documents. A future OAuth adapter separately requires provider `state`, PKCE, exact redirect URI validation, and OIDC nonce where applicable; those mechanisms do not replace application CSRF protection after login.

## 8. Request context and server/client access rules

Represent anonymity explicitly at the transport boundary, then require authentication before invoking protected application use cases:

```ts
type Principal =
  | { kind: "anonymous" }
  | {
      kind: "account";
      accountId: string;
      sessionId: string;
      accountState: AccountState;
      assurance: AuthIdentity["assurance"];
    };

interface RequestContext {
  principal: Principal;
  requestId: string;
  correlationId: string;
  source: "api" | "server_page" | "test";
}
```

The session resolver is the only production-shaped path from cookie to `Principal`. After migration, `x-actor-id`, `x-user-id`, request body party IDs, query parameters, and the fixed demo actor are ignored/rejected as identity sources. Tests inject contexts or use a test session helper below the HTTP boundary; they do not add a production-like impersonation header.

Server Components and route handlers may call a server-only `getCurrentUser()`/`requireCurrentUser()` facade. It returns the minimal `CurrentUser`, not the token, session record, provider subject, full account object, or membership list. Client Components receive only the display fields required for the rendered surface. They must call protected server routes for mutations and must not read the `HttpOnly` cookie.

Do not place session-dependent responses in static rendering, shared caches, public revalidation, URLs, serialized debug props, or client storage. Server actions, if introduced later, pass through the same authentication, CSRF/origin, authorization, validation, idempotency, and audit boundaries as route handlers.

## 9. Agreement ownership, membership, and party mapping

Canonical `Party` describes a participant in one version of an agreement. An `Account` describes a product user. The binding is a separate operational record so contact and provider identity are not copied into accepted terms:

```ts
type AgreementMembershipRole = "owner" | "participant" | "reviewer" | "observer";
type AgreementMembershipState = "active" | "pending_invitation" | "revoked";

interface AgreementMembership {
  agreementId: AgreementId;
  accountId?: string;
  partyId: PartyId;
  role: AgreementMembershipRole;
  state: AgreementMembershipState;
  createdAt: ISODateTime;
  createdByAccountId: string;
  activatedAt?: ISODateTime;
  revokedAt?: ISODateTime;
}
```

Rules for the minimal sprint:

- Creating an agreement atomically creates one active `owner` membership linking the authenticated account to the server-selected creator `partyId`.
- An agreement has exactly one active owner in Sprint 5.4. Ownership is operational authority, not an economic side, beneficiary status, proof of authorship, or unilateral authority over accepted outcomes.
- Read/update scope is based on active membership and action policy, not `provenance.createdByActorId`, a canonical role string, or a client capability.
- The owner may update a mutable draft. Other roles are read-only unless a later, explicitly tested action matrix grants draft collaboration.
- Participant account binding must reference a `partyId` present in the relevant agreement and may not silently rewrite canonical parties.
- Every active or pending membership must continue to reference a party in the current draft version. A draft update that removes or replaces a bound party must be rejected until a separate authorized membership/rebinding operation resolves the conflict; updating canonical content must never silently revoke, transfer, or retarget membership.
- At most one non-revoked membership may bind a given account to a given agreement/party tuple, and the single-owner invariant is enforced by the coordinating write boundary rather than inferred from canonical roles.
- Revoked and pending memberships grant no normal agreement access.
- Repository list scope derives from active membership for the account; the repository still cannot perform an unscoped list.
- Existing audit provenance retains the historical actor/account reference even if membership later changes.

Initial action matrix:

| Action | Owner | Active participant | Active reviewer | Observer/pending/revoked |
| --- | --- | --- | --- | --- |
| Create agreement | Account-level permission | Account-level permission | Account-level permission | Pending/revoked membership is irrelevant |
| List/read agreement | Yes | Yes | Yes, if explicitly bound | No |
| Update draft | Yes | No | No | No |
| Manage invitations | Boundary only; implementation may be deferred | No | No | No |
| Transfer ownership | Deferred | No | No | No |
| Accept terms or authorize outcomes | Separate future policy/use case | Separate future policy/use case | No implicit authority | No |

This deliberately conservative matrix is a Sprint 5.4 default. Agreement Language `AuthorizationPolicy`, exact-version acceptance, assurance requirements, lifecycle state, and future step-up checks remain separate gates for consequential operations.

## 10. Invitations and ownership transfer boundaries

The sprint needs a safe model boundary even if the first implementation stops at owner membership.

Invitation records, endpoints, token delivery, and acceptance are not Sprint 5.4 implementation acceptance criteria. The rules below constrain a later implementation and must not cause speculative repositories, routes, UI, or token machinery to be added now.

An invitation is a single-purpose, expiring, revocable operational capability with: opaque invitation ID, agreement/party reference, intended role, destination digest or normalized destination held in restricted storage, token digest, creator, created/expiry/accepted/revoked timestamps, attempt limits, and audit references. The raw token is shown/sent only once. Possession does not sign a user in and does not grant agreement access before acceptance.

Invitation acceptance must be an authenticated POST operation protected by CSRF/origin checks. It verifies the token, invitation state/expiry, authenticated account eligibility, agreement/party consistency, and absence of a conflicting binding, then atomically consumes the invitation and activates membership. The invitation landing GET shows only generic, non-sensitive context until authentication and eligibility checks succeed. Email ownership matching policy and whether invitations may be reassigned require founder approval before production.

Ownership transfer is deferred because it changes recovery and control expectations. Its future operation must require an active owner, eligible active recipient membership, recent/step-up authentication, explicit recipient acceptance, optimistic concurrency or a one-time transfer record, and an atomic swap that never leaves zero or two active owners. It cannot alter canonical party roles, accepted terms, settlement authority, or historical provenance. No “claim ownership by link” behavior is permitted.

## 11. Route protection and error behavior

Route boundaries:

- Public: marketing pages and local-development sign-in UI/POST.
- Authentication-required pages: dashboard, agreement list, create, and agreement detail routes.
- Authentication-required APIs: all `/api/v1/agreements` methods and the minimal current-user/sign-out endpoints.
- Authorization-required: every agreement read/list/mutation after authentication; page guards are usability boundaries, not substitutes for service-level authorization.

Prefer explicit guards in the protected route-group layout/page loaders and API composition over relying solely on broad middleware. Middleware may provide an early redirect, but the application service remains the enforcement point because middleware can be bypassed by internal calls, alternate routes, or configuration drift.

Behavior matrix:

| Condition | Browser page | API |
| --- | --- | --- |
| Missing/invalid/expired session | Redirect to local sign-in with a validated relative return target | `401 AUTHENTICATION_REQUIRED` |
| Suspended account | Dedicated neutral account-unavailable page; no agreement data | `403 ACCOUNT_SUSPENDED` |
| Disabled account | Clear signed-out/account-unavailable path; revoke sessions | `403 ACCOUNT_DISABLED` |
| Authenticated but resource missing or unauthorized | Existing non-disclosing agreement-unavailable page | `404 RESOURCE_NOT_FOUND` |
| Authenticated and known resource but action forbidden | For object mutations, prefer non-disclosing unavailable response unless the user can already read the resource; then `403` may explain the unavailable action without revealing extra data | `403 PERMISSION_DENIED` only after read authorization; otherwise safe `404` |
| Session expires during an edit | Preserve unsent local form state when safe, require sign-in, then refetch current version before submission | `401`; no mutation |

API `401` responses may include `WWW-Authenticate: Session` and always use the existing non-sensitive envelope. Do not redirect APIs to HTML. Return targets must be same-origin relative paths from an allowlist/validator; reject schemes, protocol-relative URLs, backslashes, and cross-origin destinations.

Account state is checked during session resolution and again before high-risk future operations. Suspended/disabled accounts receive no agreement scope. Error logs and metrics use codes and internal correlation IDs, not email, display name, raw session/invitation token, agreement terms, or participant lists.

## 12. Changes to existing boundaries

The implementation should make focused changes:

1. Introduce identity/session application contracts and development-only in-memory adapters.
2. Change `RequestContext` from required `actorId` to a typed `Principal`; agreement services require an account principal.
3. Replace `DevelopmentAgreementAccessPolicy`'s fixed actor map with a membership-backed policy.
4. Replace actor-based repository list scope with an opaque authorization scope derived from active agreement memberships. The repository may receive allowed agreement IDs for the in-memory implementation, but production design should use a join/queryable scope rather than a large client-visible list.
5. Create owner membership atomically with agreement creation. Because Sprint 5.4 remains process-local, a coordinating repository/unit-of-work port must make agreement, membership, idempotency result, and audit effects all-or-nothing. Do not accept a partial agreement with no owner.
6. Record `accountId` as the authenticated actor in provenance/audit while keeping `createdByPartyId` as the canonical creator party. Preserve their distinction.
7. Add stable authentication/account error codes without changing the existing safe object-level 404 behavior.

The minimum implementation slice is one local adapter, narrow account/session ports, authenticated context resolution, owner membership creation, membership-backed list/read/update authorization, protected routes, and the associated negative tests. `AuthIdentityRepository` is needed only if the local adapter actually persists a provider-to-account mapping; invitation and ownership-transfer ports remain absent until those use cases are authorized. This keeps the replaceable-provider seam at the verified-assertion boundary without building a generalized identity framework.

Do not place authentication logic inside the Agreement repository or canonical validator. Do not add a generic dependency-injection framework, global role engine, organization system, or speculative policy language.

## 13. Safe migration from the mock actor

Use a bounded cutover, not a permanent dual identity path:

1. Add tests that freeze the current agreement API behavior apart from authentication.
2. Add deterministic development accounts, sessions, and an explicit `demo-actor` → development `accountId`/creator-party migration mapping inside seed/composition code only.
3. Introduce the session resolver and authenticated context while the old fixed actor path remains behind a named, test-only compatibility adapter.
4. Backfill/seed owner membership for each existing in-memory demo aggregate using its trusted provenance and known party binding. Ambiguous records fail closed and are omitted from account scope; do not guess ownership from display names.
5. Switch pages and APIs to session-derived identity and membership-backed authorization.
6. Remove the fixed `actorId: "demo-actor"` route behavior and reject/ignore all actor impersonation headers.
7. Remove the compatibility adapter after contract and negative tests pass.

The in-memory store is disposable, so no end-user data migration is promised. Migration mapping exists only to preserve deterministic fixtures during development. Future durable migration requires an explicit, reviewable script, dry-run report, conflict handling, rollback/roll-forward plan, and audit record.

## 14. Audit, provenance, privacy, and observability

Audit hooks should cover:

- development sign-in success/failure category, sign-out, session creation/rotation/revocation/expiry;
- account-state denial;
- owner membership creation, invitation creation/acceptance/revocation if implemented, and future ownership transfer;
- agreement access denial aggregates and every successful agreement mutation; and
- old/new membership or session references where needed, using non-sensitive opaque IDs.

Security events and domain activity records may share correlation IDs but should remain separate streams/contracts. Authentication telemetry failure after a committed sign-in/session mutation must not create a false failure response; required security audit persistence becomes transactional in the future durable adapter.

Data minimization:

- Keep provider claims and credentials outside agreements, memberships, URLs, analytics, and general logs.
- Do not copy email addresses into canonical parties, agreement provenance, cursors, idempotency scope, or audit explanations.
- Return only `CurrentUser` fields needed by the UI.
- Hash/digest session and invitation tokens with domain separation; never log raw values.
- Avoid IP address and user-agent persistence by default. If future abuse detection needs them, define purpose, access, retention, truncation/pseudonymization, and legal review first.
- Use generic sign-in failure text that does not enumerate accounts.
- Keep agreement list cursors bound to account authorization scope without encoding membership or identity details.
- Private agreement data is never used for model training by default.

Retention, export, deletion, legal hold, audit access, breach response, and production security-event retention remain unresolved policy decisions. Disabling an account must not silently erase agreement history or other participants' legitimate records; privacy deletion needs a later policy-aware workflow.

## 15. Security considerations

- Generate high-entropy opaque tokens with a cryptographically secure generator; never use sequential IDs or `Math.random()`.
- Bound cookie, CSRF, provider callback, invitation, return-path, and identifier lengths before processing.
- Prevent timing-sensitive token comparison where application code compares secrets.
- Apply CSP, output encoding, and existing React/Next.js protections; XSS can still perform authenticated actions even when cookies are `HttpOnly`.
- Never put bearer tokens in URLs, fragments, local/session storage, source maps, errors, or telemetry.
- Rate-limit sign-in, provider callback, invitation acceptance, and session creation before production; process-local limits are not sufficient for distributed deployment.
- Revoke sessions on disabled accounts and future credential compromise/password reset. Production design needs “sign out all devices” and session visibility.
- Treat provider profile fields, OAuth errors, invitation labels, and return paths as untrusted input.
- Preserve `If-Match`, idempotency, validation, and authorization checks after session integration; authentication does not replace any of them.
- Require recent or stronger authentication for future ownership transfer, acceptance with elevated consequences, credential changes, and financial actions.
- Complete threat modeling, dependency review, secret management, secure headers, monitoring, incident response, and penetration testing before production use.

## 16. Test strategy

### Authentication unit and contract tests

- Valid local profile creates a fresh session; unknown/disabled profiles fail generically.
- Tokens are random, stored only as digests, bounded, and compared safely.
- Missing, malformed, unknown, expired, revoked, and rotated tokens resolve anonymous.
- Idle and absolute expiry, bounded renewal, sign-out, account suspension/disablement, rotation, and concurrent old-token use behave deterministically with injected clock/ID/token generators.
- Production configuration cannot select local development authentication.
- Provider assertion mapping cannot be constructed from request fields.

### CSRF and redirect tests

- Unsafe requests reject absent/mismatched Origin and absent/incorrect/session-mismatched CSRF tokens without mutation.
- Sign-in and sign-out receive login-CSRF protection; GET methods never mutate.
- Same-origin valid requests work.
- Cross-origin, protocol-relative, encoded, backslash, and scheme-bearing return paths are rejected.

### Authorization and ownership tests

- Agreement creation produces exactly one active owner binding and attributable audit record atomically.
- Owner can list/read/update a mutable draft; unrelated, pending, revoked, observer, participant, and reviewer contexts follow the action matrix.
- Active participants/reviewers can read only explicitly bound agreements.
- Canonical party roles, body `partyId`, capabilities, mock `currentUserParticipantId`, actor headers, and possession of an ID/link never grant access.
- Unknown and unauthorized reads are externally indistinguishable; known readable resources may return a safe action-level 403.
- Suspended/disabled accounts receive no agreement scope.
- Membership changes invalidate cursor scope and do not rewrite historical provenance.
- Invitation acceptance, if implemented, is single-use, expiring, atomic, account-bound, and cannot create conflicting party bindings.

### Route, UI, and integration tests

- Public routes remain available; every protected page/API denies anonymous requests appropriately.
- APIs return JSON 401/403/404 rather than redirects; page redirects preserve only validated relative return paths.
- Current-user responses expose no token, provider subject, email unless explicitly required, or membership inventory.
- Session-dependent responses are `no-store`; cookies have expected flags in local and production-shaped configuration.
- Session expiry during draft editing causes no write; reauthentication requires a fresh fetch and existing `If-Match` recovery.
- Existing agreement validation, pagination, cursor tamper rejection, idempotency, audit, stale-write, API contract, UI compatibility, lint, typecheck, test, and build checks remain green.

Use injected clocks, token generators, and isolated repositories. Do not depend on wall-clock sleeps or a live OAuth provider. Add no testing dependency unless the existing Node/Next.js facilities cannot express a concrete security contract.

## 17. Future production provider integration

Keep provider-specific code at the outer adapter. A production selection may support passkeys directly, an OpenID Connect/OAuth provider, or both. Provider evaluation must cover phishing resistance, account recovery, MFA/step-up, session/revocation hooks, verified-email semantics, organization support, audit exports, data residency, incident history, accessibility, cost, lock-in, and operational ownership.

Integration sequence:

1. Approve provider, jurisdictions, identity assurance, recovery, retention, and threat model.
2. Add production secrets through approved secret management; never commit them or expose them to the browser beyond public client identifiers.
3. Implement exact callback allowlists, authorization code + PKCE, state, OIDC nonce where applicable, issuer/audience/signature/time validation, and provider error handling using reviewed libraries.
4. Map the verified provider subject to `AuthIdentity` and internal `Account`; never key accounts by mutable email alone.
5. Issue the same internal session contract or adopt a provider-managed session behind the same resolver interface.
6. Run contract, negative-security, accessibility, migration, revocation, recovery, load, and incident-response tests in a non-production environment.
7. Roll out explicitly with monitoring and rollback; never silently enable local authentication in production or dual-accept unverified headers.

Passkeys are preferred as a phishing-resistant future method where product and recovery research support them. They require WebAuthn challenge/origin/RP-ID verification and careful recovery design; this sprint does not implement a simplified version.

## 18. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Development sign-in is mistaken for production security | Environment guard, explicit UI language, fail-closed production composition, no identity-verification claims. |
| Cookie sessions introduce CSRF or fixation | Origin validation, session-bound CSRF token, fresh token on sign-in/privilege change, server revocation, safe cookie flags. |
| Authentication is confused with authorization | Separate principal, membership, access policy, and canonical authorization policy; service-level checks remain mandatory. |
| Owner gains unintended outcome authority | Owner controls draft administration only; acceptance and consequential authorization remain exact-version policy gates. |
| Email/provider data leaks into agreements or logs | Internal opaque IDs, separate identity records, minimal projections, redacted structured telemetry. |
| Invitation links become bearer access to agreements | Single-purpose digest, expiry/revocation, authenticated POST acceptance, no pre-acceptance resource access. |
| Account state or authorization reveals agreement existence | Authenticate first, deny scope for inactive accounts, retain safe object-level 404 behavior. |
| In-memory sessions appear durable or secure across workers | Label disposable, deterministic adapter; require durable transactional storage before production. |
| Membership and agreement writes diverge | Coordinating unit-of-work contract and atomic tests; future database transaction/outbox. |
| Session expiry causes stale or lost agreement edits | Preserve local unsent input where safe, reauthenticate, refetch, and require current `versionId`; never replay blindly. |
| Provider abstraction becomes speculative | Keep one verified-assertion adapter and narrow repositories; defer provider-specific features until selection. |

## 19. Founder decisions

No founder decision is required to approve this documentation-only design or a development-only implementation that uses the conservative defaults above and remains unavailable in production.

Founder approval is genuinely required before production authentication or broader ownership features for:

- production identity provider(s), passkey/OAuth mix, supported account types, recovery model, MFA/step-up requirements, and assurance shown to users;
- invitation eligibility and reassignment rules, including whether verified email must match the invitation destination;
- ownership transfer, co-ownership, organization ownership, delegated roles, support-assisted recovery, and the exact action matrix;
- suspended/disabled account appeals, emergency access/revocation, compromised-account response, and support authority;
- retention, deletion, export, legal hold, security-event/audit access, provider data residency, and privacy notices/consent; and
- production session/CSRF lifetimes, trusted origins, rate limits, monitoring, incident response, jurisdiction, and operational ownership.

These decisions should be made before production provider integration, not encoded accidentally into the local adapter.

## 20. Implementation acceptance criteria

When Sprint 5.4 runtime implementation is separately authorized, it is complete only when:

- all protected pages and agreement APIs derive identity from a validated server session;
- the fixed demo actor and any actor impersonation header are absent from runtime identity resolution;
- anonymous, suspended, disabled, unauthorized, and expired-session behavior matches the documented matrix;
- sign-in, sign-out, rotation, expiry, cookie, origin, CSRF, fixation, redirect, and no-store contracts are tested;
- agreement creation atomically establishes owner membership, idempotency, and attributable audit effects;
- list/read/update authorization uses active account-to-party membership and the conservative action matrix;
- canonical party roles, client fields, and capability hints cannot grant authority;
- local authentication fails closed outside development/test and makes no production-security claim;
- existing concurrency, validation, privacy, pagination, idempotency, compatibility, and audit guarantees remain intact;
- focused tests plus repository test, lint, typecheck, build, `git diff --check`, and documentation consistency review pass; and
- no PostgreSQL/Prisma, production credentials, KYC/AML, real-money, production AI/MCP, or settlement capability is introduced.
