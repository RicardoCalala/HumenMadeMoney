import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const KEY_PRV_VERSIONS = Object.freeze({
  protocol: "role-custody-readiness-protocol-v2",
  instrument: "key-prv-closed-eligibility-instrument-v2",
  administration: "key-prv-eligibility-administration-v1",
  eligibility: "role-eligibility-attestation-v2",
  assignment: "role-assignment-v2",
  evidence: "readiness-evidence-v2",
  collective: "collective-readiness-v2",
  orderMethod: "key-prv-order-hmac-sha256-fisher-yates-v1",
  fixedOrderMethod: "canonical-key-then-prv-v1",
} as const);

export type KeyPrvRole = "KEY" | "PRV";
export type KeyPrvItemId = `KEY-${string}` | `PRV-${string}`;

export const KEY_PRV_INSTRUMENT = Object.freeze([
  ["KEY-01", "Adult, voluntary acceptance, and understanding of confidentiality, least privilege, release, stop, and incident duties."],
  ["KEY-02", "No authorship, edit, approval, implementation, testing, or validation of restricted fixture content, expected labels, rationales, comparison logic, or the submission."],
  ["KEY-03", "No disclosure, copying, outside retention, exposure, or known prior compromise of a key or presentation."],
  ["KEY-04", "Not a scorer, calibration administrator, recorder, adjudicator, participant, primary submission author, or presentation operator for the attempt."],
  ["KEY-05", "No supervisory, financial, household, close-personal, reporting-line, authorship, or outcome-contingent conflict."],
  ["KEY-06", "Can keep keys deny-by-default in the approved compartment with no local copy, message, screenshot, printout, log, or ad hoc export."],
  ["KEY-07", "Will verify protocol/dataset/subset/key versions and digests and release only the exact matching subset to the deterministic loader."],
  ["KEY-08", "Will verify complete lock, lock digest, eligibility digest, separation, time order, and attempt number before release."],
  ["KEY-09", "Will keep retry material inaccessible until a valid primary failure, bounded remediation, renewed attestations, non-exposure confirmation, and retry authority all exist."],
  ["KEY-10", "Will not disclose answer-bearing material, manually score, or communicate correctness hints."],
  ["KEY-11", "Will produce only the bounded attributed release receipt required by schema."],
  ["KEY-12", "Will stop and report uncertainty, mismatch, early/excess request, substitution, abnormal access, exposure, coercion, or bypass attempt."],
  ["PRV-01", "Voluntarily accepts minimization, purpose, access, retention, deletion, hold, and incident duties."],
  ["PRV-02", "Understands every storage class and confirms no operational store is Git, an application/provider, production, or unapproved personal location."],
  ["PRV-03", "Will approve only minimum fields, least privilege, attributed logs, encryption, bounded validity, and separate backup controls."],
  ["PRV-04", "Is not a scorer/adjudicator and does not recruit, coach, interpret, score, change results, or operate comparison."],
  ["PRV-05", "Has no conflict capable of distorting access, hold, deletion, or incident decisions."],
  ["PRV-06", "Will maintain the bounded inventory, purpose, controller, access, creation, deletion, backup, and hold metadata without secrets."],
  ["PRV-07", "Will deny unrestricted narratives and unnecessary identities, credentials, paths, fixture/key text, responses, or scores."],
  ["PRV-08", "Will issue only necessary, scoped holds with reason, owner, start, access, objective trigger, and review no later than 30 days."],
  ["PRV-09", "Will verify deletion from primary, temporary, export, rejected-input, log, and aligned backup copies."],
  ["PRV-10", "Will stop on leakage, unexplained access, inventory mismatch, overcollection, missed deletion, unreviewed hold, unapproved store/export, or uncertain erasure."],
  ["PRV-11", "Will preserve only minimum incident evidence and prevent incident detail becoming an unbounded store."],
  ["PRV-12", "Will re-review access and retention after relevant role, topology, protocol, incident, closure, or necessary-hold change."],
] as const satisfies readonly (readonly [KeyPrvItemId, string])[]);

export const KEY_PRV_CANONICAL_IDS = Object.freeze(KEY_PRV_INSTRUMENT.map(([itemId]) => itemId));
export const KEY_PRV_MANIFEST = Object.freeze(KEY_PRV_INSTRUMENT.map(([itemId, statement]) => Object.freeze({ itemId, role: itemId.slice(0, 3) as KeyPrvRole, statement })));

