import type { AgreementAccessPolicy, AgreementAction, AgreementAggregate, AccessDecision, RequestContext } from "./contracts.ts";

/** Explicit non-production policy. Missing or unknown actors are denied by default. */
export class DevelopmentAgreementAccessPolicy implements AgreementAccessPolicy {
  private readonly bindings: ReadonlyMap<string, string>;
  constructor(bindings: ReadonlyMap<string, string> = new Map([["demo-actor", "party-demo"]])) { this.bindings = bindings; }
  async authorize(context: RequestContext, action: AgreementAction, resource?: AgreementAggregate): Promise<AccessDecision> {
    const partyId = this.bindings.get(context.actorId);
    if (!partyId) return { allowed: false };
    if ((action === "read" || action === "update") && resource && resource.provenance.createdByActorId !== context.actorId) return { allowed: false };
    return { allowed: true, partyId, scopeId: `actor:${context.actorId}` };
  }
}
