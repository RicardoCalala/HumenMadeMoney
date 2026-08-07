import assert from "node:assert/strict";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createInterface } from "node:readline";
import test from "node:test";
import { PrismaClient } from "@prisma/client";
import { seedSimulatedExecutionQaAgreement, SIMULATED_EXECUTION_QA_AGREEMENT_ID } from "../../prisma/seed-simulated-execution-qa.ts";
import { TOOL_NAMES } from "../../server/mcp/registry.ts";
import { issueActorToken } from "../../server/mcp/security.ts";

const databaseUrl = process.env.TEST_DATABASE_URL;
const contract = databaseUrl ? test : test.skip;
const versionId = "version-simulated-execution-qa-v1";
const base = { contractVersion: "2026-08-06", agreementId: SIMULATED_EXECUTION_QA_AGREEMENT_ID, versionId };
const secret = "sprint-6.0.1-local-test-secret-at-least-32-characters";
const prisma = databaseUrl ? new PrismaClient({ datasources: { db: { url: databaseUrl } } }) : null;

async function seed() {
  const stamp = new Date("2026-08-06T00:00:00.000Z");
  for (const account of [
    { id: "account-alex", profileId: "alex", displayName: "Alex", primaryEmail: "alex@local.invalid" },
    { id: "account-jordan", profileId: "jordan", displayName: "Jordan", primaryEmail: "jordan@local.invalid" },
  ]) {
    await prisma!.account.upsert({ where: { id: account.id }, update: { state: "active", displayName: account.displayName, primaryEmail: account.primaryEmail, updatedAt: stamp }, create: { id: account.id, state: "active", displayName: account.displayName, primaryEmail: account.primaryEmail, createdAt: stamp, updatedAt: stamp } });
    await prisma!.localAuthProfile.upsert({ where: { profileId: account.profileId }, update: { accountId: account.id }, create: { profileId: account.profileId, accountId: account.id, createdAt: stamp } });
  }
  await seedSimulatedExecutionQaAgreement(prisma!);
}

class StdioClient {
  readonly child: ChildProcessWithoutNullStreams;
  private nextId = 0;
  private readonly pending = new Map<number, (value: Record<string, unknown>) => void>();
  readonly stderr: string[] = [];

  constructor() {
    this.child = spawn(process.execPath, ["--experimental-strip-types", "scripts/mcp-server.ts"], {
      cwd: new URL("../../", import.meta.url),
      env: { ...process.env, DATABASE_URL: databaseUrl!, HMM_PERSISTENCE_ADAPTER: "prisma", HMM_MCP_LOCAL_SECRET: secret, NODE_ENV: "test" },
      stdio: ["pipe", "pipe", "pipe"],
    });
    createInterface({ input: this.child.stdout }).on("line", (line) => {
      const response = JSON.parse(line) as { id?: number };
      if (typeof response.id === "number") this.pending.get(response.id)?.(response);
      else this.pending.values().next().value?.(response);
    });
    this.child.stderr.on("data", (chunk) => this.stderr.push(String(chunk)));
  }

