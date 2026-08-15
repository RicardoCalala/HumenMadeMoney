# Sprint 6.5.4 KEY+PRV v2 Compatibility Matrix

Status: **PROSPECTIVE OFFLINE COMPATIBILITY EVIDENCE — CHECKPOINT PENDING — BLOCKED**

| Contract | v2 treatment | Compatibility rule |
| --- | --- | --- |
| `custody-topology-v1` | Reused byte-identically | Permitted only as a named v1 subcontract; all eight compartments, separation, access and zero-secret rules remain unchanged. |
| `backup-restore-evidence-v1` | Reused byte-identically | Permitted only with the unchanged v1 topology digest relationship and synthetic/empty restore restrictions. |
| `role-custody-ledger-v1` | Reused byte-identically | Permitted as the outer append-only custody/incident/correction ledger; v2 administration snapshots are payload evidence and cannot weaken v1 chain rules. |
| `retention-hold-v1` | Reused byte-identically | Applies unchanged to v2 private administration evidence; the seed, sequence and responses gain no longer or broader retention. |
| `role-separation-matrix-v1` | Reused byte-identically | C2 KEY+PRV combination still requires exact founder proof and compartment separation; passing the instrument does not approve combination. |
| `least-privilege-access-matrix-v1` | Reused byte-identically | No new permission or access class. |
| `role-eligibility-attestation-v1` | Historical only | Rejected for the v2 combined KEY+PRV path; no import, remap, subset reuse, or upgrade. |
| `role-assignment-v1` | Historical only | Rejected when eligibility provenance is v2. |
| `readiness-evidence-v1` / `collective-readiness-v1` | Historical only | Cannot authorize v2 screening or consume v2 administration evidence. |
| scorer calibration v1 contracts | Unchanged and separately gated | No fixture, key, threshold, scorer, comparison, retry, or release-review semantics change. |

Compatibility requires exact known SHA-256 values for every reused v1 file, all frozen envelope members, and both historical commits named by the v1 governance. A cross-version mixture not listed above fails closed. There is no database migration and no historical data rewrite.
