# Sprint 6.5.4 implementation artifact digests

Status: **FROZEN OFFLINE IMPLEMENTATION EVIDENCE — SECOND FOUNDER APPROVAL PENDING**

SHA-256 is over each file's exact committed bytes. This manifest intentionally does not hash itself. A second founder approval must compare these values with the exact clean execution commit before any recruitment.

| Version / role | Path | Depends on | SHA-256 |
| --- | --- | --- | --- |
| approved design | `docs/sprints/sprint-6.5.4-comprehension-validation-design.md` | founder decisions 1–11 | `57e70b3f7c2872d7318f7f989a9dbe6243d2dca15f540596efe672a1de83667c` |
| `human-review-orientation-v2` | `docs/human-review-orientation-v2.md` | approved design | `ee871584098a3de66c560daea8f412003f206cf871d873e7a4fcc77688367179` |
| `authority-comprehension-instrument-v1` | `docs/authority-comprehension-instrument-v1.md` | orientation v2, protocol v1 | `0b6c7225c14f137498881ddc0bf0ee5c2b5656d3f3571d64052b5153c15bb7d5` |
| `authority-comprehension-rubric-v1` | `docs/authority-comprehension-rubric-v1.md` | instrument v1 | `36764c70bd926c55d65c9f813b77b33460abb1cdec3cd58093e828004b21ca10` |
| `hmm-comprehension-study-v2` / `authority-comprehension-dataset-v1` | `docs/orientation-validation-study-v2.md` | all validation contracts | `0b0fb4ada24461f35271c1e902923cc85573a299c592f02b98875379e072b9c9` |
| `orientation-validation-protocol-v1` | `docs/runbooks/sprint-6.5.4-orientation-validation-protocol-v1.md` | orientation, instrument, rubric, schemas | `2ab8d00a657e1f78615c04565731d6ff0607196f87a58f147f6695f342f59d0f` |
| founder approvals | `docs/runbooks/sprint-6.5.4-founder-approvals.md` | founder decisions 1–11 | `bf6416d06d9a524bfac8004f40b7ad75754c129019072c5ed1024f224d33135f` |
| pending Gate B record | `docs/runbooks/sprint-6.5.4-second-founder-checkpoint.md` | exact clean commit and this manifest | `14b66255d8d1ee0668e40f3d21114a11e095f6933d4735b1cdc1cfbdce45480c` |
| frozen protocol manifest | `apps/web/tests/fixtures/ai-evaluation/orientation-validation/protocol-manifest.json` | all version constants and gates | `02ac0548ad1d0b70ef186b920c832b15a57262bc5a8ec7c455748a3a8d5482fc` |
| frozen instrument/coverage manifest | `apps/web/tests/fixtures/ai-evaluation/orientation-validation/instrument.json` | instrument v1, rubric v1 | `068db391cd9fdc1a6d6a72f8605d6386a39e28e7bb624e0b5a57ae5efc42779d` |
| `orientation-validation-result-v1` | `apps/web/tests/fixtures/ai-evaluation/orientation-validation/result-schema.json` | study v2, protocol v1, rubric v1 | `aea0ce1a48a011815456c97d3762e71e16a4303b8fd972cc5130c4347bb02c87` |
| `orientation-validation-report-v1` | `apps/web/tests/fixtures/ai-evaluation/orientation-validation/report-schema.json` | evaluator and result v1 | `b77241195ac250f49f10ac6e4f96de91dd123326dcea6a103acd54bbdfac4c58` |
| restricted semantic dataset | `apps/web/tests/fixtures/ai-evaluation/orientation-validation/semantic-fixtures.json` | rubric v1 | `91d505a405cdeccfc0abea9f8f92c10a70f31123a5560e2de4b0d6ea84e4754f` |
| deterministic evaluator | `apps/web/server/evaluation/orientation-validation.ts` | protocol/result/report contracts | `bb3203b4af34dcfba4e792cd08aff5108eed9b16cb5563875b11417dc6cb4e89` |
| mechanics regression suite | `apps/web/tests/orientation-validation.test.ts` | evaluator and fixtures | `9e8bbdc01a9ac379b3358f461935091d8d6260bcc5d3c5bb39f4670b61c80a7e` |
| governance/security consistency suite | `apps/web/tests/orientation-validation-docs.test.ts` | documentation and schemas | `a7ba81559dc59c18306ac37ff01f47da9cb4b10876a985e10b3052857080f674` |
| root offline command | `package.json` | web offline command | `b96e0c5fe4f630cd9f646c940f3174610bc7b059410619bda24fa6e5b16ad6cc` |
| web offline command | `apps/web/package.json` | orientation validation tests | `a8ad63ca2c1d45ff9d7413aef85236e8dfbf497f06b880efb7dd4b869e115706` |

The existing `human-review-protocol-v1`, `human-review-rubric-v1`, `human-review-result-v1`, and `reviewer-packet-v1` remain unchanged because their later release-gating contracts were not changed by this offline validation implementation. Sprint 6.5.3 and Sprint 6.4 artifacts are outside this manifest and remain immutable.
