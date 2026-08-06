# Human Made Money

> The trust layer for human agreements.

Human Made Money is an agreement-centered product for turning human promises into clear, shared, and inspectable processes. The long-term platform is intended to help people define terms, accept responsibilities, collect evidence, verify outcomes, and resolve commitments—with optional financial protection when an agreement involves money.

Escrow and AI-assisted verification are supporting capabilities, not the whole product. Not every agreement needs funds, and AI must support explainable human decisions rather than act as an invisible authority.

## Current state

Human Made Money is in early development. The repository currently contains:

- a working public marketing site;
- a reusable web UI foundation;
- an agreement-first product, design, architecture, and engineering specification;
- a pnpm/Turborepo workspace prepared for future apps, services, and shared packages.

The Agreement Engine, user accounts, API services, database, evidence and verification workflows, escrow, funding, and settlement are roadmap work—not current production capabilities. All monetary examples and development flows must use simulated funds. No real funds are held, moved, or settled by this repository today.

## Product direction

The Agreement is the central domain object. Planned supporting capabilities include identity and access, evidence, verification, optional escrow/protection, intent monitoring, settlement, notifications, and audit history.

The intended lifecycle is broadly:

```text
Draft → Review → Accepted → Protected or active → In progress
      → Verification → Decision → Resolution → Closed
```

Cancellation, expiry, amendment, insufficient evidence, and dispute are first-class paths. See [`docs/product-bible.md`](docs/product-bible.md) for the product source of truth and [`docs/03-roadmap.md`](docs/03-roadmap.md) for directional roadmap context.

## Architecture

This is a TypeScript monorepo managed with pnpm workspaces and Turborepo.

### Implemented today

- **Web:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, and shadcn/base-ui components.
- **Tooling:** pnpm 11 and Turborepo 2.
- **Application:** a statically buildable marketing experience in `apps/web`.

### Planned, not implemented

The architecture documents describe an Agreement Engine at the center, with separate evidence, verification, escrow/protection, dynamic intent, settlement, identity, and notification responsibilities. Backend services, PostgreSQL/Prisma persistence, authentication, cloud infrastructure, payment providers, and AI orchestration are design decisions or roadmap targets until working code lands.

Read [`docs/04-architecture.md`](docs/04-architecture.md), [`docs/07-database-model.md`](docs/07-database-model.md), and [`docs/08-api-architecture.md`](docs/08-api-architecture.md) for those intended boundaries. Documentation must always distinguish implemented behavior from future architecture.

## Repository structure

```text
.
├── apps/
│   └── web/              # Current Next.js marketing application
├── packages/             # Reserved for shared workspace packages
├── services/             # Reserved for backend/domain services
├── database/             # Reserved for schemas and migrations
├── infrastructure/       # Reserved for deployment infrastructure
├── scripts/              # Reserved for repository automation
├── assets/               # Shared product assets
├── docs/                 # Product, design, architecture, and engineering sources
├── AGENTS.md             # Repository-wide human/AI contributor guidance
├── pnpm-workspace.yaml   # Workspace membership
└── turbo.json            # Task orchestration
```

Reserved directories may be empty. Their presence expresses the intended monorepo boundary, not an implemented service.

## Local setup

### Prerequisites

- Node.js 22.13.0 or newer
- pnpm 11.20.0 or newer

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Turborepo starts the workspace development tasks. The current web app is then available at [http://localhost:3000](http://localhost:3000).

To run only the web application:

```sh
pnpm --filter web dev
```

No database, production credentials, payment account, or cloud access is required for the current site.

## Validation

Run the repository baseline from the root:

```sh
pnpm build
pnpm lint
pnpm typecheck
```

Confirm that pnpm recognizes every workspace package with:

```sh
pnpm list --recursive --depth -1
```

During development, narrower checks can target the web workspace:

```sh
pnpm --filter web build
pnpm --filter web lint
pnpm --filter web typecheck
```

## Contributor and Codex workflow

Before changing the project, read [`AGENTS.md`](AGENTS.md) and the task-relevant sections of:

- [`docs/product-bible.md`](docs/product-bible.md)
- [`docs/design-bible.md`](docs/design-bible.md)
- [`docs/engineering-playbook.md`](docs/engineering-playbook.md)

Contributors and local coding agents should:

1. inspect repository guidance, current code, and working-tree status before editing;
2. keep changes small, reversible, and centered on the requested outcome;
3. preserve unrelated or uncommitted work;
4. use repository-native commands and run relevant checks plus the root baseline;
5. review the final diff and report changed files, validation results, and limitations;
6. commit, push, deploy, or migrate data only when the user explicitly requests it.

Local agents are scoped to read/write access within this repository. Terminal commands and network access should be limited to the task and approval-based when they reach beyond normal local repository work. Do not request full-disk, administrator, or unrelated personal-file access.

Never place production secrets, credentials, customer data, payment-provider production keys, or production database URLs in prompts, source files, logs, fixtures, or commits. Use documented development placeholders and simulated funds only. Do not connect to, mutate, deploy, or migrate production systems without explicit authorization and an appropriate reviewed workflow.

## Status

🚧 Early development. The current marketing site is buildable; product workflows and financial capabilities are not yet implemented.
