export type AccountState = "active" | "suspended" | "disabled";
export interface Account { accountId: string; state: AccountState; displayName: string; primaryEmail?: string; createdAt: string; updatedAt: string }
export interface SessionRecord { sessionId: string; accountId: string; tokenDigest: string; csrfDigest: string; state: "active" | "revoked" | "expired"; assurance: "development"; createdAt: string; lastSeenAt: string; idleExpiresAt: string; absoluteExpiresAt: string; revokedAt?: string; rotation: number }
export interface CurrentUser { accountId: string; displayName: string; state: AccountState; sessionExpiresAt: string; assurance: "development" }
export interface SessionRepository { create(record: SessionRecord): Promise<void>; findByDigest(digest: string): Promise<SessionRecord | null>; replace(previousId: string | undefined, record: SessionRecord): Promise<void>; revoke(sessionId: string, at: string): Promise<void>; update(record: SessionRecord): Promise<void> }
export interface AccountRepository { find(accountId: string): Promise<Account | null>; findByLocalProfile(profileId: string): Promise<Account | null> }
export interface TokenPair { raw: string; digest: string }
