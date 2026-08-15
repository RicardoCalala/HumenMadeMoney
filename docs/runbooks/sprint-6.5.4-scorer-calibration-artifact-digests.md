# Sprint 6.5.4 scorer-calibration expanded artifact digests

Status: **FROZEN OFFLINE IMPLEMENTATION EVIDENCE — FOUNDER CHECKPOINT PENDING — NO REAL SCORER CALIBRATION — NO A-01 CONTACT**

SHA-256 is over each path's exact bytes in the proposed implementation commit. This expanded envelope is append-only beside the historical 18-path manifest; it does not replace or reinterpret that manifest. The historical manifest SHA-256 remains `14e2c5c03910e25bb30c04d0bbf9879a2a0ef9299619c72446a39f2be684c2ae`, and its 18 member digests are independently regression-tested.

| Version / role | Path | Depends on | SHA-256 |
| --- | --- | --- | --- |
| approved calibration design | `docs/sprints/sprint-6.5.4-scorer-calibration-clarification-design.md` | eight founder decisions | `58493896538cf07a479c6fd0f2ea1461624e61c4ec1f1ea5f41e2fd6fdaa159d` |
| `scorer-calibration-protocol-v1` | `docs/runbooks/sprint-6.5.4-scorer-calibration-protocol-v1.md` | design, frozen rubric | `bc85e6db00fba46d90a17a61e005acd8ec403f746e4676a3dc6dbc00d6f714e7` |
| construct-separation methodology v1 | `docs/runbooks/sprint-6.5.4-construct-separation-methodology-v1.md` | founder Decisions 6–7 | `293857a2d948d2842d6222446626b22b4641a397eed83fa01c716149ed2ed95a` |
| recruitment checklist v2 | `docs/runbooks/sprint-6.5.4-recruitment-execution-checklist-v2.md` | protocol, new checkpoint | `09a780de31a0e6a314ed83c889c1f2c71c3516e471b3af31a3a9d2ae4a5274b6` |
| frozen rubric dependency | `docs/authority-comprehension-rubric-v1.md` | historical envelope; unchanged | `36764c70bd926c55d65c9f813b77b33460abb1cdec3cd58093e828004b21ca10` |
| dataset/coverage manifest v1 | `apps/web/tests/fixtures/ai-evaluation/scorer-calibration/dataset-manifest-v1.json` | two restricted subsets and keys | `9071484d6ff2e9ee66503707b5e476d82cf46b24c7a661a14c105d224f8e48b9` |
| restricted primary presentation v1 | `apps/web/tests/fixtures/ai-evaluation/scorer-calibration/restricted/primary-subset-v1.json` | dataset v1 | `45291ecb0a454c47bb0b4f4169057fe9a8d6192d2604c4fa98f38f3567c221fa` |
| restricted retry presentation v1 | `apps/web/tests/fixtures/ai-evaluation/scorer-calibration/restricted/retry-subset-v1.json` | dataset v1; inaccessible before need | `ad6a038cedfe21f5389b77d5936f9864ea895fdb0bf11273141443522f5e69bb` |
| restricted primary key v1 | `apps/web/tests/fixtures/ai-evaluation/scorer-calibration/keys/primary-key-v1.json` | primary presentation, rubric | `85bb2746bde9df954f031f5b74a0162f78a1c7de3825027b5f318cb637f74a71` |
| restricted retry key v1 | `apps/web/tests/fixtures/ai-evaluation/scorer-calibration/keys/retry-key-v1.json` | retry presentation, rubric | `1f31fb1dc39dea1b4d4799ac62dd172d161068b5acb671df3641b4ad6f91ce9a` |
| `scorer-calibration-eligibility-v1` | `apps/web/tests/fixtures/ai-evaluation/scorer-calibration/eligibility-schema-v1.json` | protocol v1 | `6ce5e783c7f06e8d86ee5ec0318654d25a4d952d762a070f4bb11e0798228f5e` |
| `scorer-calibration-result-v1` | `apps/web/tests/fixtures/ai-evaluation/scorer-calibration/result-schema-v1.json` | protocol/comparison v1 | `9f0b7bf6e4f983d2188e6b3999be952332d60256003b1429bc5b8531c08bc90f` |
| deterministic comparison v1 | `apps/web/server/evaluation/scorer-calibration.ts` | dataset/keys/schemas | `028887c1014eea7552c3f1b32e4c5b183cbfc14b1ffb19de64b42267e655202b` |
| offline lock/comparison runner | `apps/web/scripts/run-scorer-calibration.ts` | comparison v1 | `600ac191f0f59a15f3b7ee6012e93a2222d5373e32c317a056e148f8acfe97b1` |
| calibration mechanics/security tests | `apps/web/tests/scorer-calibration.test.ts` | evaluator, runner contracts, restricted fixtures | `ca78fa479b9eeeb8dd75f1b5b3ae2acf9312034d838660348fc9f649bfdd981e` |
| governance/privacy/digest tests | `apps/web/tests/scorer-calibration-docs.test.ts` | historical and expanded governance | `66c2feff3eff8c531c227b38cda0ff73145a4752dc6748c7c8e835ef7277fcb3` |
| ignored private calibration location | `.gitignore` | controlled local evidence boundary | `f70262b9cf137926ab98f405c08970fa0863e9d10b5684766f28d162c66ca62a` |

The comparison code additionally pins canonical JSON key digests `51096a26db78a185bf1d2bda030ab27cb7bd6c73f24522e105cfd3ce0330070c` (primary) and `173b471843263fb4ce8581989eaec7689b37bdee611ee06b803db58cff9d1c3c` (retry), plus non-overlap proof digest `c8ee7366144ded0436be2bd6a6a2b7bac322e6b31cbbc3b9ae15ee94d3eb48f9`. This prevents an administrator from substituting an altered key or reused failed fixture while retaining deterministic JSON parsing.

This manifest intentionally does not hash itself. The separate pending checkpoint is committed after validation so it can pin the exact implementation commit containing this envelope without creating a self-referential Git hash. Neither file authorizes real access.
