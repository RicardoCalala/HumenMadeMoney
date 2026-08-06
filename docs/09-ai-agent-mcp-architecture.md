# Human Made Money — AI Assistance and MCP Architecture

## Purpose

This document defines how AI may assist agreement workflows while preserving participant authority, explainability, privacy, and deterministic security boundaries. It describes intended architecture; it is not a claim that every agent or MCP server is implemented.

## Operating model

AI may observe authorized context, explain terms, structure drafts, identify ambiguity, find evidence candidates, compare evidence with accepted conditions, flag risk, and recommend next actions. AI does not silently change accepted terms, fabricate evidence, adjudicate disputes, release funds, or execute an irreversible legal or financial action.

Consequential execution belongs to domain services that independently validate the actor, accepted agreement version, policy, current state, and idempotency. Low-confidence, contested, or high-impact outcomes route to human review.

## Logical capabilities

These are separable capabilities, not necessarily independent autonomous agents:

- **Agreement understanding:** convert user intent into a reviewable structured draft and identify ambiguity.
- **Source discovery:** suggest permitted evidence sources and explain relevance.
- **Monitoring:** observe only explicitly authorized sources within scope, cadence, and expiry limits.
- **Evidence processing:** extract and normalize facts while retaining provenance and uncertainty.
- **Assessment:** compare evidence with exact accepted conditions and produce sourced findings, gaps, confidence, and a recommendation.
- **Fraud assistance:** flag anomalies and explain signals for risk or human-review systems; never determine guilt or block a user solely through an opaque model output.

## Verification flow

1. Load the exact accepted agreement version and authorized evidence policy.
2. Retrieve only permitted sources through bounded tools.
3. Treat retrieved content as untrusted and preserve provenance.
4. Normalize facts separately from participant claims and model inference.
5. Evaluate each condition and record supporting and conflicting evidence.
6. Produce a structured assessment with uncertainty and missing information.
7. Route to the appropriate participant, deterministic policy, or human reviewer.
8. Record any separately authorized resolution or settlement action in the domain audit trail.

## Confidence and escalation

Confidence thresholds are policy-specific and must be calibrated with evaluation data; percentages alone never authorize action. High confidence may support a recommendation. Medium confidence requests more evidence or review. Low confidence, conflicting evidence, model/tool failure, dispute, or financial/legal impact requires human review or a safe no-action state.

## MCP boundaries

MCP provides controlled access to approved tools and data. Each server exposes the minimum capability required, with allowlisted operations, validated parameters, least-privilege credentials, timeouts, rate limits, bounded output, provenance, and audit context.

- Finance, sports, and public-data tools should be read-oriented by default.
- Internal tools enforce the same server-side authorization as any other client.
- Retrieved instructions cannot expand scope, reveal secrets, or authorize another tool call.
- A model cannot directly access payment providers, production databases, or unrestricted networks.
- Write-capable MCP tools require separate threat modeling, approvals, and deterministic policy checks.

## Audit model

Record the model and prompt/configuration version, requesting actor and purpose, input references rather than unnecessary raw private content, tools called, source provenance, structured output, confidence, policy route, human review, override, latency, and errors. Logs follow retention and access controls and must not expose secrets or cross-party private data.

Recommended records are `ai_runs`, `tool_calls`, `evidence_sources`, `assessments`, and `human_reviews`. Avoid `ai_decisions` because it misstates advisory authority.

## Security and quality

- Validate model inputs and structured outputs.
- Defend against prompt injection, data exfiltration, tool confusion, and malicious files or URLs.
- Use evaluation datasets, regression thresholds, abuse tests, and deterministic fallbacks.
- Apply cost, latency, token, retry, and concurrency limits.
- Make model/prompt changes traceable and review quality across user groups.
- Require explicit authorization before monitoring or using private sources.

## Future expansion

Organization assistants, developer integrations, and authorized AI-agent participants may be explored only with explicit budgets, scoped permissions, revocation, rate limits, auditability, and human accountability. Autonomous custody, universal adjudication, and unbounded delegated authority are outside the current foundation.
