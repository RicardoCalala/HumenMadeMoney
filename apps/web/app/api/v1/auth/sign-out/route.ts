import { authenticationService } from "../../../../../server/auth/composition.ts";
import { clearCookie, CSRF_COOKIE, sessionToken } from "../../../../../server/auth/http.ts";
import { requireAuthenticatedCsrf, SESSION_COOKIE } from "../../../../../server/agreements/transport/http.ts";
function clearedHeaders() { const headers = new Headers({ "Cache-Control": "no-store" }); headers.append("Set-Cookie", clearCookie(SESSION_COOKIE)); headers.append("Set-Cookie", clearCookie(CSRF_COOKIE)); return headers; }
export async function POST(request: Request) { try { await requireAuthenticatedCsrf(request); await authenticationService.signOut(sessionToken(request)); return Response.json({ signedOut: true }, { headers: clearedHeaders() }); } catch { return Response.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in to continue." } }, { status: 401, headers: clearedHeaders() }); } }