const sha256 = (bytes: string | Buffer): string => createHash("sha256").update(bytes).digest("hex");
export const KEY_PRV_STATEMENT_BYTES_DIGEST = sha256(JSON.stringify(KEY_PRV_INSTRUMENT.map(([, statement]) => statement)));
export const KEY_PRV_MANIFEST_DIGEST = sha256(JSON.stringify(KEY_PRV_MANIFEST));
export const orderDigest = (order: readonly KeyPrvItemId[]): string => sha256(JSON.stringify(order));
const digestOk = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const timeOk = (value: unknown): value is string => typeof value === "string" && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
const sameDigest = (left: string, right: string): boolean => digestOk(left) && digestOk(right) && timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));

const BIGINT_ZERO = BigInt(0);
const BIGINT_ONE = BigInt(1);
const MAX_UINT64_PLUS_ONE = BIGINT_ONE << BigInt(64);
const ORDER_DOMAIN = Buffer.from("HMM-KEY-PRV-ORDER-V1\0", "ascii");

function hmacUint64Stream(seed: Buffer): () => bigint {
  let counter = BIGINT_ZERO;
  let block = Buffer.alloc(0);
  let offset = 0;
  return () => {
    if (offset + 8 > block.length) {
      const counterBytes = Buffer.alloc(8);
      counterBytes.writeBigUInt64BE(counter);
      block = createHmac("sha256", seed).update(ORDER_DOMAIN).update(counterBytes).digest();
      counter += BIGINT_ONE;
      offset = 0;
    }
    const value = block.readBigUInt64BE(offset);
    offset += 8;
    return value;
  };
}

export function sampleBoundedUint64(readUint64: () => bigint, bound: number): number {
  if (!Number.isSafeInteger(bound) || bound < 1) throw new Error("invalid_shuffle_bound");
  const divisor = BigInt(bound);
  const limit = (MAX_UINT64_PLUS_ONE / divisor) * divisor;
  for (;;) {
    const value = readUint64();
    if (value >= BIGINT_ZERO && value < limit) return Number(value % divisor);
  }
}