  request(method: string, params?: Record<string, unknown>) {
    const id = ++this.nextId;
    const response = new Promise<Record<string, unknown>>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`MCP stdio request ${id} timed out`)), 5_000);
      this.pending.set(id, (value) => { clearTimeout(timer); this.pending.delete(id); resolve(value); });
    });
    this.child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, ...(params ? { params } : {}) })}\n`);
    return response;
  }

  call(name: string, args: Record<string, unknown>, actorToken: string) {
    return this.request("tools/call", { name, arguments: args, actorToken });
  }

  async close() {
    this.child.stdin.end();
    if (this.child.exitCode === null) this.child.kill("SIGTERM");
    if (this.child.exitCode === null) await new Promise<void>((resolve) => this.child.once("exit", () => resolve()));
  }
}

contract("real stdio client completes the PostgreSQL-backed advisory flow and preserves bounded authority", async (t) => {
  await seed();
  const beforeEvidence = await prisma!.evidenceItem.count({ where: { agreementId: SIMULATED_EXECUTION_QA_AGREEMENT_ID } });
  const client = new StdioClient();
  t.after(async () => client.close());
  const now = Math.floor(Date.now() / 1_000);
  const token = issueActorToken({ accountId: "account-jordan", sessionId: "session-mcp-qa", audience: "hmm-local-mcp", purpose: "verification", issuedAt: now - 5, expiresAt: now + 300 }, secret);

  const initialized = await client.request("initialize");
  assert.equal((initialized.result as { serverInfo: { name: string } }).serverInfo.name, "hmm-local-verification");
  const tools = await client.request("tools/list");
  assert.deepEqual((tools.result as { tools: Array<{ name: string }> }).tools.map((tool) => tool.name), TOOL_NAMES);

  const terms = await client.call("hmm_get_agreement_terms", base, token);
  assert.equal((terms.result as { structuredContent: { resolutionContext: { settlementAuthority: boolean } } }).structuredContent.resolutionContext.settlementAuthority, false);
  const requirements = await client.call("hmm_get_evidence_requirements", base, token);
  assert.equal((requirements.result as { structuredContent: unknown[] }).structuredContent.length, 1);

  const retrieved = await client.call("hmm_retrieve_approved_source", { ...base, sourceConstraintId: "qa-fixture-source", fixtureId: "fixture.qa.simulated", fields: ["result", "simulation"] }, token);
  const source = (retrieved.result as { structuredContent: { observation: object; capturedAt: string; retrievalReceiptId: string } }).structuredContent;
  const observationKey = `mcp-observation-${crypto.randomUUID()}`;
  const submitted = await client.call("hmm_submit_source_observation", { ...base, evidenceRequirementId: "qa-evidence-requirement", criterionIds: ["qa-criterion"], sourceConstraintId: "qa-fixture-source", retrievalReceiptId: source.retrievalReceiptId, metadata: source.observation, capturedAt: source.capturedAt, idempotencyKey: observationKey }, token);
  const evidence = (submitted.result as { structuredContent: { resource: { evidenceId: string; currentRevisionId: string } } }).structuredContent.resource;
  const replayed = await client.call("hmm_submit_source_observation", { ...base, evidenceRequirementId: "qa-evidence-requirement", criterionIds: ["qa-criterion"], sourceConstraintId: "qa-fixture-source", retrievalReceiptId: source.retrievalReceiptId, metadata: source.observation, capturedAt: source.capturedAt, idempotencyKey: observationKey }, token);
  assert.equal((replayed.result as { structuredContent: { kind: string } }).structuredContent.kind, "replayed");

  const metadata = await client.call("hmm_list_evidence_metadata", { ...base, pageSize: 50 }, token);
  assert.ok((metadata.result as { structuredContent: { data: Array<{ evidenceId: string }> } }).structuredContent.data.some((item) => item.evidenceId === evidence.evidenceId));
  const assessmentResponse = await client.call("hmm_request_assessment", { ...base, idempotencyKey: `mcp-assessment-${crypto.randomUUID()}` }, token);
  const assessment = (assessmentResponse.result as { structuredContent: { resource: { assessmentId: string; evidenceSetId: string; adapterKind: string; limitations: string[] } } }).structuredContent.resource;
  assert.equal(assessment.adapterKind, "deterministic");
  assert.match(assessment.limitations.join(" "), /no decision or settlement authority/i);
  const fetched = await client.call("hmm_get_assessment", { contractVersion: base.contractVersion, agreementId: base.agreementId, assessmentId: assessment.assessmentId }, token);
  assert.equal((fetched.result as { structuredContent: { authority: string } }).structuredContent.authority, "advisory_only");
  const review = await client.call("hmm_request_human_review", { ...base, assessmentId: assessment.assessmentId, evidenceSetId: assessment.evidenceSetId, reasonCodes: ["participant_challenge"], affectedCriterionIds: ["qa-criterion"], idempotencyKey: `mcp-review-${crypto.randomUUID()}` }, token);
  assert.equal((review.result as { structuredContent: { resource: { state: string; assignedAccountId?: string } } }).structuredContent.resource.state, "open");
  assert.equal((review.result as { structuredContent: { resource: { assignedAccountId?: string } } }).structuredContent.resource.assignedAccountId, undefined);

  assert.equal(await prisma!.evidenceItem.count({ where: { agreementId: base.agreementId } }), beforeEvidence + 1);
  assert.equal(await prisma!.evidenceRevision.count({ where: { id: evidence.currentRevisionId } }), 1);
  const provenance = await prisma!.evidenceProvenanceEvent.findFirstOrThrow({ where: { evidenceId: evidence.evidenceId } });
  assert.match(provenance.correlationId, /^mcp-/);
  assert.doesNotMatch(JSON.stringify(provenance), /Synthetic approved observation|retrievalReceiptId|session-mcp-qa/i);
  assert.equal(client.stderr.join(""), "");
});

contract("stdio framing rejects oversized payloads without exposing content", async (t) => {
  const client = new StdioClient();
  t.after(async () => client.close());
  const response = await client.request("tools/call", { name: "hmm_get_agreement_terms", actorToken: "x", arguments: { payload: "sensitive-marker".repeat(25_000) } });
  assert.equal((response.error as { code: number; message: string }).code, -32600);
  assert.equal((response.error as { message: string }).message, "The MCP request is too large.");
  assert.doesNotMatch(JSON.stringify(response), /sensitive-marker/);
});

test.after(async () => prisma?.$disconnect());
