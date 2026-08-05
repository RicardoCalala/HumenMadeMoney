# Architecture

This document describes the high-level architecture for Human Made Money. It outlines components, data flows, security considerations, and scaling strategies to help engineers and stakeholders understand how the system is organized.

## High-level components

- Web Client (Browser / Mobile)
  - React/Next.js or similar SPA for user-facing flows: account management, agreement creation, dashboards, dispute review.

- API Layer
  - REST/GraphQL API that serves the frontend and third-party integrations. Handles authentication, authorization, business logic, and orchestration.

- Core Escrow Service
  - Responsible for agreement lifecycle: create agreement, manage participants, accept deposits, lock/unlock funds, and execute settlements.
  - Ensures atomic changes with transactional guarantees and audit logs.

- Payments & Custody
  - Integrations with payment processors (Stripe, Plaid for ACH, fiat on/off ramps) and custody providers for secure fund storage.
  - Handles multi-currency support and reconciliation.

- Verification & Oracle Layer
  - Trusted data integrations (price feeds, public APIs, block explorers, webhooks) that provide verifiable signals.
  - Oracles that normalize and sign events used for automated resolution.

- AI Verification Engine
  - Uses language models and domain-specific pipelines to summarize evidence, extract facts, and produce explainable recommendations.
  - Runs in a sandboxed environment with deterministic prompts, tooling to fetch evidence, and human-review fallbacks for uncertain outcomes.

- Automation & Rules Engine
  - Declarative rules and triggers that map agreement terms to monitorable conditions and resolution actions.
  - Executes settlement actions when conditions are met or when manual review approves them.

- Notification & Webhooks
  - Sends user notifications (email, SMS, in-app) and emits webhooks for partner integrations and developer APIs.

- Data & Audit Logs
  - Immutable audit trail for all agreement state transitions, evidence, and AI outputs.
  - Event store or append-only log for forensic capabilities and compliance.

- Jobs & Workers
  - Background workers for monitoring, payouts, reconciliation, and async tasks. Scalable via queues.

- Admin & Reviewer Tools
  - Interfaces for human reviewers to inspect evidence, override automated decisions, and manage disputes.

## Data flow (typical escrow lifecycle)

1. User creates agreement via Web Client → API validates and persists agreement.
2. Participants invited; deposit requests issued via Payments integration.
3. Funds received and marked as locked in escrow (on-chain or custody provider).
4. Verification engine monitors trusted sources according to agreement rules.
5. When a trigger occurs, Rules Engine evaluates conditions and instructs Core Escrow Service to execute settlement.
6. Actions are recorded in the Audit Log and notifications are sent to participants.
7. If the resolution is ambiguous, the case is routed to human reviewers with AI summaries.

## Security & Compliance

- Principle of least privilege for services and keys.
- Strong authentication (MFA) and role-based access control for admin/reviewer tools.
- End-to-end encryption for sensitive fields and secrets in transit and at rest.
- Secure key management (KMS) for signing oracle events and accessing custody APIs.
- Regular audits, monitoring, and alerting for suspicious activity and reconciliation mismatches.
- Privacy controls: minimize PII storage, retention policies, and legal-compliance workflows for KYC/KYB when required.

## Scalability & Reliability

- Stateless API servers behind load balancers; scale horizontally.
- Worker queues (e.g., Redis, SQS) for background processing; support autoscaling.
- Use managed databases with read-replicas for scaling reads; partition or sharding for very large datasets.
- Caching layer (Redis) for hot reads and rate-limiting.
- Circuit breakers and graceful degradation for external data sources and payment providers.
- High-availability configuration for payments and custody critical paths.

## Observability

- Structured logging, distributed tracing (e.g., OpenTelemetry), and metrics (Prometheus/Grafana).
- Audit logs stored immutably for compliance and forensic analysis.
- Health checks, synthetic monitoring for external integrations, and alerting for SLA breaches.

## Deployment & Infrastructure

- Infrastructure-as-Code (Terraform) for reproducible environments.
- CI/CD pipelines for testing, security scans, and controlled releases to staging/production.
- Blue/green or canary deployments for safe rollouts.
- Secrets management via KMS/secret manager and short-lived credentials for services.

## Extensibility

- Plugin-style connectors for new oracle/data sources and payment providers.
- Clear API contracts and webhook events for partner integrations.
- Modular rules engine with a domain-specific language (DSL) for expressing common agreement conditions.

## Open questions / Next steps

- Decide custody model: full custody vs. partner custody vs. on-chain multisig.
- Define the oracle signing and trust model for attesting external events.
- Determine the level of AI explainability required for regulatory compliance.
- Design the data retention and audit export processes for legal requests.

