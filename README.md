# Human Made Money

> The trust layer for human agreements.

Human Made Money is an agreement-centered product for turning human promises into clear, shared, and inspectable processes. The long-term platform is intended to help people define terms, accept responsibilities, collect evidence, verify outcomes, and resolve commitments—with optional financial protection when an agreement involves money.

Escrow and AI-assisted verification are supporting capabilities, not the whole product. Not every agreement needs funds, and AI must support explainable human decisions rather than act as an invisible authority.

## Current state

Human Made Money is in early development. The repository currently contains:

- a working public marketing site;
- a reusable web UI foundation;
- an agreement-first product, design, architecture, and engineering specification;
- a pnpm/Turborepo workspace with local/test PostgreSQL persistence behind existing application ports.

The current agreement and development-authentication slice can use disposable in-memory stores or local/test PostgreSQL. This is not production hosting or production authentication. Evidence and verification workflows, escrow, funding, and settlement remain roadmap work. All monetary examples and development flows use simulated funds; no real funds are held, moved, or settled.

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
- **Application:** agreement APIs and local development authentication in `apps/web`.
- **Persistence:** explicitly selected in-memory or PostgreSQL/Prisma adapters for local and test use.

### Planned, not implemented

The architecture documents describe an Agreement Engine at the center, with separate evidence, verification, escrow/protection, dynamic intent, settlement, identity, and notification responsibilities. Production authentication, cloud infrastructure, payment providers, and AI orchestration remain later decisions.

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

The default adapter is `in_memory`, so no database, production credentials, payment account, or cloud access is required.

### Optional local PostgreSQL persistence

Copy the names from `.env.example` into an ignored `.env.local` and use a fresh local signing secret. Then:

```sh
docker compose up -d postgres
DATABASE_URL="postgresql://hmm:hmm_local_only@127.0.0.1:5432/hmm_local?schema=public" pnpm --filter web db:migrate
DATABASE_URL="postgresql://hmm:hmm_local_only@127.0.0.1:5432/hmm_local?schema=public" pnpm --filter web db:seed
HMM_PERSISTENCE_ADAPTER=prisma pnpm --filter web dev
```

The Prisma adapter fails closed when configuration or PostgreSQL is unavailable; it never dual-writes or falls back to memory. Migrations are forward-only. The seed is deterministic and contains only synthetic `.invalid` accounts. The reset command refuses non-local hosts and database names without a distinct `test` or `local` segment:

```sh
TEST_DATABASE_URL="postgresql://hmm:hmm_local_only@127.0.0.1:5432/hmm_test?schema=public" pnpm --filter web db:reset:test
```

To run PostgreSQL contract tests, create the dedicated `hmm_test` database, apply the checked-in migration to it, then provide `TEST_DATABASE_URL` to `pnpm --filter web test:postgres`. These local/test facilities do not select a production host, credentials model, retention policy, backup plan, or operating topology.

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
