import type { AgreementAccessPolicy, AgreementAction, AgreementAggregate, AccessDecision, RequestContext } from "./contracts.ts";
import type { AgreementMembershipRepository } from "../persistence/repository.ts";

/** Explicit non-production policy. Missing or unknown actors are denied by default. */
export class MembershipAgreementAccessPolicy implements AgreementAccessPolicy {
  private readonly memberships: AgreementMembershipRepository; private readonly creatorPartyByAccount: ReadonlyMap<string, string>;
  constructor(memberships: AgreementMembershipRepository, creatorPartyByAccount: ReadonlyMap<string, string>) { this.memberships = memberships; this.creatorPartyByAccount = creatorPartyByAccount; }
  async authorize(context: RequestContext, action: AgreementAction, resource?: AgreementAggregate): Promise<AccessDecision> {
    if (context.principal.kind !== "account" || context.principal.accountState !== "active") return { allowed: false };
    const accountId = context.principal.accountId;
    if (action === "create") { const partyId = this.creatorPartyByAccount.get(accountId); return partyId ? { allowed: true, partyId } : { allowed: false }; }
    if (action === "list") return { allowed: true, scopeId: `membership:${accountId}` };
    if (!resource) return { allowed: true };
    const membership = await this.memberships.findActive(resource.agreementId, accountId);
    if (!membership) return { allowed: false };
    if (action === "update" && membership.role !== "owner") return { allowed: false };
    return { allowed: true, partyId: membership.partyId };
  }
}
