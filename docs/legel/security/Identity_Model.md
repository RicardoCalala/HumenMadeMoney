# Human Made Money — Identity Model

## Purpose

Identity assurance should match the risk of the requested capability. Verification is not a universal prerequisite and a “trust level” must not become an unexplained reputation verdict.

## Assurance levels

### Visitor

May view public information and begin a local or anonymous draft where supported. No authority to accept or mutate an agreement.

### Registered account

Has a verified contact method and authenticated session. May create drafts, receive invitations, and perform low-risk actions subject to authorization and abuse controls.

### Capability-verified participant

Has completed the identity or ownership checks required for a specific higher-risk capability, such as organization administration or a regulated payment flow. Record verification purpose, provider reference, method, time, result, expiry, and minimal necessary attributes.

### Delegated or organization actor

Acts under explicit role, scope, and expiry. Organization membership does not replace agreement-level consent or permit access beyond the delegated purpose.

These levels describe assurance and permissions, not moral trustworthiness. Higher verification does not guarantee honest behavior or agreement performance.

## Authentication and authorization

Support secure session-based authentication and appropriate recovery. Add MFA/passkeys and step-up authentication for sensitive actions. Centralize authorization policy, enforce it server-side, default deny, and evaluate participant role, organization role, agreement version, lifecycle state, and action risk.

Authorized AI agents, if introduced later, require a sponsoring principal, explicit scopes, budgets, expiry, revocation, rate limits, and audit history. They do not inherit human identity or unrestricted authority.

## Privacy and safety principles

- Collect and retain the minimum identity data required for a declared purpose.
- Keep provider credentials and raw sensitive documents out of general application records and logs.
- Separate identity claims, provider facts, participant assertions, and risk inference.
- Provide correction, recovery, and appeal paths.
- Threat-model account takeover, impersonation, confused deputy behavior, enumeration, and insider access.
- Complete legal and compliance review before regulated identity or payment use in a jurisdiction.