export function replayKeyPrvOrder(seed: Buffer | string): { order: KeyPrvItemId[]; orderDigest: string } {
  const seedBytes = typeof seed === "string" ? Buffer.from(seed, "hex") : Buffer.from(seed);
  if (seedBytes.length !== 32 || (typeof seed === "string" && !/^[a-f0-9]{64}$/.test(seed))) throw new Error("seed_must_be_32_bytes");
  const order = [...KEY_PRV_CANONICAL_IDS];
  const readUint64 = hmacUint64Stream(seedBytes);
  for (let index = order.length - 1; index > 0; index -= 1) {
    const swapIndex = sampleBoundedUint64(readUint64, index + 1);
    [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
  }
  seedBytes.fill(0);
  return { order, orderDigest: orderDigest(order) };
}

export type AdministrationMode = "randomized" | "fixed_accessibility";
export type AdministrationStatus = "locked" | "presenting" | "completed" | "aborted" | "void_incident";
export type KeyPrvResponse = { ordinal: number; itemId: KeyPrvItemId; response: boolean };

export type KeyPrvAdministration = {
  recordType: "key_prv_eligibility_administration";
  schemaVersion: typeof KEY_PRV_VERSIONS.administration;
  protocolVersion: typeof KEY_PRV_VERSIONS.protocol;
  instrumentVersion: typeof KEY_PRV_VERSIONS.instrument;
  instrumentManifestDigest: string;
  statementBytesDigest: string;
  administrationId: string;
  administrationRequestDigest: string;
  proposedRoles: readonly ["KEY", "PRV"];
  orderMode: AdministrationMode;
  orderMethodVersion: typeof KEY_PRV_VERSIONS.orderMethod | typeof KEY_PRV_VERSIONS.fixedOrderMethod;
  seedHex: string | null;
  itemIdSequence: readonly KeyPrvItemId[];
  orderDigest: string;
  accommodationCode: "fixed_order_requested" | null;
  generatedAt: string;
  lockedAt: string;
  presentationStartedAt: string | null;
  completedAt: string | null;
  abortedAt: string | null;
  responses: readonly KeyPrvResponse[];
  status: AdministrationStatus;
  outcome: "pending" | "eligible" | "ineligible" | "uncertain";
  reasonCodes: readonly string[];
  lastCompletedOrdinal: number;
  priorAdministrationDigest: string | null;
  correctionAuthorizationDigest: string | null;
  incidentDigest: string | null;
  noAccessGranted: true;
  participantCountersChanged: 0;
  releaseReviewersChanged: 0;
  genuineReleaseReviewsChanged: 0;
  hmmStatus: "not_qualified";
  previousAdministrationDigest: string;
  administrationDigest: string;
};

type LockInput = {
  administrationId: string;
  administrationRequestDigest: string;
  mode: AdministrationMode;
  at: string;
  accommodationCode?: "fixed_order_requested";
};

const canonicalize = (value: unknown): string => JSON.stringify(value, (_key, item) => item && typeof item === "object" && !Array.isArray(item) ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item);

function sealAdministration(raw: Omit<KeyPrvAdministration, "administrationDigest">): KeyPrvAdministration {
  const sealed = { ...raw, proposedRoles: Object.freeze([...raw.proposedRoles]) as readonly ["KEY", "PRV"], itemIdSequence: Object.freeze([...raw.itemIdSequence]), responses: Object.freeze(raw.responses.map((response) => Object.freeze({ ...response }))), reasonCodes: Object.freeze([...raw.reasonCodes]), administrationDigest: sha256(`${raw.previousAdministrationDigest}\n${canonicalize(raw)}`) };
  return Object.freeze(sealed);
}

function exactPermutation(order: readonly string[]): order is readonly KeyPrvItemId[] {
  return order.length === 24 && new Set(order).size === 24 && KEY_PRV_CANONICAL_IDS.every((itemId) => order.includes(itemId));
}

export function verifyAdministrationIntegrity(record: KeyPrvAdministration): string[] {
  const reasons = new Set<string>();
  if (record.schemaVersion !== KEY_PRV_VERSIONS.administration || record.protocolVersion !== KEY_PRV_VERSIONS.protocol || record.instrumentVersion !== KEY_PRV_VERSIONS.instrument) reasons.add("wrong_version");
  if (!sameDigest(record.instrumentManifestDigest, KEY_PRV_MANIFEST_DIGEST) || !sameDigest(record.statementBytesDigest, KEY_PRV_STATEMENT_BYTES_DIGEST)) reasons.add("instrument_digest_mismatch");
  if (!exactPermutation(record.itemIdSequence) || !sameDigest(record.orderDigest, orderDigest(record.itemIdSequence))) reasons.add("order_invalid");
  if (!digestOk(record.administrationRequestDigest) || !digestOk(record.previousAdministrationDigest) || !digestOk(record.administrationDigest)) reasons.add("digest_invalid");
  const base = { ...record } as Partial<KeyPrvAdministration>; delete base.administrationDigest;
  if (digestOk(record.previousAdministrationDigest) && record.administrationDigest !== sha256(`${record.previousAdministrationDigest}\n${canonicalize(base)}`)) reasons.add("administration_digest_mismatch");
  if (record.orderMode === "randomized") {
    if (!record.seedHex || record.orderMethodVersion !== KEY_PRV_VERSIONS.orderMethod) reasons.add("randomized_evidence_missing");
    else {
      try { const replayed = replayKeyPrvOrder(record.seedHex); if (!sameDigest(replayed.orderDigest, record.orderDigest) || replayed.order.some((id, index) => id !== record.itemIdSequence[index])) reasons.add("replay_mismatch"); } catch { reasons.add("replay_mismatch"); }
    }
    if (record.accommodationCode !== null) reasons.add("randomized_accommodation_invalid");
  } else if (record.seedHex !== null || record.orderMethodVersion !== KEY_PRV_VERSIONS.fixedOrderMethod || record.accommodationCode !== "fixed_order_requested" || record.itemIdSequence.some((id, index) => id !== KEY_PRV_CANONICAL_IDS[index])) reasons.add("fixed_accessibility_invalid");
  if (![record.generatedAt, record.lockedAt].every(timeOk) || Date.parse(record.generatedAt) > Date.parse(record.lockedAt)) reasons.add("lock_time_invalid");
  if (record.responses.some((response, index) => response.ordinal !== index + 1 || response.itemId !== record.itemIdSequence[index] || typeof response.response !== "boolean")) reasons.add("response_mapping_invalid");
  if (record.responses.length !== record.lastCompletedOrdinal || record.responses.length > 24) reasons.add("response_count_invalid");
  if (record.noAccessGranted !== true || record.participantCountersChanged !== 0 || record.releaseReviewersChanged !== 0 || record.genuineReleaseReviewsChanged !== 0 || record.hmmStatus !== "not_qualified") reasons.add("forbidden_state_effect");
  return [...reasons].sort();
}

export type CombinedEligibilityResult = {
  role: KeyPrvRole;
  schemaVersion: typeof KEY_PRV_VERSIONS.eligibility;
  protocolVersion: typeof KEY_PRV_VERSIONS.protocol;
  administrationDigest: string;
  instrumentManifestDigest: string;
  attestations: Record<string, true>;
  outcome: "eligible" | "ineligible" | "uncertain";
  reasonCodes: string[];
  combinedAllTrue: boolean;
  noAccessGranted: true;
  participantCountersChanged: 0;
  releaseReviewersChanged: 0;
  genuineReleaseReviewsChanged: 0;
  hmmStatus: "not_qualified";
};

export function evaluateCombinedEligibility(record: KeyPrvAdministration): [CombinedEligibilityResult, CombinedEligibilityResult] {
  const reasons = new Set(verifyAdministrationIntegrity(record));
  if (record.status !== "completed" || record.responses.length !== 24 || !timeOk(record.completedAt)) reasons.add("administration_incomplete");
  const responseMap = new Map(record.responses.map(({ itemId, response }) => [itemId, response]));
  for (const itemId of KEY_PRV_CANONICAL_IDS) if (!responseMap.has(itemId)) reasons.add("response_missing");
  const anyFalse = [...responseMap.values()].some((response) => response === false);
  const allTrue = reasons.size === 0 && responseMap.size === 24 && [...responseMap.values()].every((response) => response === true);
  const outcome = allTrue ? "eligible" : anyFalse && reasons.size === 0 ? "ineligible" : "uncertain";
  if (anyFalse) reasons.add("one_or_more_false");
  const make = (role: KeyPrvRole): CombinedEligibilityResult => ({ role, schemaVersion: KEY_PRV_VERSIONS.eligibility, protocolVersion: KEY_PRV_VERSIONS.protocol, administrationDigest: record.administrationDigest, instrumentManifestDigest: KEY_PRV_MANIFEST_DIGEST, attestations: Object.fromEntries(KEY_PRV_CANONICAL_IDS.filter((id) => id.startsWith(`${role}-`) && responseMap.get(id) === true).map((id) => [id, true])), outcome, reasonCodes: [...reasons].sort(), combinedAllTrue: allTrue, noAccessGranted: true, participantCountersChanged: 0, releaseReviewersChanged: 0, genuineReleaseReviewsChanged: 0, hmmStatus: "not_qualified" });
  return [make("KEY"), make("PRV")];
}

export class KeyPrvAdministrationLedger {
  readonly #histories = new Map<string, KeyPrvAdministration[]>();
  readonly #replacementAuthorizations = new Map<string, { priorRequestDigest: string; priorAdministrationDigest: string; authorizationDigest: string; incidentDigest: string }>();

  history(requestDigest: string): readonly KeyPrvAdministration[] { return Object.freeze([...(this.#histories.get(requestDigest) ?? [])]); }
  current(requestDigest: string): KeyPrvAdministration | undefined { return this.#histories.get(requestDigest)?.at(-1); }

  authorizeReplacement(input: { priorRequestDigest: string; newRequestDigest: string; priorAdministrationDigest: string; authorizationDigest: string; incidentDigest: string }): void {
    const prior = this.current(input.priorRequestDigest);
    if (!prior || !["aborted", "void_incident"].includes(prior.status) || prior.administrationDigest !== input.priorAdministrationDigest || ![input.newRequestDigest, input.authorizationDigest, input.incidentDigest].every(digestOk) || this.#histories.has(input.newRequestDigest) || this.#replacementAuthorizations.has(input.newRequestDigest)) throw new Error("replacement_not_authorized");
    this.#replacementAuthorizations.set(input.newRequestDigest, { priorRequestDigest: input.priorRequestDigest, priorAdministrationDigest: input.priorAdministrationDigest, authorizationDigest: input.authorizationDigest, incidentDigest: input.incidentDigest });
  }

  lock(input: LockInput): KeyPrvAdministration {
    if (this.#histories.has(input.administrationRequestDigest)) throw new Error("order_already_locked_no_reroll");
    if (!digestOk(input.administrationRequestDigest) || !timeOk(input.at) || !/^[0-9a-f-]{36}$/.test(input.administrationId)) throw new Error("invalid_lock_request");
    if (input.mode === "fixed_accessibility" && input.accommodationCode !== "fixed_order_requested") throw new Error("fixed_accessibility_must_be_selected_pre_lock");
    if (input.mode === "randomized" && input.accommodationCode !== undefined) throw new Error("randomized_mode_has_no_accommodation_code");
    const seed = input.mode === "randomized" ? randomBytes(32) : null;
    const generated = seed ? replayKeyPrvOrder(seed) : { order: [...KEY_PRV_CANONICAL_IDS], orderDigest: orderDigest(KEY_PRV_CANONICAL_IDS) };
    const replacement = this.#replacementAuthorizations.get(input.administrationRequestDigest);
    const raw: Omit<KeyPrvAdministration, "administrationDigest"> = { recordType: "key_prv_eligibility_administration", schemaVersion: KEY_PRV_VERSIONS.administration, protocolVersion: KEY_PRV_VERSIONS.protocol, instrumentVersion: KEY_PRV_VERSIONS.instrument, instrumentManifestDigest: KEY_PRV_MANIFEST_DIGEST, statementBytesDigest: KEY_PRV_STATEMENT_BYTES_DIGEST, administrationId: input.administrationId, administrationRequestDigest: input.administrationRequestDigest, proposedRoles: ["KEY", "PRV"], orderMode: input.mode, orderMethodVersion: input.mode === "randomized" ? KEY_PRV_VERSIONS.orderMethod : KEY_PRV_VERSIONS.fixedOrderMethod, seedHex: seed?.toString("hex") ?? null, itemIdSequence: generated.order, orderDigest: generated.orderDigest, accommodationCode: input.mode === "fixed_accessibility" ? "fixed_order_requested" : null, generatedAt: input.at, lockedAt: input.at, presentationStartedAt: null, completedAt: null, abortedAt: null, responses: [], status: "locked", outcome: "pending", reasonCodes: [], lastCompletedOrdinal: 0, priorAdministrationDigest: replacement?.priorAdministrationDigest ?? null, correctionAuthorizationDigest: replacement?.authorizationDigest ?? null, incidentDigest: replacement?.incidentDigest ?? null, noAccessGranted: true, participantCountersChanged: 0, releaseReviewersChanged: 0, genuineReleaseReviewsChanged: 0, hmmStatus: "not_qualified", previousAdministrationDigest: "0".repeat(64) };
    seed?.fill(0);
    const record = sealAdministration(raw);
    this.#histories.set(input.administrationRequestDigest, [record]);
    this.#replacementAuthorizations.delete(input.administrationRequestDigest);
    return record;
  }

  #append(requestDigest: string, patch: Partial<KeyPrvAdministration>): KeyPrvAdministration {
    const history = this.#histories.get(requestDigest); const current = history?.at(-1);
    if (!history || !current) throw new Error("administration_not_locked");
    const base = { ...current } as Record<string, unknown>; delete base.administrationDigest;
    const next = sealAdministration({ ...base, ...patch, previousAdministrationDigest: current.administrationDigest } as Omit<KeyPrvAdministration, "administrationDigest">);
    history.push(next);
    return next;
  }

  startPresentation(requestDigest: string, at: string): KeyPrvAdministration {
    const current = this.current(requestDigest);
    if (!current || current.status !== "locked" || !timeOk(at) || Date.parse(at) < Date.parse(current.lockedAt)) throw new Error("presentation_requires_durable_lock");
    return this.#append(requestDigest, { status: "presenting", presentationStartedAt: at });
  }

  recordResponse(requestDigest: string, itemId: KeyPrvItemId, response: boolean): KeyPrvAdministration {
    const current = this.current(requestDigest);
    if (!current || current.status !== "presenting" || typeof response !== "boolean") throw new Error("response_capture_not_allowed");
    const ordinal = current.responses.length + 1;
    if (current.itemIdSequence[ordinal - 1] !== itemId) throw new Error("response_item_not_next_locked_id");
    return this.#append(requestDigest, { responses: [...current.responses, { ordinal, itemId, response }], lastCompletedOrdinal: ordinal });
  }

  complete(requestDigest: string, at: string): KeyPrvAdministration {
    const current = this.current(requestDigest);
    if (!current || current.status !== "presenting" || current.responses.length !== 24 || !timeOk(at)) throw new Error("completion_requires_all_24_responses");
    const allTrue = current.responses.every(({ response }) => response);
    return this.#append(requestDigest, { status: "completed", completedAt: at, outcome: allTrue ? "eligible" : "ineligible", reasonCodes: allTrue ? [] : ["one_or_more_false"] });
  }

  abort(requestDigest: string, at: string, reasonCode: string, incidentDigest: string | null = null): KeyPrvAdministration {
    const current = this.current(requestDigest);
    if (!current || !["locked", "presenting"].includes(current.status) || !timeOk(at) || !/^[a-z0-9_]{3,64}$/.test(reasonCode) || (incidentDigest !== null && !digestOk(incidentDigest))) throw new Error("abort_invalid");
    return this.#append(requestDigest, { status: incidentDigest ? "void_incident" : "aborted", abortedAt: at, outcome: "uncertain", reasonCodes: [reasonCode], incidentDigest });
  }

  resume(requestDigest: string, at: string, correctionAuthorizationDigest: string): KeyPrvAdministration {
    const current = this.current(requestDigest);
    if (!current || current.status !== "aborted" || current.incidentDigest !== null || !timeOk(at) || !digestOk(correctionAuthorizationDigest)) throw new Error("resume_not_authorized_or_integrity_uncertain");
    return this.#append(requestDigest, { status: current.presentationStartedAt ? "presenting" : "locked", abortedAt: null, outcome: "pending", reasonCodes: [], correctionAuthorizationDigest });
  }
}

export type KeyPrvCollectiveReadinessInput = {
  implementationCommit: string;
  governanceHead: string;
  artifactEnvelopeDigest: string;
  v1CustodyCompatibilityDigest: string;
  keyPrvReadinessEvidenceDigest: string;
  founderCheckpointDecisionDigest: string | null;
  allV1ReadinessControlsPass: boolean;
  allV2AmendmentControlsPass: boolean;
  noOpenIncidentOrChange: boolean;
};

export function evaluateKeyPrvCollectiveReadinessV2(input: KeyPrvCollectiveReadinessInput) {
  const reasons = new Set<string>();
  if (!/^[a-f0-9]{40}$/.test(input.implementationCommit) || !/^[a-f0-9]{40}$/.test(input.governanceHead) || ![input.artifactEnvelopeDigest, input.v1CustodyCompatibilityDigest, input.keyPrvReadinessEvidenceDigest].every(digestOk)) reasons.add("implementation_or_evidence_binding_invalid");
  if (!input.allV1ReadinessControlsPass) reasons.add("v1_readiness_controls_not_all_pass");
  if (!input.allV2AmendmentControlsPass) reasons.add("v2_amendment_controls_not_all_pass");
  if (!input.noOpenIncidentOrChange) reasons.add("open_incident_or_relevant_change");
  if (!input.founderCheckpointDecisionDigest || !digestOk(input.founderCheckpointDecisionDigest)) reasons.add("randomized_order_founder_checkpoint_pending");
  const decision = reasons.size === 0 ? "READY" as const : "BLOCKED" as const;
  return Object.freeze({ recordType: "sprint_6_5_4_collective_readiness" as const, schemaVersion: KEY_PRV_VERSIONS.collective, protocolVersion: KEY_PRV_VERSIONS.protocol, implementationCommit: input.implementationCommit, governanceHead: input.governanceHead, artifactEnvelopeDigest: input.artifactEnvelopeDigest, v1CustodyCompatibilityDigest: input.v1CustodyCompatibilityDigest, keyPrvReadinessEvidenceDigest: input.keyPrvReadinessEvidenceDigest, founderCheckpointDecisionDigest: input.founderCheckpointDecisionDigest ?? "ABSENT", decision, reasonCodes: Object.freeze([...reasons].sort()), realKeyPrvScreeningAuthorized: decision === "READY", realScorerCalibrationAuthorized: decision === "READY", a01ContactAuthorized: false as const, participantCounters: Object.freeze({ contacted: 0, enrolled: 0, A: 0, B: 0, C: 0, D: 0 }), releaseGate: Object.freeze({ reviewers: 0, genuineReviews: 0, hmmStatus: "not_qualified" as const }) });
}
