# Sprint 6.5.4 Empty Topology Bootstrap Protocol v1

Protocol: `empty-topology-bootstrap-protocol-v1`

Status: **PROSPECTIVE EMPTY/SYNTHETIC BOOTSTRAP — IMPLEMENTATION CHECKPOINT PENDING — BLOCKED**

Authority is limited to establishing and verifying empty infrastructure under the approved design. Nothing in this protocol appoints a person, assigns a real alias, records a real identity/contact/response/result, grants real access, exposes a calibration key or fixture, contacts A-01, changes a counter, or affects HMM qualification.

## 1. Versioned contracts

- `empty-topology-bootstrap-evidence-v1`
- `empty-topology-retention-v1`
- `collective-readiness-v3`
- unchanged historical v2/v1 contracts only as listed in the compatibility matrix

All JSON contracts are closed Draft 2020-12 schemas. The runtime validator rejects unknown top-level fields and requires exact constants, counts, permissions, control results, zero-effect fields, and evidence digest.

## 2. Pre-creation fail-closed gate

The requested private root must resolve strictly beneath the repository root, have a generic `.hmm-private-*` basename, and be excluded by repository-local untracked Git metadata before creation. It must not resolve inside `.git`, `node_modules`, Documents, Downloads, Applications, Monero-related areas, Ferrari, National Defence, Lawyer, or any location outside the explicitly authorized HMM project. The runner accepts no fallback root.

The actual path and LOC-to-path map are written only inside the ignored private root with mode `0600`. Public evidence sets `actualPathsOmitted: true` and contains only opaque LOC references.

## 3. Topology and access

The primary boundary contains empty `IDMAP`, `RAW`, `LEDGER`, `CAL`, `PRES`, `KEYS`, and `INC` directories. The separate BACKUP boundary contains `BACKUP`. Root, boundaries, and compartments use mode `0700`; bounded mapping/evidence files use `0600`.

Every class receives a synthetic non-person `SYN-BSC-*` controller label and an ephemeral closed access template whose default is `DENY` and grants are empty. Labels are neither aliases nor role assignments and are mechanically ineligible for all human evidence.

## 4. Encryption and operational restore

Each class is tested with a fresh distinct 32-byte OS-CSPRNG key under AES-256-GCM. The operational archive covers the seven non-BACKUP source classes and synthetic access/ledger/incident probes. BACKUP uses its own key. Recovery creates two random XOR shares; the key is reconstructed only from both, while each share alone must fail authenticated decryption.

The archive is encrypted to the actual separate BACKUP boundary, restored to a newly created isolated target with non-overwrite writes, and verified for manifest digest, record count, independent ledger head, file mode, and path containment. The restore target, synthetic source records, templates, and ciphertext are then deleted. Secret buffers, both shares, reconstructed key material, plaintext, ciphertext, nonce, and tag buffers are overwritten before exit. Final compartment state must be empty.

No network, provider, API key, environment secret, production service, or database is used.

## 5. Ledger, incident, and correction mechanics

The empty ledger is initialized with a synthetic chained event, a linked synthetic correction, and a contained synthetic incident. Each record binds the previous digest. Recomputed head equality must pass and a mutated record must fail chain validation. Only the independent final head digest survives in bounded evidence; all synthetic records are deleted.

## 6. Retention and holds

| Class | Trigger | Period / maximum | Conditions |
| --- | --- | --- | --- |
| IDMAP | Sprint 6.5 qualification closure | 90 days | necessary hold released |
| ROLE_MAPPING | last operational need plus related incident/hold closure | 90 days | — |
| RAW, CAL | validation closure | 90 days | required completion prerequisites |
| PRES | Sprint 6.5 qualification closure | 90 days | frozen-study reproducibility resolved |
| KEYS | Sprint 6.5 qualification closure | 90 days | reproducibility/integrity resolved |
| INC | incident closure | 180 days | documented hold released |
| LEDGER | Sprint 6.5 qualification closure | 365 days | — |
| aggregate reports, manifests, head confirmations | Sprint 6.5 qualification closure | 365 days | — |
| BACKUP | applicable source deletion | 168 hours maximum | never outlives source |

Holds are reviewed within 30 days, cannot renew automatically, and require an objective release trigger. Real deletion requires distinct executor and verifier. Bootstrap working artifacts are removed immediately after evidence capture.

## 7. Expiry, handoff, and collective gate

Successful evidence sets authority to `EXPIRED_COMPLETE`. A material incident also expires authority and blocks completion. Real handoff remains `NOT_STARTED`: real PRV/RCV qualification, topology acceptance, new operational credentials/factors, and a human-separated restore are all absent.

`collective-readiness-v3` includes the bootstrap evidence digest but does not import bootstrap data into role assignments or KEY+PRV evidence. Before the new checkpoint and all real prerequisites exist it must report:

- `empty_bootstrap_founder_checkpoint_pending`
- `randomized_order_founder_checkpoint_pending`
- `real_prv_rcv_and_required_roles_not_qualified`
- `real_human_separated_handoff_restore_absent`
- `other_collective_readiness_controls_blocked`

Therefore real KEY+PRV screening and scorer calibration remain unauthorized, A-01 contact remains false, all counters remain zero, and HMM remains `NOT_QUALIFIED`.
