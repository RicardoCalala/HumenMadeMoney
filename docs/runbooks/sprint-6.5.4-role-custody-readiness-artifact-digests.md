# Sprint 6.5.4 Role & Custody Readiness Expanded Artifact Digests

Status: **FROZEN OFFLINE IMPLEMENTATION EVIDENCE — FINAL FOUNDER CHECKPOINT PENDING — BLOCKED — NO REAL SCORER CALIBRATION — NO A-01 CONTACT**

Design commit: `649a7e1f62a71b91523edc22d02f7c773c9ac62f`
Implementation commit: `7d7d8c12f10e37b9872304e68a5f0a98a81a267f`

SHA-256 is over each path's exact bytes at the implementation commit. This manifest is append-only beside both historical manifests; it does not replace, modify, or reinterpret them. The historical 18-path manifest remains `14e2c5c03910e25bb30c04d0bbf9879a2a0ef9299619c72446a39f2be684c2ae`. The scorer-calibration manifest remains `f74ef1dfe9022f019bd8569f7c2e76db47ec7ff5e38f020070c1c5e1aa24a46c`.

| Version / role | Path | Depends on | SHA-256 |
| --- | --- | --- | --- |
| approved role/custody design v1 | `docs/sprints/sprint-6.5.4-role-custody-readiness-protocol-design-v1.md` | five founder-approved decisions | `22794dfcd352ba1c9c05613b079b9eccddfc1d36d1fec3359d851c46c3598368` |
| `role-custody-readiness-protocol-v1` | `docs/runbooks/sprint-6.5.4-role-custody-readiness-protocol-v1.md` | approved design | `f5d916dd8bddff82b2666ad21b9eba051e3352ed07350bcb57f60ee7bea0aecd` |
| recruitment checklist v3 | `docs/runbooks/sprint-6.5.4-recruitment-execution-checklist-v3.md` | protocol, collective gate | `c4dfda3e16d6415fd822e4f647bfc5542fc551d7a782c78bc15e715309bfad4f` |
| executable role/custody policy | `apps/web/server/evaluation/role-custody-readiness.ts` | protocol and schemas | `c843300af11e194a1427d748e781972f111db05b496c36c2b3af9a0bbef67151` |
| readiness-gated calibration runner | `apps/web/scripts/run-readiness-gated-scorer-calibration.ts` | readiness policy, frozen calibration evaluator | `faec921ef79cd586e4001bf506aa1c1ab3ba80b1d9ebd95b4f662ec2c84e8794` |
| role/custody mechanics/security tests | `apps/web/tests/role-custody-readiness.test.ts` | executable policy and schemas | `f0de8b8dd4296047608f1ca83574cc8cebdf6ebb00c9c81b98009fb794c3af06` |
| role/custody governance tests | `apps/web/tests/role-custody-readiness-docs.test.ts` | protocol, checklist, checkpoint | `53e0f0e76ddca0e0259812a333090d3571fdda7d24f6887cae0297ec78e9def3` |
| `backup-restore-evidence-v1` | `apps/web/tests/fixtures/ai-evaluation/role-custody-readiness/backup-restore-evidence-schema-v1.json` | recovery controls | `d1e38d45383a346104cc083b08f8f9daaf7f08937166492eb873ed5b9324b5bc` |
| `collective-readiness-v1` | `apps/web/tests/fixtures/ai-evaluation/role-custody-readiness/collective-readiness-schema-v1.json` | all readiness controls | `8227fd535198745439ae183582073dbe4755deb3f8f43540b70951017c27c3a2` |
| `custody-topology-v1` | `apps/web/tests/fixtures/ai-evaluation/role-custody-readiness/custody-topology-schema-v1.json` | eight logical compartments | `dd813fa38ec08d2f1669ab5ad2200e3a48d615ed6cd66f7ebe43125596e3886e` |
| `role-custody-ledger-v1` | `apps/web/tests/fixtures/ai-evaluation/role-custody-readiness/ledger-record-schema-v1.json` | chain/correction/incident/head controls | `200180cdb515a3f9eff8c7d487ea335a227c63353391eef924b75b900cff769c` |
| `readiness-evidence-v1` | `apps/web/tests/fixtures/ai-evaluation/role-custody-readiness/readiness-evidence-schema-v1.json` | per-control evidence | `b848524ff1357579c62286e3b8486e0095c02f8b6ee6789d229c4ba17a6d65eb` |
| `retention-hold-v1` | `apps/web/tests/fixtures/ai-evaluation/role-custody-readiness/retention-hold-schema-v1.json` | deletion/hold controls | `fd6ea7a6293f103d65b491e224df11bb0cd62fcf3205f35aeb375747566bc334` |
| `role-assignment-v1` | `apps/web/tests/fixtures/ai-evaluation/role-custody-readiness/role-assignment-schema-v1.json` | eligibility, alias, access, validity | `2fa6951f1214326250b1467ee794d1fd889392ee28fbaebeee2b88d2264a2017` |
| `role-eligibility-attestation-v1` | `apps/web/tests/fixtures/ai-evaluation/role-custody-readiness/role-eligibility-schema-v1.json` | neutral role instruments | `f6ba6d5e9e12f32f41c15efee5668f3c10cfb39e5913e967b50ea694dd50f207` |
| historical participant-facing manifest | `docs/runbooks/sprint-6.5.4-artifact-digests.md` | unchanged historical envelope | `14e2c5c03910e25bb30c04d0bbf9879a2a0ef9299619c72446a39f2be684c2ae` |
| historical scorer-calibration manifest | `docs/runbooks/sprint-6.5.4-scorer-calibration-artifact-digests.md` | unchanged scorer envelope | `f74ef1dfe9022f019bd8569f7c2e76db47ec7ff5e38f020070c1c5e1aa24a46c` |
| historical scorer checkpoint | `docs/runbooks/sprint-6.5.4-scorer-calibration-founder-checkpoint.md` | remains `PENDING` | `c271a711f613f7b73c594848a8e42e2b9568643b24f38706ea69bb54d017af2d` |
| historical second checkpoint | `docs/runbooks/sprint-6.5.4-second-founder-checkpoint.md` | remains `PENDING` | `14b66255d8d1ee0668e40f3d21114a11e095f6933d4735b1cdc1cfbdce45480c` |
| historical recruitment checklist v2 | `docs/runbooks/sprint-6.5.4-recruitment-execution-checklist-v2.md` | immutable history | `09a780de31a0e6a314ed83c889c1f2c71c3516e471b3af31a3a9d2ae4a5274b6` |
| frozen calibration evaluator | `apps/web/server/evaluation/scorer-calibration.ts` | unchanged scorer protocol | `028887c1014eea7552c3f1b32e4c5b183cbfc14b1ffb19de64b42267e655202b` |
| frozen calibration runner | `apps/web/scripts/run-scorer-calibration.ts` | unchanged implementation evidence | `600ac191f0f59a15f3b7ee6012e93a2222d5373e32c317a056e148f8acfe97b1` |
| frozen calibration tests | `apps/web/tests/scorer-calibration.test.ts` | unchanged regression evidence | `ca78fa479b9eeeb8dd75f1b5b3ae2acf9312034d838660348fc9f649bfdd981e` |
| frozen calibration governance tests | `apps/web/tests/scorer-calibration-docs.test.ts` | unchanged digest evidence | `66c2feff3eff8c531c227b38cda0ff73145a4752dc6748c7c8e835ef7277fcb3` |
| frozen scorer eligibility schema | `apps/web/tests/fixtures/ai-evaluation/scorer-calibration/eligibility-schema-v1.json` | referenced, not redefined | `6ce5e783c7f06e8d86ee5ec0318654d25a4d952d762a070f4bb11e0798228f5e` |
| frozen scorer result schema | `apps/web/tests/fixtures/ai-evaluation/scorer-calibration/result-schema-v1.json` | referenced, not redefined | `9f0b7bf6e4f983d2188e6b3999be952332d60256003b1429bc5b8531c08bc90f` |
| root package contract | `package.json` | unchanged; no new dependency or script | `b96e0c5fe4f630cd9f646c940f3174610bc7b059410619bda24fa6e5b16ad6cc` |
| web package contract | `apps/web/package.json` | unchanged; no new dependency or script | `a8ad63ca2c1d45ff9d7413aef85236e8dfbf497f06b880efb7dd4b869e115706` |
| dependency lock | `pnpm-lock.yaml` | unchanged; no dependency download | `701509cd6e05024d7c75d9926b51743b61628437cb958aeb63caab9c948ee0e4` |

This manifest intentionally does not hash itself or the later governance-only checkpoint bytes. The checkpoint pins this manifest's external SHA-256 and the implementation commit. That avoids self-reference. It remains `PENDING`; no hash is an approval receipt.

The implementation and validation created only synthetic `TST-*` data in memory. They created no real role/scorer/participant alias, assignment, result, location, secret, provider request, production action, financial/custody/settlement action, or qualification evidence.
