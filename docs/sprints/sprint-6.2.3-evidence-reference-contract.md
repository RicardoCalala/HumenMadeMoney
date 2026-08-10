# Sprint 6.2.3 — Evidence Reference Contract

## Decision

The OpenAI advisory adapter no longer asks a model to reproduce canonical evidence values. The live failures showed that a provider can preserve the meaning of a timestamp while changing its representation; the prior `{ evidenceRevisionId, field, value }` output contract therefore made safe provider behavior depend on lossless value echoing.

HMM now creates deterministic `claimReferenceId` values before request construction. Each ID is a SHA-256 reference scoped to the exact agreement ID, accepted version ID, document digest, frozen evidence-set ID/digest/canonicalization version, criterion ID, evidence revision ID, allowed evidence-requirement IDs, metadata field, canonical typed-value digest, and evidence content digest when present. The provider receives approved reference records but returns only `claimReferenceIds` for each finding.

HMM independently rebuilds the reference map from the immutable input, recomputes frozen evidence-set membership, and resolves every accepted ID to its canonical typed value in memory. The canonical value is never supplied by model output. The completed finding retains the existing evidence-revision citations; raw claim values are not newly persisted.

## Validation and authority invariants

- Every reference must be generated from an available, valid, non-failed revision belonging to the exact agreement and accepted version.
- The evidence-set digest must recompute from the exact frozen revision membership.
- Every reference must be criterion-scoped, bound to a cited revision and at least one cited allowed evidence requirement, sourced from an allowlisted field, and limited to `standard` sensitivity.
- Fabricated, duplicate, stale, changed-revision, cross-agreement, cross-version, cross-criterion, cross-evidence-set, misbound, unauthorized, or sensitive references reject the entire output with `CLAIM_SUPPORT` or `CITATION`.
- Strings, timestamps, numbers, booleans, and null remain canonical HMM-owned JSON values. Formatting, normalization, paraphrase, calculation, and value echoing cannot satisfy support.
- Explanation and confidence text remain advisory. They cannot substitute for a claim reference or grant authority.
- The adapter has no tools and no path to Financial Safety, reviewer assignment or decisions, `record_resolution`, authorization, resolution, release, refund, or settlement.

## Version and smoke impact

The adapter is `openai-adapter-v2`; default prompt/schema versions are `hmm-advisory-v2` and `assessment-draft-v2`; the synthetic fixture is `hmm-smoke-fixture-v2`. These changes intentionally change configuration and fixture digests. Existing one-time authorization records cannot match the new envelope and remain terminal. No authorization record is created by this sprint.

All automated coverage remains offline and credential-free. The dry-run harness must report `networkRequests: 0`.
