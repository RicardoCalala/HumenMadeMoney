# Human Made Money — Security Architecture

## Purpose

Define security boundaries for the trust layer for human agreements. This document states required design properties and must distinguish implemented controls from intended future controls.

## Principles

1. **Zero trust:** authenticate and authorize every actor and service request; network location is not trust.
2. **Least privilege:** grant the smallest scoped permission for the shortest practical time and default deny.
3. **Defense in depth:** combine identity, authorization, validation, encryption, monitoring, reconciliation, and recovery.
4. **Explicit consequences:** financial and lifecycle mutations require clear policy, confirmation, idempotency, and audit context.
5. **Privacy by design:** minimize data, access, retention, and exposure.
6. **AI is untrusted assistance:** model and retrieved outputs never bypass deterministic controls.

## Trust boundaries

- Client applications are untrusted and cannot enforce authorization alone.
- Domain services own agreement, evidence, verification, protection, intent, and settlement policy.
- External identity, payment, model, and data providers are unreliable and potentially compromised dependencies.
- Queues, webhooks, files, URLs, and retrieved content require validation, authentication where applicable, replay defense, and bounded processing.

## Core controls

### Authentication and authorization

Use secure sessions, verified recovery, MFA or step-up authentication for sensitive actions, centralized server-side policy, resource ownership checks, scoped service identities, rotation, and access review.

### Data protection

Classify and minimize data; encrypt in transit and protect sensitive data at rest; keep secrets outside source and logs; use short-lived file access; define retention/deletion; redact structured logs; and test restoration.

### Application and infrastructure

Validate at trust boundaries, apply rate and size limits, protect against injection and CSRF as applicable, scan uploads, review dependencies, isolate environments, patch supported software, and monitor privileged actions. Production access requires separate authorization and is not granted by this documentation.

### Money movement

Before any real-money capability, complete legal, compliance, security, and operational review. Use provider-side controls, signed webhooks, replay protection, idempotency, explicit currency/minor units, step-up confirmation, reconciliation, alerts, holds, and incident recovery. AI cannot directly hold, transfer, release, refund, or settle funds.

### AI and MCP

Treat prompts, models, tool outputs, and retrieved content as untrusted. Use allowlisted tools, validated structured inputs/outputs, least-privilege credentials, data-loss controls, provenance, evaluation, abuse testing, and human review for uncertain or high-impact outcomes. Prompt injection cannot expand permissions.

## Audit and observability

Record attributable lifecycle transitions, permission changes, evidence access, assessment runs, tool calls, review outcomes, provider callbacks, settlement attempts, and administrative actions. Protect log integrity and access, minimize payloads, use correlation identifiers, and define alerts with owned response playbooks.

## Threat model baseline

At minimum consider broken authorization, account takeover, confused deputy behavior, forged acceptance, malicious evidence, prompt injection, data leakage, replayed webhooks, duplicate settlement, race conditions, provider outage, insider access, denial of service, and failed recovery.

## Security goal

Enable understandable, auditable agreement workflows with safe failure modes and human accountability. Automation may assist bounded operations, but it never removes the need for explicit authority, review, reconciliation, or recovery.
