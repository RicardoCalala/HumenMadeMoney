# Human Made Money — Fraud Prevention Framework

## Purpose

Reduce abuse across accounts, agreements, evidence, identity, and money movement while preserving due process, privacy, and a review path. This is a control framework, not a claim that every control is implemented.

## Risk areas and controls

### Account and identity abuse

Consider credential stuffing, account takeover, synthetic or duplicate identity, session theft, and privilege escalation. Use secure sessions, rate limits, anomaly detection, verified recovery, step-up authentication, least privilege, and access logging proportionate to risk.

### Agreement manipulation

Protect against hidden amendments, forged acceptance, coercion, collusion, replayed actions, and unauthorized lifecycle changes through immutable version references, explicit acceptance, attributable events, server-side authorization, idempotency, and dispute/appeal paths.

### Evidence abuse

Treat uploads, URLs, retrieved content, metadata, and participant claims as untrusted. Apply file limits and malware controls, preserve provenance and timestamps, detect tampering where possible, separate facts from claims and inference, and restrict cross-party visibility.

### Payment and settlement fraud

Use provider verification, signed webhooks, replay defense, idempotency keys, velocity and amount controls, step-up confirmation, dual control where appropriate, reconciliation, holds, and incident procedures. No current documentation authorizes real-money custody or transfer without reviewed legal, compliance, security, and operational controls.

## AI-assisted risk signals

AI may flag anomalies, cluster related signals, summarize evidence, and recommend review. Outputs must identify sources, uncertainty, model/configuration version, and limitations. An opaque score must not alone determine guilt, permanently restrict an account, or execute/refuse settlement. High-impact outcomes require an authorized human or reviewed deterministic policy, with correction and appeal routes.

## Human review and operations

Reviewers need least-privilege access, reason codes, evidence provenance, conflict-of-interest controls, escalation, and auditable overrides. Monitor false positives and disparate impact. Maintain playbooks for containment, user communication, recovery, provider coordination, and legally required reporting.
