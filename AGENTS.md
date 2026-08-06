# Human Made Money — Repository Guidance

## Product north star

Human Made Money is **the trust layer for human agreements**. It helps people create clear agreements, establish shared evidence, protect commitments, verify outcomes, and settle with confidence.

Escrow is one core capability within that trust layer. Do not position escrow as the entire company, assume every agreement requires funds, or reduce the product to a payment flow.

## Required reading

Before product, design, architecture, or runtime work, read the sections relevant to the task in:

- `docs/product-bible.md` — product vision, philosophy, users, journeys, AI policy, success measures, and roadmap.
- `docs/design-bible.md` — experience hierarchy, language, interaction patterns, accessibility, and design-system rules.
- `docs/engineering-playbook.md` — engineering workflow, AI/Codex practice, security, quality, validation, and operations.

Also follow the nearest scoped `AGENTS.md` and the applicable architecture, data, API, and roadmap documents. If guidance conflicts, surface the conflict and use the precedence defined in the Engineering Playbook.

## Product language

- Lead with agreements, trust, clarity, evidence, and confident execution.
- Describe AI as guidance and verification support. Keep consequential decisions explainable and preserve human review for uncertain outcomes.
- Describe escrow as an optional protection mechanism used when an agreement includes money.
- Avoid claims that imply autonomous legal judgment, guaranteed outcomes, or regulated capabilities that have not been implemented.
- Prefer plain, calm language over financial jargon or hype.

## Engineering priorities

- Preserve the agreement engine as the product center; escrow, verification, intent, and settlement are supporting capabilities.
- Favor small, reversible changes and existing patterns over new abstractions or dependencies.
- Keep security, auditability, privacy, accessibility, and explainability visible in design decisions.
- Inspect and preserve uncommitted work; do not overwrite unrelated changes.
- Do not redesign architecture while making copy, documentation, or design-system changes.
- Run the checks relevant to the affected workspace and report any checks that could not be run.
- Do not commit, push, deploy, or migrate external data unless explicitly requested.

For `apps/web`, also follow its local `AGENTS.md`, including the generated Next.js guidance block.
