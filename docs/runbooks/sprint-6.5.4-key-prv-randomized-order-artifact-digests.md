# Sprint 6.5.4 KEY+PRV Randomized Order Expanded Artifact Digests

Status: **FROZEN OFFLINE IMPLEMENTATION EVIDENCE — NEW FOUNDER CHECKPOINT PENDING — BLOCKED — NO REAL KEY+PRV SCREENING — NO REAL SCORER CALIBRATION — NO A-01 CONTACT**

Approved design commit: `bb6836e06f919265c51015b0a4dc68ab6cd555ab`

Clean implementation commit / governance parent: `9c351f161364a9bd294fa129965ce359354a3d2a`

SHA-256 is over each path's exact bytes at the implementation commit. This append-only amendment envelope is beside, and does not replace or reinterpret, the three historical envelopes. It intentionally does not hash itself or the later pending checkpoint.

| Version / artifact | Path | SHA-256 |
| --- | --- | --- |
| approved randomized-order design v1 | `docs/sprints/sprint-6.5.4-key-prv-randomized-order-amendment-design-v1.md` | `2f896088b5f884c75ed3a1a61516a95b89db69ad1cf8517b04c462f5c736dced` |
| executable generator, lock ledger, evaluator and v2 rollup | `apps/web/server/evaluation/key-prv-randomized-order.ts` | `18de4a577b21af5669cf2294cd2435735da1f96d548c9d65fe64c1d2d6f50241` |
| exact-byte instrument manifest v2 | `apps/web/tests/fixtures/ai-evaluation/role-custody-readiness/key-prv-instrument-manifest-v2.json` | `3e165b5dc59097fcb6767a4747e2d0b41780f57b05be09863edbf2a78fbaddc6` |
| administration schema v1 | `apps/web/tests/fixtures/ai-evaluation/role-custody-readiness/key-prv-administration-schema-v1.json` | `f5720ef8564a96a414a999f489385cdad268e2d2e57ee61fc13fd9d3f20c5b59` |
| eligibility schema v2 | `apps/web/tests/fixtures/ai-evaluation/role-custody-readiness/role-eligibility-schema-v2.json` | `6e4014c5f3848f7bd68375c22ca78decc25bdfcaa06ce2532f7f86203538135e` |
| assignment schema v2 | `apps/web/tests/fixtures/ai-evaluation/role-custody-readiness/role-assignment-schema-v2.json` | `dd9024de166aa0d1267b3f0de1d77bfc83ad641807399c4e342d9b8aae33baa9` |
| readiness evidence schema v2 | `apps/web/tests/fixtures/ai-evaluation/role-custody-readiness/readiness-evidence-schema-v2.json` | `c0fed43445a8bf4adafb806b64535e4ad738be6fef713ddc85d2fff2a72dc1b6` |
| collective readiness schema v2 | `apps/web/tests/fixtures/ai-evaluation/role-custody-readiness/collective-readiness-schema-v2.json` | `edb70b451f72fcac15b6605c033af0c70e79110e77eb86124fb5bde56d4e173f` |
| mechanics, security, privacy and governance tests | `apps/web/tests/key-prv-randomized-order.test.ts` | `fe6bbb9bd1faa998c20cc414e48d6555b52df3602c3e60e6ad889c9750627118` |
| protocol v2 | `docs/runbooks/sprint-6.5.4-role-custody-readiness-protocol-v2.md` | `09f0abfa54f9a93498c78ad10c0ed74ba148574afe994cdf596cd9942a1c708a` |
| v2/v1 compatibility matrix | `docs/runbooks/sprint-6.5.4-key-prv-v2-compatibility-matrix.md` | `c87b4dd8464c38c60301ce66b91b9edd152706f6c1681b18b58635a0efda17a8` |
| recruitment checklist v4 | `docs/runbooks/sprint-6.5.4-recruitment-execution-checklist-v4.md` | `fc31f7aa7a7f85ef74205cf0a3342a74f2cb916285fffb166ce8051c91438799` |
| offline validation report v1 | `docs/runbooks/sprint-6.5.4-key-prv-randomized-order-validation-v1.md` | `8562ca1a368b756d5da1247808272be1cb816d742f1c96e7070f6f026ce5e78a` |
| historical role/custody expanded envelope | `docs/runbooks/sprint-6.5.4-role-custody-readiness-artifact-digests.md` | `a205acc1a00c94b702d47ef6adf5a5d4fd5933e7b37f62f26267dda8a30ab3bc` |
| historical scorer-calibration envelope | `docs/runbooks/sprint-6.5.4-scorer-calibration-artifact-digests.md` | `f74ef1dfe9022f019bd8569f7c2e76db47ec7ff5e38f020070c1c5e1aa24a46c` |
| historical participant-facing envelope | `docs/runbooks/sprint-6.5.4-artifact-digests.md` | `14e2c5c03910e25bb30c04d0bbf9879a2a0ef9299619c72446a39f2be684c2ae` |
| root package contract, unchanged | `package.json` | `b96e0c5fe4f630cd9f646c940f3174610bc7b059410619bda24fa6e5b16ad6cc` |
| web package contract, unchanged | `apps/web/package.json` | `a8ad63ca2c1d45ff9d7413aef85236e8dfbf497f06b880efb7dd4b869e115706` |
| dependency lock, unchanged | `pnpm-lock.yaml` | `701509cd6e05024d7c75d9926b51743b61628437cb958aeb63caab9c948ee0e4` |

Canonical logical instrument-entry digest: `dfac87e43277885390e3f812b8ef336a3a44c614f8ac7c8e6a521ae6b2f23453`.

Canonical exact statement-array byte digest: `c3cada12503fd05066ba085b3cbfec549994ccbaeabc57ed50091253ba19e455`.

The compatibility matrix reuses `custody-topology-v1`, `backup-restore-evidence-v1`, `role-custody-ledger-v1`, `retention-hold-v1`, the role-separation matrix and least-privilege matrix byte-identically. It prohibits v1 KEY/PRV eligibility or assignment evidence from being imported, remapped, rescored, subset-selected, silently upgraded, or mixed into the v2 combined chain.

The implementation and validation created only synthetic in-memory data. No seed, order, response, identity, alias, access grant, genuine result, scorer action, participant contact, provider/API action, production/database record, financial/custody/settlement action, release review, qualification, or counter change was created. This envelope is evidence, not an approval receipt.
