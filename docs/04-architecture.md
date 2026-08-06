# Human Made Money Architecture Update

## Core Systems

Human Made Money is an agreement-centered trust layer composed of several core engines. The Agreement Engine is the product center; escrow, intent, verification, and settlement support different agreement needs.

## 1. Agreement Engine

Responsible for:

* Creating agreements
* Defining conditions
* Managing participants
* Tracking lifecycle states

---

## 2. Escrow Engine

Responsible for:

* Holding funds
* Locking transactions
* Releasing payments
* Maintaining audit trails

---

## 3. Dynamic Intent Engine

Responsible for:

* Monitoring future conditions
* Tracking commitments
* Activating funding requirements
* Triggering escrow events

Lifecycle:

CREATED

↓

MONITORING

↓

TRIGGERED

↓

FUNDING REQUIRED

↓

FUNDED

↓

SETTLED

↓

EXPIRED

---

## 4. AI Verification Engine

Responsible for:

* Finding trusted sources
* Collecting evidence
* Evaluating outcomes
* Generating explanations
* Determining confidence

---

## 5. Settlement Engine

Responsible for:

* Final payout execution
* Transaction records
* Notifications
* Compliance logging

The future execution path is AI/MCP evidence assessment, proposed resolution, configurable review window (24 hours by product default), Financial Safety gate, then deterministic execution only when uncontested and clear. AI never holds release authority. A dispute freezes execution for explicit human review and authorization, and a compliance hold overrides every timer.

---

## 6. Financial Safety Boundary

Responsible for future identity/KYC status, sanctions screening, transaction monitoring, funding-source controls, amount and velocity limits, risk flags, holds, destination integrity, auditability, and human compliance review. Gate states are `clear`, `review_required`, `held`, and `restricted`; only `clear` may proceed.

Solo agreements remain non-financial in the MVP. Outcome-contingent transfers require at least two valid economic sides; circular/self-dealing flows, HMM acting as counterparty, and arbitrary post-outcome destination changes are prohibited. Real KYC/AML, custody, payments, and real funds are not Sprint 5.2 capabilities and require legal/compliance approval plus appropriate regulated partners before launch.

---

## Strategic Direction

Human Made Money is the trust layer for human agreements, not only an escrow platform.

It is programmable agreement infrastructure that can clarify terms, establish evidence, verify conditions, protect funds when needed, and execute financial commitments. Not every agreement requires escrow, and the architecture should preserve that distinction.
