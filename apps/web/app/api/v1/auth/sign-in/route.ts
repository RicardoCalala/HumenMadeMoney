import { authenticationService, localAuthenticationEnabled } from "../../../../../server/auth/composition.ts";
import { clearCookie, cookie, PREAUTH_COOKIE, preauthDigest, readableCsrfCookie, requireLoginOrigin, sessionToken } from "../../../../../server/auth/http.ts";
import { SESSION_COOKIE, json, readJson } from "../../../../../server/agreements/transport/http.ts";
import { DevelopmentSignInLimiter } from "../../../../../server/auth/development-sign-in-limiter.ts";
const limiter = new DevelopmentSignInLimiter({ windowMs: 60_000, maximum: 10, maximumBuckets: 256 });
const originKey = (request: Request) => { try { return `origin:${new URL(request.headers.get("origin") ?? request.url).origin}`; } catch { return "origin:invalid"; } };
const failed = (status = 401, code = "SIGN_IN_FAILED", message = "That local profile could not be signed in.") => json({ error: { code, message } }, status, { "Set-Cookie": clearCookie(PREAUTH_COOKIE) });
export async function POST(request: Request) {
  if (!localAuthenticationEnabled) return json({ error: { code: "AUTHENTICATION_UNAVAILABLE", message: "Local authentication is unavailable." } }, 404);
  try { requireLoginOrigin(request); } catch { return failed(403, "CSRF_REJECTED", "Refresh the sign-in page and try again."); }
  const csrf = request.headers.get("x-csrf-token") ?? ""; const expected = preauthDigest(request) ?? "";
  if (!authenticationService.verifyPreAuthenticationCsrf(csrf, expected)) return failed(403, "CSRF_REJECTED", "Refresh the sign-in page and try again.");
  try {
    const body = await readJson(request) as { profileId?: unknown }; if (typeof body.profileId !== "string" || body.profileId.length > 64) return failed();
    const limit = limiter.check([originKey(request), `profile:${body.profileId.toLowerCase()}`]);
    if (!limit.allowed) return json({ error: { code: "RATE_LIMITED", message: "Too many local sign-in attempts. Wait briefly and try again." } }, 429, { "Retry-After": String(limit.retryAfterSeconds), "Set-Cookie": clearCookie(PREAUTH_COOKIE) });
    const result = await authenticationService.signInDevelopment(body.profileId, sessionToken(request)); const headers = new Headers({ "Cache-Control": "no-store" });
    headers.append("Set-Cookie", cookie(SESSION_COOKIE, result.token, 8 * 60 * 60)); headers.append("Set-Cookie", clearCookie(PREAUTH_COOKIE)); headers.append("Set-Cookie", readableCsrfCookie(result.csrfToken));
    return Response.json({ user: { accountId: result.account.accountId, displayName: result.account.displayName, state: result.account.state, sessionExpiresAt: result.record.idleExpiresAt, assurance: result.record.assurance } }, { status: 200, headers });
  } catch { return failed(); }
}
