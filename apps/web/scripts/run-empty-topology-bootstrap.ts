import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { evaluateBootstrapCollectiveReadinessV3, runOperationalEmptyBootstrap } from "../server/evaluation/empty-topology-bootstrap.ts";

const args = new Map<string, string>();
for (let index = 2; index < process.argv.length; index += 2) {
  const key = process.argv[index]; const value = process.argv[index + 1];
  if (!key?.startsWith("--") || !value) throw new Error("arguments_must_be_name_value_pairs");
  args.set(key, value);
}
const requiredPath = (name: string) => { const value = args.get(name); if (!value) throw new Error("missing_" + name.slice(2).replaceAll("-", "_")); return resolve(value); };
const projectRoot = requiredPath("--project-root");
const privateRoot = requiredPath("--private-root");
const evidenceOut = requiredPath("--evidence-out");
const implementationCommit = args.get("--implementation-commit");
if (!implementationCommit) throw new Error("missing_implementation_commit");
let gitIgnored = false;
try { execFileSync("git", ["-C", projectRoot, "check-ignore", "-q", privateRoot], { stdio: "ignore" }); gitIgnored = true; } catch { gitIgnored = false; }
const evidence = await runOperationalEmptyBootstrap({ projectRoot, privateRoot, implementationCommit, gitIgnored });
await writeFile(evidenceOut, JSON.stringify(evidence, null, 2) + "\n", { flag: "wx", mode: 0o600 });
const readiness = evaluateBootstrapCollectiveReadinessV3({ implementationCommit, governanceHead: implementationCommit, artifactEnvelopeDigest: "0".repeat(64), bootstrapEvidence: evidence, bootstrapFounderCheckpointApproved: false, randomizedOrderCheckpointApproved: false, realRolesQualified: false, operationalHandoffRestoreVerified: false, allOtherReadinessControlsPass: false });
process.stdout.write(JSON.stringify({ evidenceDigest: evidence.evidenceDigest, locationReferences: evidence.compartments.map(({ class: kind, locationRef }) => ({ class: kind, locationRef })), bootstrapStatus: "VALIDATED_EXPIRED", readiness: readiness.decision, blockers: readiness.reasonCodes }) + "\n");
