import { parseAiProviderConfig } from "../server/evidence/ai-config.ts";
import { buildSmokeAuthorizationSnapshot, createSmokeAuthorization } from "../server/evidence/smoke-authorization.ts";
import { smokeFixtureId, smokeInput } from "../tests/fixtures/openai-smoke-fixture.ts";

const argument = (name: string) => { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : undefined; };
if (!process.argv.includes("--synthetic-only")) throw new Error("The explicit --synthetic-only argument is required.");
const path = argument("--record"); const projectLabel = argument("--project-label"); const expiresAt = argument("--expires-at");
if (!path || !projectLabel || !expiresAt) throw new Error("--record, --project-label, and --expires-at are required.");
const config = parseAiProviderConfig(process.env);
const snapshot = buildSmokeAuthorizationSnapshot(config, projectLabel, smokeFixtureId, smokeInput);
const record = await createSmokeAuthorization(path, snapshot, expiresAt);
console.log(JSON.stringify({ authorizationId: record.authorizationId, attemptId: record.attemptId, status: record.status, authorizedAt: record.authorizedAt, expiresAt: record.expiresAt, recordVersion: record.recordVersion, recordPath: path }));
